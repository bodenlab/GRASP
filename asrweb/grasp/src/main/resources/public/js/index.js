/*
 * http://bl.ocks.org/bunkat/1962173
 */
var graph = {};

// keep track of window view
var prevbrushStart = -1;
var prevbrushEnd = -1;
var retain_previous_position = false;


/**
 * Adds the MSA POAG initially, during this process the data for the
 * rest of the functions is set up etc
 */
setup_main_poag = function (graph) {
    var nodes = [];
    var node_dict = {};
    var max_seq_len = 0;
    // Draw the main MSA POAG at the top of the page, this is defined in the JSON
    // object which is passed to the JavaScript from the BN-kit application  
    var poag = graph.options.stored_data.msa;
    // Set up each node, this includes adding labels, identifying if the node is of interest
    // Interest = many edges, whether it is inferred or the main MSA, an indel
    // and also the additional features to be added later (mutant) etc.
    for (var n in poag.nodes) {
        var node = poag.nodes[n];
        // Add the type to the node so we know whether or not to draw the distributions
        node.type = poag.metadata.type;
        node.deleted_during_inference = true;
        node.inferred = false;
        node.mutant = false;
        node.msa = true;
        if (node.seq.chars.length > max_seq_len) {
            max_seq_len = node.seq.chars.length;
        }

	formatMutants(node, poag);
	/*if (node.type != "fused"){
            node.graph = {};
            if (mutants > 0) {
                node.graph.bars = node.mutants.chars;
            } else {
                node.graph.bars = node.seq.chars;
            }
	}*/
        nodes.push(node);
        node_dict["root" + "-" + node.id] = node;
    }
    // Add variables to the graph object
    graph.nodes = nodes;
    graph.all_nodes = nodes;
    graph.node_dict = node_dict;
    graph.max_seq_len = max_seq_len;
    return graph;
}


/**
 * Each time we add a new POAG we need to update the lane scaling
 * so that the size remains correct rather than just piling them on top of
 * one another.
 */
update_lanes = function (graph) {
    // At each position we want to add a "lane" which is where that section
    // of the POAG is drawn
    var lanes = [];
    for (var d = 0; d < graph.max_depth * 1.5; d ++) {
        var tmp = {};
        tmp.id = d;
        lanes.push(tmp);
    }
    graph.lanes = lanes;
    return graph;
}


/**
 * Adds the edges to the visualisation
 */
add_edges = function (graph, poag, name) {
    var current_y_position = graph.max_depth;
    var edges = graph.edges;
    var node_dict = graph.node_dict;
    for (var e in poag.edges) {
        var edge = poag.edges[e];
        edge.y1 += current_y_position;
        edge.y2 += current_y_position;
        // Update the to and from ID's for the nodes to include the POAG
        // if we are in the inferred version we need to get the updated x coods as above
        var node_inferred_from = node_dict[name + "-" + edge.from];
        var node_inferred_to = node_dict[name + "-" + edge.to];
        edge.x1 = node_inferred_from.x;
        edge.x2 = node_inferred_to.x;
        edges.push(edge);
    }
    graph.edges = edges;
    return graph;
}

/**
 * Adds a new POAG under the initial MSA version. 
 * Here we need to keep track of how many POAGS have been
 * added and add the new nodes to our list of nodes.
 */
