/*
 * http://bl.ocks.org/bunkat/1962173
 */

/**
 * Keeps track of the POAG information.
 *
 * Pertains information relating to:
 *      1. single POAGs, these include: msa, inferred and merged as an
 *          example but can be exteneded.
 *      2. multi POAGs, these are POAGs of interest as added by the user,
 *          by selecting to add joint or marginal POAGs.
 *
 *  Data is added when the page loads and also on respective ajax calls
 *  to add POAGs to the multi section or to update the inferred POAG.
 *
 *  Each update of data requires updating the merged POAG.
 */
var poags = {
    retain_previous_position: false,
    // Mins and maxs
    min_x: 1000,
    max_x: 0,
    min_y: 1000,
    max_y: 0,
    y_offset: 50,
    node_radius: 0, // radius of the nodes in the current view (will be updated on draw)
    // Current x coords visible in the window frame
    cur_x_max: 100,
    cur_x_min: 0,
    // SVG and group elements
    svgs: {},
    // Data
    root_poag_name: 'MSA',
    inferred_poag_name: 'Root',
    merged_poag_name: 'Merged',
    groups: {
        'mini': {},
        'single': {},
        'multi': {},
        'merged': {},
    },
    single: {
        names: ['MSA', 'Root'],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'single-',
        height: 250,
        margin: {left: 0, right: 0, top: 150, bottom: 0}
    },
    multi: {
        names: [],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'multi-',
        height: 250,
        margin: {left: 0, right: 0, top: 150, bottom: 0}
    },
    merged: {
        names: ['Merged'],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'merged-',
        height: 250,
        margin: {left: 0, right: 0, top: 150, bottom: 0}
    },
};

var graph_array = [];

/**
 * Style and size options relating to all POAGs and related visualisations.
 *
 * Includes:
 *      1. Graph            -> style of the histogram which displays on hover
 *      2. Display          -> initial style such as how many nodes appear and
 *                          styles related to biological importantce (i.e. number
 *                          of out edeges etc).
 *      3. Style            -> general page style such as font etc.
 *      4. Mutants          -> mutant styling and initial variables.
 *      5. Mini             -> the mini display area which has an overview of the MSA POAG.
 *      6. Position         -> style and defines for the number of 'positions' which are
 *                          displayed. Positions are the x value of the node in the seq.
 *      7. Node, Edge, Pie  -> style for nodes and edges of POAGs.
 *      8. Data             -> SVG information and div ID.
 */
var poag_options = {

    poagColours: {},
    // Keep track of the colours assigned to the poag name
    name_to_merged_id: {},
    names_to_colour: {
        'MSA': "none",
        'Root': "#C83AFE",
        'Merged': "none",
    },
    root_node_fill: "#EA78F5",
    legend_rect: {
        width: 90,
        stroke_width: 3,
        stroke: "white",
        opacity: 0.3,
        text_padding: 10,
    },
    display: {
        draw_consensus: false, // show the thicker consensus lines
        view_node_ids: true,    // view the node IDs under the MSA nodes
        margin_between_single_multi: 80,
        no_colour: "#f6f2f7",
        colours: clustal_colours,
        number_of_edges_to_be_interesting: 2, // Min number of edges to consider it interesting
        interesting_many_edges_colour: "Crimson",
        diff_colour: "black",
        diff_opacity: 0.3,
        num_start_nodes: 20, // How many nodes that it starts with
    },
    style: {
        /******** Options for Sizing *****************************************/
        height: 2000,
        width: 2000, // Default width gets overridden
        margin: {top: 100, left: 200, bottom: 0, right: 10},
        poagColours: {},
        /*********** End of sizing options **********************************/
        background_colour: "white",
        background_stroke_colour: "grey",
        background_stroke_width: "1px",
        stroke_width: "3px",
        font_size: "20px",
        font_family: "Gill Sans, sans-serif",
        node_position_colour: "#AAA",
    },
    mutants: {
        count: 0,
        draw: false,
    },
    /******** Options for node and edge drawing ***************************/
    mini: {
        stroke: "grey",
        stroke_width: 3,
        radius: 15,
        x_padding: 10,
        fill: "#3636FF",
        opacity: 0.3,
        height: 50,
        margin: {top: 40, left: 60, bottom: 100, right: 10},
    },
    position: {
        text_padding: 10, // How high above the mini it will appear
        level_1: 1, // Means that we will draw a position for every node
        level_2: 5, // We will draw a position at every 5 nodes
        level_3: 10, // Draw position at every 10
        level_unlimited: 25,
        level_1_node_limit: 10, // if < 10 nodes in the main element draw 10
        level_2_node_limit: 50, // lvl 2 < 50 nodes
        level_3_node_limit: 100 // If we have more than 50 nodes don't draw positions
    },
    /**************** Options for changing the style of the nodes *************************/
    node: {
        stroke_width: 2,
        stroke: "#d3d3d3",
        hover_radius: 10,
        font_size: "18px",
        text_padding: 5,
        gradient: false,
        min_radius: 5,
        max_radius: 40,
        position_label_padding: 50,
    },
    /**************** Options for style of the edges between nodes **********************/
    edge: {
        y_curve_amount: 5,
        stroke_width: 4,
        consensus_stroke_width: 7,
        single_seq_dash: 5,
        stroke: "#BBB",
        consensus_stroke: "black",
        reciprocated_stroke: "#111",
        opacity: 0.8,
        stroke_opacity: 1,
        x_length: 160,
        font_color: "grey",
        text_stroke_width: 1
    },
    /********** Pie chart options ***************************************/
    pie: {
        label_position: 22, // Makes the label this distance in from the outer radius
        radius: 50,
        stroke_width: 3,
        stroke: "white",
        max_seq_len: 6 // Number of sequences in a pie chart where we don't draw the dividing lines between (stroke
                // width gets set to 0;
    },
    /*********** Histogram options  ************************************/
    graph: {
        draw_position_in_histogram: true, // Draws the position as a title above the node TODO?
        x_size: 150, // Multiplication factor for positions
        y_size: 100,
        y_start: 200,
        x_start: 200,
        svg_overlay: null,
        x: 0,
        y: 0,
        graph_outer_circle_colour: "grey",
        graph_outer_circle_opacity: 0.5,
        graph_outer_circle_radius: 85,
        graphs: new Array(),
        size: 80,
        offset_graph_width: -35,
        offset_graph_height: -40,
        width: 80,
        div_factor: 1,
        graph_height: 70,
        max_height: 10,
        max_bar_count: 2,
        hist_bar_thresh: 1, // percentage (0-100%)
        hover: true,
        metabolite_count: 0,
        display_label_text: true, // true means display the label text below the MSA graph TODO ?
        display_axis_text: true, // Text on the axis (as in the numbers on the y axis) TODO ?
        draw_axis: true, // Whether or not to draw the y axis
        colours: clustal_colours
    },
    /********** Data ***************************************************/
    data: {
        raw_svg_id: "",
        target: "",
    }
};

graph = {};

graph.options = poag_options;



/**
 * Runs through the setup of the data and the vis.
 *
 * Sets up SVG elements (for the mini poag and for the other poags)
 * Sets up the scales (creates groups for each of the poags)
 * Sets up the  brush element, the brush enables the mini representation of the MSA POAG to link back to the MSA and control which nodes are visible in the SVG containing all the POAGs.
 *
 * Parameters:
 *
 *      json_str    -> string containing the json
 *                  representation of the data.
 *
 *      set_inferred -> boolean, to set the 'bottom' graph
 *                  as the inferred graph (true) or to add a
 *                  joint or marginal reconstruction to the
 *                  multi display (false).
 */
var setup_poags = function (json_str, set_inferred, set_msa, set_merged, name) {

    if (set_inferred) {
        delete poag_options.names_to_colour[poags.inferred_poag_name];
        poags.inferred_poag_name = name;
        poags.single.names[1] = name;
        poag_options.names_to_colour[name] = "#C83AFE";
    }
    //poags.svg.selectAll("*").remove();
    // Process_data
    poags = process_poags(json_str, poags, set_inferred, set_msa, set_merged, name);

    // Create the SVG element
    poag = setup_poag_svg(poags);

    // Make the scales
    poags = setup_poag_scales(poags);

    poags = draw_all_poags(poags);
    // Remove the previous SVG elements if there were any
    poags.groups.mini.selectAll("*").remove();

    // Setup the mini brush
    poags = setup_brush(poags);

    draw_mini_msa(poags);

}

/**
 * Sorts the names of the added POAGs and then re draws them.
 * Maintains the order the user inputted them in to return to that
 * as well.
 */
var sort_added_poags = function () {
    var order = document.getElementById("sort-poags").innerHTML;
    if (order == "Sort") {
        var added_name_order = [];
        for (var n in poag.multi.names) {
            added_name_order.push(poag.multi.names[n]);
        }
        // Save the old order
        poags.multi.added_name_order = added_name_order;
        poags.multi.names.sort(function (a, b) {
            return parseInt(a) - parseInt(b);
        });
        document.getElementById("sort-poags").text = "un-sort";
    } else {
        // Reset to original
        poags.multi.names = poags.multi.added_name_order;
        document.getElementById("sort-poags").text = "sort";
    }
    // Need to reset where the POAG should be drawn
    poag = setup_poag_svg(poags);
    redraw_poags();

}

/**
 * Directs the drawing of the POAGs.
 *
 * Includes all the single POAGs (e.g. MSA, inferred, merged)
 * and the Joint or marginal added poags.
 *
 */
var draw_all_poags = function (poags) {
    // For each of the poags draw the nodes, pass in the group
    // to append to.
    // Draw the mini msa first
    draw_mini_msa(poags);

    // draw merged
    var nodes = poags.merged.nodes;
    var edges = poags.merged.edges;
    var group = poags.groups.merged;
    var scale_y = poags.scale['single_y'];
    // Setup the graph overlay features
    var graph_group = setup_graph_overlay(poag_options.graph, group);
    if (nodes != undefined) {
        var height = poags.merged.height - poags.merged.margin.top / 2;
        draw_poag(poags, "Merged", nodes, edges, scale_y, group, true, height, graph_group);
    }

    // draw MSA and inferred graph
    for (var p in poags.single.names) {
        var poag_name = poags.single.names[p];
        var nodes = poags.single.nodes[poag_name];
        var edges = poags.single.edges[poag_name];
        var group = poags.groups.single[poag_name];
        var scale_y = poags.scale['single_y'];
        // Setup the graph overlay features
        var graph_group = setup_graph_overlay(poag_options.graph, group);

        if (nodes != undefined) {
            var height = poags.single.height - poags.single.margin.top / 2;
            draw_poag(poags, poag_name, nodes, edges, scale_y, group, false, height, graph_group);
        }
    }

    // draw POAG stack
    document.getElementById("poag-all").style.display = "none";
    document.getElementById("poag-merged").style.display = "none";
    for (var p in poags.multi.names) {
        var poag_name = poags.multi.names[p];
        var nodes = poags.multi.nodes[poag_name];
        var edges = poags.multi.edges[poag_name];
        var group = poags.groups.multi[poag_name];
        var scale_y = poags.scale['multi_y'];
        var poagPi = false;
        var graph_group = setup_graph_overlay(poag_options.graph, group);

        if (nodes != undefined) {
            document.getElementById("poag-all").style.display = "block";
            document.getElementById("poag-merged").style.display = "block";
            var height = poags.multi.height - poags.multi.margin.top / 2;
            draw_poag(poags, poag_name, nodes, edges, scale_y, group, poagPi, height, graph_group);
        }
    }
    return poags;
}


