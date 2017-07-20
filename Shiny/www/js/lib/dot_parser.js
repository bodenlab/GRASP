/**
 * Parses the dot file and converts it to an object
 * assumed edge format:
 * "0"->"2"[fontsize=12, fontcolor=darkgray, penwidth=2, dir=forward, label="50%", sequences="s1,s2,s5"];
 * assumed node format:
 * "0"[label="PG", fontsize=15, style="filled", fillcolor="#FFFFFF"];
 **/
dot_parser = function (options) {
    data_as_text = options.data;
    var lines = data_as_text.split('\n');

    // Check line 0 and 1 have correct format
    if ( lines[0] != "digraph {" ) {
        console.log("ERROR");
        return null;
    }
    
    // Set the rank order from the file - tells us whether to build
    // we'll need to reverse it or not
    var reverse = lines[1];

    var nodes = null;
    var temp = null;
    var start_node = null;
    var end_node = null;
    var info = null;
    var label = null;
    var edge = null;
    var bars = new Array();
    var x_array = null;
    var max_bar_count = 0;
    var bar_count = 0;

    // Set up the data dict which will be used to store all the info
    data = {};
    data['nodes'] = {};
    data['edges'] = {};

    // Since we've already covererd the first two lines parse the rest
    // of the file
    for (var i = 2; i < lines.length - 1; i ++) {
        temp = lines[i].split('[');
        nodes = temp[0].split('"');
        info = split_string(temp[1].split(']')[0]);

        // Get node id num
        start_node = parseInt(nodes[1]);
        // Means it's an edge
        if (nodes.length > 3) {
            end_node = parseInt(nodes[3]);
            // ID of edges will be the id of the starting node
            edge = data['edges'][start_node];
            if (edge == undefined) {
                data['edges'][start_node] = {};
            }
            data['edges'][start_node][end_node] = {};
            data['edges'][start_node][end_node]['id'] = end_node; 
            data['edges'][start_node][end_node]['label'] = info[5];
            data['edges'][start_node][end_node]['direction'] = info[3].split("=")[1];
            data['edges'][start_node][end_node]['sequences'] = info[7];

        // It is a node
        } else {
            data['nodes'][start_node] = {};
            data['nodes'][start_node]['id'] = start_node;
            data['nodes'][start_node]['label'] = info[1];
            data['nodes'][start_node]['color'] = info[6];
            data['nodes'][start_node]['name'] = "Histogram: " + info[1];
            data['nodes'][start_node]['x'] = 0;
            data['nodes'][start_node]['y'] = 0;
            if (info[8] != undefined) {
                options.graphs_display = true;
                // Keep track of the max number of bars on one graph
                bar_count = 0;
                graph = {};
                graph.y_label = "Histogram";
                bars = new Array();
                x_array = info[8].split(',');
                var sum_bar_vals = 0;
                // Add all the bars
                for (var x_val in x_array) {
                    var tmp = {};
                    var str_x = x_array[x_val];
                    tmp.x_label = str_x.substring(str_x.length - 1, str_x.length);
                    tmp.value = parseInt(str_x.substring(0, str_x.length - 1));
                    bars.push(tmp);
                    sum_bar_vals += tmp.value;
                    bar_count ++;
                }
                // Normalise the height of the bars
                for (var b in bars) {
                    bars[b].value = bars[b].value / sum_bar_vals;
                }
                graph.bars = bars;
                data['nodes'][start_node]['graph'] = graph;
                if (bar_count > max_bar_count) {
                    max_bar_count = bar_count;
                }
            }
        }
        options.graph.max_bar_count = max_bar_count;
    }
    return data;
}

/**
 * Splits the info string without splitting things in quotation marks
 * http://stackoverflow.com/questions/18703669/split-string-but-not-words-inside-quotation-marks
 **/
function split_string(str) {
    var tokens = [].concat.apply([], str.split('"').map(function(v,i){
        return i%2 ? v : v.split(',')
    })).filter(Boolean);
    return tokens
}