add_poag = function (graph, poag, name) {
    var node_dict = graph.node_dict;
    var nodes = graph.all_nodes;
    for (var n in poag.nodes) {
        var node = poag.nodes[n];
        if (n == 0) {
            node.first_node = true; // Used to make the line for the mini line
        }
        node.y += graph.max_depth;
        var node_inferred = node_dict["root" + '-' + node.id];
        // Update the x coords to match that of the MSA node (to account for deletions)
        node.x = node_inferred.x;
        node.msa = false;
        node.mutant = false;
        node.name = name;
        if (node.inferred == true && node.mutants.chars.length > 0) {
            node.mutant = true;
        }
        // Add the type to the node so we know whether or not to draw the distributions
        node.type = poag.metadata.type;
	formatMutants(node, poag);

        node.inferred = true;
        node.many_edges = false;
        // Update to say that it hasn't been deleted since it appears in both
        node.deleted_during_inference = false;
        node_inferred.deleted_during_inference = false;
        // Add a unique identifier so we can find it in the node dictionary
        node.unique_id = name + "-" + node.id;
        nodes.push(node);
        node_dict[name + "-" + node.id] = node;
    }
    graph.all_nodes = nodes;
    graph.node_dict = node_dict;
    return graph;
}

function formatMutants(node, poag){

    if (node.type != "fused"){
	node.graph = {};
        if (mutants > 0) {
            node.graph.bars = node.mutants.chars;
        } else {
            node.graph.bars = node.seq.chars;
        }
    } else {
	//adding number of poags fused
	node.npoags = poag.metadata.npoags;

	node["subtype"] = poag.metadata.subtype;
	
	//changing graph if fused marginal graph
	if (node.subtype == "marginal"){
		
	    node.graph = {};
	    node.graph.bars = node.mutants.chars;

	}
    }
}



make_scales = function (graph) {
    var nodes = graph.all_nodes;
    var lanes = graph.lanes;
    var radius = graph.max_radius;
    var options = graph.options;
    var margin = options.margin;
    var x_padding = options.x_padding;

    var width = options.width - margin.left - margin.right
            , height = options.height - margin.top - margin.bottom
            , miniHeight = lanes.length * options.lane_height + options.lane_padding
            , mainHeight = options.height - miniHeight - options.lane_padding;

    var x = d3.scale.linear()
            .domain([(d3.min(nodes, function (d) {
                    return d.x - 1;
                })),
                d3.max(nodes, function (d) {
                    return d.x + 1;
                })])
            .range([0, width]);


    var x1 = d3.scale.linear().range([0, width]);

    var ext = d3.extent(lanes, function (d) {
        return d.id;
    });
    var y1 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, mainHeight]);
    var y2 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, miniHeight]);

    // Place the mini viewer below the main graph and the padding between the views
    //graph.position_of_mini_viewer = options.padding_between_views + mainHeight;
    graph.scale = {};
    graph.scale.x1 = x1;
    graph.scale.x = x;
    graph.scale.y1 = y1;
    graph.scale.y2 = y2;
    graph.scale.ext = ext;
    graph.page_options = {};
    graph.page_options.width = width;
    graph.page_options.margin = margin;
    graph.page_options.height = height;
    graph.page_options.miniHeight = miniHeight;
    graph.page_options.mainHeight = mainHeight;
    return graph;
}