/**
 * Add new poag, need to remove the SVG and children.
 */
var refresh_svg_content = function () {
    svg.selectAll("*").remove();
}

/**
 * Redraws the POAG elements.
 * 
 * Draws the POAGs once the user has moved the brush in the mini SVG and changed the view box of the user.
 * Determines the bounds of the brush by getting the extent (keeps track of the minimum and maximum x values of the brush element.)
 * Removes all the old DOM elements.
 * Updates the scale (to make the node radius larger or smaller to fit more or less nodes in the area).
 * Calls draw_all_poags to redraw the visualisation.
 * 
 */
var redraw_poags = function () {
    var extent = poags.brush.extent();
    if (extent[0] == extent[1]) {
        var diff = poags.cur_x_max - poags.cur_x_min;
        if ((extent[0] + diff/2) > poags.max_x) {
            poags.cur_x_max = poags.max_x;
            poags.cur_x_min = poags.max_x - diff;
        } else if ((extent[0] - diff/2) < 0) {
            poags.cur_x_max = diff;
            poags.cur_x_min = 0;
        } else {
            poags.cur_x_max = extent[0] + diff/2;
            poags.cur_x_min = extent[0] - diff/2;
        }
    } else {
        poags.cur_x_min = extent[0];
        poags.cur_x_max = extent[1];
    }
    poags.brush.extent([poags.cur_x_min, poags.cur_x_max]);
    poags = update_x_scale(poags);
    var group = poags.groups.mini;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect.poag").remove();
    group.selectAll("defs.poag").remove();
    var group = poags.single_group;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect.poag").remove();
    group.selectAll("defs.poag").remove();
    var group = poags.merged_group;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect.poag").remove();
    group.selectAll("defs.poag").remove();
    var group = poags.group;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect.poag").remove();
    group.selectAll("defs.poag").remove();
    poags = draw_all_poags(poags);
}


/**
 * Sets the brush x coords.
 */

function moveBrush() {
    var extent = poags.brush.extent();
    var origin = d3.mouse(this);
    var point = poags.scale.mini_x.invert(origin[0]);
    var halfExtent = (poags.brush.extent()[1] - poags.brush.extent()[0]) / 2;
    var start = point - halfExtent;
    var end = point + halfExtent;
    if (extent[0] == extent[1]) {
        var diff = poags.cur_x_max - poags.cur_x_min;
        if ((extent[0] + diff/2) > poags.max_x) {
            end = poags.max_x;
            start = poags.max_x - diff;
        } else if ((extent[0] - diff/2) < 0) {
            end = diff;
            start = 0;
        } else {
            end = extent[0] + diff/2;
            start = extent[0] - diff/2;
        };
    }
    poags.brush.extent([start, end]);
    poags.retain_previous_position = true;
    redraw_poags();
}

/**
 * Sets up the brush element.
 *
 * https://stackoverflow.com/questions/22873551/d3-js-brush-controls-getting-extent-width-coordinates
 */
var setup_brush = function (poags) {

    var init_x = 0;
    var end_x = poags.options.display.num_start_nodes;
    if (poags.retain_previous_position) {
        init_x = poags.cur_x_min;
        end_x = poags.cur_x_max;
    }
    var brush = d3.svg.brush()
            .x(poags.scale.mini_x)
            .extent([init_x, end_x])
            .on("brush", redraw_poags);

    poags.groups.mini.append('rect')
            .attr("class", "mini")
            .attr('pointer-events', 'painted')
            .attr('width', poags.options.style.width)
            .attr('height', poags.options.mini.height)
            .attr('visibility', 'hidden')
            .on('mouseup', moveBrush);

    poags.groups.mini.append("g")
            .attr("class", "x brush")
            .call(brush)  //call the brush function, causing it to create the rectangles
            .selectAll("rect") //select all the just-created rectangles
            .attr("y", -(poags.options.mini.height/2 + 5))
            .attr("fill", poags.options.mini.fill)
            .attr("opacity", poags.options.mini.opacity)
            .attr("height", poags.options.mini.height + 10); //set their height

    poags.brush = brush;
    return poags;
}

/**
 * Draws POAG.
 */
var draw_poag = function (poags, poag_name, nodes, edges, scale_y, group, poagPi, height) {
    var draw_legend = true;
    var colour = poags.options.names_to_colour[poag_name];

    for (var e in edges) {
        var edge = edges[e];
        if (edge.from.x >= poags.cur_x_min - 1 && edge.to.x <= poags.cur_x_max + 1) {
            draw_edges(poags, edge, group, scale_y);
        }
    }

    for (var n in nodes) {
        var node = nodes[n];
        var node_cx = poags.scale.x(node.x);
        var node_cy = scale_y(node.y) + poags.y_offset;
        if (node.x >= poags.cur_x_min && node.x <= poags.cur_x_max) {
            if (draw_legend) {
                draw_legend_rect(poags, node, nodes[poags.cur_x_max], group, height, scale_y, colour);
                draw_legend = false;
            }
            var radius = draw_nodes(poags, node, group, node_cx, node_cy);

            if (poag_name == poags.root_poag_name || node.type == 'marginal' || poagPi) {
                draw_pie(poags, node, group, radius, poagPi, node_cx, node_cy);
                // if it is a merged node, we want to draw a layered Pie chart
                // so we set poagPi to false and re draw a smaller pie chart with
                // the proper colours.
                if (poagPi) {
                    draw_pie(poags, node, group, radius, false, node_cx, node_cy);
                }
                // check whether to display a graph
                var count = 0;
                for (var b in node.graph.bars) {
                    if (node.graph.bars[b].value > poag_options.graph.hist_bar_thresh) {
                        count++;
                    }
                }
                if (count > 1) {
                    var graph_node = create_new_graph(node, poag_options.graph, group, node_cx, node_cy);
                    poag_options.graph.graphs.push(graph_node);
                }
            }
        }
    }

}

/**
 * Processes the JSON data as a string.
 *
 * Each update requires the SVG to be redrawn as a number
 * of elements will change -> including the ordering, the
 * size of the SVG and the merged POAG.
 *
 * Parameters:
 *
 *      json_str    -> a string containing the JSON representation
 *                  of the POAG, includes two POAGS, the MSA and
 *                  an inferred (joint or marginal) reconstruction.
 *
 *      inferred    -> a boolean whether or not the 'bottom' poag is
 *                  to be placed at the top (true) or added to
 *                  the multi poag section (false).
 *
 *      graph       -> contains information re the poag.
 */
var process_poags = function (json_str, poags, inferred, set_msa, merged, name) {
    var data = JSON.parse(json_str);

    poags.options = poag_options;

    // If a new inference, empty the stack of graphs
    if (inferred) {
        poags.multi.nodes = {};
        poags.multi.names = [];
        poags.merged.nodes = [];
        poags.merged.edges = [];
        set_msa = true;
        poags.single.raw.inferred = data.bottom;
    }

    // If it is the first time running we want to set the MSA data otherwise
    // we reuse the already processed MSA.
    if (set_msa) {
        poags.single.raw.msa = data.top;
        poags = process_msa_data(poags);
        poags = process_edges(poags, data.top, poags.root_poag_name, inferred);
    }

    poags = process_poag_data(poags, data.bottom, name, inferred, merged);
    poags = process_edges(poags, data.bottom, name, inferred, merged);

    if (poags.single.nodes[poags.root_poag_name].length < poags.options.display.num_start_nodes) {
        poags.options.display.num_start_nodes = Math.floor(poags.single.nodes[poags.root_poag_name].length*0.8);
    }

    return poags;
}

/**
 * Proceses the MSA data.
 *
 * For each node sets:
 *      x corrds    -> which the preceeding inferred POAGs
 *                      use.
 *      type        -> from metadata.
 *      mutant      -> false
 *      deleted_during_inference -> true, will be set to false
 *                  if the inferred graph contains the node.
 *      name        -> msa
 *
 * Keeps track of:
 *      max_seq_len -> maximum sequence length.
 *      max_x       -> used for scaling
 *      min_x       -> used for scaling
 time *
 * Adds the node to the node dictionary.
 */
var process_msa_data = function (poags) {

    var node_dict = {};
    poags.max_seq_len = 0;
    var msa = poags.single.raw.msa;
    var nodes = msa.nodes;
    var name = poags.root_poag_name;

    poags.single.nodes[name] = [];

    for (var n in nodes) {
        var node = nodes[n]
        node.type = msa.metadata.type;
        node.deleted_during_inference = true;
        node.name = name;

        poags = update_min_max(node.x, node.y, poags);

        if (node.seq.chars.length > poags.max_seq_len) {
            poags.max_seq_len = node.seq.chars.length;
        }

        //formatMutants(node, poag);
        node_dict[name + "-" + node.id] = node;
        poags.single.nodes[name].push(node);
    }

    poags.node_dict = node_dict;

    return poags;
}


/**
 * Helper to update min and max x and y of POAGs.
 */
var update_min_max = function (x, y, poags) {
    if (x > poags.max_x) {
        poags.max_x = x;
    }

    if (x < poags.min_x) {
        poags.min_x = x;
    }

    if (y > poags.max_y) {
        poags.max_y = y;
    }

    if (y < poags.min_y) {
        poags.min_y = y;
    }

    return poags;
}



/**
 * Processes the node data from raw POAGs.
 *
 . Parameters:
 *      poags       ->struct containing the information
 *                  about all poags
 *      raw_poag    ->the poag we want to add
 *      options     -> single or multi options depending on
 *                  the poag type.
 *      name        -> the poag name, i.e. of the internal node
 *                  or inferred.
 */
