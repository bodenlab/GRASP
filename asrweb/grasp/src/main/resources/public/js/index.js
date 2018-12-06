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
    page_width: 0,
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
        margin: {left: 0, right: 0, top: 200, bottom: 0}
    },
    multi: {
        names: [],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'multi-',
        height: 250,
        margin: {left: 0, right: 0, top: 200, bottom: 0}
    },
    merged: {
        names: ['Merged'],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'merged-',
        height: 250,
        margin: {left: 0, right: 0, top: 200, bottom: 0}
    },
    taxonomy: {}
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
        margin: {top: 140, left: 200, bottom: 0, right: 10},
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
        stroke_width: 5,
        consensus_stroke_width: 8,
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
        offset_graph_width: -25,
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
    poags = setup_poag_svg(poags);

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
    setup_poag_svg(poags)
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
    var prev_max = poags.cur_x_max;
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
    // if the extent hasn't changed, the screen has been re-sized, so automatically increase/decrease how many nodes are shown
    // based on screen size difference
    if (prev_max === poags.cur_x_max) {
        var resize_diff = $(window).width() - poags.page_width;
        var num_nodes = resize_diff/(4*poags.node_radius);
        poags.cur_x_max = prev_max + num_nodes;
        if (poags.cur_x_max < poags.options.display.num_start_nodes) {
            poags.cur_x_max = poags.options.display.num_start_nodes;
        }
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
    group.selectAll("rect").remove();
    group.selectAll("defs.poag").remove();
    var group = poags.merged_group;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect").remove();
    group.selectAll("defs.poag").remove();
    var group = poags.group;
    group.selectAll("g.graph").remove();
    group.selectAll("path.poag").remove();
    group.selectAll("circle.poag").remove();
    group.selectAll("text.poag").remove();
    group.selectAll("rect").remove();
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

  for (var n in nodes) {
    var node = nodes[n];
    var node_x = node[N_X] + 1;
    if (node_x >= poags.cur_x_min - 2 && node_x <= poags.cur_x_max + 2) {
      var node_cx = poags.scale.x(node_x);
      var node_cy = scale_y(node[N_Y]) + poags.y_offset;
      if (node_x >= poags.cur_x_min && node[N_X] <= poags.cur_x_max) {
        if (draw_legend) {
          draw_legend_rect(poags, node, nodes[poags.cur_x_max], group, height,
              scale_y, colour);
          draw_legend = false;
        }
      }
    }
  }
  draw_legend = false;
  // draw all reciprocated edges so that they are drawn on top of uni-directional ones
  for (var e in edges) {
    var edge = edges[e];
    //if we have an out going edge
    if (edge[E_TO] !== undefined) {
      if (edge[E_RECIPROCATED] && ((edge[E_TO][N_X] > poags.cur_x_min - 1
              && edge[E_TO][N_X] < poags.cur_x_max + 1)
              || (edge[E_FROM][N_X] < poags.cur_x_max + 1
                  && edge[E_FROM][N_X] > poags.cur_x_min - 1))) {
        draw_edges(poags, edge, group, scale_y);
      }
    }
  }
    // draw all not reciprocated edges first
    for (var e in edges) {
        var edge = edges[e];
      if (edge[E_TO] !== undefined) {
        if (!edge[E_RECIPROCATED] && ((edge[E_TO][N_X] > poags.cur_x_min - 1
                && edge[E_TO][N_X] < poags.cur_x_max + 1) || (edge[E_FROM][N_X]
                < poags.cur_x_max + 1 && edge[E_FROM][N_X] > poags.cur_x_min
                - 1))) {
          draw_edges(poags, edge, group, scale_y);
        }
      }
    }

  for (var n in nodes) {
    var node = nodes[n];
    var node_x = node[N_X] + 1;
    if (node_x >= poags.cur_x_min - 2 && node_x <= poags.cur_x_max + 2) {
      var node_cx = poags.scale.x(node_x);
      var node_cy = scale_y(node[N_Y]) + poags.y_offset;
      if (node_x >= poags.cur_x_min && node[N_X] <= poags.cur_x_max) {
        if (draw_legend) {
          draw_legend_rect(poags, node, nodes[poags.cur_x_max], group, height, scale_y, colour);
          draw_legend = false;
        }
        if (node[G_X] === poags.min_x || node[G_X] === poags.max_x) {
          draw_terminus(poags, group, node_cx, node_cy);
        } else {
          var radius = draw_nodes(poags, node, group, node_cx, node_cy);

          if (poag_name === poags.root_poag_name || node[N_TYPE] === 'marginal' || poagPi) {
            draw_pie(poags, node, group, radius, poagPi, node_cx, node_cy);
            // if it is a merged node, we want to draw a layered Pie chart
            // so we set poagPi to false and re draw a smaller pie chart with
            // the proper colours.
            if (poagPi) {
              draw_pie(poags, node, group, radius, false, node_cx, node_cy);
            }
            // check whether to display a graph
            var count = 0;
            for (var b in node[G_GRAPH]) {
              if (node[G_GRAPH][b][G_VALUE_BAR] > poag_options.graph.hist_bar_thresh) {
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
    let data = json_str;
    if (typeof json_str === "string") {
      data = JSON.parse(json_str);
    }
    if (data.bottom.nodes[0].id !== undefined) {
      data.bottom.nodes = convertToArray(data.bottom.nodes);
      data.bottom.edges = convertEdgesToArray(data.bottom.edges);
      data.top.nodes = convertToArray(data.top.nodes);
      data.top.edges = convertEdgesToArray(data.top.edges);
      data["new_ds"] = true;
    }
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


var process_poags_joint = function (data, poags, inferred, set_msa, merged, name) {

  poags = process_poag_data(poags, data, name, inferred, merged);
  poags = process_edges(poags, data, name, inferred, merged);

  if (poags.single.nodes[poags.root_poag_name].length < poags.options.display.num_start_nodes) {
    poags.options.display.num_start_nodes = Math.floor(poags.single.nodes[poags.root_poag_name].length*0.8);
  }
  return poags;
}


let convertEdgesToArray = function (data) {
  let arr = [];
  for (let d in data) {
    let edge = data[d];
    let tmp = [];
    tmp[E_FROM] = edge.from;
    tmp[E_TO] = edge.to;
    tmp[E_CONSENSUS] = edge.consensus;
    tmp[E_SINGLE] = edge.single;
    tmp[E_RECIPROCATED] = edge.reciprocated;
    tmp[E_WEIGHT] = edge.weight;
    tmp[E_X1] = edge.x1;
    tmp[E_X2] = edge.x2;
    tmp[E_Y1] = edge.y1;
    tmp[E_Y2] = edge.y2;
    arr.push(tmp);
  }
  return arr;
}


/**
 * A temporary helper function that converts the JSON object to an ordered array
 * to save on space.
 * @param data
 */
let convertToArray = function (data) {
    let arr = [];
    for (let d in data) {
      let node = data[d];
      let tmp = [];
      tmp[G_LABEL] = node.label;
      if (node.graph !== undefined) {
        tmp[G_GRAPH] = convertDictToArr(node.graph.bars);
      }
      if (node.mutants !== undefined) {
        tmp[G_MUTANTS] = [];
        tmp[G_MUTANTS][G_CHARS] = convertDictToArr(node.mutants.chars);
      }
      tmp[G_SEQ] = [];
      tmp[G_SEQ][G_CHARS] = convertDictToArr(node.seq.chars);
      tmp[G_X] = node.x;
      tmp[G_Y] = node.y;
      tmp[G_CONSENSUS] = node.consensus;
      arr.push(tmp);
    }
    return arr;
}



let convertDictToArr = function (data) {
    let arr = [];
    for (let d in data) {
        let tmp = Array(2).fill(0);
        tmp[G_VALUE] = data[d].value;
        if (data[d].label !== undefined) {
          tmp[G_LABEL] = data[d].label;
        } else {
          tmp[G_LABEL] = data[d].x_label;
        }
        arr.push(tmp);
    }
    return arr;
}

let convertCharValToStr = function(arr) {
    for (let c in arr) {
        if (!isNaN(arr[c][G_LABEL])) {
          arr[c][G_LABEL] = String.fromCharCode(arr[c][G_LABEL])
        }
    }
    return arr;
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
        if (!isNaN(node[G_LABEL])) {
            node[G_LABEL] = String.fromCharCode(node[G_LABEL]);
        }
        node[N_TYPE] = msa.metadata.type;
        node[N_DEL_DUR_INF] = true; //[N_DEL_DUR_INF]
        node[N_GROUP] = name;
        node[N_CLASS] = "";
        node[N_Y] = 0;
        node[UNIQUE_ID] = name + '-' + node[N_X];
        poags = update_min_max(node[G_X], node[G_Y], poags);
        node[G_SEQ][G_CHARS] = convertCharValToStr(node[G_SEQ][G_CHARS]);
        node[G_GRAPH] = convertCharValToStr(node[G_GRAPH]);
        node[G_MUTANTS] = convertCharValToStr(node[G_GRAPH]);
        if (node[G_SEQ][G_CHARS].length > poags.max_seq_len) {
            poags.max_seq_len = node[G_SEQ][G_CHARS].length;
        }

        //formatMutants(node, poag);
        if (node[G_X] < poags.min_x) {
            poags.min_x = node[G_X];
        }
        if (node[G_X] > poags.max_x) {
            poags.max_x = node[G_X];
        }
        node_dict[name + "-" + node[N_X]] = node;
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

    // Set all the nodes to be deleted during inference if they haven't been
    let allNodes = poags.node_dict;
    for (var an in allNodes) {
        allNodes[an][N_DEL_DUR_INF] = true;
    }

    for (var n in raw_poag.nodes) {
        var node = raw_poag.nodes[n];

        // Get the msa node as to get the x coords.
        var msa_node = poags.node_dict[root_name + '-' + node[N_X]]
        node[N_MUTANT] = false;
        node[N_GROUP] = name;
        node[N_CLASS] = "";
        node[N_Y] = 0;
        if (!isNaN(node[G_LABEL])) {
          node[G_LABEL] = String.fromCharCode(node[G_LABEL]);
        }
        // if x positions are not the same, change to be the same, and find the node
        // with the current msa_node[N_X] and swap co-ordinates
        node[G_SEQ][G_CHARS] = convertCharValToStr(node[G_SEQ][G_CHARS]);
        node[G_GRAPH] = convertCharValToStr(node[G_GRAPH]);
        node[G_MUTANTS] = convertCharValToStr(node[G_GRAPH]);
        if (node[N_X] !== msa_node[N_X]) {
            for (var on in raw_poag.nodes) {
                if (raw_poag.nodes[on][N_X] === msa_node[N_X]) {
                    raw_poag.nodes[on][N_X] = node[N_X];
                    break;
                }
            }
            node[N_X] = msa_node[N_X];
        }
        if (raw_poag.metadata !== undefined) {
          node[N_TYPE] = raw_poag.metadata.type;
        } else {
          node[N_TYPE] = 'joint';
        }
        node[UNIQUE_ID] = name + '-' + node[N_X];
        poags = update_min_max(node[N_X], node[N_Y], poags);

        // Set that this msa node wasn't deleted during inference
        // Only set if the poag name is 'inferred'
        msa_node[N_DEL_DUR_INF] = false;
        if (inferred) {
            msa_node[N_DEL_DUR_INF] = false;
            poags.single.nodes[name].push(node);
        } else if (merged) {
            msa_node[N_DEL_DUR_INF] = false; // TODO: should merged affect the mini graph?
            poags.merged.nodes.push(node);
        } else {
            poags.multi.nodes[name].push(node);
        }

        poags.node_dict[node[UNIQUE_ID]] = node;

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
        reduced_edge[E_ID] = e;
        // From node
        reduced_edge[E_FROM] = poags.node_dict[name + '-' + edge[E_FROM]];
        // To node
        reduced_edge[E_TO] = poags.node_dict[name + '-' + edge[E_TO]]
        reduced_edge[E_CONSENSUS] = edge[E_CONSENSUS] === 1;
        reduced_edge[E_RECIPROCATED] = edge[E_RECIPROCATED] === 1;
        reduced_edge[E_WEIGHT] = edge[E_WEIGHT];
        reduced_edge[E_NAME] = name;
        reduced_edge[E_SINGLE] = edge[E_SINGLE] === 1;
        reduced_edge[E_SEQS] = edge[E_SEQS];

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


var draw_terminus = function (poags, group, node_cx, node_cy) {
    group.append("rect")
        .attr("x", node_cx)
        .attr("y", node_cy - node_cy/2)
        .attr("width", poags.options.edge.consensus_stroke_width)
        .attr("height", node_cy)
        .attr("fill", poags.options.edge.consensus_stroke)
        .attr("opacity", poags.options.edge.opacity);
}

/**
 * Draws the nodes.
 *
 * Each node is drawn in its respective group element.
 */
var draw_nodes = function (poags, node, group, node_cx, node_cy) {
    var node_opt = poags.options.node;
    var radius = (poags.scale.x(node[N_X] + 1) - poags.scale.x(node[N_X])) / 4;

    if (radius > node_opt.max_radius) {
        radius = node_opt.max_radius;
    }

    poags.node_radius = radius;

    group.append('circle')
            .attr("class", 'poag')
            .attr("id", "node-" + node[UNIQUE_ID])
            .attr('cx', node_cx)
            .attr('cy', node_cy)
            .attr('r', radius)
            .attr("stroke-width", node_opt.stroke_width)
            .attr("stroke", node_opt.stroke)
            .attr("opacity", node_opt.default_opacity)
            .attr("fill", poags.options.display.colours[node[G_LABEL]]);


    if (radius > node_opt.min_radius && node[G_LABEL].length == 1) {
        group.append("text")
                .attr("class", "poag")
                .attr("id", "ptext-" + node[UNIQUE_ID])
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
                    return getNodeTextColour(poags.options.display.colours[(node[G_LABEL])]);
                })
                .text(node[G_LABEL]);
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
            if (nodes_inferred[m][N_X] == node[N_X]) {
                node_inferred = nodes_inferred[m];
                break;
            }
        }
        var line_y = (y_scale(node[N_Y]) + (y_scale(node[N_Y] + 1)) / 2);
        var line_x = x_scale(node[N_X] + 1);
        line_points.push(combine_points(line_x, line_y));

        // find node out edges
        var out_edge_count = 0;
        if (node_inferred != null) {
            if (poags.merged.edges.length > 0) {
                for (var e in poags.merged.edges) {
                    if (poags.merged.edges[e][E_FROM][N_X] == node_inferred[N_X]) {
                        out_edge_count++;
                    }
                }
            } else {
                for (var e in poags.single.edges[poags.inferred_poag_name]) {
                    if (poags.single.edges[poags.inferred_poag_name][e][E_FROM][N_X] == node_inferred[N_X]) {
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
        if (node[N_DEL_DUR_INF] == true) {
             group.append("circle")
                    .attr("class", "poag")
                    .attr("id", "node_" + node[G_LABEL] + n)
                    .attr('cx', line_x)
                    .attr('cy', line_y)
                    .attr('r', mini_opt.radius)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.interesting_many_edges_colour);
            d3.select("#node_"+node[G_LABEL]+n).moveToBack();
            //circle.moveToBack();
        }
        if (node_inferred != null && poags.options.mutants.draw == true && node_inferred[N_MUTANT] == true) {
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
 * Make a color scale for the similarity of nodes.
 *
 * @param min
 * @param max
 */
let makeColorScaleEdge = function (min, max) {
  let color = d3.scale.linear().domain([min, max])
  .interpolate(d3.interpolateHcl)
  .range([d3.rgb("#ff00c3"), d3.rgb('#0aff21')]);
  return color;
}
let colorScale = makeColorScaleEdge(0, 100);

// Define the div for the tooltip
var tooltipdiv = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

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
    var x_start = scale_x(edge[E_FROM][N_X] + 1);
    var x_end = scale_x(edge[E_TO][N_X] + 1);
    var x_mid = x_start - ((x_start - x_end) / 2);

    var x_diff = Math.abs(edge[E_FROM][N_X] - edge[E_TO][N_X]);

    var y_start = scale_y(edge[E_FROM][N_Y]) + poags.y_offset;
    var y_end = scale_y(edge[E_TO][N_Y]) + poags.y_offset;

    // If y start and y end are the same we want a nice curve
    var y_jump_buffer = same_level_buffer * x_diff + poags.node_radius + 10;
    if (y_jump_buffer > poags.single.height) {
        y_jump_buffer = poags.single.height;
    }

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
    if (edge[E_RECIPROCATED]) {
        stroke = edge_opt.reciprocated_stroke;
    }
    let drawCon = false;
    if (edge[E_CONSENSUS] && poags.options.display.draw_consensus) {
        stroke_width = edge_opt.consensus_stroke_width;
        stroke = "#0008F8";
      drawCon = true;

    }
    console.log(edge[E_CONSENSUS])
    group.append("path")
            .attr("d", line_function(line_points))
            .attr("class", 'poag')
            .attr("id", 'edge-' + edge[E_FROM][UNIQUE_ID] + '-' + edge[E_TO][UNIQUE_ID])
            .attr("stroke-width", stroke_width)
            .attr("stroke", function() {
              if (drawCon) {
                return "#0008F8";
              } else {
                return colorScale(edge[E_WEIGHT])
              }
            })
            .attr("stroke-dasharray", function() {
                if (!edge[E_RECIPROCATED]) {
                    return "3,3";
                } else {
                    return "0,0";
                }
            })
            .attr("opacity", 1) //edge_opt.opacity)
            .attr("fill", "none")
            .attr("marker-mid", "url(#triangle-end)")

            .on("click", function() {

                if ($(this).attr("opacity") == 1) { // If it's already selected clear the search
                    $(this).attr("stroke-width", stroke_width)
                    $(this).attr("opacity", edge_opt.opacity)
                    search_tree("", true, true); // clear tree
                }
                else { // If it isn't selected, search for the sequences in the tree

                    $(this).attr("stroke-width", stroke_width*2)
                    $(this).attr("opacity", 1)
                    for (var s in edge[E_SEQS]){
                        search_tree(edge[E_SEQS][s], false, true);
                    }

                }

            }).on("mouseover", function() {
                  tooltipdiv.transition()
                  .duration(200)
                  .style("opacity", .9);
                  tooltipdiv.html("Seqs: " + edge[E_WEIGHT] + "%")
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                  tooltipdiv.transition()
                  .duration(500)
                  .style("opacity", 0);
                });

            // .on("mouseover", function() {
            //     $(this).attr("stroke-width", stroke_width*2)
            //     $(this).attr("opacity", 1)
            //     for (var s in edge[E_SEQS]){
            //         search_tree(edge[E_SEQS][s], false, true);
            //     }
            // })
            // .on("mouseout", function() {
            //     $(this).attr("stroke-width", stroke_width)
            //     $(this).attr("opacity", edge_opt.opacity)
            //     search_tree("", true, true); // clear tree
            // });


    
//    
//    group.append("circle")
//            .attr("class", 'poag')
//            .attr('cx', x_start)
//            .attr('cy', y_start)
//            .attr('r', "3px")
//            .attr("stroke-width", edge_opt.stroke_width)
//            .attr("stroke", edge_opt.stroke)
//            .attr("opacity", edge_opt.opacity)
//            .attr("fill", poags.options.display.colours[edge[G_LABEL]]);
//    
//    group.append("circle")
//            .attr("class", 'poag')
//            .attr('cx', x_end)
//            .attr('cy', y_end)
//            .attr('r', "3px")
//            .attr("stroke-width", edge_opt.stroke_width)
//            .attr("stroke", edge_opt.stroke)
//            .attr("opacity", edge_opt.opacity)
//            .attr("fill", poags.options.display.colours[edge[G_LABEL]]);

}


/**
 * Creates an interpolation between the points to
 * give a nice line
 */
var line_function = d3.svg.line()
        .x(function (d) {
            return d[0];
        })
        .y(function (d) {
            return d[1];
        })
        .interpolate("basis");

/**
 * Create tmp x, y for interpolation
 */
combine_points = function (x_var, y_var) {;
    return [x_var, y_var];
};

/**
 * Draws the legend on the side and the graph label.
 *
 * Draws a rectangle beside the first node with the
 * poag name.
 */
var draw_legend_rect = function (poags, node, node_end, group, height, scale_y, colour) {
    var rect_opt = poags.options.legend_rect;
    var node_cx = poags.scale.x(node[N_X] + 1);
    var node_cy = scale_y(node[N_Y]);
    //var width = poags.scale.x(node_end.x) - node_cx;
    // TODO need to update the height to be based on the height
    // TODO need to make the width based on the last node
    // of the POAG i.e. diff between least y and max y.
    if (colour != "none" && colour != undefined) {
        var gradient_id = "gradient" + node[UNIQUE_ID];
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
                .attr("id", "rect-" + node[UNIQUE_ID])
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
                .attr("id", "rect-" + node[UNIQUE_ID])
                .attr('x', node_cx - poags.options.style.margin.left / 2)
                .attr('y', node_cy - height / 2)
                .attr('width', poags.options.style.width)
                .attr('height', 10)
                .attr("stroke-width", rect_opt.stroke_width)
                .attr("stroke", rect_opt.stroke)
                .attr("opacity", 1)
                .attr("fill", colour);
    }

    var tax = poags.taxonomy[node[UNIQUE_ID]];
    if (tax === undefined) {
        tax = "";
    }
    group.append("text")
            .attr("class", "poag")
            .attr("id", "rtext-" + node[UNIQUE_ID])
            .attr('x', node_cx - poags.options.style.margin.left / 2 + 10)
            .attr('y', function () {
                var tmp = node_cy + rect_opt.text_padding - height / 4;
                return tmp;
            })
            .attr("text-anchor", "start")
            .style("font-family", poags.options.style.font_family)
            .style("font-size", poags.options.style.font_size)
            .attr("stroke", function () {
                return getNodeTextColour(poags.options.display.colours[(node[G_LABEL])]);
            })
            .text(node[UNIQUE_ID].split("-")[0] + " " + tax);

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

    if (radius < options.node.min_radius || (!poagPi && node[N_GROUP] == "Merged")) {
        stroke_width = 0;
    }

    //making pi slightly larger for poagPi, to create ring effect for fused pi chart
    if (poagPi) {
        radius += 5;
    }

    var pie_group = group.append("g")
            .attr("id", "pie" + node[N_GROUP])
            .attr("class", "poag")
            .attr('transform', 'translate(' + node_cx + "," + node_cy + ")")

    var pie = d3.layout.pie()
            .value(function (d) {
                return d[G_VALUE_BAR];
            });

    var path_pie = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(0);

    var label_pie = d3.svg.arc()
            .outerRadius(radius - options.pie.label_position)
            .innerRadius(radius - options.pie.label_position);

    var pie_data = node[G_SEQ][G_CHARS];
    radius -= 10;

    if (node[N_GROUP] !== "MSA" && node[N_GROUP] !== "Merged" && options.mutants.count > 0 && options.mutants.draw === true) {
        // ToDo: Confirm that we don't actually want to change anything on the pie graph
        pie_data = node[G_MUTANTS];
        if (pie_data.length < 2) {
            // We don't want to draw a pie graph if there is only one character.
            return;
        }
    } else if (node[N_MERGED_SEQ] !== undefined) {
        var pie_data = node[N_MERGED_SEQ];
        radius += 10;
    }

    var max = 0;
    var lbl = "";
    for (var d in pie_data) {
        if (pie_data[d][G_VALUE_BAR] > max){
            lbl = pie_data[d][G_LABEL];
            max = pie_data[d][G_VALUE_BAR];
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
                if (d.data[N_MERGED_SEQ] == undefined) {
                    return options.display.colours[(d.data[G_LABEL])];

                } else {
                    if (!poagPi) {
                        if (d.data[G_LABEL] != "0") {
                            //other labels in the inner fused pi chart
                            return options.display.colours[(d.data[G_LABEL])];
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
                .attr("id", "ptext-" + node[UNIQUE_ID])
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
                    return getNodeTextColour(options.display.colours[(node[G_LABEL])]);
                })
                .text(lbl);
    }

    if (node[N_GROUP] == "MSA") {
         group.append("text")
                .attr("class", "poag")
                .attr("id", "idtext-" + node[UNIQUE_ID])
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
                    if (poags.node_radius > 2*options.node.min_radius || node[N_X] % spacing == 0) {
                        return node[N_X] + 1;
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

    var yModal = d3.scale.linear()
            .range([2*options.graph_height/ options.div_factor, 0]);


    var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

    var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(2);

    var modalyAxis = d3.svg.axis()
        .scale(yModal)
        .orient("left")
        .ticks(5);

    //options.svg_overlay = svg;
    options.x = x;
    options.y = y;
    options.yModal = yModal;
    options.xAxis = xAxis;
    options.yAxis = yAxis;
    options.modalyAxis = modalyAxis
}

function create_outer_circle(node, options, graph_group) {
    var circle = graph_group.append("circle")
            .attr("class", "outside" + node[N_GROUP] + " movable")
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
                return "outline movable";
            })
            .attr("x", function () {
                return options.offset_graph_width-15;
            }) //Need to determine algorithm for determining this
            .attr("width", (options.size * 2) + options.offset_graph_width)
            .attr("y", function () {
                return options.offset_graph_height;
            })
            .attr("rx", options.graph_height/3)
            .attr("ry", options.graph_height/3)
            .attr("height", function () {
                return options.graph_height - (2 * options.offset_graph_height);
            })
            .attr("fill", "white");
}

function create_axis(node, options, graph_group) {
    var axisgroup = graph_group.append("g")
            .attr("class", "y axis movable")
            .attr("transform", function () {
                w = 0;
                return "translate(" + w + ",0)";
            })
            .call(options.yAxis)
            .append("text")
            .attr("y", -20)
            .attr("x", options.offset_graph_width + 40)
            .attr("dy", ".71em")
            .text(node[N_GROUP] + "   ID: " + (node[N_X] + 1));
}

function create_modal_axis(node, options, modal_group) {
    var axisgroup = modal_group.append("g")
        .attr("class", "y axis movable")
        .attr("transform", function () {
            w = 0;
            return "translate(" + w + ",0)";
        })
        .call(options.modalyAxis)
        .append("text")
        .attr("y", -20)
        .attr("x", options.offset_graph_width + 40)
        .attr("dy", ".71em")
        .text(node[N_GROUP] + "   ID: " + (node[N_X] + 1));
}

function create_bars(node, options, graph_group) {
    var num_bars = Object.keys(node[G_GRAPH]).length; //options.max_bar_count;
    var size = options.size;
    var y = options.y;
    var padding_x = (size/num_bars)/2 - 4;
    var outer_padding = 1;

    // Just to make it look nicer if there is only one bar
    if (num_bars == 1) {
        padding_x = size/6.0;
    }

    var bars = [];
    for (var bar in node[G_GRAPH]) {
        var bar_info = node[G_GRAPH][bar];
        if (bar_info[G_VALUE_BAR] > poag_options.graph.hist_bar_thresh) {
            bars.push(node[G_GRAPH][bar]);
        }
    }
    num_bars = Object.keys(bars).length;
    for (var bar in bars) {
        var bar_info = bars[bar];
        graph_group.append("rect")
                .attr("class", function () {
                    return "bar2 movable";
                })
                .attr("x", function () {
                    return outer_padding + (bar * (size / num_bars)); /* where to place it */
                }) //Need to determine algoritm for determining this
                .attr("width", (size / num_bars) - outer_padding/2)
                .attr("y", function () {
                    return y(bar_info[G_VALUE_BAR]/100.0);
                })
                .attr("height", function () {
                    // As the number is out of 100 need to modulate it
                    return options.graph_height - y(bar_info[G_VALUE_BAR]/100.0);
                })
                .attr("fill", options.colours[(bar_info[G_X_LABEL] == undefined) ? bar_info[G_LABEL] : bar_info[G_X_LABEL]]);


        graph_group.append("text")
                .attr("class", "y axis movable")
                .attr("x", function () {
                    return padding_x + bar * (options.size / num_bars);
                }) //Need to determine algorithm for determining this
                .attr("y", options.graph_height + 20)
                .text((bar_info[G_X_LABEL] == undefined) ? bar_info[G_LABEL] : bar_info[G_X_LABEL]);

    }
}

/**
 * create bar for graph that appears in the modal

 */

function create_modal_bars(node, options, modal_group) {
    var num_bars = Object.keys(node[G_GRAPH]).length; //options.max_bar_count;
    var size = options.size*2;
    var y = options.yModal;
    var padding_x = (size/num_bars)/2 - 6;;
    var outer_padding = 0.5;

    // Just to make it look nicer if there is only one bar
    if (num_bars == 1) {
        padding_x = size/6.0;
    }

    var bars = [];
    for (var bar in node[G_GRAPH]) {
        var bar_info = node[G_GRAPH][bar];
        if (bar_info[G_VALUE_BAR] > poag_options.graph.hist_bar_thresh) {
            bars.push(node[G_GRAPH][bar]);
        }
    }
    num_bars = Object.keys(bars).length;
    for (var bar in bars) {
        var bar_info = bars[bar];
        modal_group.append("rect")
            .attr("class", function () {
                return "bar2 movable";
            })
            .attr("x", function () {
                return bar*(2*outer_padding  + size / num_bars); /* where to place it */
            }) //Need to determine algoritm for determining this
            .attr("width", (size / num_bars) - 2*outer_padding)
            .attr("y", function () {
                return y(bar_info[G_VALUE_BAR]/100.0);
            })
            .attr("height", function () {
                // As the number is out of 100 need to modulate it
                return 2*options.graph_height - y(bar_info[G_VALUE_BAR]/100.0);
            })
            .attr("fill", options.colours[(bar_info[G_X_LABEL] == undefined) ? bar_info[G_LABEL] : bar_info[G_X_LABEL]]);


        modal_group.append("text")
            .attr("class", "y axis movable")
            .attr("x", function () {
                return (padding_x) + bar * (size / num_bars + 2*outer_padding);
            }) //Need to determine algorithm for determining this
            .attr("y", 2*options.graph_height + 20)
            .text((bar_info[G_X_LABEL] == undefined) ? bar_info[G_LABEL] : bar_info[G_X_LABEL]);

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
 * Create area that will be hoverable
 */

function create_hover_area(node, options, graph_group) {

    graph_group.append("circle")
        .attr("type", "button")
        .attr("data-toggle", "modal")
        .attr("data-target", "#resultsModal")
        .attr("class", function () {
            return "hoverArea btn btn-primary";
        })
        .attr("cx", options.size / 2 - 12)
        .attr("cy", options.size / 2 - 2)
        .attr("r", options.graph_outer_circle_radius*0.3)
        // .attr("height", function () {
        //     return options.graph_height*2.75;
        // })
        .attr("fill", "teal")
        .attr("opacity", 0)
        .attr("pointer-events", "fill");
}

/**
 * Create indicator pointing graph to appropriate node
 */

function create_pointer_line(node, options, graph_group) {

    var lineData = [{"x": (options.offset_graph_width), "y": 110},
                    {"x": (options.offset_graph_width+50), "y": 140},
                    {"x": (options.offset_graph_width+105), "y": 110}];

    var lineFunction = d3.svg.line()
                        .x(function(d) {
                            return d.x;
                        })
                        .y(function(d) {
                            return d.y;
                        })
                        .interpolate("linear");

    graph_group.append("path")
        .attr("class", function () {
            return "line movable";
        })
        .attr("d", lineFunction(lineData))
        .attr("stroke", "black")
        .style("stroke-dasharray", ("3, 3"))
        .attr("stroke-width", 2)
        .attr("fill", "none");
}


/**
 * helper function to create global unique identifiers
 * @returns {*}
 */
function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

/**
 * Creating the graphs
 */
create_new_graph = function (node, options, group, node_cx, node_cy) {
    //var node_cx = scale_x_graph(options, node[N_X]);
    //var node_cy = scale_y_graph(options, node.y) - options.graph_height / 2;
    options.metabolite_count++;
    var x_pos = node_cx + options.offset_graph_width;
    var y_pos = node_cy + options.offset_graph_height;
    var num_bars = options.max_bar_count;
    var hover_on = options.hover;

    var graph_group = group.append("g")
            .attr("id", guid())
            .attr("class", "graph modal-body")
            .attr('transform', 'translate(' + x_pos + "," + y_pos + ")")
            .attr("opacity", 0)
            .attr("pointer-events", "none")
            .on("mouseover", function () {
                if (hover_on) {
                    this.parentNode.appendChild(this);

                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr("transform", "translate("+x_pos+", "+(y_pos-100)+")")
                        .attr("opacity", 1)
                        .attr("end", function(){

                            d3.select(this).select(".hoverArea")
                                .attr("transform", "translate(0, "+(y_pos+100)+")")
                                .attr("opacity", 0);

                        });

                }
                // if (hover_on) {
                //     d3.select(this).attr("opacity", 1);
                // }
            })
            .on("mouseout", function () {
                if (hover_on) {
                    this.parentNode.appendChild(this);

                    d3.select(this)
                        .transition()
                        .delay(500)
                        .duration(300)
                        .attr("transform", "translate("+x_pos+", "+y_pos+")")
                        .attr("opacity", 0)
                        .each("end", function(){

                            d3.select(this).select(".hoverArea")
                                .attr("transform", "translate(0, "+(y_pos)+")")
                                .attr("opacity", 0);
                        });
                }
            })
            .on("click", function(d, i){
                if (hover_on) {
                    this.parentNode.appendChild(this);

                    var margin = {top: 20, right: 20, bottom: 30, left: 80};
                    var thisGroup = d3.select(this);
                    var groupId = d3.select(thisGroup).node().attr("id");


                    d3.selectAll("#usedModal").remove();
                    var modal_container = d3.select("#modalGraph")
                        .append("svg")
                        .attr("id", "usedModal")
                        .attr("width", 400)
                        .attr("height", 400)
                        .style("display", "block")
                        .style("margin", "auto");

                    var modal_group = modal_container.append("g")
                        .attr("opacity", 1)
                        .attr("x", 50)
                        .attr("y", 50)
                        .attr("transform", "translate(100, 50)scale(1.5)");

                    create_modal_axis(node, options, modal_group);
                    create_modal_bars(node, options, modal_group);

                    d3.select(this)
                        .transition()
                        .delay(500)
                        .duration(300)
                        .attr("transform", "translate("+x_pos+", "+y_pos+")")
                        .attr("opacity", 0)
                        .each("end", function(){

                            d3.select(this).select(".hoverArea")
                                .attr("transform", "translate(0, "+(y_pos)+")")
                                .attr("opacity", 0);
                        });
                    return modal_group

                }
            });


    create_hover_area(node, options, graph_group);
    create_outer_circle(node, options, graph_group);
    create_rect(node, options, graph_group);
    create_axis(node, options, graph_group);
    create_bars(node, options, graph_group);
    create_pointer_line(node, options, graph_group);
    return graph_group;
}



/**
 *
 * From http://www.bioinformatics.nl/~berndb/aacolour.html
 */
function formatMutants(node, poag) {

    if (node[N_TYPE] != "fused") {
        node[G_GRAPH] = {};
        if (graph.options.mutants.count > 0) {
            node[G_GRAPH] = node[G_MUTANTS];
        } else {
            node[G_GRAPH] = node[G_SEQ][G_CHARS];
        }
    } else {
        //adding number of poags fused
        node.npoags = poag.metadata.npoags;

        node["subtype"] = poag.metadata.subtype;
        //changing graph if fused marginal graph
        if (node.subtype == "marginal") {

            node.graph = {};
            node[G_GRAPH] = node[G_MUTANTS];

        }
    }
}