setup_svg = function (graph) {
    var nodes = graph.all_nodes;
    var lanes = graph.lanes;
    var margin = graph.page_options.margin;
    var width = graph.page_options.width;
    var height = graph.page_options.height;
    var mainHeight = graph.page_options.mainHeight;
    var miniHeight = graph.page_options.miniHeight;
    var x1 = graph.scale.x1;
    var y1 = graph.scale.y1;
    var x = graph.scale.x;
    var y2 = graph.scale.y2;
    var options = graph.options;

    var max_depth = graph.max_depth;
    // Get the width of the DIV that we are appending the svg to so we can scale the height and width values
    var actual_svg_width = width;//document.getElementById(options.raw_svg_id).offsetWidth;
    var actual_svg_height = height;// document.getElementById(options.raw_svg_id).offsetHeight;
    // We don't want to get the height as we only want to develop the scale based on one element
    var scale_width = 0.9;// Want it to be 10% smaller than the space to add even padding
    var scale_height = 0.9;

    var width = width;
    var padding = scale_width *(options.svg_padding);

    var general_svg = d3.select(options.target)
            .append("svg")
            //.attr("preserveAspectRatio", "xMinYMin meet")
            //.attr("preserveAspectRatio", "xMaxYMax meet")
            .attr("viewBox", "0 0 " + actual_svg_width + " " + actual_svg_height)
            .classed("svg-content", true);

    var chart = general_svg.append('g')
                    .attr("transform",  "translate(" + 0 + ",-" + options.svg_padding + ")" + " scale(1)");// + scale_width + ")");

    chart.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', mainHeight / max_depth);

    var main = chart.append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('width', width)
            .attr('height', mainHeight)
            .attr('class', 'main');

    var mini = chart.append('g')
            .attr('transform', 'translate(' + margin.left/2 + ', 50 )')
            .attr('width', width)
            .attr('height', miniHeight - options.padding_between_views)
            .attr('class', 'mini');

    graph.mini = mini;
    graph.main = main;
    options.graph.svg_overlay = main;
    return graph;
};

    // https://github.com/wbkd/d3-extended
    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
    d3.selection.prototype.moveToBack = function() {
        return this.each(function() {
            var firstChild = this.parentNode.firstChild;
            if (firstChild) {
                this.parentNode.insertBefore(this, firstChild);
            }
        });
    };

setup_items = function (graph) {
    var mini = graph.mini;
    var main = graph.main;
    // draw the items
    var node_group = main.append('g');

    mini.append('g').selectAll('miniItems')
            .data(getPaths(graph))
            .enter().append('path')
            .attr('class', function (d) {
                return 'miniItem ' + d.class;
            })
            .attr('d', function (d) {
                return d.path;
            });
    graph.node_group = node_group;
    return graph;
}

setup_brush = function (graph) {
    var width = graph.page_options.width;
    var mainHeight = graph.page_options.mainHeight;
    var miniHeight = graph.page_options.miniHeight;
    var x = graph.scale.x;
    var y_scale = graph.scale.y2;
    var mini = graph.mini;
    var main = graph.main;
    var options = graph.options;

    // invisible hit area to move around the selection window
    mini.append('rect')
            .attr('pointer-events', 'painted')
            .attr('width', width)
            .attr('height', miniHeight)
            .attr('visibility', 'hidden')
            .on('mouseup', moveBrush);

    // draw the selection area
    var brush = d3.svg.brush()
            .x(x)
            .extent([0, options.num_start_nodes])
            .on("brush", display);


    mini.append('g')
            .attr('class', 'x brush')
            .call(brush)
            .selectAll('rect')
            .attr('y',  -20)
            .attr('height', miniHeight + options.lane_height);

    mini.selectAll('rect.background').remove();

    graph.brush = brush;
    return graph;

};



/**
 * Sets the MSA graph at the top of the page
 */
var set_poag_data = function (options, json_str) {
    console.log(json_str);
    var data = JSON.parse(json_str);
    options.stored_data.msa = data.top;
    options.stored_data.inferred.push(data.bottom);
    return options;
}

create_poags = function (options) {
    // Stores everything for the graph
    // create an empty array to store the edges in 
    graph.edges = [];
    graph.options = options;
    graph.max_depth = 0;
    // Setup the MSA POAG and the edges
    graph = setup_main_poag(graph);
    graph = add_edges(graph, options.stored_data.msa, "root");
    graph.max_depth += options.stored_data.msa.max_depth + 1;

    // Setup the secondary POAG (inferred)
    for (var p in options.stored_data.inferred) {
        var poag = options.stored_data.inferred[p];
        graph = add_poag(graph, poag);
        graph = add_edges(graph, poag);
        graph.max_depth += poag.max_depth + 1;
        options.height += 250;
    }

    // Update the lanes for the graph so scaling is correct
    graph = update_lanes(graph);
    // Make the radius based on the graph height and the number of lanes
    graph.options.graph.colours = options.colours;
    graph.max_radius = (options.height / graph.lanes.length) / 3;
    // Where the minimum size of the radius is set up to determine when to stop drawing labels
    graph.min_radius = graph.max_radius / 3;
    graph = make_scales(graph);
    graph = setup_svg(graph);
    graph = setup_items(graph);
    graph = draw_mini_line(graph);//draw_mini_nodes(graph);
    graph = setup_brush(graph);
    display();
};