var process_poag_data = function (poags, raw_poag, name, inferred, merged) {

    var root_name = poags.root_poag_name;

    if (inferred) {
        poags.single.nodes[name] = [];
    } else if (merged) {
        poags.merged.nodes = [];
    } else {
        poags.multi.nodes[name] = [];
        poags.multi.names.push(name);
    }

    for (var n in raw_poag.nodes) {
        var node = raw_poag.nodes[n];

        // Get the msa node as to get the x coords.
        var msa_node = poags.node_dict[root_name + '-' + node.id]
        node.name = name;
        node.mutant = false;
        // if x positions are not the same, change to be the same, and find the node
        // with the current msa_node.x and swap co-ordinates
        if (node.x != msa_node.x) {
            for (var on in raw_poag.nodes) {
                if (raw_poag.nodes[on].x == msa_node.x) {
                    raw_poag.nodes[on].x = node.x;
                    break;
                }
            }
            node.x = msa_node.x;
        }
        node.type = raw_poag.metadata.type;
        node.unique_id = name + '-' + node.id;
        poags = update_min_max(node.x, node.y, poags);

        // Set that this msa node wasn't deleted during inference
        // Only set if the poag name is 'inferred'
        if (inferred) {
            msa_node.deleted_during_inference = false;
            poags.single.nodes[name].push(node);
        } else if (merged) {
            msa_node.deleted_during_inference = false; // TODO: should merged affect the mini graph?
            poags.merged.nodes.push(node);
        } else {
            poags.multi.nodes[name].push(node);
        }

        poags.node_dict[node.unique_id] = node;

    }
    return poags;
}


/**
 * Process the edge data.
 *
 * Involves reducing information content such that we just
 * have:
 *
 *      1. from_id  -> as unique node id
 *      2. to_id    -> as unique node id.
 *      3. name     -> name of POAG
 *
 * Adds the edges to the respective multi or single groups
 */
var process_edges = function (poags, raw_poag, name, inferred, merged) {

    var edges = raw_poag.edges;

    if (inferred) {
        poags.single.edges[name] = [];
    } else if (merged) {
        poags.merged.edges = [];
    } else {
        poags.multi.edges[name] = [];
    }

    for (var e in edges) {
        var edge = edges[e];
        var reduced_edge = {};
        reduced_edge.id = e;
        // From node
        reduced_edge.from = poags.node_dict[name + '-' + edge.from];
        // To node
        reduced_edge.to = poags.node_dict[name + '-' + edge.to]

        reduced_edge.consensus = edge.consensus;
        reduced_edge.reciprocated = edge.reciprocated;
        reduced_edge.weight = edge.weight;
        reduced_edge.name = name;
        reduced_edge.single = edge.single;

        if (inferred) {
            poags.single.edges[name].push(reduced_edge);
        } else if (merged) {
            poags.merged.edges.push(reduced_edge);
        } else {
            poags.multi.edges[name].push(reduced_edge);
        }
    }

    return poags;
}

/**
 * Make scales creates the scales used by the application.
 *
 * The POAGs use the same X scale which is defined by the
 * positions from the MSA POAG.
 *
 * NEED TO MAKE SURE YOU UPDATE THE X SCALE IF THERE IS
 * AN X COORD WHICH IS LARGER IN ONE OF THE JOINT OR ADDED
 * POAGS, I.E. AN INSERTION.
 *
 * The POAG consists of three compartments:
 *      1. Overview msa which is mini
 *              - graph.scale.mini
 *
 *      2. Individual graphs
 *              - graph.scale.y
 *
 *      3. A container of joint reconstructions
 *              - graph.scale.y
 *
 *              - the joint reconstruction container allows for
 *              the poags to be grouped by the name and
 *              the depths/y_values of each POAG. This is used
 *              to allow easy sorting and updates of the POAG order.
 *
 *  In order to keep all of these as connected elements they
 *  are scaled according to their respected containers within
 *  the same SVG element.
 *
 */
var setup_poag_scales = function (poags) {
    var options = poags.options.style;

    // Update the width of the SVG to be that of the div.
    // Ensures that we get updates based on the div size changing.
    options.width = options.width;//document.getElementById(svg_id).offsetWidth;

    var width = options.width - options.margin.left - options.margin.right;
    var height = options.height - options.margin.top - options.margin.bottom;

    var x = d3.scale.linear()
            .domain([poags.min_x, poags.max_x])
            .range([0, width]);

    var mini_x = d3.scale.linear()
            .domain([poags.min_x, poags.max_x])
            .range([0, width]);

    var single_y = d3.scale.linear()
            .domain([poags.min_y, poags.max_y])
            .range([0, poags.single.height - poags.single.margin.top]);

    var multi_y = d3.scale.linear()
            .domain([poags.min_y, poags.max_y])
            .range([0, poags.multi.height - poags.multi.margin.top]);

    var mini_y = d3.scale.linear()
            .domain([poags.min_y, poags.max_y])
            .range([0, poags.options.mini.height]);

    poags.scale = {'x': x, 'single_y': single_y, 'multi_y': multi_y, 'mini_y': mini_y, 'mini_x': mini_x};

    return poags;
}

/**
 * Updates the x scale based on how many nodes should be visible
 * as determined by the brush element.
 */
var update_x_scale = function (poags) {
    poags.scale.x.domain([poags.cur_x_min, poags.cur_x_max]);
    return poags;
}

/**
 * Sets up the SVG element which contains the POAGs and
 * the groups.
 *
 * A group is created for each single POAG, each multi POAG and
 * the mini overview. This allows each to have a set offset
 * and the nodes be grouped an positioned accordingly.
 *
 */
var setup_poag_svg = function (poags) {
    var options = poags.options;
    var width = options.style.width;
    var margin = options.style.margin;

    // Calculate the total height of the SVG element based
    // on the number of POAGs which are to be displayed.
    var single_height = poags.single.names.length * (poags.single.height);
    var multi_height = poags.multi.names.length*(poags.multi.height + poag_options.display.margin_between_single_multi);
    var mini_height = options.mini.height + options.mini.margin.top + options.mini.margin.bottom;
    var height = single_height + multi_height + mini_height + margin.top;

    // If we are resetting the SVG element we want to add a svg otherwise
    // we just use the existing svg element
    if (poags.svg == undefined) {
        // setup stacked svg
        var svg = d3.select(options.data.target)
                .append("svg")
                .attr("viewBox", "0 0 " + width + " " + multi_height)
                .classed("svg-content", true);

        // setup mini svg
        var mini_svg = d3.select("#poag-mini")
                .append("svg")
                .attr("viewBox", "0 0 " + width + " " + mini_height)
                .classed("svg-content", true);

        var mini_group = mini_svg.append('g')
                .attr('transform', 'translate(' + 0 + ',' + margin.top + ')')

        mini_group.append('defs').append('clipPath')
                .attr('id', 'clip')
                .append('rect')
                .attr('width', width)
                .attr('height', height);

        var mini = mini_group.append('g')
                .attr('transform', 'translate(' + margin.left / 2 + ',' + 0 + ')')
                .attr('width', width)
                .attr('height', options.mini.height)
                .attr('class', 'mini');

        poags.mini_svg = mini_svg;
        poags.groups.mini = mini;

        // setup msa/inferred svg
        var single_svg = d3.select("#poag-msa")
                .append("svg")
                .attr("viewBox", "0 0 " + width + " " + single_height)
                .classed("svg-content", true);

        poags.single_svg = single_svg;

        // setup merged svg
        var merged_svg = d3.select("#poag-merged")
                .append("svg")
                .attr("viewBox", "0 0 " + width + " " + poags.merged.height)
                .classed("svg-content", true);

        poags.merged_svg = merged_svg;

    } else {
        // reset graphs
        poags.single_svg.selectAll("*").remove();
        poags.single_svg.attr("viewBox", "0 0 " + width + " " + single_height);
        var single_svg = poags.single_svg;

        poags.svg.selectAll("*").remove();
        poags.svg.attr("viewBox", "0 0 " + width + " " + multi_height);
        var svg = poags.svg;

        poags.merged_svg.selectAll("*").remove();
        poags.merged_svg.attr("viewBox", "0 0 " + width + " " + poags.merged.height);
        var merged_svg = poags.merged_svg;
    }

    poags.groups.single = {};
    poags.groups.multi = {};

    var single_group = single_svg.append('g')
            .attr('transform', 'translate(' + 0 + ',' + margin.top + ')');

    var group = svg.append('g')
            .attr('transform', 'translate(' + 0 + ',' + margin.top + ')');

    var merged_group = merged_svg.append('g')
            .attr('transform', 'translate(' + margin.left / 2 + ',' + margin.left / 2 + ')');


    poags.merged_group = merged_group;
    poags.groups.merged = merged_group;
    poags.merged_svg = merged_svg;
    poags.groups.merged_svg = merged_svg;

    // Make a group for each of the individual POAGs for displaying in single_svg
    for (var n in poags.single.names) {
        var name = poags.single.names[n];
        var tmp_group = single_group.append('g')
                .attr('transform', 'translate(' + margin.left / 2 + ',' +
                        (n * poags.single.height) + ' )')
        poags.groups.single[name] = tmp_group;
    }
    poags.single_group = single_group;
    poags.single_svg = single_svg;
    poags.groups.single_svg = single_svg;

    // Make a group for each of the multi POAGs for displaying in svg
    for (var n in poags.multi.names) {
        var name = poags.multi.names[n];
        var tmp_group = group.append('g')
                .attr('transform', 'translate(' + margin.left / 2 + ',' + (
                        (n * (poags.multi.height))) + ' )')
        poags.groups.multi[name] = tmp_group;
    }
    poags.group = group;
    poags.svg = svg;
    poags.groups.svg = svg;

    options.style.width = width;
    options.style.height = height;

    return poags;
};


/**
 * ---------------------------------------------------------------------------
 *                              Draw
 * ---------------------------------------------------------------------------
 */


/**
 * Draws the nodes.
 *
 * Each node is drawn in its respective group element.
 */
var draw_nodes = function (poags, node, group, node_cx, node_cy) {
    var node_opt = poags.options.node;
    var radius = (poags.scale.x(node.x + 1) - poags.scale.x(node.x)) / 4;

    if (radius > node_opt.max_radius) {
        radius = node_opt.max_radius;
    }

    poags.node_radius = radius;

    group.append('circle')
            .attr("class", 'poag')
            .attr("id", "node-" + node.unique_id)
            .attr('cx', node_cx)
            .attr('cy', node_cy)
            .attr('r', radius)
            .attr("stroke-width", node_opt.stroke_width)
            .attr("stroke", node_opt.stroke)
            .attr("opacity", node_opt.default_opacity)
            .attr("fill", poags.options.display.colours[node.label]);


    if (radius > node_opt.min_radius && node.label.length == 1) {
        group.append("text")
                .attr("class", "poag")
                .attr("id", "ptext-" + node.unique_id)
                .attr('x', node_cx)
                .attr('y', function () {
                    var tmp = node_cy + node_opt.text_padding;
                    return tmp;
                })
                .attr("text-anchor", "middle")
                .attr("stroke-width", node_opt.stroke_width)
                .style("font-family", poags.options.style.font_family)
                .style("font-size", poags.options.style.font_size)
                .attr("stroke", function () {
                    return getNodeTextColour(poags.options.display.colours[(node.label)]);
                })
                .text(node.label);
    }

    return radius;
}


