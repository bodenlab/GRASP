/*
 * http://bl.ocks.org/bunkat/1962173
 */
var graph = {};

setup_data = function (graph) {
    var lanes = [];
    var nodes = [];
    var node_dict = {};
    var edges = [];
    var poags = graph.data.poags;
    var current_y_position = 0;
    var count = 0;
    var total_max_depth = 0;
    for (var p in poags) {
        var poag = poags[p];
        var title = poag.metadata.title;
        var max_depth = poag.metadata.max_depth;
        if (max_depth > total_max_depth) {
            total_max_depth = max_depth;
        }
        for (var i = 0; i <= max_depth; i++) {
            var temp = {};
            temp.id = count;
            temp.label = title + ", depth: " + i;
            lanes.push(temp);
            count++;
        }
        // Add each of the nodes to the items
        for (var n in poag.nodes) {
            var node = poag.nodes[n];
            var node_arr = node_dict[node.id];
            if (node_arr == undefined) {
                node_arr = new Array()
                 node_arr.push(node);
            } else {
                for (var y_val in node_arr) {
                    if (node.y != y_val) {
                        node_arr.push(node);
                    }
                }
            }
            // Update the y coord so that we have the node occuring at the
            // correct y position
            node.y += current_y_position;
            node.lane += current_y_position;


            node_dict[node.id] = node_arr;
            nodes.push(node);
        }
        // Add each of the reactions to the reaction items
        for (var e in poag.edges) {
            var edge = poag.edges[e];
            edge.y1 += current_y_position;
            edge.y2 += current_y_position;
            // Update the to and from ID's for the nodes to include the POAG
            edge.from = p + "_" + edge.from;
            edge.to = p + "_" + edge.to;
            edges.push(edge);
        }
        current_y_position += (max_depth + 1);
    }
    graph.max_depth = total_max_depth + 1;
    graph.lanes = lanes;
    graph.nodes = nodes;
    graph.edges = edges;
    graph.node_count = count;
    graph.node_diff = node_dict;
    return graph;
};

make_scales = function (graph) {
    var nodes = graph.nodes;
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
                    return d.start;
                })),
                d3.max(nodes, function (d) {
                    return d.end + (2 * radius);
                })])
            .range([0, (Object.keys(nodes).length * width/options.num_start_nodes)]);


    var x1 = d3.scale.linear().range([x_padding, width - x_padding]);

    var ext = d3.extent(lanes, function (d) {
        return d.id;
    });
    var y1 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, mainHeight]);
    var y2 = d3.scale.linear().domain([ext[0], ext[1] + 1]).range([0, miniHeight]);

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
    var nodes = graph.nodes;
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
    var max_depth = graph.max_depth;
    var chart = d3.select('body')
            .append('svg:svg')
            .attr('width', width + margin.right + margin.left)
            .attr('height', height + margin.top + margin.bottom)
            .attr('class', 'chart');

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
            .attr('transform', 'translate(' + margin.left + ',' + (mainHeight + 60) + ')')
            .attr('width', width)
            .attr('height', miniHeight)
            .attr('class', 'mini');

    // draw the lanes for the main chart
    main.append('g').selectAll('.laneLines')
            .data(lanes)
            .enter().append('line')
            .attr('x1', 0)
            .attr('y1', function (d) {
                return d3.round(y1(d.id)) + 0.5;
            })
            .attr('x2', width)
            .attr('y2', function (d) {
                return d3.round(y1(d.id)) + 0.5;
            })
            .attr('stroke', function (d) {
                return d.label === '' ? 'white' : 'lightgray'
            });

    main.append('g').selectAll('.laneText')
            .data(lanes)
            .enter().append('text')
            .text(function (d) {
                return d.label;
            })
            .attr('x', -10)
            .attr('y', function (d) {
                var tmp = y1(d.id + .5);
                return tmp;
            })
            .attr('dy', '0.5ex')
            .attr('text-anchor', 'end')
            .attr('class', 'laneText');

