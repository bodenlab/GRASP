


/**
 * Global variables
 */
var drawMutants = false;
var mutants = false;

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
    // Brush positions
    prevbrushStart: -1,
    prevbrushEnd: -1,
    retain_previous_position: false,
    // Mins and maxs
    min_x: 1000,
    max_x: 0,
    min_y: 1000,
    max_y: 0,
    // Current x coords visible in the window frame
    cur_x_max: 10,
    cur_x_min: 0,
    // SVG and group elements
    svgs: {},
    // Data
    root_poag_name: 'MSA',
    inferred_poag_name: 'Inferred',
    merged_poag_name: 'Merged',
    single: {
        names: ['MSA', 'Inferred', 'Merged'],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'single-',
        height: 200,
        margin: {left: 0, right: 0, top: 100, bottom: 0}
    },
    multi: {
        names: [],
        nodes: {},
        edges: {},
        raw: {},
        class_name: 'multi-',
        height: 250,
        margin: {left: 0, right: 0, top: 100, bottom: 0}
    }
};

var graph_array = []

var random = {"C": "#33CCFF", "S": "#A55FEB", "T": "#FF68DD", "Y": "#9A03FE", "Q": "#F900F9", "N": "#A27AFE", "H": "#7979FF", "K": "#86BCFF", "R": "#8CEFFD", "D": "#03F3AB", "E": "#4AE371", "I": "#FF8A8A", "L": "#FF5353", "M": "#FF9331", "V": "#FFCC33", "G": "#FF6600", "P": "#FF9999", "F": "#ff6666", "W": "#FF5353", "A": "#FF0033"};


/**
 * Style and size options relating to all POAGs and related visualisations.
 *
 * Includes:
 *      1. Graph            -> style of the historgram which displays on hover
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
        'Inferred': "#C83AFE",
        'Merged': "none",
    },
    root_node_fill: "#EA78F5",
    legend_rect: {
        width: 90,
        stroke_width: 0,
        stroke: "white",
        default_opacity: 1,
        text_padding: 10,
    },

    display: {
        margin_between_single_multi: 50,
        colours: random,
        number_of_edges_to_be_interesting: 2, // Min number of edges to consider it interesting
        interesting_many_edges_colour: "Crimson",
        diff_colour: "SlateGrey",
        diff_opacity: 0.3,
        num_start_nodes : 10,// How many nodes that it starts with
    },
    style: {
        /******** Options for Sizing *****************************************/
        height: 2000,
        width: 2000,    // Default width gets overridden
        margin: {top: 100, left: 200, bottom: 0, right: 10},
        poagColours: {},
        /*********** End of sizing options **********************************/
        background_colour: "white",
        background_stroke_colour: "grey",
        background_stroke_width: "1px",
        stroke_width: "3px",
        font_size: "12px",
        font_family: "Gill Sans, sans-serif",
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
        height: 30,
        margin: {top: 100, left: 60, bottom: 50, right: 10},
    },
    position: {
        text_padding: 10,   // How high above the mini it will appear
        level_1: 1,         // Means that we will draw a position for every node
        level_2: 5,         // We will draw a position at every 5 nodes
        level_3: 10,        // Draw position at every 10
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
    },
    /**************** Options for style of the edges between nodes **********************/
    edge: {
        y_curve_amount: 13,
        stroke_width: 3,
        stroke: "grey",
        opacity: 0.5,
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
        draw_position_in_histogram: true, // Draws the position as a title above the node
        x_size: 150, // Multiplication factor for positions
        y_size: 100,
        y_start: 400,
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
        offset_graph_height: -30,
        width: 80,
        div_factor: 1,
        graph_height: 70,
        max_height: 10,
        max_bar_count: 2,
        hover: true,
        metabolite_count: 0,
        display_label_text: false, // true means display the label text below the MSA graph
        display_axis_text: true, // Text on the axis (as in the numbers on the y axis)
        draw_axis: true // Whether or not to draw the y axis
    },
    /********** Data ***************************************************/
    data: {
        raw_svg_id: "",
        target: "",
    }
};