/**
 * Draws the mini line so the user has a high level overview of the
 * msa poag.
 *
 * Itterates through each node and adds the y coord and x coord
 * to an array.
 *
 * Interpolates over array to make a d3 path object.
 *
 * If there are options.display.number_of_edges_to_be_interesting
 * then a rectangle is appended to empahsise a point of interest,
 * similarly, if there is a deletion or insertion from the inferred
 * then there will be a circle drawn.
 *
 */
var draw_mini_msa = function (poags) {

    var line_points = [];
    var x_scale = poags.scale.mini_x;
    var mini_opt = poags.options.mini;
    var options = poags.options.display;
    var group = poags.groups.mini;
    var y_scale = poags.scale.mini_y;
    var nodes = poags.single.nodes[poags.root_poag_name];
    var nodes_inferred = poags.single.nodes[poags.inferred_poag_name];

    for (var n in nodes) {
        var node = nodes[n];
        var node_inferred = null;
        for (var m in nodes_inferred) {
            if (nodes_inferred[m].id == node.id) {
                node_inferred = nodes_inferred[m];
                break;
            }
        }
        var line_y = (y_scale(node.y) + (y_scale(node.y + 1)) / 2);
        var line_x = x_scale(node.x);
        line_points.push(combine_points(line_x, line_y));

        // find node out edges
        var out_edge_count = 0;
        if (node_inferred != null) {
            if (poags.merged.edges.length > 0) {
                for (var e in poags.merged.edges) {
                    if (poags.merged.edges[e].from.id == node_inferred.id) {
                        out_edge_count++;
                    }
                }
            } else {
                for (var e in poags.single.edges[poags.inferred_poag_name]) {
                    if (poags.single.edges[poags.inferred_poag_name][e].from.id == node_inferred.id) {
                        out_edge_count++;
                    }
                }
            }
        }
        if (out_edge_count >= options.number_of_edges_to_be_interesting) {
            var rect = group.append("rect")
                    .attr("class", "poag")
                    .attr('x', line_x)
                    .attr('y', function () {
                        var tmp = y_scale(0) - mini_opt.height/4; // Have it at the top
                        return tmp;
                    })
                    .attr('width', 2 * mini_opt.radius)
                    .attr('height', mini_opt.height/2)
                    .attr("stroke-width", mini_opt.stroke_width)
                    .attr("stroke", mini_opt.stroke)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.diff_colour);
            rect.moveToBack();
        }
        if (node.deleted_during_inference == true) {
             group.append("circle")
                    .attr("class", "poag")
                    .attr("id", "node_" + node.label + n)
                    .attr('cx', line_x)
                    .attr('cy', line_y)
                    .attr('r', mini_opt.radius)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.interesting_many_edges_colour);
            d3.select("#node_"+node.label+n).moveToBack();
            //circle.moveToBack();
        }
        if (node_inferred != null && poags.options.mutants.draw == true && node_inferred.mutant == true) {
            var tri = group.append("path")
                    .attr("class", "poag")
                    .attr('transform', 'translate(' + (line_x - mini_opt.x_padding) + ',' + (y_scale(0) - 10) + ')')
                    .attr("d", d3.svg.symbol().type("triangle-down"))
                    .attr("opacity", 0.7)
                    .attr("fill", "black");

            tri.moveToBack();
        }

    }

    var path = group.append("path")
            .attr("class", "poag")
            .attr("d", line_function(line_points))
            .attr("stroke-width", mini_opt.stroke_width)
            .attr("stroke", mini_opt.stroke)
            .attr("fill", "none")

    path.moveToBack();

}

/**
 * Draws the edges.
 *
 * x and y coords are taken from the corrosponding nodes.
 */
var draw_edges = function (poags, edge, group, scale_y) {
    var edge_opt = poags.options.edge;
    var scale_x = poags.scale.x;
    var node_dict = poags.node_dict;
    var same_level_buffer = edge_opt.y_curve_amount;

    // Curvature of edge in y direction
    var y_len = edge_opt.y_curve_amount;

    var line_points = new Array();
    x_start = scale_x(edge.from.x);
    x_end = scale_x(edge.to.x);
    x_mid = x_start - ((x_start - x_end) / 2);
    x_diff = Math.abs(edge.from.x - edge.to.x);

    y_start = scale_y(edge.from.y) + poags.y_offset;
    y_end = scale_y(edge.to.y) + poags.y_offset;
    //y_next = scale_y(edge.next.y);
    y_mid = y_start - ((y_start - y_end) / 2);

    // If y start and y end are the same we want a nice curve
    var y_jump_buffer = same_level_buffer * x_diff + poags.node_radius + 10;

    line_points.push(combine_points(x_start, y_start));

    // Add the curve in
    if (y_end == y_start) {// || y_next > y_start) {
        if (x_diff == 1) {
            line_points.push(combine_points(x_mid, y_end + y_len));
        } else {
            y_text_pos = (y_start - y_jump_buffer / 2);
            line_points.push(combine_points(x_mid, (y_start - y_jump_buffer)));
        }
    } else if (y_end > y_start) {
        if (x_diff == 1) {
            line_points.push(combine_points(x_mid, y_end + y_len));
        } else {
            line_points.push(combine_points(x_end, y_end + y_jump_buffer));
        }
    } else {
        if (x_diff == 1) {
            line_points.push(combine_points(x_mid, y_start + y_len));
        } else {
            line_points.push(combine_points(x_end, y_start + y_jump_buffer));
        }
    }
    line_points.push(combine_points(x_end, y_end));

    // identify stroke width to use based on consensus
    // if not the consensus, then identify whether a single sequence on the edge or not
    var stroke_width = edge_opt.stroke_width;
    var stroke = edge_opt.stroke;
    if (edge.reciprocated) {
        stroke = edge_opt.reciprocated_stroke;
    }
    if (edge.consensus && poags.options.display.draw_consensus) {
        stroke_width = edge_opt.consensus_stroke_width;
    }
    group.append("path")
            .attr("d", line_function(line_points))
            .attr("class", 'poag')
            .attr("id", 'edge-' + edge.from.unique_id + '-' + edge.to.unique_id)
            .attr("stroke-width", stroke_width)
            .attr("stroke", stroke)
            .attr("stroke-dasharray", function() {
                if (edge.single) {
                    return "3,3";
                } else {
                    return "0,0";
                }
            })
            .attr("opacity", edge_opt.opacity)
            .attr("fill", "none")
            .attr("marker-mid", "url(#triangle-end)");
    
//    
//    group.append("circle")
//            .attr("class", 'poag')
//            .attr('cx', x_start)
//            .attr('cy', y_start)
//            .attr('r', "3px")
//            .attr("stroke-width", edge_opt.stroke_width)
//            .attr("stroke", edge_opt.stroke)
//            .attr("opacity", edge_opt.opacity)
//            .attr("fill", poags.options.display.colours[edge.label]);
//    
//    group.append("circle")
//            .attr("class", 'poag')
//            .attr('cx', x_end)
//            .attr('cy', y_end)
//            .attr('r', "3px")
//            .attr("stroke-width", edge_opt.stroke_width)
//            .attr("stroke", edge_opt.stroke)
//            .attr("opacity", edge_opt.opacity)
//            .attr("fill", poags.options.display.colours[edge.label]);

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
 * Create tmp x, y for interpolation
 */
combine_points = function (x_var, y_var) {
    return {x: x_var, y: y_var};
};

/**
 * Draws the legend on the side and the graph label.
 *
 * Draws a rectangle beside the first node with the
 * poag name.
 */
var draw_legend_rect = function (poags, node, node_end, group, height, scale_y, colour) {
    var rect_opt = poags.options.legend_rect;
    var node_cx = poags.scale.x(node.x);
    var node_cy = scale_y(node.y);
    //var width = poags.scale.x(node_end.x) - node_cx;
    // TODO need to update the height to be based on the height
    // TODO need to make the width based on the last node
    // of the POAG i.e. diff between least y and max y.
    if (colour != "none" && colour != undefined) {
        var gradient_id = "gradient" + node.unique_id;
        var legend = group.append("defs")
                .attr("class", "poag")
                .append("svg:linearGradient")
                .attr("id", gradient_id)
                .attr("x1", "100%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

        legend.append("stop").attr("offset", "0%").attr("stop-color", colour).attr("stop-opacity", 1);

        legend.append("stop").attr("offset", "100%").attr("stop-color", "white").attr("stop-opacity", 1);

        group.append('rect')
                .attr("class", 'poag')
                .attr("id", "rect-" + node.unique_id)
                .attr('x', node_cx - poags.options.style.margin.left / 2)
                .attr('y', node_cy - height / 2)
                .attr('width', poags.options.style.width)
                .attr('height', height + height / 2 - 20)
                .attr("stroke-width", rect_opt.stroke_width)
                .attr("stroke", rect_opt.stroke)
                .attr("opacity", rect_opt.opacity)
                .attr("fill", "url(#" + gradient_id + ")");

        group.append('rect')
                .attr("class", 'poag')
                .attr("id", "rect-" + node.unique_id)
                .attr('x', node_cx - poags.options.style.margin.left / 2)
                .attr('y', node_cy - height / 2)
                .attr('width', poags.options.style.width)
                .attr('height', 10)
                .attr("stroke-width", rect_opt.stroke_width)
                .attr("stroke", rect_opt.stroke)
                .attr("opacity", 1)
                .attr("fill", colour);
    }

    group.append("text")
            .attr("class", "poag")
            .attr("id", "rtext-" + node.unique_id)
            .attr('x', node_cx - poags.options.style.margin.left / 2 + 10)
            .attr('y', function () {
                var tmp = node_cy + rect_opt.text_padding - height / 4;
                return tmp;
            })
            .attr("text-anchor", "start")
            .style("font-family", poags.options.style.font_family)
            .style("font-size", poags.options.style.font_size)
            .attr("stroke", function () {
                return getNodeTextColour(poags.options.display.colours[(node.label)]);
            })
            .text(node.name);

}

/**
 * Draws a pie chart on a node.
 *
 * Used in the MSA POAG for displaying options and in the
 * merged POAG.
 */
var draw_pie = function (poags, node, group, radius, poagPi, node_cx, node_cy) {
    var options = poags.options;
    var colors = options.poagColours;
    var pie_opt = options.pie;

    //poagPi indicates whether to draw a pi chart colored by poag of origin or not
    var poagPi = poagPi || false;

    var stroke_width = options.pie.stroke_width;

    if (radius < options.node.min_radius || (!poagPi && node.name == "Merged")) {
        stroke_width = 0;
    }

    //making pi slightly larger for poagPi, to create ring effect for fused pi chart
    if (poagPi) {
        radius += 5;
    }

    var pie_group = group.append("g")
            .attr("id", "pie" + node.name)
            .attr("class", "poag")
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

    var pie_data = node.seq.chars;
    radius -= 10;

    if (node.name != 'MSA' && node.name != "Merged" && options.mutants.count > 0 && options.mutants.draw == true) {
        pie_data = node.mutants.chars;
    } else if (node.seq.hasOwnProperty("poagValues")) {
        var pie_data = node.seq.poagValues;
        radius += 10;
    }

    var max = 0;
    var lbl = "";
    for (var d in pie_data) {
        if (pie_data[d].value > max){
            lbl = pie_data[d].label;
            max = pie_data[d].value;
        }
    }

    var arc = pie_group.selectAll(".arc")
            .data(pie(pie_data))
            .enter().append("g")
            .attr("class", "poag");

    arc.append("path")
            .attr("class", "poag")
            .attr("d", path_pie)
            .attr("stroke-width", stroke_width)
            .attr("stroke", pie_opt.stroke)
            .attr("fill", function (d, i) {
                //"poag" in data suggest fused type pi should be draw
                if (!d.data.hasOwnProperty("poag")) {
                    return options.display.colours[(d.data.label)];

                } else {
                    if (!poagPi) {
                        if (d.data.label != "0") {
                            //other labels in the inner fused pi chart
                            return options.display.colours[(d.data.label)];
                        } else {
                            //the slice in inner fused pi chart
                            return "white";
                        }
                    } else {
                        //draws for outter ring in fused node
                        return colors[(d.data.poag)];
                    }
                }
            });

    // Don't want to append text if it is smaller than the min radius
    if (poags.node_radius > options.node.min_radius){
        //Appending single big label to node if in consensus
        group.append("text")
                .attr("class", "poag")
                .attr("id", "ptext-" + node.unique_id)
                .attr('x', node_cx)
                .attr('y', function () {
                    var tmp = node_cy + options.node.text_padding;
                    return tmp;
                })
                .attr("text-anchor", "middle")
                .attr("stroke-width", options.node.stroke_width)
                .style("font-family", options.style.font_family)
                .style("font-size", options.style.font_size)
                .attr("stroke", function () {
                    return getNodeTextColour(options.display.colours[(node.label)]);
                })
                .text(lbl);
    }

    if (node.name == "MSA") {
         group.append("text")
                .attr("class", "poag")
                .attr("id", "idtext-" + node.unique_id)
                .attr('x', node_cx)
                .attr('y', function () {
                    var tmp = node_cy + 3*options.node.text_padding + options.node.position_label_padding;
                    return tmp;
                })
                .attr("text-anchor", "middle")
                .attr("stroke-width", options.node.stroke_width)
                .style("font-family", options.style.font_family)
                .style("font-size", options.style.font_size)
                .attr("stroke", options.style.node_position_colour)
                .text(function() {
                    var spacing = Math.floor((poags.cur_x_max - poags.cur_x_min)/10);
                    if (poags.node_radius > 2*options.node.min_radius || node.id % spacing == 0) {
                        return node.id;
                    }
                    return "";
                });
    }
}


// https://github.com/wbkd/d3-extended
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};


/**
 * Get the text colour for node labels based on hue and lightness (i.e. dark colours will have light text)
 */
var getNodeTextColour = function (colour) {
    var hsl = hexToHsl(colour);
    if (hsl[0] < 60 || hsl[2] > 50) {
        return "#383838";
    }
    return "#F7F7F7";
}




/**
 * Convert hex to hsl
 */
var hexToHsl = function (hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        r = (c >> 16) & 255;
        g = (c >> 8) & 255;
        b = c & 255;

        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0;
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return [(h * 100 + 0.5) | 0, ((s * 100 + 0.5) | 0), ((l * 100 + 0.5) | 0)];
    }
    return [(100 + 0.5) | 0, ((100 + 0.5) | 0), ((100 + 0.5) | 0)];
}




