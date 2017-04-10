
scale_x = function (options, x) {
    return (x * options.node.x_size) + options.node.x_start;
}

scale_y = function (options, y) {
    return (y * options.node.y_size) + options.node.y_start;
}

/**
 * Draws the nodes.
 */
draw_nodes = function(graph) {
    var options = graph.options;
    var node_opt = options.node;
    var edge_opt = options.edge;
    var nodes = options.data.nodes;
    var svg = graph.svg;
    var tooltip = svg.call(options.tip);

    options.graph.svg_overlay = svg;

    // Sets up the graph environment for the overlayed graphs
    setup_graph_overlay(options.graph);

    // Create a node group
    var group = svg.append('g')
                .attr("class", "nodes")
                .attr("id", "node_g")
    
    for (n in nodes) {
        node = nodes[n];
        colour = options.colours[node.label];
        group.append("circle")
                .attr("class", "node_" + node.label)
                .attr("id", "node_" + node.label + n)
                .attr("r", node_opt.radius)
                .attr("cx", scale_x(options, node.x))
                .attr("cy", scale_y(options, node.y))
                .attr("stroke-width", node_opt.stroke_width)
                .attr("stroke", node_opt.stroke)
                .attr("opacity", node_opt.default_opacity)
                .attr("fill", options.colours[node.label])
                .on("mouseover", tooltip.show)
                .on("mouseout", tooltip.hide);
        
        group.append("text")
                .attr("class", "node_text_" + node.label)
                .attr("id", "node_text_" + node.label + n)
                .attr("x", scale_x(options, node.x))
                .attr("y", scale_y(options, node.y) + node_opt.text_padding)
                .attr("text-anchor", "middle")
                .attr("stroke-width", node_opt.stroke_width)
                .style("font-family", node_opt.font_family)
                .style("font-size", node_opt.text_size)
                .attr("stroke", node_opt.font_colour)
                .text(node.label);

        if (options.graphs_display == true) {
            // Check if there is any bars to display first
            if (node.graph.bars.length > 1) {
                var graph_node = create_new_graph(node, options.graph);
                options.graph.graphs.push(graph_node);
            }
        }
        if (options.seq_display == true) {
            // Check whether or not there is a range of sequences
            // i.e. there may have just been the one amino acid in this
            // case there is no point re drawing it
            if (node.seq.chars.length > 1) {
                var seq_node = make_pie(node, options, svg);
                //options.graph.graphs.push(graph_node);
            }
        }
    }


    return graph;
}


make_pie = function(node, options, svg) {
    var node_cx = scale_x_graph(options.graph, node.x);
    var node_cy = scale_y_graph(options.graph, node.y);
    var pie_group = svg.append("g")
            .attr("id", "pie" + node.name)
            .attr('transform', 'translate(' + node_cx + "," + node_cy + ")")

    var pie = d3.pie()
        .sort(null)
        .value(function(d) { return d.value; });

    var path_pie = d3.arc()
        .outerRadius(options.pie.radius - 10)
        .innerRadius(0);

    var label_pie = d3.arc()
        .outerRadius(options.pie.radius - options.pie.label_position)
        .innerRadius(options.pie.radius - options.pie.label_position);

    var arc = pie_group.selectAll(".arc")
      .data(pie(node.seq.chars))
      .enter().append("g")
        .attr("class", "arc");

    arc.append("path")
        .attr("d", path_pie)
        .attr("fill", function(d) { 
            return options.colours[(d.data.label)]; 
        });

    arc.append("text")
        .attr("transform", function(d) { 
                return "translate(" + label_pie.centroid(d) + ")"; 
            })
        .attr("dy", "0.35em")
        .text(function(d) { return d.data.label; });
}

/**
 * Assign x and y coods to the nodes
 * Only if we are using the dot file (not the JSON)
 */
assign_x_y_coords = function (graph) {
    var options = graph.options;
    var node_opt = options.node;
    var edge_opt = options.edge;
    var nodes = options.data.nodes;
    var edges = options.data.edges;
    var x = 0;
    var initial_y = 600;
    var y = 100;
    var n_int = 0;
    var walk_up = true;
    var y_tmp = {};

    for (n in nodes) {
        node = nodes[n];
        x += edge_opt.x_length;
        y_tmp = get_y_coord(n_int, options.depth, edge_opt.y_length, initial_y, walk_up);
        y = y_tmp.y_var;
        walk_up = y_tmp.walk_up_var;
        node.x = x;
        node.y = y;
        if (walk_up == true) {
            n_int ++;
        } else {
            n_int --;
        }
    }
    
    return graph;
}

/**
 * Gets the y coordinate based on users params
 */
