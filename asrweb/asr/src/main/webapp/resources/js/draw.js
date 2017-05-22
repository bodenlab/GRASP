draw_positions = function (graph, nodes, x_min, x_max) {
    var options = graph.options;
    var position_opt = options.position;
    var node_opt = options.node;
    var group = graph.node_group;
    var x_scale = graph.scale.x1;
    var y_scale = graph.scale.y1;
    var radius = graph.max_radius;
    var stroke_width =  node_opt.stroke_width;
    var width = options.width;
    // Get the number of nodes which are in the larger display
    var node_count = Object.keys(nodes).length / 2; // includes both POAGS (inferred and MSA)
    var level = 0;
    // Work out how many labels we want to draw
    if (node_count + 1 < position_opt.level_1_node_limit) {
        level = position_opt.level_1;

    } else if (node_count + 1 < position_opt.level_2_node_limit) {
        level = position_opt.level_2;

    } else if (node_count + 1 < position_opt.level_3_node_limit) {
        level = position_opt.level_3;

    } else {
        level = position_opt.level_unlimited;
    }
    // We want to draw every position not just if there is a node there (we want to draw it
    // even if the node has been removed)
    for (var n = 0; n < nodes.length/2; n ++) {
        if (n % level == 0) {
                group.append("text")
                    .attr("class", "position_text")
                    .attr('x', function () {
                        var tmp = x_scale(n);
                        return tmp;
                    })
                    .attr('y', function () {
                        var tmp = y_scale(0) - position_opt.text_padding; // Have it at the top
                        return tmp ;
                    })
                    .attr("text-anchor", "middle")
                    .attr("stroke-width", node_opt.stroke_width)
                    .style("font-family", node_opt.font_family)
                    .style("font-size", node_opt.text_size)
                    .attr("stroke", function() {
                        return "grey";
                    })
                    .text(n);
        }
    }
}


draw_mini_nodes = function (graph) {
    var nodes = graph.nodes;
    var options = graph.options;
    var node_opt = options.node;
    var group = graph.mini.append('g');
    var x_scale = graph.scale.x;
    var y_scale = graph.scale.y2;
    var radius = options.mini_radius;
    var x_padding = options.x_padding / 2;
    var y_padding = 20;
    for (var n in nodes) {
        var node = nodes[n];

        var colour = options.colours[node.label];
        group.append("circle")
                .attr("class", "mini_node")
                .attr("id", "node_" + node.label + n)
                .attr('cx', function () {
                    var tmp = x_scale(node.start);
                    return tmp + x_padding;
                })
                .attr('cy', function () {
                    var tmp = (y_scale(node.lane) + y_scale(node.lane + 1)) / 2;
                    return tmp + y_padding;
                })
                .attr('r', radius)
                .attr("stroke-width", node_opt.stroke_width)
                .attr("stroke", node_opt.stroke)
                .attr("opacity", node_opt.default_opacity)
                .attr("fill", options.colours[node.label]);

        if (node.many_edges == true) {
            group.append("rect")
                    .attr("class", "mini_rect")
                    .attr('x', function () {
                        var tmp = x_scale(node.start) - (2 * radius);
                        return tmp + x_padding;
                    })
                    .attr('y', function () {
                        var tmp = y_scale(0); // Have it at the top
                        return tmp ;
                    })
                    .attr('width', 4 * radius)
                    .attr('height', y_scale(graph.max_depth * 2))
                    .attr("stroke-width", node_opt.stroke_width)
                    .attr("stroke", node_opt.stroke)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.diff_colour);

        }
        if (node.deleted_during_inference == true) {
            group.append("circle")
                .attr("class", "mini_node")
                .attr("id", "node_" + node.label + n)
                .attr('cx', function () {
                    var tmp = x_scale(node.start);
                    return tmp + x_padding;
                })
                .attr('cy', function () {
                    var tmp = (y_scale(node.lane) + y_scale(node.lane + 1)) / 2;
                    return tmp + y_padding;
                })
                .attr('r', 2 * radius)
                .attr("opacity", options.diff_opacity)
                .attr("fill", options.interesting_many_edges_colour);
        }
    }
    graph.mini_group = group;
    return graph;
}