/**
 * Gets called once before the graphs are to be setup and gets the SVG based
 * on the ID that a user has specified
 */
setup_graph_overlay = function (options, graph_group) {

    var x = d3.scale.ordinal()
            .rangeRoundBands([0, options.width / options.div_factor], .5);

    var y = d3.scale.linear()
            .range([options.graph_height/ options.div_factor, 0]);

    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(2);
    //options.svg_overlay = svg;
    options.x = x;
    options.y = y;
    options.xAxis = xAxis;
    options.yAxis = yAxis;
}

function create_outer_circle(node, options, graph_group) {
    var circle = graph_group.append("circle")
            .attr("class", "outside" + node.name)
            .attr("id", function () {
                return "node-" + node;
            })
            .attr("cx", options.size / 2 - 12)
            .attr("cy", options.size / 2 - 2)
            .attr("r", options.graph_outer_circle_radius)
            .attr("stroke-width", 3)
            .attr("stroke", options.graph_outer_circle_colour)
            .attr("opacity", options.graph_outer_circle_opacity)
            .attr("fill", options.graph_outer_circle_colour);
}


function create_rect(node, options, graph_group) {

    graph_group.append("rect")
            .attr("class", function () {
                return "outline";
            })
            .attr("x", function () {
                return options.offset_graph_width;
            }) //Need to determine algorithm for determining this
            .attr("width", (options.size * 2) + options.offset_graph_width)
            .attr("y", function () {
                return options.offset_graph_height;
            })
            .attr("height", function () {
                return options.graph_height - (2 * options.offset_graph_height);
            })
            .attr("fill", "white");
}

function create_axis(node, options, graph_group) {
    var axisgroup = graph_group.append("g")
            .attr("class", "y axis")
            .attr("transform", function () {
                w = 0;
                return "translate(" + w + ",0)";
            })
            .call(options.yAxis)
            .append("text")
            .attr("y", -10)
            .attr("x", options.offset_graph_width + 25)
            .attr("dy", ".71em")
            .text(node.name);
}

function create_bars(node, options, graph_group) {
    var num_bars = Object.keys(node.graph.bars).length; //options.max_bar_count;
    var size = options.size;
    var y = options.y;
    var padding_x = 0;
    var outer_padding = 1;

    // Just to make it look nicer if there is only one bar
    if (num_bars == 1) {
        padding_x = size/6.0;
    }

    var bars = [];
    for (var bar in node.graph.bars) {
        var bar_info = node.graph.bars[bar];
        if (bar_info.value > poag_options.graph.hist_bar_thresh) {
            bars.push(node.graph.bars[bar]);
        }
    }
    num_bars = Object.keys(bars).length;
    for (var bar in bars) {
        var bar_info = bars[bar];
        graph_group.append("rect")
                .attr("class", function () {
                    return "bar2";
                })
                .attr("x", function () {
                    return outer_padding + padding_x + (bar * (size / num_bars)); /* where to place it */
                }) //Need to determine algoritm for determining this
                .attr("width", (size / num_bars) - (3 * padding_x) - outer_padding/2)
                .attr("y", function () {
                    return y(bar_info.value/100.0);
                })
                .attr("height", function () {
                    // As the number is out of 100 need to modulate it
                    return options.graph_height - y(bar_info.value/100.0);
                })
                .attr("fill", options.colours[(bar_info.x_label == undefined) ? bar_info.label : bar_info.x_label]);

        graph_group.append("text")
                .attr("class", "y axis")
                .attr("x", function () {
                    return (2 * padding_x) + bar * (options.size / num_bars);
                }) //Need to determine algorithm for determining this
                .attr("y", options.graph_height + 10)
                .text((bar_info.x_label == undefined) ? bar_info.label : bar_info.x_label);
    }
}

/**
 * Apply's transforms to the group to emmulate any wrappers that the user has
 * in their SVG
 */
function apply_transforms(node, options, graph_group) {
    var transforms = options.transforms;
    for (var t in transforms) {
        var margin_width = transforms[t].margin_width;
        var margin_height = transforms[t].margin_height;
        graph_group = graph_group.append("g")
            .attr("transform", "translate(" + margin_width +
                    "," + margin_height + ")");
    return graph_group;
    }
}


/**
 * Scale the x and the y that was gotten from the JSON file
 */
scale_x_graph = function (options, x) {
    return (x * options.x_size) + options.x_start;
}

scale_y_graph = function (options, y) {
    return (y * options.y_size) + options.y_start;
}


/**
 * Creating the graphs
 */
create_new_graph = function (node, options, group, node_cx, node_cy) {
    //var node_cx = scale_x_graph(options, node.x);
    //var node_cy = scale_y_graph(options, node.y) - options.graph_height / 2;
    options.metabolite_count++;
    var num_bars = options.max_bar_count;
    var hover_on = options.hover;
    var graph_group = group.append("g")
            .attr("class", "graph")
            .attr('transform', 'translate(' + (node_cx + options.offset_graph_width) + "," + (node_cy + options.offset_graph_height) + ")")
            .attr("opacity", 0)
            .on("mouseover", function () {
                if (hover_on) {
                    d3.select(this).attr("opacity", 1);
                }
            })
            .on("mouseout", function () {
                if (hover_on) {
                    d3.select(this).attr("opacity", 0);
                }
            });

    create_outer_circle(node, options, graph_group);
    create_rect(node, options, graph_group);
    create_axis(node, options, graph_group);
    create_bars(node, options, graph_group);
    return graph_group;
}



/**
 *
 * From http://www.bioinformatics.nl/~berndb/aacolour.html
 */



function formatMutants(node, poag) {

    if (node.type != "fused") {
        node.graph = {};
        if (graph.options.mutants.count > 0) {
            node.graph.bars = node.mutants.chars;
        } else {
            node.graph.bars = node.seq.chars;
        }
    } else {
        //adding number of poags fused
        node.npoags = poag.metadata.npoags;

        node["subtype"] = poag.metadata.subtype;
        //changing graph if fused marginal graph
        if (node.subtype == "marginal") {

            node.graph = {};
            node.graph.bars = node.mutants.chars;

        }
    }
}



/*
 * Fuses the information from two objects containing edge objects
 * params = edges1 and edges2 are objects containing edge objects
 *	   from two different POAGS.
 *
 * returns object containing the unique edges from each edge object, and
 * for each edge in common a fused edge will be stored in the object with
 * the same information as the two original edges but with y-values
 * corresponding to the highest y-value between the two edges fused.
 */
function getFusedEdges(edges1, edges2, newNodes, metadata1, metadata2) {
    //object to store fused edges
    var newEdges = {};

    //pairwise comparison of edges, fusing if same edge name
    for (var edge1 in edges1) {
        for (var edge2 in edges2) {

            if (edge1 == edge2) {

                var newEdge = fuse_edges(edges1[edge1], edges2[edge2],
                        metadata1, metadata2);
                newEdges[edge1] = newEdge;

                break;
            }
        }
    }

    //add uncommon edges
    add_uncommonEdges(edges1, newEdges, newNodes, metadata1);
    add_uncommonEdges(edges2, newEdges, newNodes, metadata2);

    return newEdges;
}