/**
 * Runs through the setup of the data and the vis.
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

    // Process_data
    poags = process_poags(json_str, poags, set_inferred, set_msa, set_merged, name);

    // Create the SVG element
    poag = setup_poag_svg(poags, set_msa || set_inferred);

    // Make the scales
    poags = setup_poag_scales(poags);

    // Setup the mini brush
    poags = setup_brush(poags);

    poags = draw_all_poags(poags);


}



/**
 * Directs the drawing of the POAGs.
 *
 * Includes all the single POAGs (e.g. MSA, inferred, merged)
 * and the Joint or marginal added poags.
 *
 */
var draw_all_poags = function(poags) {
    // For each of the poags draw the nodes, pass in the group
    // to append to.
    // Draw the mini msa first
    draw_mini_msa(poags);

    for (var p in poags.single.names) {
        var poagPi = false;
        var poag_name = poags.single.names[p];
        var nodes = poags.single.nodes[poag_name];
        var edges = poags.single.edges[poag_name];
        var group = poags.groups.single[poag_name];
        var scale_y = poags.scale['single_y'];
        var colour = poags.options.names_to_colour[poag_name];

        if (poag_name == poags.merged_poag_name) {
            poagPi = true;
        }
        if (nodes != undefined) {
            var height = poags.single.height - poags.single.margin.top/2;
            draw_legend_rect(poags, nodes[0], group, height, scale_y, colour);
            draw_poag(poags, poag_name, nodes, edges, scale_y, group, poagPi);
        }
    }

    for (var p in poags.multi.names) {
        var poag_name = poags.multi.names[p];
        var nodes = poags.multi.nodes[poag_name];
        var edges = poags.multi.edges[poag_name];
        var group = poags.groups.multi[poag_name];
        var scale_y = poags.scale['multi_y'];
        var poagPi = false;
        var colour = poags.options.names_to_colour[poag_name];

        if (nodes != undefined) {
            var height = poags.single.height - poags.single.margin.top/2;
            draw_legend_rect(poags, nodes[0], group, height, scale_y, colour);

            draw_poag(poags, poag_name, nodes, edges, scale_y, group, poagPi);
        }
    }
    return poags;
}


/**
 * Redraws the POAG elements.
 */
var redraw_poags = function() {
    var extent = poags.brush.extent();
    poags.cur_x_min = extent[0];
    poags.cur_x_max = extent[1];
    poags = update_x_scale(poags);
    var group = poags.group;

    group.selectAll("path").remove();
    group.selectAll("circle").remove();
    group.selectAll("text").remove();
    group.selectAll("rect.mini").remove();
    poags = draw_all_poags(poags);
}


/**
 * Sets the brush x coords.
 * http://bl.ocks.org/bunkat/1962173
 */

function moveBrush() {
    var brush = poags.brush;
    var origin = d3.mouse(this)
            , point = poags.scale.mini_x.invert(origin[0])
            , halfExtent = (brush.extent()[1] - brush.extent()[0]) / 2
            , start = point - halfExtent
            , end = point + halfExtent;

    graph.brush.extent([start, end]);
    prevbrushStart = start;
    prevbrushEnd = end;
    poags.retain_previous_position = true;
    redraw_poags();
}

/**
 * Sets up the brush element.
 *
 * https://stackoverflow.com/questions/22873551/d3-js-brush-controls-getting-extent-width-coordinates
 */
