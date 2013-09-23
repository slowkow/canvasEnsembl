$(document).ready(function() {
    // Global variables.
    var ensembl_url = 'http://beta.rest.ensembl.org';
    var initialized = false;
    var genome_json = {
        data: { tracks: [] },
        config: {
            graphType: 'Genome',
            backgroundColor: 'rgb(255,255,255)', 
            featureNameFontColor: 'rgb(0,0,0)',
            trackNameFontColor: 'rgb(0,0,0)',
            trackNameFontColor: 'rgb(0,0,0)',
            trackNameFontSize: 12,
            wireColor: 'rgb(100,100,100,0.5)',
            marginBottom: 5,
            marginLeft: 5,
            marginRight: 5,
            marginTop: 5
        }
    };

    // Convert Ensembl JSON to canvasXpress JSON.
    var cxExons = function(gene_id, json) {
        // An array of canvasXpress items that belong in json.data.tracks.data
        var transcripts = [];
        // Group exons by the parent transcript.
        var groups = _.groupBy(json, "Parent");
        // Loop through the exons for each transcript.
        _.map(groups, function(group, transcript_id) {
            // Sort exons by start coordinate.
            group = _.sortBy(group, "start");
            var item = {
                id: transcript_id,
                dir: group[0]["strand"] == 1 ? "right" : "left",
                data: _.map(group, function(x) {return [x["start"], x["end"]]})
            };
            transcripts.push(item);
        });
        var data = {
            tracks: [
                {
                    //name: gene_id + " Ensembl Transcripts",
                    type: "box",
                    connect: "true",
                    fill: "rgb(200,0,0)",
                    outline: "rgb(128,0,0)",
                    data: transcripts
                }
            ]
        };
        var config = {
            title: gene_id,
            subtracksMaxDefault: Object.keys(groups).length
        };
        return {data: data, config: config};
    }
   
    // Convert Ensembl JSON to canvasXpress JSON.
    var cxGenomicSequence = function(gene_id, json) {
        var sequence = json[0].seq;
        // Split this: "chromosome:GRCh37:7:140424943:140624564:-1"
        var offset = parseInt(json[0].desc.split(':')[3]);
        var data = {
            tracks: [
                {
                    subtype: 'DNA',
                    type: 'sequence',
                    data: [{
                        id: 'Reference Sequence',
                        fill: 'rgb(51,255,255)',
                        outline: 'rgb(0,0,0)',
                        dir: 'right',
                        offset: offset,
                        sequence: sequence,
                        index: 0,
                        counter: 0,
                        measureText: 108
                    }]
                }
            ]
        };
        var config = {};
        return {data: data, config: config};
    }

    // Update an existing canvas with new data and config.
    var cxUpdate = function(id, data, config) {
        var cx = CanvasXpress.getObject(id);
        cx.updateData(data);
        $.extend(cx, config);
        cx.draw();
    }

    var drawPlot = function(gene_id) {
        // Clear the current tracks.
        genome_json.data.tracks = [];

        // Add the genomic sequence for this gene.
        getGenomicSequence(gene_id, addTrack);
        
        // Add the transcripts for this gene.
        getExons(gene_id, addTrack);
    }

    var addTrack = function(json) {
        // Add the tracks to the global state.
        for (var i = 0; i < json.data.tracks.length; i++) {
            genome_json.data.tracks.unshift(json.data.tracks[i]);
        }

        // Update config values.
        $.extend(true, genome_json.config, json.config);

        // Update the plot or else initialize it.
        if (initialized) {
            cxUpdate("canvas1", genome_json.data, genome_json.config);
        } else {
            new CanvasXpress(
                'canvas1', genome_json.data, genome_json.config
            );
            initialized = true;
        }
    }

    // Query Ensembl for genomic sequence.
    var getGenomicSequence = function(gene_id, callback) {
        console.log("==> Getting genomic sequence JSON for " + gene_id);
        // Fetch the genomic sequence for a given gene.
        $.getJSON(ensembl_url + '/sequence/id/' + gene_id +
        '?content-type=application/json;multiple_sequences=1;type=genomic')
        .done(function(json) {
            console.log("==> Successfully retrieved genomic sequence!");
            // Transform Ensembl JSON to canvasXpress JSON.
            json = cxGenomicSequence(gene_id, json);
            // Call the specified callback function on the transformed JSON.
            callback(json);
        })
        .fail(function(jqxhr, textStatus, error) {
            console.log("==> Failure! " + textStatus, + ', ' + error);
        });
    }

    // Query Ensembl for exons.
    var getExons = function(gene_id, callback) {
        console.log("==> Getting exons for " + gene_id);
        // Fetch the exons for a given gene.
        $.getJSON(ensembl_url + '/feature/id/' + gene_id + '?feature=exon')
        .done(function(json) {
            console.log("==> Successfully retrieved exons!");
            // Transform Ensembl JSON to canvasXpress JSON.
            json = cxExons(gene_id, json);
            // Call the specified callback function on the transformed JSON.
            callback(json);
        })
        .fail(function(jqxhr, textStatus, error) {
            console.log("==> Failure! " + textStatus + ', ' + error);
        });
    }

    // Initialize to some gene.
    drawPlot('ENSG00000157764');

    // Update the plot when the form is submitted.
    $('form').submit(function() {
        var gene_id = $("#gene_id").val();
        drawPlot(gene_id);
        return false;
    });
});