/*
 * Gets unique edges and appends them to newEdge
 *
 * params = -> edges - object containing edges desired to get its
 *		      unique edges.
 * 	       -> edgesFused - array of edge names added to newEdges.
 *	       -> newEdges - array containing all the fused edges
 *			 already proccessed
 *
 * ensures -> All of the unique edges in edges will be added to
 *	     newEdges.
 *	      -> Edges added to newEdges are a deep copy version of
 *	     the edge.
 */
function add_uncommonEdges(edges, newEdges, newNodes, metadata) {

    //adding edges in edges not in newEdges
    for (var edge in edges) {

        if (!(edge in newEdges)) {

            var edgeCopy = {};
            var edgeInfo = edges[edge];

            for (var property in edgeInfo) {
                edgeCopy[property] = edgeInfo[property];
            }

            //setting the new y-values
            setY(edgeCopy, newNodes);

            newEdges[edge] = edgeCopy;
        }
    }
}

/*
 * Sets the y-values for the edges based off the nodes already
 * created due to fusing the graphs
 *
 * params: -> edgeCopy - deepCopy of the edge being created to
 *			be added to the new edges.
 *	      -> newNodes - array of nodes created due to fusing
 *			the two graphs.
 *
 * ensures: -> The edgeCopy has it's y-values set so the edge
 *	      goes from the y specified as the starting node
 *	      in new nodes and goes to the ending nodes y in
 *	      newNodes.
 */
function setY(edgeCopy, newNodes) {

    //looping through each node and checking if involved in edge
    for (var i = 0; i < newNodes.length; i++) {
        var node = newNodes[i];

        //no. of nodes corresponding to edgeCopy
        var hits = 0;

        //Setting the y for the from node
        if (node.id == edgeCopy.from) {
            edgeCopy.y1 = node.y;
            hits++;

            //setting the y for the to node
        } else if (node.id == edgeCopy.to) {
            edgeCopy.y2 = node.y;
            hits++;
        }

        //edge can only have two nodes, so:
        if (hits == 2) {
            break;
        }
    }
}

/*
 * Fuse the two inputted edges
 *
 * params = two inputted edges with equivalent names from two
 *	   different POAGs
 *
 * returns = A new edge with the same details of both input
 *	    edges but y1 for the edge is equal to the largest
 *	    y1 of the two edges, same for y2.
 */
function fuse_edges(edge1Info, edge2Info, metadata1, metadata2) {

    //initialising new edge with equivalent information to edge1
    var newEdge = {"x1": edge1Info.x1, "weight": edge1Info.weight,
        "from": edge1Info.from, "x2": edge1Info.x2,
        "to": edge1Info.to};

    newEdge.consensus = edge1Info.consensus || edge2Info.consensus;
    newEdge.reciprocated = edge1Info.reciprocated || edge2Info.reciprocated;

    //making y1 for new edge be equal to edge with largest y1
    if (edge1Info.y1 > edge2Info.y1) {
        newEdge.y1 = edge1Info.y1;
    } else {
        newEdge.y1 = edge2Info.y1;
    }

    //making y2 for new edge be equal to edge with largest y2
    if (edge1Info.y2 > edge2Info.y2) {
        newEdge.y2 = edge1Info.y2;
    } else {
        newEdge.y2 = edge2Info.y2;
    }

    return newEdge;
}




/*
 * Fuses inputted two list of nodes from two different POAGs
 *
 * param = -> nodes1 and nodes2 are arrays containing node objects from
 *	     different POAGS.
 *	  -> nodes1 can be from a fused type poag, marginal type, or
 *	     joint type.
 *	  -> nodes2 must be from either a marginal type, or joint type
 *	     poag.
 *	  -> metadata1 is the metadata from the nodes1 poag.
 *	  -> metadata2 is the metadata from the nodes2 poag.
 *
 * returns -> list of nodes with the information from the two different
 *						 lists of nodes fused.
 */
function getFusedNodes(nodes1, nodes2, metadata1, metadata2) {

    //fusing the common nodes
    var commonNodeInfo = add_commonNodes(nodes1, nodes2, metadata1,
            metadata2);
    var idNodesFused = commonNodeInfo[0];
    var newNodes = commonNodeInfo[1];

    //adding the uncommon nodes to newNodes in fused format
    add_uncommonNodes(nodes1, idNodesFused, newNodes, metadata1);
    add_uncommonNodes(nodes2, idNodesFused, newNodes, metadata2);

    return newNodes;
}

/*
 * Get common nodes IDs and fuse common nodes
 *
 * params = same as for function 'getFusedNodes'
 *
 * returns -> commonNodeInfo - array containing idNodesFused and newNodes.
 *		-> idNodesFused is an array of ids of common nodes
 *		-> newNodes is an array of the common nodes fused
 */
function add_commonNodes(nodes1, nodes2, metadata1, metadata2) {
    //array to store new, fused nodes
    var newNodes = [];

    //IDs of the nodes already fused
    var idNodesFused = [];

    //pairwise comparison of nodes, fusing if same id
    for (var i = 0; i < nodes1.length; i++) {

        var nodes1Id = nodes1[i].id;

        for (var j = 0; j < nodes2.length; j++) {
            var nodes2Id = nodes2[j].id;

            if (nodes1Id == nodes2Id) {

                idNodesFused.push(nodes1Id);

                var newNode = fuse_nodes(nodes1[i], nodes2[j], newNodes,
                        metadata1, metadata2);
                newNodes.push(newNode);

                break;
            }

        }
    }

    var commonNodeInfo = [idNodesFused, newNodes];
    return commonNodeInfo;
}

/*
 * Gets nodes unique to nodes, adds them in ordered way to idNodesFused
 * and newNodes
 *
 * params = -> nodes is an array of nodes.
 *	       -> idNodesFused is an array of ids from nodes present in
 *	                        newNodes.
 * 	       -> newNodes is an array of nodes already fused/added.
 *	       -> metadata is the metadata object from the same poag as
 *	                    nodes.
 *
 * ensures = -> All of the nodes unique to nodes will be added in ascending
 *	      order in both idNodesFused and newNodes depending on node ID.
 *	        -> Nodes added to newNodes are a deep copy version of the nodes,
 *	      (are converted to fused format if not already.
 */
function add_uncommonNodes(nodes, idNodesFused, newNodes, metadata) {

    //adding nodes from first graph not contained in the other graph
    for (var i = 0; i < nodes.length; i++) {

        //checking if node already in newNodes, if not then add
        if (idNodesFused.indexOf(nodes[i].id) == -1) {

            //adding to idNodesFused in ordered way
            idNodesFused.push(nodes[i].id);
            idNodesFused.sort(d3.ascending);

            var nodeCopy = node_DeepCopy(nodes[i], metadata);

            //using ordering in idNodesFused to add node to newNodes
            newNodes.splice(idNodesFused.indexOf(nodes[i].id), 0, nodeCopy);
        }
    }
}


/*
 * Returns deep copy of inputted node, if from an unfused type will return in
 * a fused type format
 *
 * params = -> node is an inputted node from a POAG
 *	       -> metadata is the metdata from the same poag as node
 *
 * returns = -> newNode - is is exactly the same(if node is fused type),
 *	       else returns copy of node in fused type format.
 */
function node_DeepCopy(node, metadata) {
    //need to check what the point of class, lane, and seq are.
    var newNode = {"id": node.id, "x": node.x, "y": node.y, "label": node.label,
        "num_out_edges": node.num_out_edges};

    //checking if node from fused poag and
    if (metadata.type == "fused" && node.graph.bars[0]
            .hasOwnProperty("poagValues")) {

        //already in fused format, just add deep copies of graph and seq
        newNode.graph = graph_deepCopy(node);
        newNode.seq = seq_deepCopy(node);

    } else if (metadata.type != "marginal") {

        //putting in details in fused type format
        newNode.seq = {"chars": [{"label": newNode.label, "value": 1}],
            "poagValues": []};

        newNode.seq.poagValues.push({"label": newNode.label, "value": 1,
            "poag": "poag" + (metadata.npoags + 1)});

        newNode.graph = {"bars": [{"label": newNode.label, "value": 100,
                    "poagValues": {}}]};

        newNode.graph.bars[0].poagValues["poag" + (metadata.npoags + 1)] = 100;

    } else {

        //putting in details in fused type format
        newNode.seq = {"chars": [{"label": newNode.label, "value": 1}],
            "poagValues": []};

        newNode.seq.poagValues.push({"label": newNode.label, "value": 1,
            "poag": "poag" + (metadata.npoags + 1)});

        //need to treat the marginal graph object differently
        newNode.graph = add_poagValues(node.graph, metadata.npoags);
    }

    return newNode;
}

/*
 * Creates a fused poag version of the marginal poags graph object
 * (i.e. has poag information)
 *
 * params: -> graph - marginal poags graph object
 *
 * returns: -> fusedGraphObject - fused poag version of graph object
 */
function add_poagValues(graph, npoags) {

    var bars = graph.bars;

    var fusedGraphObject = {"bars": []};

    for (var bari in bars) {

        var bar = bars[bari];

        //copying over graph information and adding poag info
        var newBar = {"label": bar.x_label, "value": bar.value,
            "poagValues": {}};

        newBar.poagValues["poag" + (npoags + 1)] = bar.value;

        fusedGraphObject.bars.push(newBar);
    }

    return fusedGraphObject;
}


/*
 * Fuses two inputted nodes
 *
 * params = -> node1, node2, metadata1 & metadata2 same as described
 *	      for 'getFusedNodes' method
 *	       -> newNodes is an array of the fused nodes
 *
 * returns = -> newNode - A single node with attributes of both nodes
 *			 fused.
 */
function fuse_nodes(node1, node2, newNodes, metadata1, metadata2) {
    //need to check what the point of class, lane, and seq are.
    var newNode = {"id": node1.id, "lane": 0, "x": node1.x};

    //fusing the nodes appropriately depending on the poags they are from
    if (metadata1.type == "joint" && metadata2.type == "joint") {

        //need to create new graph and seq objects when fusing joint types
        newNode.seq = create_seqObject(node1, node2);
        newNode.graph = createGraphObject(newNode.seq, node1, node2);

    } else if (metadata1.type == "fused" && metadata2.type == "joint") {

        //adding the label information from the joint node (node2) to node1
        newNode.seq = add_labelToSeq(node1, node2, metadata1.npoags);
        newNode.graph = add_labelToGraph(newNode.seq, node1, node2,
                metadata1.npoags);

    } else if (metadata1.type == "marginal" && metadata2.type == "marginal") {

        //Need to create new seq object with the marginal but fuse distributions
        newNode.seq = create_seqObject(node1, node2);
        newNode.graph = fuse_marginalGraphs(node1, node2, metadata1.npoags,
                metadata2.npoags);

    } else if (metadata1.type == "fused" && metadata2.type == "marginal") {

        //need to add label information to seq, but still fuse distributions
        newNode.seq = add_labelToSeq(node1, node2);
        newNode.graph = fuse_marginalGraphs(node1, node2, metadata1.npoags,
                metadata2.npoags);
    }

    //node with highest y becomes y of new node
    if (node1.y > node2.y) {
        newNode.y = node1.y;
    } else {
        newNode.y = node2.y;
    }

    //label with highest frequency becomes new label
    newNode.label = getNodeLabel(newNode.seq);

    return newNode;
}