get_y_coord = function (n, depth, y_len, initial_y, walk_up) {
    var rem = n % depth;
    var odd_rem = rem % 2;
    var y_tmp = 0;
    var y = 0;

    if (rem == 0 && n != 0 && depth > 3) {
        if (walk_up == true) {
            walk_up = false;
            n --;
        } else {
            walk_up = true;
        }
    }
    if (odd_rem == 0 && rem != 0) {
        y_tmp = (y_len * ((n - 1) % depth))
    } else {
        y_tmp = (y_len * rem);
    } 
    if (odd_rem == 0 && n != 0) {
        y = initial_y + y_tmp;
    } else {
        y = initial_y - y_tmp;
    }
    return {y_var: y, walk_up_var: walk_up};
}





/**
 * Reorder the nodes so that the more likely pairings are nearest
 * to eachother in the y direction
 */
 

/**
 * Draws the lines between the nodes
 */
draw_edges = function(graph) {
    var options = graph.options;
    var node_opt = options.node;
    var edge_opt = options.edge;
    var nodes = options.data.nodes;
    var edges = options.data.edges;
    var svg = graph.svg;
    var tooltip = svg.call(options.tip);
    var x_start = 0;
    var x_mid = 0;
    var x_end = 0;
    var y = 100;
    var y_mid = 0;
    var count = 0;
    var y_len = 25;
    var y = 100;
    var n_int = 0;
    var walk_up = true;
    var y_tmp = {};
    var opacity = 1;
    var same_level_buffer = 50;
    var label = null;
    var initial_y = options.nodes.y_start;
    var group = svg.append('g')
                .attr("class", "edges")
                .attr("id", "edge_g")

    for (e in edges) {
        edge = edges[e]
        var line_points = new Array();
        x_start = scale_x(options, edge.x1);
        x_end = scale_x(options, edge.x2);
        x_mid = x_start - ((x_start - x_end)/2);
        y_start = scale_y(options, edge.y1);
        y_end = scale_y(options, edge.y2);
        y_mid = y_start - ((y_start - y_end)/2);
        line_points.push(combine_points(x_start, y_start));
        x_text_pos = x_mid;
        y_text_pos = y_mid;
        y_jump_buffer = same_level_buffer* Math.abs(edge.x1 - edge.x2);
        // Means that the nodes are on the same level
        if (y_end == y_start) {
            if ( Math.abs(edge.x1 - edge.x2) == 1) {
                line_points.push(combine_points(x_mid, y_start -y_len));
            } else {
                y_text_pos = (y_start - y_jump_buffer/2);
                line_points.push(combine_points(x_mid, (y_start - y_jump_buffer)));
            }
        }
        else if (y_end > y_start) {
            x_text_pos = (x_mid + x_start)/2 + 10;
            if ( Math.abs(edge.x1 - edge.x2) == 1) {
                // Means that the node it is pointing to is lower than the node before it
                line_points.push(combine_points(x_mid, y_end + y_len));
            } else {
                y_text_pos = (y_end + y_jump_buffer/2);
                line_points.push(combine_points(x_end, y_end + y_jump_buffer));
            }
        // Means the node at the end is higher than the starting node
        } else {
            x_text_pos = (x_mid + x_end)/2 - 10;
            if ( Math.abs(edge.x1 - edge.x2) == 1) {
                line_points.push(combine_points(x_mid, y_start + y_len));
            } else {
                y_text_pos = (y_start + y_jump_buffer/2);
                line_points.push(combine_points(x_end, y_start + y_jump_buffer));

            }
        }
        line_points.push(combine_points(x_end, y_end));

        label = edge.weight;
        opacity = 0.3 + (edge.weight * 0.007);

        var edge = group.append("path")
                        .attr("d", line_function(line_points))
                        .attr("class", "edge")
                        .attr("id", "edge:" + edge.from +":to:" + edge.to )
                        .attr("stroke-width", edge_opt.stroke_width)
                        .attr("stroke", edge_opt.stroke)
                        .attr("opacity", opacity)
                        .attr("fill", "none")
                        .attr("marker-mid", "url(#triangle-end)");

        group.append("text")
                .attr("class", "edge_text_" + label)
                .attr("id", "edge_text_" + edge.from +":to:" + edge.to )
                .attr("x", x_text_pos)
                .attr("y", y_text_pos)
                .attr("text-anchor", "middle")
                .attr("stroke-width", edge_opt.text_stroke_width)
                .style("font-family", edge_opt.font_family)
                .style("font-size", edge_opt.text_size)
                .style("fill", edge_opt.font_color)
                .attr("opacity", opacity)
                .text(label);

        edge.moveToBack();
        count ++;
    }
    return graph;
}

/**
 * Create tmp x, y for interpolation
 */
combine_points = function (x_var, y_var) {
    return {x: x_var, y: y_var};
}

/**
 * Creates an interpolation between the points to 
 * give a nice line
 */
var line_function = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate("basis");

/**
 * Used to move the edge segments to the back
 */
d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};
