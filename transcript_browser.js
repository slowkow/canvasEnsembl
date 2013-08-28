$(document).ready(function() {
    // Convert Ensembl JSON to canvasXpress JSON.
    var cxJSON = function(gene_id, json) {
        var transcripts = [];
        var groups = _.groupBy(json, "Parent");
        _.map(groups, function(group, transcript_id) {
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
                    name: gene_id + " Ensembl Transcripts",
                    type: "box",
                    connect: "true",
                    fill: "rgb(255,0,0)",
                    outline: "rgb(128,0,0)",
                    data: transcripts
                }
            ]
        };
        var config = {
            title: gene_id,
            graphType: 'Genome',
            backgroundGradient1Color: 'rgb(0,183,217)', 
            backgroundGradient2Color: 'rgb(4,112,174)', 
            backgroundType: 'gradient',
            subtracksMaxDefault: Object.keys(groups).length
        };
        return {data: data, config: config};
    }

    // Delete the canvasXpress DOM elements and start over.
    // TODO Do this properly as Isaac described with cx.updateData() instead.
    var clearCanvas = function(canvas_id) {
        $(".CanvasXpressTooltip").remove();
        $(".CanvasXpressContainer").remove();
        var newCanvas = $('<canvas/>',
                { id: canvas_id }
        ).prop(
                { width: 1000, height: 900 }
        );
        $('#' + canvas_id).remove();
        $('#' + canvas_id + '_container').prepend(newCanvas);
    }

    var getExons = function(gene_id, callback) {
        console.log("==> Getting genome JSON for " + gene_id);

        var url = 'http://beta.rest.ensembl.org/feature/id/';

        $.getJSON(url + gene_id + '?feature=exon')
        .done(function(json) {
            console.log("==> Success!");
            // Transform Ensembl JSON to canvasXpress JSON.
            json = cxJSON(gene_id, json);
            // Call the specified callback function on the transfored JSON.
            callback(json);
        })
        .fail(function(jqxhr, textStatus, error) {
            console.log("==> Failure! " + textStatus + ', ' + error);
        });
    }

    // Handle the business of creating a new heatmap.
    var drawPlot = function(gene_id) {
        var f1 = function(json) {
            clearCanvas('canvas1');
            new CanvasXpress('canvas1', json.data, json.config);
        }
        getExons(gene_id, f1);
        return cx;
    }

    // Initialize to some gene.
    var cx = drawPlot('ENSG00000157764');
    console.log(cx);

    $('form').submit(function() {
        var gene_id = $("#gene_id").val();
        drawPlot(gene_id);
        return false;
    });
});