/*
 * Fuses the graph information present in two marginal poags or a fused poag
 * and marginal poag
 *
 * params: -> node1 must either be a node from a fused or marginal poag
 *	      -> node2 must be a node from a marginal poag
 *	      -> npoags is the total number of nodes fused thus far
 *	        (refer to fuse_multiplegraphs)
 *
 * returns: -> fusedGraph - fused graph object of the two inputted nodes
 *			   and returns a new graphh object in the fused
 *			   graph format (i.e. has poagValues).
 */
function fuse_marginalGraphs(node1, node2, npoags1, npoags2) {

    var bars1 = node1.graph.bars;
    var bars2 = node2.graph.bars;

    var fusedGraph = {"bars": []};

    //pairwise comparison of the bars, fusing if have the same label
    for (var bar1i in bars1) {

        var bar1 = bars1[bar1i];

        for (var bar2i in bars2) {
            var bar2 = bars2[bar2i];

            if (bar1.x_label == bar2.x_label) {

                var newBar = fuse_Bar(bar1, bar2, npoags1, npoags2);
                fusedGraph.bars.push(newBar);
            }
        }
    }
    return fusedGraph;
}

/*
 * Fuses two bar objects with the same label
 *
 * params: -> bar1 must be from a graph object from either a fused or
 *	     marginal poag
 *	      -> bar2 must be from a graph object from a marginal poag
 *	         Both bar objects must have the same label.
 *	     -> npoags1 and 2 is the same as described in params for
 *	        'fused_marginalGraphs'
 *
 * returns: -> newBar - object containing information between the
 *		       two bars fused. If bar1 is from a fused graph,
 *		       will appropriately normalise poagValues and add
 *		       the extra poagValue from bar2.
 */
function fuse_Bar(bar1, bar2, npoags1, npoags2) {

    var newValue = (bar1.value + bar2.value) / 2;
    var newBar = {"label": bar1.x_label, "value": newValue,
        "poagValues": {}};

    //if has "poagValues", bar1 is from fused type
    if (bar1.hasOwnProperty("poagValues")) {

        //Copying over the poagValues from bar1 and normalising
        for (var poag in bar1.poagValues) {

            newBar.poagValues[poag] = bar1.poagValues[poag] / 2;
        }

    } else {

        //adding new poagValue information since must be marginal type here
        newBar.poagValues["poag" + (npoags1 + 1)] = bar1.value / 2;
    }

    //bar2 is always from marginal type so just add the barValue for that poag
    newBar.poagValues["poag" + (npoags2 + 1)] = bar2.value / 2;

    return newBar;
}

/*
 * Creates a seq object based off the labels of two inputted nodes
 *
 * params: Nodes 1 and 2 are both nodes with the same id from two
 *	      different POAGs which are unfused and represent a
 *	      sequence at an intermediate node in the tree.
 *
 * return: seq object created based off the labels of the inputted nodes
 */
function create_seqObject(node1, node2) {

    var newSeq = {"chars": [], "poagValues": []};

    if (node1.label != node2.label) {

        //creating two new seperate char objects
        newSeq.chars[0] = {"label": node1.label, "value": 1};
        newSeq.chars[1] = {"label": node2.label, "value": 1};
    } else {

        //just adding one new char object, but with a value of 2
        newSeq.chars[0] = {"label": node1.label, "value": 2};
    }

    //adding the different values for the poags
    newSeq.poagValues[0] = {"label": node1.label, "value": 1,
        "poag": "poag1"};

    newSeq.poagValues[1] = {"label": node2.label, "value": 1,
        "poag": "poag2"};

    return newSeq;
}

/*
 * Adds to the existing seq object in node1 based off the seq label in
 * node2
 *
 * params: -> node1 - is from a POAG which is fused
 *	      -> node2 - has the same ID as node1, and is from either
 *	                 joint or marginal poag
 *	      -> npoags - same as described in 'fused_marginalGraphs'
 *
 * returns: -> seq - A seq object in node1 updated to include node2's
 *		    label details. Added if label already present in chars,
 *		    otherwise label added as new char with value of 1.
 */
function add_labelToSeq(node1, node2, npoags) {

    //getting deep copy of characters in seq object
    var newSeq = seq_deepCopy(node1);
    var chars = newSeq.chars;

    var foundMatch = false;
    for (var i = 0; i < chars.length; i++) {

        //if found match, increment character value
        if (node2.label == chars[i].label) {
            chars[i].value += 1;
            foundMatch = true;
            break;
        }

    }

    //adding new char object if no match found
    if (!foundMatch) {
        chars.push({});
        chars[chars.length - 1].label = node2.label
        chars[chars.length - 1].value = 1;
    }

    //adding the poagValue in
    newSeq.poagValues.push({"label": node2.label, "value": 1,
        "poag": ("poag" + (npoags + 1))});

    return newSeq;
}

/*
 * Creates deep copy of seq object in inputted node
 *
 * params: node -> node wish to make deep copy of its seq object,
 *		          must be fused type
 *
 * returns: -> newSeq - Deep copy of node seq, is identical to node.seq.
 */
function seq_deepCopy(node) {
    //to store all the sequence information
    var newSeq = {"chars": [], "poagValues": []};

    for (var i = 0; i < node.seq.chars.length; i++) {

        //adding seq details from inputted node to seq object of new node
        newSeq.chars.push({});
        newSeq.chars[i].label = node.seq.chars[i].label;
        newSeq.chars[i].value = node.seq.chars[i].value;
    }

    //copying over the poagValue details
    var poagValues = node.seq.poagValues;
    for (var j = 0; j < poagValues.length; j++) {
        newSeq.poagValues.push({"label": poagValues[j].label, "value":
                    poagValues[j].value, "poag": poagValues[j].poag});
    }

    return newSeq;
}

/*
 * Gets the label in a given seq object with the highest value.
 *
 * params: -> seq - seq object from a node from any type of poag
 *
 * returns: -> label with the highest associated value in the seq object
 */
function getNodeLabel(seq) {
    //getting the characters
    var chars = seq.chars;

    //initially assigning chars with max freq as the first
    var charMaxFreq = chars[0];

    //getting char with max freq
    for (var i = 1; i < seq.chars.length; i++) {
        if (chars[i].value > chars[chars.indexOf(charMaxFreq)].value) {
            charMaxFreq = chars[i];
        }
    }

    return charMaxFreq.label;
}

/*
 * Creates node graph object from inputted seq object and
 * nodes from joint type poags. Called on initial graph fusion.
 *
 * params = -> seq - fused seq object generated from
 *		     create_seqObject(node1, node2).
 *	       -> node1 - node from joint type poag
 *	       -> node2 - node from joint type poag
 *
 * require = -> node1.label == node2.label
 *	        -> node1 and node2 from different poags
 *
 * returns = -> newGraph - A new graph object generated from
 *			  the seq and node data
 */
function createGraphObject(seq, node1, node2) {
    var overallCharCount = 0;
    var chars = seq.chars;

    var newGraph = {"bars": []};

    //getting total character count
    for (var i = 0; i < chars.length; i++) {
        overallCharCount += chars[i].value;
    }

    //calculating freq of each character relative to total
    for (var i = 0; i < chars.length; i++) {

        var char = chars[i];
        var graphValue = (char.value / overallCharCount) * 100;

        //adding the char label and value
        newGraph.bars.push({"label": char.label, "value":
                    graphValue, "poagValues": {}});

        if (char.label == node1.label && char.label == node2.label) {

            //add both the poags to poag values since match char
            newGraph.bars[i].poagValues["poag1"] =
                    (1 / overallCharCount) * 100;

            newGraph.bars[i].poagValues["poag2"] =
                    (1 / overallCharCount) * 100;

        } else if (char.label == node1.label) {

            //add just node1s poag to graph object
            newGraph.bars[i].poagValues["poag1"] =
                    (1 / overallCharCount) * 100;

        } else {

            //add just node2s poag to graph object
            newGraph.bars[i].poagValues["poag2"] =
                    (1 / overallCharCount) * 100;

        }
    }
    return newGraph;
}

/*
 * Adds the information from node2 to the graph in node1
 *
 * params = -> seq - fused seq object from nodes inputted
 *	       -> node1 - node from fused poag
 *	       -> node2 - node from joint poag
 *	       -> npoags - number of poags fused in the poag from
 *		       which node1 is derived.
 *
 * returns = -> newGraph - new graph object which is the same as
 *			  node1s graph but with the extra label
 *			  information incorporated from node2.
 */
function add_labelToGraph(seq, node1, node2, npoags) {
    var overallCharCount = 0;
    var chars = seq.chars;

    var newGraph = graph_deepCopy(node1);

    //getting total character count
    for (var i = 0; i < chars.length; i++) {
        overallCharCount += chars[i].value;
    }

    //calculating freq of each character relative to total
    for (var i = 0; i < chars.length; i++) {
        var char = chars[i];

        var graphValue = (char.value / overallCharCount) * 100;

        var graphBars = newGraph.bars;

        var labelIndex = -1;

        for (var k = 0; k < graphBars.length; k++) {

            if (graphBars[k].label == node2.label &&
                    node2.label == char.label) {

                graphBars[k].value = graphValue;

                labelIndex = k;
                break;
            }
        }

        /****updating the poag values for every poagvalue*****/
        for (var k = 0; k < graphBars.length; k++) {

            //for updating the whole bars value
            graphBars[k].value = 0;

            for (var poagValue in graphBars[k].poagValues) {

                graphBars[k].poagValues[poagValue] =
                        (1 / overallCharCount) * 100;

                graphBars[k].value += (1 / overallCharCount) * 100;
            }
        }

        /*********adding new graph poag info *************/
        if (labelIndex != -1) {

            graphBars[labelIndex].poagValues["poag" +
                    (npoags + 1)] = (1 / overallCharCount) * 100;

            graphBars[labelIndex].value += (1 / overallCharCount) * 100;

        } else if (char.label == node2.label) {

            graphBars.push({"label": char.label, "value": graphValue,
                "poagValues": {}});

            graphBars[graphBars.length - 1].poagValues["poag" +
                    (npoags + 1)] = (1 / overallCharCount) * 100;

        }
    }

    return newGraph;
}