function display() {
    var brush = graph.brush;
    var nodes_curr = graph.all_nodes;
    console.log(JSON.stringify(graph.all_nodes));
    var mini = graph.mini;

    var x_scale = graph.scale.x1;

    var options = graph.options;

    var minExtent = (brush.extent()[0]);
    var maxExtent = (brush.extent()[1]);
    if (prevbrushStart == -1 || retain_previous_position == false) {
         prevbrushStart = minExtent;
         prevbrushEnd = maxExtent;
    }
    retain_previous_position = false;

    var vis_nodes = nodes_curr.filter(function (d) {
            return d.x < prevbrushEnd && d.x >= prevbrushStart - 1;
        });

    mini.select('.brush').call(brush.extent([prevbrushStart, prevbrushEnd]));

    x_scale.domain([prevbrushStart, prevbrushEnd]);

    // Delete all the old edges
    graph.node_group.selectAll("path.edge").remove();
    graph.node_group.selectAll("path.pie").remove();

    // Delete all graphs
    graph.options.graph.svg_overlay.selectAll("g.graph").remove();

    // Delete all old nodes
    graph.node_group.selectAll("circle.main_node").remove();

    // Delete all the old text
    graph.node_group.selectAll("text.edge_text").remove();
    graph.node_group.selectAll("text.node_text").remove();
    graph.node_group.selectAll("text.pie").remove();
    graph.node_group.selectAll("text.position_text").remove();

    draw_nodes(graph, vis_nodes, prevbrushStart, prevbrushEnd);
    draw_node_edges(graph, prevbrushStart, prevbrushEnd);
    draw_positions(graph, vis_nodes, prevbrushStart, prevbrushEnd);

}


function moveBrush() {
    var brush = graph.brush;
    var origin = d3.mouse(this)
            , point = graph.scale.x.invert(origin[0])
            , halfExtent = (brush.extent()[1] - brush.extent()[0]) / 2
            , start = point - halfExtent
            , end = point + halfExtent;
    console.log(brush);
    graph.brush.extent([start, end]);
    prevbrushStart = start;
    prevbrushEnd = end;
    retain_previous_position = true;
    display();
}


// generates a single path for each item class in the mini display
// ugly - but draws mini 2x faster than append lines or line generator
// is there a better way to do a bunch of lines as a single path with d3?
function getPaths(graph) {
    var items = graph.all_nodes;
    var x = graph.scale.x;
    var y2 = graph.scale.y2;
    var paths = {}, d, offset = .5 * y2(1) + 0.5, result = [];
    for (var i = 0; i < items.length; i++) {
        d = items[i];
        if (!paths[d.class])
            paths[d.class] = '';
        paths[d.class] += ['M', x(d.x), (y2(d.y) + offset), 'H', x(d.x)].join(' ');
    }

    for (var className in paths) {
        result.push({class: className, path: paths[className]});
    }

    return result;
}

/**
 * Adds a new POAG to the existing visualisation (can be marginal or joint)
 */
var add_new_poag = function (json_str, poag_name) {
    var data = JSON.parse(json_str);
    graph = add_poag(graph, data.bottom, poag_name);
    graph = add_edges(graph, data.bottom, poag_name);
    graph.max_depth += data.bottom.max_depth + 1;
    graph = update_lanes(graph);
    graph = make_scales(graph); 
    display();
}


/**
 * Refresh the graph to be the latest reconstructed
 */
var refresh_graphs = function(options) {
    d3.select(".svg-content").remove();
    retain_previous_position = true;
    options = create_poags(options);
};