draw_mini_line = function (graph) {
    var nodes = graph.nodes;
    var options = graph.options;
    var mini_opt = options.mini;
    var group = graph.mini.append('g');
    var x_scale = graph.scale.x;
    var y_scale = graph.scale.y2;
    var radius = options.mini_radius;
    var x_padding = options.x_padding;
    var y_padding = 0;
    var line_points = new Array();

    for (var n in nodes) {
        var node = nodes[n];
        if (node.first_node == true) {

            group.append("path")
                      .attr("d", line_function(line_points))
                      .attr("class", "edge")
                      .attr("stroke-width", mini_opt.stroke_width)
                      .attr("stroke", mini_opt.stroke)
                      .attr("fill", "none")

            line_points = new Array();
        }
        //var colour = options.colours[node.label];
        var line_y = (y_scale(node.lane) + (y_scale(node.lane + 1)) / 2);
        var line_x = x_scale(node.start) + x_padding;
        line_points.push(combine_points(line_x, line_y));

        if (node.many_edges == true) {
            var rect = group.append("rect")
                    .attr("class", "mini_rect")
                    .attr('x', line_x)
                    .attr('y', function () {
                        var tmp = y_scale(0); // Have it at the top
                        return tmp ;
                    })
                    .attr('width', 4 * radius)
                    .attr('height', graph.page_options.miniHeight +  options.lane_height)
                    .attr("stroke-width", mini_opt.stroke_width)
                    .attr("stroke", mini_opt.stroke)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.diff_colour);

            rect.moveToBack();

        }
        if (node.deleted_during_inference == true) {
            var circle = group.append("circle")
                .attr("class", "mini_node")
                .attr("id", "node_" + node.label + n)
                .attr('cx', line_x)
                .attr('cy', line_y)
                .attr('r', 2 * radius)
                .attr("opacity", options.diff_opacity)
                .attr("fill", options.interesting_many_edges_colour);

            circle.moveToBack();
        }
    }
       var path = group.append("path")
                 .attr("d", line_function(line_points))
                 .attr("class", "edge")
                 .attr("stroke-width", mini_opt.stroke_width)
                 .attr("stroke", mini_opt.stroke)
                 .attr("fill", "none");

         path.moveToBack();


    graph.mini_group = group;
    return graph;
}




/**
 * Draws the nodes.
 */
draw_nodes = function (graph, nodes, x_min, x_max) {
    var options = graph.options;
    var node_opt = options.node;
    var group = graph.node_group;
    var x_scale = graph.scale.x1;
    var y_scale = graph.scale.y1;
    var radius = graph.max_radius;
    var stroke_width =  node_opt.stroke_width;

    if (radius < graph.min_radius) {
         stroke_width = 0;
    }
    // Sets up the graph environment for the overlayed graphs
    //    setup_graph_overlay(options.graph);

    for (var n in nodes) {
        var node = nodes[n];
        if (node.start >= x_min & x_max >= node.end) {
            group.append("circle")
                    .attr("class", "main_node")
                    .attr("id", "node_" + node.label + n)
                    .attr('cx', function () {
                        var tmp = x_scale(node.start);
                        return tmp;
                    })
                    .attr('cy', function () {
                        var tmp = (y_scale(node.lane) + y_scale(node.lane + 1)) / 2;
                        return tmp;
                    })
                    .attr('r', function () {
                        var tmp = (x_scale(node.end + 1) - x_scale(node.start)) / 4;

                        if (tmp > graph.max_radius) {
                            return graph.max_radius;
                        }
                        radius = tmp;
                        return tmp;
                    })
                    .attr("stroke-width", node_opt.stroke_width)
                    .attr("stroke", node_opt.stroke)
                    .attr("opacity", node_opt.default_opacity)
                    .attr("fill", options.colours[node.label]);

            // If the size of the graph is small we don't want to have labels
            // Also don't want to draw labels on the pie charts
            if (radius > graph.min_radius && (node.seq.chars.length < 2 || node.type !=  'marginal'))  {

                if (options.colours )
                    group.append("text")
                    .attr("class", "node_text")
                    .attr("id", "node_text_" + node.label + n)
                    .attr('x', function () {
                        var tmp = x_scale(node.start);
                        return tmp;
                    })
                    .attr('y', function () {
                        var tmp = (y_scale(node.lane) + y_scale(node.lane + 1)) / 2 + node_opt.text_padding;
                        return tmp;
                    })
                    .attr("text-anchor", "middle")
                    .attr("stroke-width", node_opt.stroke_width)
                    .style("font-family", node_opt.font_family)
                    .style("font-size", node_opt.text_size)
                    .attr("stroke", function () {
                        return getNodeTextColour(options.colours[(node.label)]);
                    })
                    .text(node.label);
            }
        }
        if (options.graphs_display == true && node.type == 'marginal') {
            // Check if there is any bars to display first
            if (node.graph.bars.length > 1) {
                var graph_node = create_new_graph(node, options.graph, x_scale(node.start), (y_scale(node.lane) + y_scale(node.lane + 1)) / 2);
                options.graph.graphs.push(graph_node);
            }
        }
        if (options.seq_display == true && node.type == 'marginal') {
            // Check whether or not there is a range of sequences
            // i.e. there may have just been the one amino acid in this
            // case there is no point re drawing it
            if (node.seq.chars.length > 1) {
                var seq_node = make_pie(node, graph, radius);
                //options.graph.graphs.push(graph_node);
            }
        }
    }
    graph.radius = radius;
    // Update the y curve amount to be half the radius
    graph.y_curve_amount = radius/2;
    return graph;
};