/*
 * Creates deep copy of graph object in node, graph must be fused type
 * param: node object of fused type
 * returns deep copy of graph in node
 */
function graph_deepCopy(node, npoags) {

    //to store graph information
    var newGraph = {"bars": []};

    for (var i = 0; i < node.seq.chars.length; i++) {
        //adding graph details from node to graph object of new node
        if (i >= node.graph.bars.length) {
            return newGraph;
        }
        newGraph.bars.push({});

        newBars = newGraph.bars;
        nodeBars = node.graph.bars;
        newBars[i].value = nodeBars[i].value;
        newBars[i].label = nodeBars[i].label;

        newBars[i]["poagValues"] = {};

        for (var poagValue in nodeBars[i].poagValues) {

            newBars[i].poagValues[poagValue] = nodeBars[i]
                    .poagValues[poagValue];
        }
    }
    return newGraph;
}

//  Have moved the following code to results.html line 140

//var graph1 = JSON.parse(json_str);
//var graph2 = JSON.parse(poag_json_n4);
//var graph3 = JSON.parse(poag_json_n9);
//var graph5 = JSON.parse(joint4);
//var graph6 = JSON.parse(joint5);

//var graphs = graph.poags;//[graph1, graph2, graph3, graph5, graph6];

//var marginalGraph1 = JSON.parse(marginal1);
//var marginalGraph2 = JSON.parse(marginal2);

//var marginalGraphs = [marginalGraph1, marginalGraph2];

//var newGraph = fuse_multipleGraphs(graphs);
//console.log(newGraph);

/*
 * Fuses multiple poags of either marginal or joint type
 *
 * params: -> graphs - an array of either marginal or joint poags
 *	  -> innerNodeGrouped - boolean whether the user wants
 *				the nodes displayed with the inner
 *				colours grouped or not.
 *
 * returns: string JSON object (of fused poag object)
 *	   of all the poags in the array.
 */
function fuse_multipleGraphs(graphs, innerNodeGrouped) {

    var innerNodeGrouped = innerNodeGrouped || false;

    //assigning each poag a no. to identify it
    for (var j = 0; j < graphs.length; j++) {

        graphs[j].bottom.metadata["npoags"] = j;

    }

    //initial graph fusion
    var fusedGraph = fuse_graphs(graphs[0], graphs[1]);

    fusedGraph.bottom.metadata.npoags = 2;

    //if list of poags >2, fused next poag with the current fused poag
    if (graphs.length > 2) {

        for (var i = 2; i < graphs.length; i++) {

            fusedGraph = fuse_graphs(fusedGraph, graphs[i]);
            fusedGraph.bottom.metadata.npoags += 1;

        }
    }

    //adding the poags which aren't described into seq
    for (var node in fusedGraph.bottom.nodes) {

        var seq = fusedGraph.bottom.nodes[node].seq;
        add_poagsToSeq(seq, fusedGraph.bottom.metadata.npoags,
                innerNodeGrouped);
    }

    //adding the mutant information if fusing marginal poags
    if (fusedGraph.bottom.metadata.subtype == "marginal") {

        // Need to fix when integrate to grasp
        var fusedGraphBottom = generate_mutants(fusedGraph.bottom);
        add_poagValuesToMutants(fusedGraph.bottom.nodes);

    }

    return JSON.stringify(fusedGraph);
}

/*
 * Add normalised poagValue information to each mutant object in
 * nodes[nodei]
 *
 * params: nodes are nodes from a fused poag
 *
 * ensures: for each node in the list of nodes, poagValues are
 *	   added so that the degree each poag contributes to
 *	    the mutant frequency is present.
 */
function add_poagValuesToMutants(nodes) {

    for (var nodei in nodes) {

        var node = nodes[nodei];

        for (var chari in node.mutants.chars) {

            var char = node.mutants.chars[chari];

            for (var bari in node.graph.bars) {

                var bar = node.graph.bars[bari];

                if (char.label == bar.label) {

                    //adding normalised poagValues
                    char["poagValues"] = {};
                    for (var poag in bar.poagValues) {

                        char.poagValues[poag] =
                                (bar.poagValues[poag] / bar.value) * char.value;
                    }
                }
            }
        }
    }
}

/*
 * Adds to the seq object the poags which were not present with a label of "0"
 *
 * params: -> seq - seq object from the final fused poag
 *	  -> npoags - number of poags fused to created the final fused poag.
 *	  -> innerNodeGrouped - *optional* boolean as to whether the seq
 *				poagValues should be order so that the
 *				kind of labels in the inner pi chart are
 *				grouped.
 *
 * ensures: -> All poags not present in the seq object added with label "0"
 *	      to indicate that poag does not have that node. If
 *	      innerNodeGrouped then poags added so labels grouped together
 *	      in pi chart, else added so pi chart ordered based off poag
 *	      number.
 */
function add_poagsToSeq(seq, npoags, innerNodeGrouped) {

    var poagValues = seq.poagValues;

    //getting poags which don't have node
    var poagsAbsent = getPoagsAbsent(npoags, poagValues);

    //updating seq appropriately to contain poag with label "0"
    if (poagsAbsent.length > 0) {

        //inserting absent poags into seq object with label "0"
        seq.chars.push({"label": "0", "value": 0});

        //for determining location of already added poags
        var firstPoagi = -1;

        //getting poagValues length before append extra poags
        var originalLength = poagValues.length;

        //add absent poags with label "0" for pi chart display
        for (var poagAbsenti in poagsAbsent) {

            var poagAbsent = poagsAbsent[poagAbsenti];

            var newPoagObject = {"label": "0",
                "value": 1, "poag": poagAbsent};

            //getting poag number from poag name (e.g 1 from 'poag1')
            var poagNumber = poagAbsent.charAt(poagAbsent.length - 1) - 1;

            //poag order in poagValues determines pi chart slice order
            if ((!innerNodeGrouped) || originalLength == 1 || poagsAbsent.length == 1) {

                //nodes ordered according to poagNumber
                poagValues.splice(poagNumber, 0, newPoagObject);

            } else {

                //groups according to character when pi displayed
                firstpoagi = addpoag_InnerOrdered(firstpoagi, poagNumber,
                        poagValues, newPoagObject);
            }

            seq.chars[seq.chars.length - 1].value += 1;
        }
    }
}

/*
 * Gets the poags not already described in poagValues
 *
 * params: npoags -> number of poags fused in the fused graph object
 *         poagValues -> seq.poagValues from the fused graph object
 *
 * returns: poagsAbsent -> array containing names of poags not present in
 *                         poagValues.
 */
function getPoagsAbsent(npoags, poagValues) {

    var poagsAbsent = [];

    //getting poags no present in poag values
    for (var poagi = 1; poagi < npoags + 1; poagi++) {

        var poagPresent = false;
        for (var poag in poagValues) {

            if (poagValues[poag].poag == ("poag" + poagi)) {

                poagPresent = true;
                break;
            }
        }

        if (!poagPresent) {

            poagsAbsent.push(("poag" + poagi));
        }
    }

    return poagsAbsent;
}

/*
 * Adds the newPoagObject in the appropriate position in poagValues
 * params: firstpoagi -> index in poagValues first poagAbsent was added to.
 *                       firstpoagi == -1 if absent poag not yet added.
 *         poagNumber -> poags number (e.g. 1 from 'poag1') minus 1 for indexing.
 *         poagValues -> same as described in getPoagsAbsent.
 *         newPoagObject -> poagObject describing absent poag corresponding to poagNumber.
 * returns: firstpoagi -> same as described above.
 */
function addpoag_InnerOrdered(firstpoagi, poagNumber, poagValues, newPoagObject) {

    //groups according to character when pi displayed
    if (firstpoagi == -1 && poagNumber > 0 && poagNumber < poagValues.length - 1) {

        for (var i = poagNumber; i < poagValues.length; i++) {

            //adding poag at nearest site to poagNumber between poags with different labels
            if (poagValues[i - 1].label != poagValues[i].label) {
                poagValues.splice(i, 0, newPoagObject);
                firstpoagi = i;
                break;
            }
        }

        //means all of the poags in seq have same label, so don't want to split up
        if (firstpoagi == -1) {

            //to check whether poag should be inserted at end or start
            var endDist = poagValues.length - poagNumber;

            //if poag closer to end, insert there, else at start
            if (endDist < poagNumber) {
                poagValues.push(newPoagObject);
                firstpoagi = poagValues.length - 1;

            } else {

                poagValues.splice(0, 0, newPoagObject);
                firstpoagi = 0;
            }
        }

    } else if (firstpoagi == -1 && poagNumber == 0) {

        //poag can just go at the start, won't split up poags with same labels
        poagValues.splice(0, 0, newPoagObject);
        firstpoagi = 0;


    } else if (firstpoagi == -1 && poagNumber == poagValues.length - 1) {

        //poag can just go at the end, won't split up poags with same labels
        poagValues.push(newPoagObject);
        firstpoagi = poagValues.length - 1;

    } else {

        //just adding in front of last added absent poag
        poagValues.splice(firstpoagi + 1, 0, newPoagObject);
    }

    return firstpoagi;
}

/*
 * Fuses two inputted POAG graphs
 * params = two graphs aligned and aligned nodes have the same ids
 * returns single graph with attributes of both graphs fused.
 */
function fuse_graphs(graph1, graph2) {
    //getting nodes from inputted graphs
    var nodes1 = graph1.bottom.nodes;
    var nodes2 = graph2.bottom.nodes;

    //graph metadata
    var metadata1 = graph1.bottom.metadata;
    var metadata2 = graph2.bottom.metadata;

    var newNodes = getFusedNodes(nodes1, nodes2, metadata1,
            metadata2);

    //Getting edges from inputted graphs
    var edges1 = graph1.bottom.edges;
    var edges2 = graph2.bottom.edges;

    var fusedEdges = getFusedEdges(edges1, edges2, newNodes,
            metadata1, metadata2);

    //Creating the newGraph
    var newGraph = {};
    newGraph.top = graph1.top;
    newGraph.bottom = {};
    newGraph.bottom.metadata = metadata_DeepCopy(graph1.bottom.metadata);

    newGraph.bottom.metadata.type = 'fused';
    newGraph.bottom.metadata["subtype"] =
            graph2.bottom.metadata.type;

    newGraph.bottom.max_depth = graph1.bottom.max_depth;
    newGraph.bottom.edges = fusedEdges;
    newGraph.bottom.nodes = newNodes;

    return newGraph;
}

/*
 * Creates a deep copy of a metadata object
 * params: -> metadata - e.g. from graph.bottom.metadata
 * returns: -> metadataCopy - a deep copy of metadata.
 */
function metadata_DeepCopy(metadata) {

    var metadataCopy = {};

    //copying over all properties from metadata to metadataCopy
    for (var property in metadata) {
        metadataCopy[property] = metadata[property];
    }

    return metadataCopy;
}