var setup_brush = function (poags) {

    poags.groups.mini.append('rect')
            .attr('pointer-events', 'painted')
            .attr('width', poags.options.style.width)
            .attr('height', poags.options.mini.height)
            .attr('visibility', 'hidden')
            .on('mouseup', moveBrush);

    var brush = d3.svg.brush()
        .x(poags.scale.mini_x)
        .extent([0, poags.options.display.num_start_nodes])
        .on("brush", redraw_poags);

    poags.groups.mini.append("g")
        .attr("class", "x brush")
        .call(brush)  //call the brush function, causing it to create the rectangles
    .selectAll("rect") //select all the just-created rectangles
        .attr("y", -10)
        .attr("fill",  poags.options.mini.fill)
        .attr("opacity", poags.options.mini.opacity)
        .attr("height", (poags.options.mini.height * poags.max_y) + 20); //set their height

    poags.brush = brush;
    return poags;
}

/**
 * Draws POAG.
 */
var draw_poag = function (poags, poag_name, nodes, edges, scale_y, group, poagPi) {
    for (var e in edges) {
        var edge = edges[e];
        if (edge.from.x >= poags.cur_x_min - 1 && edge.to.x <= poags.cur_x_max + 1) {
            draw_edges(poags, edge, group, scale_y);
        }
    }

    for (var n in nodes) {
        var node = nodes[n];
        var node_cx = poags.scale.x(node.x);
        var node_cy = scale_y(node.y);
        if (node.x >= poags.cur_x_min && node.x <= poags.cur_x_max) {
            var radius = draw_nodes(poags, node, group, node_cx, node_cy);
            if (poag_name == poags.root_poag_name || poagPi) {
                draw_pie(poags, node, group, radius, poagPi, node_cx, node_cy);
                // if it is a merged node, we want to draw a layered Pie chart
                // so we set poagPi to false and re draw a smaller pie chart with
                // the proper colours.
                if (poagPi) {
                    draw_pie(poags, node, group, radius, false, node_cx, node_cy);
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

    // If it is the first time running we want to set the MSA data otherwise
    // we reuse the already processed MSA.
    if (set_msa) {
        poags.single.raw.msa = data.top;

        poags = process_msa_data(poags);

        poags = process_edges(poags, data.top, poags.root_poag_name, inferred);
    }

    poags = process_poag_data(poags, data.bottom, name, inferred, merged);

    poags = process_edges(poags, data.bottom, name, inferred, merged);

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
 *                  if the infered graph contains the node.
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

    if (inferred || merged) {
        poags.single.nodes[name] = [];
    } else {
        poags.multi.nodes[name] = [];
        poag.multi.names.push(name);
    }

    for (var n in raw_poag.nodes) {
        var node = raw_poag.nodes[n];

        // Get the msa node as to get the x coords.
        var msa_node = poags.node_dict[root_name + '-' + node.id]
        node.name = name;
        node.mutant = false;
        node.type = raw_poag.metadata.type;
        node.unique_id = name + '-' + node.id;
        poags = update_min_max(node.x, node.y, poags);

        // Set that this msa node wasn't deleted during inference
        // Only set if the poag name is 'inferred'
        if (inferred || merged) {
            msa_node.deleted_during_inference = false;
            poags.single.nodes[name].push(node);
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

    if (inferred || merged) {
        poags.single.edges[name] = [];
    } else {
        poags.multi.edges[name] = [];
    }

    for (var e in edges) {
        var edge = edges[e];
        var reduced_edge = {};
        // From node
        reduced_edge.from = poags.node_dict[name + '-' + edge.from];
        // Node after from node, used to determine curvature of the
        // edge.
        //reduced_edge.next = poags.node_dict[name + '-' + edge.from + 1];
        // To node
        reduced_edge.to = poags.node_dict[name + '-' + edge.to];

        reduced_edge.name = name;

        if (inferred || merged) {
            poags.single.edges[name].push(reduced_edge);
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
var setup_poag_svg = function (poags, set_msa) {
    var options = poags.options;
    var width = options.style.width;
    var margin = options.style.margin;

    // Calculate the total height of the SVG element based
    // on the number of POAGs which are to be displayed.
    var single_height = poags.single.names.length * (poags.single.height);
    var multi_height = poags.multi.names.length * (poags.multi.height);
    var mini_height = options.mini.height + options.mini.margin.top + options.mini.margin.bottom;
    var height = single_height + multi_height + mini_height + margin.top;

    // If we are resetting the SVG element we want to add a svg otherwise
    // we just use the existing svg element
    if (d3.select("svg")) {
        d3.select("svg").remove();
    }

    var svg = d3.select(options.data.target)
        .append("svg")
        .attr("viewBox", "0 0 " + width + " " + height )
        .classed("svg-content", true);
    poags.groups = {'single': {}, 'multi': {}};

    var group = svg.append('g')
            .attr('transform', 'translate(' + 0 + ',' + margin.top + ')')

    group.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height);

    var mini = group.append('g')
            .attr('transform', 'translate(' + margin.left/2 + ',' + 0 + ')')
            .attr('width', width)
            .attr('height', options.mini.height)
            .attr('class', 'mini');

    poags.groups.mini = mini;

    // Make a group for each of the individual POAGs
    for (var n in poags.single.names) {
        var name = poags.single.names[n];
        var tmp_group = group.append('g')
            .attr('transform', 'translate(' + margin.left/2 + ',' + (
                (n * poags.single.height) + mini_height) + ' )')
        poags.groups.single[name] = tmp_group;
    }

    // Make a group for each of the multi POAGs
    for (var n in poags.multi.names) {
        var name = poags.multi.names[n];
        var tmp_group = group.append('g')
            .attr('transform', 'translate(' + margin.left/2 + ',' + (
                (n * (poags.multi.height)) +
                    poags.options.display.margin_between_single_multi + single_height
                    + mini_height) + ' )')
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

    group.append('circle')
        .attr("class", 'node-' + node.name)
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
             .attr("class", "ptext")
             .attr("id", "ptext-" + node.unique_id)
             .attr('x', node_cx)
             .attr('y', function () {
                   var tmp = node_cy + node_opt.text_padding;
                   return tmp;
             })
             .attr("text-anchor", "middle")
             .attr("stroke-width", node_opt.stroke_width)
             .style("font-family", poags.options.style.font_family)
             .style("font-size", poags.options.style.text_size)
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
    var y_scale = poags.scale.mini_y;
    var group = poags.groups.mini;
    var nodes = poags.single.nodes[poags.root_poag_name];

    for (var n in nodes) {
        var node = nodes[n];
        var line_y = (y_scale(node.y) + (y_scale(node.y + 1)) / 2);
        var line_x = x_scale(node.x);
        line_points.push(combine_points(line_x, line_y));

        if (node.num_out_edges > options.number_of_edges_to_be_interesting) {
            var rect = group.append("rect")
                    .attr("class", "mini")
                    .attr('x', line_x)
                    .attr('y', function () {
                        var tmp = y_scale(0); // Have it at the top
                        return tmp;
                    })
                    .attr('width', 2 * mini_opt.radius)
                    .attr('height', mini_opt.height * poags.max_y )
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
                    .attr('r', mini_opt.radius)
                    .attr("opacity", options.diff_opacity)
                    .attr("fill", options.interesting_many_edges_colour);

            circle.moveToBack();
        }
        if (drawMutants && mutants > 0 && node.inferred == true && node.mutants.chars.length > 1) {
            var tri = group.append("path")
                    .attr('transform', 'translate(' + (line_x - mini_opt.x_padding) + ',' + (y_scale(0) - 10) + ')')
                    .attr("d", d3.svg.symbol().type("triangle-down"))
                    .attr("opacity", 0.7)
                    .attr("fill", "black");

            tri.moveToBack();
        }

    }

    var path = group.append("path")
            .attr("d", line_function(line_points))
            .attr("class", "edge")
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

    y_start = scale_y(edge.from.y);
    y_end = scale_y(edge.to.y);
    //y_next = scale_y(edge.next.y);
    y_mid = y_start - ((y_start - y_end) / 2);

    // If y start and y end are the same we want a nice curve
    var y_jump_buffer = same_level_buffer * x_diff;

    line_points.push(combine_points(x_start, y_start));

    // Add the curve in
    if  (y_end == y_start) {// || y_next > y_start) {
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

    group.append("path")
        .attr("d", line_function(line_points))
        .attr("class", 'edge-' + edge.name)
        .attr("id", 'edge-' + edge.from.unique_id + '-' + edge.to.unique_id)
        .attr("stroke-width", edge_opt.stroke_width)
        .attr("stroke", edge_opt.stroke)
        .attr("opacity", edge_opt.opacity)
        .attr("fill", "none")
        .attr("marker-mid", "url(#triangle-end)");

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
var draw_legend_rect = function (poags, node, group, height, scale_y, colour) {
    var rect_opt = poags.options.legend_rect;
    var node_cx = poags.scale.x(node.x);
    var node_cy = scale_y(node.y);

    group.append('rect')
        .attr("class", 'rect-' + node.name)
        .attr("id", "rect-" + node.unique_id)
        .attr('x', node_cx - poags.options.style.margin.left/2)
        .attr('y', node_cy - height/2)
        .attr('width', rect_opt.width)
        .attr('height', height)
        .attr("stroke-width", rect_opt.stroke_width)
        .attr("stroke", rect_opt.stroke)
        .attr("opacity", rect_opt.default_opacity)
        .attr("fill", colour);

    group.append("text")
         .attr("class", "rtext")
         .attr("id", "rtext-" + node.unique_id)
         .attr('x', node_cx - poags.options.style.margin.left/2 + 10)
         .attr('y', function () {
               var tmp = node_cy + rect_opt.text_padding - height/4;
               return tmp;
         })
         .attr("text-anchor", "start")
         .attr("stroke-width", rect_opt.stroke_width)
         .style("font-family", poags.options.style.font_family)
         .style("font-size", poags.options.style.text_size)
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

    if (radius < options.node.min_radius || poags.max_seq_len > options.pie.max_seq_len) {
        stroke_width = 0;
    }

    //making pi slightly larger for poagPi, to create ring effect for fused pi chart
    if (poagPi) {
	    radius += 5;
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

    var pie_data = node.seq.chars;
    radius -= 10;

    if (options.mutants.count > 0) {
        pie_data = node.mutants.chars;
    } else if (node.seq.hasOwnProperty("poagValues")) {
    	//binding the poag data since fused poag type
	    var pie_data = node.seq.poagValues;
        radius += 10;
    }

    var arc = pie_group.selectAll(".arc")
            .data(pie(pie_data))
            .enter().append("g")
            .attr("class", "arc");

    arc.append("path")
            .attr("class", "pie")
            .attr("d", path_pie)
            .attr("stroke-width", pie_opt.stroke_width)
            .attr("stroke", pie_opt.stroke)
            .attr("fill", function (d, i) {
                //"poag" in data suggest fused type pi should be draw
                if (!d.data.hasOwnProperty("poag")){
                    return options.display.colours[(d.data.label)];

                } else {
                    if (!poagPi){
                        if (d.data.label != "0"){
                        //other labels in the inner fused pi chart
                            return options.display.colours[(d.data.label)];
                        } else {
                            //the white slice in inner fused pi chart
                            return "white";
                        }
                    } else {
                        //draws for outter ring in fused node
                        return colors[(d.data.poag)];
                    }
                }
            });

    // Don't want to append text if it is smaller than the min radius
    if (radius > options.node.min_radius && node.seq.chars.length>1) {
	    //array to store labels already added
	    var labelsAdded = [];
        arc.append("text")
                .attr("class", "pie")
                .attr("transform", function (d) {
                    return "translate(" + label_pie.centroid(d) + ")";
                })
                .style("fill", function (d) {
                    return getNodeTextColour(options.display.colours[(d.data.label)]);
                })
                 .attr("stroke-width", options.node.stroke_width)
                 .style("font-family", options.style.font_family)
                 .style("font-size", options.style.text_size)
                 .attr("dy", "0.35em")
                 .attr("text-anchor", "middle")
                 .text(function (d) {
		            if (d.data.label != "0" && labelsAdded.indexOf(d.data.label) == -1) {
			            labelsAdded.push(d.data.label);
                        return d.data.label;
                    } else{
			            return "";
		            }
                });
    } else{
	    //Appending single big label to node if in consensus
	    group.append("text")
             .attr("class", "ptext")
             .attr("id", "ptext-" + node.unique_id)
             .attr('x', node_cx)
             .attr('y', function () {
                   var tmp = node_cy + options.node.text_padding;
                   return tmp;
             })
             .attr("text-anchor", "middle")
             .attr("stroke-width", options.node.stroke_width)
             .style("font-family", options.style.font_family)
             .style("font-size", options.style.text_size)
             .attr("stroke", function () {
                    return getNodeTextColour(options.display.colours[(node.label)]);
             })
             .text(node.label);
    }
}


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




/**
 * Refresh the graph to be the latest reconstructed
 */
var refresh_graphs = function() {
    d3.select(".svg-content").remove();
    retain_previous_position = true;
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
setup_graph_overlay = function (options) {
    var svg = options.svg_overlay; //d3.select(document.getElementById(options.svg_id));
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

    options.x = x;
    options.y = y;
    options.xAxis = xAxis;
    options.yAxis = yAxis;
}

function create_outer_circle(node, options, graph_group) {
    var circle = graph_group.append("circle")
            .attr("class", "outside")
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
            }) //Need to determine algoritm for determineing this
            .attr("width", (options.size * 2) + options.offset_graph_width)
            .attr("y", function () {
                return options.offset_graph_height;
            })
            .attr("height", function () {
                return options.graph_height - (2 * options.offset_graph_height);
            });
}

/**
 * Adds a title to the chart
 */
function create_node_title(node, options, graph_group) {
    var title = graph_group.append("text")
             .attr("y", -10)
             .attr("x", options.width /2 - 10)
             .style("font-size", "15px")
             .style("font-weight", "700")
             .style("text-anchor", "center")
             .text(node.start);
}

function create_axis(node, options, graph_group) {
    var axisgroup = graph_group.append("g")
            .attr("class", "y axis")
            .attr("transform", function () {
                w = 0;
                return "translate(" + w + ",0)";
            })
            .call(options.yAxis);
    // Conditionally displays the axis text (i.e. the tags on the axis)
    if (options.display_axis_text == true) {
         axisgroup.append("text")
             .attr("y", -10)
             .attr("x", options.offset_graph_width + 25)
             .attr("dy", ".71em")
             .text(node.name);
    }
}

function create_bars(node, options, graph_group) {
    var num_bars = Object.keys(node.graph.bars).length; //options.max_bar_count;
    var size = options.size;
    var y = options.y;
    var padding_x = 0;
    var outer_padding = 1;
    var formatDetails = [num_bars, size, y, padding_x, outer_padding];

    // Just to make it look  nicer if there is only one bar we want it to look nicer
    if (num_bars == 1) {
        padding_x = size/6.0;
    }
    var bar_sum = 0;
    for (var bar in node.graph.bars) {
        bar_info = node.graph.bars[bar];
        bar_sum += bar_info.value;
    }
    for (var bar in node.graph.bars) {
        bar_info = node.graph.bars[bar];

	//if has poagValues indicates need to draw stacked bar for fused graph
	if (!bar_info.hasOwnProperty("poagValues")){
	    create_bar(bar, bar_info, bar_sum, formatDetails, options, graph_group);

	} else {

	    create_stackedbar(bar, bar_info, bar_sum, formatDetails, options, graph_group);
	}

    // Conditionally displays the labels at the bottom as text
    if (options.display_axis_text == true) {
        graph_group.append("text")
                .attr("class", "y axis")
                .attr("x", function () {
                    return (2 * padding_x) + bar * (options.size / num_bars);
                }) //Need to determine algoritm for determineing this
                .attr("y", options.graph_height + 10)
                .text(bar_info.label);
        }
    }
}


/*
* Creates a stacked bar from the poag info for a fused graph
*/
function create_stackedbar(bar, bar_info, bar_sum, formatDetails, options, graph_group){
    var num_bars = formatDetails[0]; //options.max_bar_count;
    var size = formatDetails[1];
    var y = formatDetails[2];
    var padding_x = formatDetails[3];
    var outer_padding = formatDetails[4];

    //keeping track where to put the next bar
    var previousY = 0;

    var subVals = bar_info.poagValues;
    i = 0;

    var colors = graph.options.poagColours;
    for (var subVal in subVals) {

	var heightValue = y(subVals[subVal]/100);
	previousY = y((subVals[subVal])*(i+1)/100);

	graph_group.append("rect")
                .attr("class", function () {
                    return "bar";
                })
                .attr("x", function () {
                    return outer_padding + padding_x + (bar * (size / num_bars)); /* where to place it */
                }) //Need to determine algoritm for determineing this
                .attr("width", (size / num_bars) - (3 * padding_x) - outer_padding/2)
                .attr("y", function () {
                    return previousY;
                })
                .attr("height", function () {
                    // As the number is out of 100 need to modulate it
                    return options.graph_height - heightValue;
                })
                .attr("fill", colors[subVal]);

	i++;
    }
}

/*
* Creates a single bar for an inputted bar object from an unfused poag
*/
function create_bar(bar, bar_info, bar_sum, formatDetails, options, graph_group) {
    var num_bars = formatDetails[0]; //options.max_bar_count;
    var size = formatDetails[1];
    var y = formatDetails[2];
    var padding_x = formatDetails[3];
    var outer_padding = formatDetails[4];

    graph_group.append("rect")
                .attr("class", function () {
                    return "bar";
                })
                .attr("x", function () {
                    return outer_padding + padding_x + (bar * (size / num_bars)); /* where to place it */
                }) //Need to determine algoritm for determineing this
                .attr("width", (size / num_bars) - (3 * padding_x) - outer_padding/2)
                .attr("y", function () {
                    return y(bar_info.value/bar_sum);
                })
                .attr("height", function () {
                    // As the number is out of 100 need to modulate it
                    return options.graph_height - y(bar_info.value/bar_sum);
                })
                .attr("fill", graph.options.display.colours[bar_info.label]);
}

/**
 * Apply's transforms to the group to emmulate any wrappers that the user has
 * in their SVG
 */
function apply_transforms(node, options) {
    var svg  = options.svg_overlay;
    var graph_group = svg.append("g");
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
create_new_graph = function (node, options, cx, cy) {
    // NEED TO UPDATE THESE OFFSETS IN THE OPTIONS BAD TO HAVE HARD CODED
    var node_cx = cx - 18;//scale_x_graph(options, node.x);
    var node_cy = cy - 25;//scale_y_graph(options, node.y) - options.graph_height / 2;
    options.metabolite_count++;
    var num_bars = options.max_bar_count;
    var svg  = options.svg_overlay;
    var hover_on = options.hover;
    var graph_group = svg.append("g")
            .attr("class", "graph")
            .attr('transform', 'translate(' + node_cx + "," + node_cy + ")")
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
    setup_graph_overlay(options);
    create_outer_circle(node, options, graph_group);
    create_rect(node, options, graph_group);
    // Conditionally draw the axis
    if (options.draw_axis == true) {
        create_axis(node, options, graph_group);
    }
    if (options.draw_position_in_histogram == true) {
        create_node_title(node, options, graph_group);
    }

    create_bars(node, options, graph_group);
    return graph_group;
}