make_pie = function (node, graph, radius) {
    var options = graph.options;
    var group = graph.node_group;
    var x_scale = graph.scale.x1;
    var y_scale = graph.scale.y1;
    var node_cx = x_scale(node.start);
    //var radius = graph.max_radius;
    var node_cy = (y_scale(node.lane) + y_scale(node.lane + 1)) / 2;
    var stroke_width = options.pie.stroke_width;
    if (radius < graph.min_radius || graph.max_seq_len > options.pie.max_seq_len) {
          stroke_width = 0;
    }
    var pie_group = group.append("g")
            .attr("id", "pie" + node.name)
            .attr('transform', 'translate(' + node_cx + "," + node_cy + ")")

    var pie = d3.layout.pie()
            .value(function (d) {
                return d.value;
            });

    var path_pie = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(0);

    var label_pie = d3.svg.arc()
            .outerRadius(radius - options.pie.label_position)
            .innerRadius(radius - options.pie.label_position);

    if (mutants > 0) {
        var arc = pie_group.selectAll(".arc")
            .data(pie(node.mutants.chars))
            .enter().append("g")
            .attr("class", "arc");
    } else {
        var arc = pie_group.selectAll(".arc")
            .data(pie(node.seq.chars))
            .enter().append("g")
            .attr("class", "arc");
    }

    arc.append("path")
            .attr("class", "pie")
            .attr("d", path_pie)
            .attr("stroke-width", stroke_width)
            .attr("stroke", options.pie.stroke)
            .attr("fill", function (d) {
                return options.colours[(d.data.label)];
            });

    // Don't want to append text if it is smaller than the min radius

    if (radius > graph.min_radius ) {
        arc.append("text")
            .attr("class", "pie")
            .attr("transform", function (d) {
                return "translate(" + label_pie.centroid(d) + ")";
            })
            .style("fill", function(d) {
                return getNodeTextColour(options.colours[(d.data.label)]);
            })
            .attr("dy", "0.35em")
            .text(function (d) {
                return d.data.label;
            });
    }
}

/**
 * Get the text colour for node labels based on hue and lightness (i.e. dark colours will have light text)
 */
var getNodeTextColour = function(colour) {
    var hsl = hexToHsl(colour);
    if (hsl[0] < 60 || hsl[2] > 50) {
        return "#383838";
    }
    return "#F7F7F7";
}

/**
 * Draws the lines between the nodes
 */