// draw the lanes for the mini chart
    mini.append('g').selectAll('.laneLines')
            .data(lanes)
            .enter().append('line')
            .attr('x1', 0)
            .attr('y1', function (d) {
                return d3.round(y2(d.id)) + 0.5;
            })
            .attr('x2', width)
            .attr('y2', function (d) {
                return d3.round(y2(d.id)) + 0.5;
            })
            .attr('stroke', function (d) {
                return d.label === '' ? 'white' : 'lightgray'
            });

    mini.append('g').selectAll('.laneText')
            .data(lanes)
            .enter().append('text')
            .text(function (d) {
                return d.label;
            })
            .attr('x', -10)
            .attr('y', function (d) {
                return y2(d.id + .5);
            })
            .attr('dy', '0.5ex')
            .attr('text-anchor', 'end')
            .attr('class', 'laneText');
    graph.mini = mini;
    graph.main = main;
    return graph;
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
    var mini = graph.mini;
    var main = graph.main;

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
            .attr('y', 1)
            .attr('height', miniHeight - 1);

    mini.selectAll('rect.background').remove();

    graph.brush = brush;
    return graph;

};
create_poags = function (options) {
    // Stores everything for the graph

    graph.options = options;
    var data = options.data;
    graph.data = data;
    graph = setup_data(graph);
    // Make the radius based on the graph height and the number of lanes

    graph.max_radius = (options.height / graph.lanes.length) / 3;
    graph = make_scales(graph);
    graph = setup_svg(graph);
    graph = setup_items(graph);
    graph = setup_brush(graph);
    graph = draw_mini_nodes(graph);

    display();

};


function display() {

    var brush = graph.brush;
    var nodes_curr = graph.nodes;

    var mini = graph.mini;

    var x_scale = graph.scale.x1;

    var options = graph.options;


    var  minExtent = (brush.extent()[0])
            , maxExtent = (brush.extent()[1])
            , vis_nodes = nodes_curr.filter(function (d) {
                return d.start <= maxExtent && d.end >= minExtent;
            });

    mini.select('.brush').call(brush.extent([minExtent, maxExtent]));

    x_scale.domain([minExtent, maxExtent]);
    // Delete all the old egdes
    graph.node_group.selectAll("path.edge").remove();
    graph.node_group.selectAll("path.pie").remove();
    // Delete all old nodes
    graph.node_group.selectAll("circle.main_node").remove();
    // Delete all the old text
    graph.node_group.selectAll("text.edge_text").remove();
    graph.node_group.selectAll("text.node_text").remove();
    graph.node_group.selectAll("text.pie").remove();

    draw_nodes(graph, vis_nodes, minExtent, maxExtent);
    draw_node_edges(graph, minExtent, maxExtent);

}

function moveBrush() {
    var brush = graph.brush;
    var origin = d3.mouse(this)
            , point = graph.scale.x.invert(origin[0])
            , halfExtent = (brush.extent()[1] - brush.extent()[0]) / 2
            , start = point - halfExtent
            , end = point + halfExtent;

    brush.extent([start, end]);
    display();

}




// generates a single path for each item class in the mini display
// ugly - but draws mini 2x faster than append lines or line generator
// is there a better way to do a bunch of lines as a single path with d3?
function getPaths(graph) {
    var items = graph.nodes;
    var x = graph.scale.x;
    var y2 = graph.scale.y2;
    var paths = {}, d, offset = .5 * y2(1) + 0.5, result = [];
    for (var i = 0; i < items.length; i++) {
        d = items[i];
        if (!paths[d.class])
            paths[d.class] = '';
        paths[d.class] += ['M', x(d.start), (y2(d.lane) + offset), 'H', x(d.end)].join(' ');
    }

    for (var className in paths) {
        result.push({class: className, path: paths[className]});
    }

    return result;
}