draw_node_edges = function (graph, x_min, x_max) {

    var options = graph.options;
    var edge_opt = options.edge;
    var edges = graph.edges;
    var group = graph.node_group;

    var x_start = 0;
    var x_mid = 0;
    var x_end = 0;

    var y_mid = 0;
    var count = 0;
    var y_len = graph.y_curve_amount;

    var opacity = 1;
    var same_level_buffer = graph.y_curve_amount;
    var label = null;

    var x_scale = graph.scale.x1;
    var y_scale = graph.scale.y1;

    for (var e in edges) {
        edge = edges[e];
        if (edge.x1 >= x_min -1 & x_max  + 1>= edge.x2) {
            var line_points = new Array();
            x_start = x_scale(edge.x1);
            x_end = x_scale(edge.x2);

            x_mid = x_start - ((x_start - x_end) / 2);
            var y_start = (y_scale(edge.y1) + y_scale(edge.y1 + 1)) / 2;
            var y_end = (y_scale(edge.y2) + y_scale(edge.y2 + 1)) / 2;
            y_mid = y_start - ((y_start - y_end) / 2);
            line_points.push(combine_points(x_start, y_start));
            var x_text_pos = x_mid;
            var y_text_pos = y_mid;
            var y_jump_buffer = same_level_buffer * Math.abs(edge.x1 - edge.x2);
            // Means that the nodes are on the same level
            if (y_end == y_start) {
                if (Math.abs(edge.x1 - edge.x2) == 1) {
                    line_points.push(combine_points(x_mid, y_start - y_len));
                } else {
                    y_text_pos = (y_start - y_jump_buffer / 2);
                    line_points.push(combine_points(x_mid, (y_start - y_jump_buffer)));
                }
            } else if (y_end > y_start) {
                x_text_pos = (x_mid + x_start) / 2 + 10;
                if (Math.abs(edge.x1 - edge.x2) == 1) {
                    // Means that the node it is pointing to is lower than the node before it
                    line_points.push(combine_points(x_mid, y_end + y_len));
                } else {
                    y_text_pos = (y_end + y_jump_buffer / 2);
                    line_points.push(combine_points(x_end, y_end + y_jump_buffer));
                }
                // Means the node at the end is higher than the starting node
            } else {
                x_text_pos = (x_mid + x_end) / 2 - 10;
                if (Math.abs(edge.x1 - edge.x2) == 1) {
                    line_points.push(combine_points(x_mid, y_start + y_len));
                } else {
                    y_text_pos = (y_start + y_jump_buffer / 2);
                    line_points.push(combine_points(x_end, y_start + y_jump_buffer));

                }
            }
            line_points.push(combine_points(x_end, y_end));

            label = edge.weight;
            opacity = 0.3 + (edge.weight * 0.007);

            var edge = group.append("path")
                    .attr("d", line_function(line_points))
                    .attr("class", "edge")
                    .attr("id", "edge:" + edge.from + ":to:" + edge.to)
                    .attr("stroke-width", edge_opt.stroke_width)
                    .attr("stroke", edge_opt.stroke)
                    .attr("opacity", opacity)
                    .attr("fill", "none")
                    .attr("marker-mid", "url(#triangle-end)");

            if (graph.radius  > graph.min_radius) {
                    group.append("text")
                        .attr("class", "edge_text")
                        .attr("id", "edge_text_" + edge.from + ":to:" + edge.to)
                        .attr("x", x_text_pos)
                        .attr("y", y_text_pos)
                        .attr("text-anchor", "middle")
                        .attr("stroke-width", edge_opt.text_stroke_width)
                        .style("font-family", edge_opt.font_family)
                        .style("font-size", edge_opt.text_size)
                        .style("fill", edge_opt.font_color)
                        .attr("opacity", opacity)
                        .text(label);
             }

            edge.moveToBack();
            count++;
        }
    }
    return graph;
};
/**
 * Create tmp x, y for interpolation
 */
combine_points = function (x_var, y_var) {
    return {x: x_var, y: y_var};
};

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


/**
 * Convert hex to hsl
 */
var hexToHsl = function(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        r = (c>>16)&255;
        g = (c>>8)&255;
        b = c&255;

        r /= 255, g /= 255, b /= 255;
        		var max = Math.max(r, g, b), min = Math.min(r, g, b);
        		var h, s, l = (max + min) / 2;

        		if (max == min) {
        		h = s = 0;
        		} else {
        			var d = max - min;
        			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        			switch (max){
        				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        				case g: h = (b - r) / d + 2; break;
        				case b: h = (r - g) / d + 4; break;
        			}

        			h /= 6;
        		}

        		return [(h*100+0.5)|0, ((s*100+0.5)|0), ((l*100+0.5)|0)];
    }
    return [(100+0.5)|0, ((100+0.5)|0), ((100+0.5)|0)];
}