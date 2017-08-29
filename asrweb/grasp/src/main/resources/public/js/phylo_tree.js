/**
 * New version of the Phylo tree for GRASP
 * @ariane.mora 29/06/2017
 */

var phylo_options = {
    svg_info: {
        div_id: "", // The ID of the div you want to draw the graph in.
        width: 1500,
        height: 300,
        margin: {top: 50, left: 50, bottom: 50, right: 150},
        stroke: "#AEB6BF",
        stroke_width: "1px",
        number_aixs_ticks: 10,
    },
    tree: {
        longest_distance_from_root_to_extent: 0,
        extant_label_height: 200,
        collapse_under: null,
        selected_node: null,
        all_nodes: new Array(),
        all_branches: new Array(),
        node_depth_dict: {}, // keeps track of the depth of each node
        extents: new Array(),
        min_x: 0,
        additive: true, // Whether or not we want to display the branches as additive
        node_instep: 0,
        root: null,
        node_dict: {}, // Keeps track of the node IDs as a dict
        // So we can easily keep track of the children nodes when we're updating
        // the tree's collapsed nodes
        node_count: 0 // Used to assign IDs to the nodes.
    },
    legend: {
        width: 20,
        height: 100,
        top_colour: "#3C6AC4",
        bottom_colour: "#F7FBFF",
        colours: ["#3C6AC4", "#F7FBFF"],
    },

    // Options for node style
    // Extent options are for the extent sequences 
    // node prefex is for internal node style
    style: {
        extent_radius: 5,
        node_radius: 5,
        hover_radius: 20,
        under_node_multiplier: 1.1,
        /** 
         * There is a "white" node under each 
         * normal node -> allows us to change the opacity to view the text without
         * interfering with hover events. 
         **/
        // --------------- Fills --------------------//
        root_node_fill: "black",
        extent_fill: "white",
        hover_fill: "#D77DE3",
        // --------------- Strokes ------------------//
        stroke: "#7F74F3",
        under_stroke: "white",
        stroke_width: "2px",
        branch_stroke_width: "1px",
        branch_stroke: "#AEB6BF",

        // ---------------- Opacity ----------------//
        opacity: 1,
        extant_label_opacity: 0.1,

        // ----------------- Text ------------------//
        font_family: "Varela Round, sans-serif",
        font_size: "10px",
        font_colour: "#24232d",

        // ---------------- Context menu style ----//
        contextmenu_fill: "#F0F8FF",
        contextmenu_hover_fill: "#FCDFFF",
        // --------------- Action styles ----------//
        /** 
         * The colour for when a user selects to perform a reconstruction
         * it will be shaded based on how "far" the node is from the root
         */
        select_colour: "#EA78F5",
    }
}


/**
 * The context menu, has the names for the events that a user can perform.
 */
var menu = contextMenu().items('View marginal reconstruction', 'View joint reconstruction', 'Add joint reconstruction', 'Collapse subtree', 'Expand subtree');


/**
 * Makes the tree scale
 */
var make_tree_scale = function (phylo_options) {
    var additive = phylo_options.tree.additive;

    var max_y = phylo_options.tree.max_depth;
    if (additive) {
        max_y = phylo_options.tree.longest_distance_from_root_to_extent;
    }

    var y_scale = d3.scale.linear()
            .domain([0, max_y])
            .range([0, phylo_options.svg_info.height]);

    var y_axis = d3.svg.axis()
            .scale(y_scale)
            .orient("left")
            .ticks(6);

    var x_scale = d3.scale.linear()
            .domain([phylo_options.tree.min_x - 2, phylo_options.tree.max_x])
            .range([phylo_options.legend.width + phylo_options.svg_info.margin.left, phylo_options.svg_info.width]);


    var legend = phylo_options.svg.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");

    legend.append("stop").attr("offset", "0%").attr("stop-color", phylo_options.legend.top_colour).attr("stop-opacity", 1);

    legend.append("stop").attr("offset", "100%").attr("stop-color", phylo_options.legend.bottom_colour).attr("stop-opacity", 1);

    phylo_options.group.append("rect")
            .attr("width", phylo_options.legend.width)
            .attr("x", 25)
            .attr("y", 0)
            .attr("height", phylo_options.svg_info.height)
            .style("fill", "url(#gradient)")

    phylo_options.group.append("g")
            .attr("class", "axis")
            .attr("stroke", phylo_options.branch_stroke)
            .attr("transform", "translate(" + 30 + ",0)")
            .call(y_axis)

    phylo_options.legend.colour_scale = d3.scale.linear()
            .domain(linspace(0, phylo_options.svg_info.height, 2))
            .range(phylo_options.legend.colours);


    phylo_options.y_scale = y_scale;
    phylo_options.x_scale = x_scale;
    return phylo_options;
}


/**
 * Helper function for the scaling from:
 * https://bl.ocks.org/starcalibre/6cccfa843ed254aa0a0d
 */
function linspace(start, end, n) {
    var out = [];
    var delta = (end - start) / (n - 1);

    var i = 0;
    while (i < (n - 1)) {
        out.push(start + (i * delta));
        i++;
    }

    out.push(end);
    return out;
}


/**
 * Creates the SVG element
 *
 */
var setup_phylo_svg = function (phylo_options) {
    var tree_div = phylo_options.svg_info.div_id;

    var options = phylo_options.svg_info;
    var width = poags.options.style.width;

    var svg = d3.select(options.div_id).append("svg")
            .attr("width", width + options.margin.left + options.margin.right)
            .attr("height", options.height + options.margin.top + options.margin.bottom);

    phylo_options.svg_info.height = options.height + options.margin.top + options.margin.bottom;
    phylo_options.svg = svg;

    return phylo_options;
}

var resize_phylo_height = function() {
    for (var e in phylo_options.tree.extents) {
        if (phylo_options.tree.extents[e].name.length*7 > phylo_options.tree.extant_label_height) {
            phylo_options.tree.extant_label_height = phylo_options.tree.extents[e].name.length*7;
        }
    }
    phylo_options.svg.attr("height", phylo_options.svg_info.height + phylo_options.tree.extant_label_height);
    phylo_options.legend.height = phylo_options.svg_info.height + 0.25*phylo_options.tree.extant_label_height;

}

/**
 * Appends a circle to the group element.
 * This is the node which the user will interact with i.e.
 * hover events and click events are attached to this node.
 *
 * Parameters:
 *      group:  the group which the node is appended to.
 *
 *      node:   contains information about the node, i.e. 
 *              name, x and y coords.
 *
 *      n:      a number associated with this node -> used as
 *              the identifier as the name may contain illegal
 *              characters.
 */
var draw_phylo_circle = function (group, node, n) {
    var options = phylo_options.style;

    group.append("circle")
        .attr("id", node.id)
        .attr("name", node.name)
        .attr("class", function() {
            if (node.extent) {
                return "extent";
            } else {
                return "node";
            }
        })
        .attr("cx", node.x)
        .attr("cy", node.y)
        .attr("r", function(d) {
            if (node.extent) {
                return options.extent_radius;
            } else {
                return options.node_radius;
            }
        })
        .attr("fill", function(d) {
            if (node.extent) {
                return options.extent_fill;
            }
            if (node.name === phylo_options.tree.selected_node.name) {
                return options.select_colour;
            }
            if (node.root_node) {
                return options.root_node_fill;
            }
            else {
                return phylo_options.legend.colour_scale(node.y);
            } 
        })  
        .attr("stroke", options.stroke)
        .attr("opacity",function() {
            if (node.extent) {
                return 0;
            } else {
                return options.opacity;
            }
        })
        .attr("stroke-width", options.stroke_width)
        .on("mouseover", function() {
            var node_selected = d3.select(this);
            // call function to update components
            on_node_mouseover(node_selected);
        })
        .on("mouseout", function() {
            var node_selected = d3.select(this);
            // update components
            on_node_mouseout(node_selected);
        })
        .on("contextmenu", function() {
            var node_name = d3.select("#text-" + d3.select(this).attr("id")).attr("name");
            var node_id = d3.select(this).attr("id");
            var node_fill = phylo_options.legend.colour_scale(node.y);
            d3.event.preventDefault();
            if (!node.extent){
                menu(d3.mouse(this)[0], d3.mouse(this)[1], node_name, node_fill, node_id);
            }
        });
}

/**
 * Appends node text to the group element.
 *
 * Parameters:
 *      group:  the group which the node is appended to.
 *
 *      node:   contains information about the node, i.e. 
 *              name, x and y coords.
 *
 *      n:      a number associated with this node -> used as
 *              the identifier as the name may contain illegal
 *              characters.
 */
var draw_phylo_text = function (group, node, n) {
    var options = phylo_options.style;
    var class_label = "node";
    var deg = 0;
    var x = node.x;
    var y = node.y;
    if (node.extent) {
        class_label = "extent";
        deg = 90;
    }
    group.append("text")
        .attr("id", "text-" + node.id)
        .attr("class", class_label)
        .attr("name", node.name)
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("fill", options.font_colour)
        .attr("text-anchor", function() {
            if (node.extent) {
                return "start";
            } else {
                return "middle";
            }
        })
        .attr("opacity", function () {
            if (node.extent) {
                return phylo_options.style.extant_label_opacity;
            } else {
                return 0;
            }
        })
        .attr("transform", "translate(" + x + "," + y + ") rotate(" + deg + ") translate(2,2)")
        .text(function() {
            if (node.extent) {
                return node.name;
            } else {
                return node.name.split("_")[0];
            }
        });
}

/**
 * Appends a circle to the group element to allow for the 
 * opacity of the node to change without interfering with
 * user triggered events.
 *
 * Parameters:
 *      group:  the group which the node is appended to.
 *
 *      node:   contains information about the node, i.e. 
 *              name, x and y coords.
 *
 *      n:      a number associated with this node -> used as
 *              the identifier as the name may contain illegal
 *              characters.
 */
var draw_phylo_under_circle = function (group, node, n) {
    var options = phylo_options.style;

    group.append("circle")
            .attr("id", "circle-" + node.id)
            .attr("class", function () {
                if (node.extent) {
                    return "extent";
                } else {
                    return "node";
                }
            })
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", function (d) {
                if (node.extent) {
                    return options.extent_radius * options.under_node_multiplier;
                } else {
                    return options.node_radius * options.under_node_multiplier;
                }
            })
            .attr("fill", "white")
            .attr("stroke", options.under_stroke)
            .attr("opacity", function() {
                if (node.extent) {
                    return 0;
                } else {
                    return options.opacity;
                }
            })
            .attr("stroke_width", options.stroke_width);
}



/**
 * Draws the nodes for the phylo tree.
 * Calls other functions to draw each componenet ->
 * itterates through the list of all nodes.
 *
 * Parameters:
 *      phylo_options: a list of options available to the
 *              user, used to keep styling out of css.
 */
var draw_phylo_nodes = function (phylo_options, initial) {
    var group = phylo_options.group;
    for (var n in phylo_options.tree.all_nodes) {
        var node = phylo_options.tree.all_nodes[n];
        // Check if this node is collapsed
        if (initial || phylo_options.tree.node_dict[node.id].collapsed != true) {
            // Add a white under circle to make it pretty
            draw_phylo_under_circle(group, node, n);

            // Add the node label
            draw_phylo_text(group, node, n);

            // Add the node which has the colour for extents and the
            // function for hover
            draw_phylo_circle(group, node, n);
        }
    }
}

/**
 * Changes the node text to be visible when a user hovers over a node.
 * Also updates the node to increase in size so it is obvious which node is being selected.
 *
 * Parameter: 
 *      node_selected: d3 node object, contains styling and coords etc.
 */
var on_node_mouseover = function (node_selected) {
    var options = phylo_options.style;
    var view_node_labels = document.getElementById('node-text-toggle').innerHTML.split(" | ")[1] == "ON";
    if (node_selected.attr("class") == "extent"){
        d3.select("#text-" + node_selected.attr("id")).attr("opacity", 1);
    }
    if (!view_node_labels && node_selected.attr("class") == "node"){
        node_selected.attr("r", options.hover_radius);
        node_selected.attr("fill", options.hover_fill);
        node_selected.attr("opacity", 0.2);
        node_selected.attr("stroke-width", "0px");
        d3.select("#text-" + node_selected.attr("id")).attr("opacity", 1);
    }
}

/**
 * Changes the node back to the original colour and size.
 * Changes the text i.e. node name back to being hidden.
 *
 * Parameter:
 *      node_selected: d3 node object, contains styling and coords etc.
 */
var on_node_mouseout = function (node_selected) {
    var options = phylo_options.style;
    var view_node_labels = document.getElementById('node-text-toggle').innerHTML.split(" | ")[1] == "ON";
    if (node_selected.attr("class") == "extent") {
        d3.select("#text-" + node_selected.attr("id")).attr("opacity", phylo_options.style.extant_label_opacity);
    }
    if (!view_node_labels && node_selected.attr("class") == "node") {
        node_selected.attr("r", options.node_radius);
        d3.select("#circle-" + node_selected.attr("id")).attr("r", options.node_radius * options.under_node_multiplier);
        var y = d3.select("#circle-" + node_selected.attr("id")).attr("cy");
        if (node_selected.attr("name") == phylo_options.tree.selected_node.name) {
             node_selected.attr("fill", phylo_options.style.select_colour);
        } else {
             node_selected.attr("fill", phylo_options.legend.colour_scale(y));
        }
        node_selected.attr("opacity", 1);
        node_selected.attr("stroke-width", options.stroke_width);
        d3.select("#text-" + node_selected.attr("id")).attr("opacity", 0);
    }
}


/**
 * Gets called when a user right clicks on a node.
 * This pops up a menu with options such as:
 *      1. view joint reconstruction
 *      2. view marginal etc.
 *
 *  Parameter: 
 *      node_name: name of the node -> used in the AJAX call to create the
 *      joint or marginal distribution.
 */
var on_contextmenu = function (node_name, node_fill, node_id) {
    d3.event.preventDefault();
    menu(d3.mouse(this)[0], d3.mouse(this)[1], node_id);
}



/**
 * Appends text to the branch as it is an additive tree element.
 *
 * Parameters:
 *      group:  the group which the node is appended to.
 *
 *      node:   contains information about the branch, i.e. 
 *              label, x and y coords.
 */
var draw_branch_text = function (group, branch) {
    var options = phylo_options.style;

    group.append("text")
        .attr("class", "branch")
        .text(branch.label.toFixed(4)) // Limit to 4 decimal places
        .attr("class", "branch-text")
        .attr("text-anchor", "middle")
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("fill", options.branch_stroke)
        .attr("transform", "translate(" + branch.x1 + 5 + "," + (branch.y1 + branch.y2) / 2 + ") rotate(90) translate(1,-5)")
        .attr("opacity", 0);
}

/**
 * User can select to toggle the branch text on or off
 * Action: Gets called when user clicks a button.
 */

var toggle_branch_text = function () {
    var button_text = document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1];
    if (button_text == "ON") {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
        document.getElementById('branch-text-toggle').innerHTML = "View branch length | OFF";
    } else {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
        document.getElementById('branch-text-toggle').innerHTML = "View branch length | ON";
    }
}

var toggle_node_text = function () {
    var button_text = document.getElementById('node-text-toggle').innerHTML.split(" | ")[1];
    phylo_options.svg.selectAll('circle.node').each(function () {
        $(this).attr("opacity", ($(this).attr("opacity") == 1) ? 0 : 1);
    });
    phylo_options.svg.selectAll('text.node').each(function () {
        $(this).attr("opacity", ($(this).attr("opacity") == 1) ? 0 : 1);
    });
    if (button_text == "ON") {
            document.getElementById('node-text-toggle').innerHTML = "View node labels | OFF";
    } else {
            document.getElementById('node-text-toggle').innerHTML = "View node labels | ON";
    }
}

var toggle_additive = function () {
    var additive = document.getElementById('additive-toggle').innerHTML.split(" | ")[1];
    if (additive == "Additive") {
        clear_svg();
        phylo_options.tree.additive = false;
        run_phylo_tree(); // TODO: refresh? (not run)
        document.getElementById('additive-toggle').innerHTML = "View tree type | Cladogram";
    } else {
        clear_svg();
        phylo_options.tree.additive = true;
        run_phylo_tree();
        document.getElementById('additive-toggle').innerHTML = "View tree type | Additive";
    }
    // check labels
    if (document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
    } else {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
    }
    if (document.getElementById('extant-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('text.extent').each(function () {
            $(this).attr("opacity", 1);
        });
    }
    if (document.getElementById('node-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('circle.node').each(function () {
            $(this).attr("opacity", 0);
        });
        phylo_options.svg.selectAll('text.node').each(function () {
            $(this).attr("opacity", 1);
        });
    }
}

var toggle_extant_text = function() {
    var button_text = document.getElementById('extant-text-toggle').innerHTML.split(" | ")[1];
    phylo_options.svg.selectAll('text.extent').each(function () {
        $(this).attr("opacity", ($(this).attr("opacity") == 1) ? phylo_options.style.extant_label_opacity : 1);
    });
    if (button_text == "ON") {
        document.getElementById('extant-text-toggle').innerHTML = "View extant labels | OFF";
    } else {
        document.getElementById('extant-text-toggle').innerHTML = "View extant labels | ON";
    }
}



/**
 * Draws the branches of the phylo tree
 */
var draw_phylo_branches = function (phylo_options, initial) {
    var group = phylo_options.group;
    var options = phylo_options.style;

    for (var b in phylo_options.tree.all_branches) {
        var branch = phylo_options.tree.all_branches[b];
        if (initial || phylo_options.tree.node_dict[branch.id].collapsed != true) {
            group.append("line")
                    .attr("class", "branch")
                    .style("stroke", options.branch_stroke)
                    .style("stroke-width", options.branch_stroke_width)
                    .attr("x1", branch.x1)
                    .attr("x2", branch.x2)
                    .attr("y1", branch.y1)
                    .attr("y2", branch.y2);
            // If it isn't a parent branch add the branch length
            if (branch.y1 != branch.y2) {
                draw_branch_text(group, branch);
            }
        }
    }
}

/**
 * Makes an array of "depths" from the logest distance
 * from the root so we don't get overlapping tree branches.
 */
var make_depth_array = function (phylo_options) {
    var depth = 0;
    var depth_array = [];
    var depth_size = phylo_options.tree.longest_distance_from_root_to_extent / (phylo_options.tree.max_depth / 2);

    while (depth < phylo_options.tree.longest_distance_from_root_to_extent) {
        depth_array.push(depth);
        depth += depth_size;
    }

    phylo_options.depth_array = depth_array;
    return phylo_options;
}

var set_phylo_params = function (tree_div, tree_string) {
    phylo_options.svg_info.div_id = tree_div;
    phylo_options.svg_info.width = window.innerWidth - 200;
    phylo_options.tree_string = tree_string;
    phylo_options = setup_phylo_svg(phylo_options);
}


var clear_svg = function () {
    var group = phylo_options.group;
    group.selectAll("line").remove();
    group.selectAll("text").remove();
    group.selectAll("rect").remove();
    group.selectAll("circle").remove();
}

/**
 * Sets up the tree and calls the other functions
 */
var run_phylo_tree = function () {
    // Make sure the group has no children

    var group = phylo_options.svg.append("g")
            .attr("transform", "translate(" + phylo_options.svg_info.margin.left + "," + phylo_options.svg_info.margin.top + ")");

    phylo_options.group = group;

    phylo_options.tree.all_nodes = [];
    phylo_options.tree.all_branches = [];

    var tree_json = parse_newick(phylo_options.tree_string);
    tree_json.distance_from_root = 0;
    tree_json.parent_node = {raw_x: 0, depth: 0, distance_from_root: 0};
    tree_json.root_node = true;
    phylo_options.tree.root = tree_json;

    phylo_options.tree.max_depth = 0;
    phylo_options.tree.max_y = 0;

    // Find the total distance to the root and assign
    // cummulative distances to each of the nodes
    get_distance_from_root(tree_json, 0, phylo_options, true);

    phylo_options = make_depth_array(phylo_options);

    // Now that we have made the scale we need to update the 
    // y position of the root node.

    phylo_options.tree.tree_nodes = [];
    phylo_options.tree.max_x = 0; // Largest factor we'll need to scale with

    /* Assign the x coords */
    phylo_options.leaf_count = 0;
    phylo_options.left_leaf_nodes = [];
    assign_leaf_x_coords(tree_json, phylo_options);

    /* For each of the leaf nodes itterate back up
     * through the tree and assign x coords to inner nodes. */
    for (var n in phylo_options.left_leaf_nodes) {
        assign_inner_x_coords(phylo_options.left_leaf_nodes[n].parent, phylo_options);
    }

    /* Assign x coords of the root */
    tree_json.raw_x = (tree_json.children[0].raw_x + tree_json.children[tree_json.children.length - 1].raw_x) / 2;

    /* Set the max x */
    phylo_options.tree.max_x = phylo_options.leaf_count;

    phylo_options = make_tree_scale(phylo_options);
    tree_json.y = phylo_options.y_scale(0);

    tree_json.x = phylo_options.x_scale(tree_json.raw_x);
    tree_json.parent_y = 0;

    phylo_options.tree.node_depth_dict[1] = [];
    phylo_options.tree.node_depth_dict[1].push(tree_json);

    phylo_options.tree.all_nodes.push(make_child(tree_json, false, phylo_options.tree.all_nodes.length));
    phylo_options.tree.node_dict[tree_json.id] = tree_json;

    assign_node_coords(tree_json, false, 0);
    add_children_nodes(tree_json, true);

    // collect all the nodes
    var nodes = phylo_options.tree.all_nodes;
    if (phylo_options.tree.selected_node === null) {
        phylo_options.tree.selected_node = nodes[0]; // set root node as selected (initial)
    }

    // Draw the branches and the nodes
    draw_phylo_branches(phylo_options, true);
    draw_phylo_nodes(phylo_options, true);
}

/**
 *  Redraw the tree structure stored in phylo_options.tree
 */
var redraw_phylo_tree = function() {
    console.log("redraw  tree");
    var options = phylo_options;
    var root = phylo_options.tree.root;

    clear_svg();
    phylo_options.leaf_count = 0; // reset, will be re-calculated based on visible nodes TODO
    // reset x value for drawing
    for (var n in phylo_options.tree.node_dict) {
        phylo_options.tree.node_dict[n].raw_x = 0;
    }

    // Find the total distance to the root and assign
    // cummulative distances to each of the nodes
    get_distance_from_root(root, 0, phylo_options, false);
    phylo_options = make_depth_array(phylo_options);

    // Assign the x coords
    phylo_options.left_leaf_nodes = [];
    assign_leaf_x_coords(root, phylo_options);

    // For each of the leaf nodes itterate back up
    // through the tree and assign x coords to inner nodes.
    for (var n in phylo_options.left_leaf_nodes) {
        assign_inner_x_coords(phylo_options.left_leaf_nodes[n].parent, phylo_options);
    }

    /* Assign x coords of the root */
    root.raw_x = (root.children[0].raw_x + root.children[root.children.length - 1].raw_x) / 2;

    /* Set the max x */
    phylo_options.tree.max_x = phylo_options.leaf_count;

    phylo_options = make_tree_scale(phylo_options);
    root.y = phylo_options.y_scale(0);

    root.x = phylo_options.x_scale(root.raw_x);
    root.parent_y = 0;

    assign_node_coords(root, 0);

    // re-populate all_nodes and all_branches for drawing
    phylo_options.tree.all_branches = [];
    phylo_options.tree.all_nodes = [];
    phylo_options.tree.all_nodes.push(make_child(root, false, phylo_options.tree.all_nodes.length));
    add_children_nodes(root, false);

    // Draw the branches and the nodes
    draw_phylo_branches(phylo_options, false);

    if (phylo_options.tree.collapse_under != null) {
        phylo_options.tree.collapse_under.collapsed = false;
    }

    draw_phylo_nodes(phylo_options, false);
}

/**
 * Assigns the parent nodes based on the x coords of the children.
 *
 * Traels from the leaf nodes up assigning parent node based on
 * 1/2 between left and right child.
 */
var assign_inner_x_coords = function (node, phylo_options) {
    /* Assign the x coords based on that of the children*/
    node.raw_x = (node.children[0].raw_x + node.children[node.children.length - 1].raw_x) / 2;
    console.log(node.id + " : " + node.raw_x);
    if (node.parent != undefined) {
        assign_inner_x_coords(node.parent, phylo_options);
    }
}

/**
 * Assigns the x coords of leafs/terminating nodes.
 *
 * Leaf is used to define either a left node, i.e. extent or
 * a terminating node (i.e. we are not displaying the children
 * of that node).
 */
var assign_leaf_x_coords = function (node, phylo_options) {

    if (node.collapsed && !node.terminated) {
        return;
    }

    /* This is a leaf (or terminating node) so assign the current x count */
    if (node.children == undefined || node.terminated == true) {
        node.raw_x = phylo_options.leaf_count;
        console.log(node.id + " : " + node.raw_x);
        phylo_options.leaf_count += 1;
        /* Add one of the children to the leaf node array so
         * we traverse up from only half the nodes when assigning
         * parent coords. */
        if (node.left) {
            phylo_options.left_leaf_nodes.push(node);
        }
        return;
    }

    /* Otherwise DFS left child first */
    for (var n in node.children) {
        if (n == 0) {
            node.children[n].left = true;
        } else {
            node.children[n].left = false;
        }
        node.children[n].parent = node;
        assign_leaf_x_coords(node.children[n], phylo_options);
    }
}


/**
 * Helper that makes a cut down node.
 */
var make_child = function (node, left, id) {
    var child = {};
    child.id = node.id;
    child.left = left;
    child.name = node.name;
    child.y = node.y;
    child.x = node.x;
    if (node.children == undefined) {
        child.extent = true;
    } else {
        child.extent = false;
    }

    return child;
}


/**
 * Before we can assign depths need to first determine the longest 
 * branch length.
 *
 * This involves traversing down the tree from root to tip
 * and keeping track of the longest branch.
 *
 * During this function we will also make the reverse relationship -> 
 * i.e. keep track of each nodes parent and also store the extents.
 *
 * This way we will be able to assign coords to x based on how many children
 * a node has and ensure the tree continues to look somewhat balenced even if
 * one branch stops early on.
 */
var get_distance_from_root = function (node, depth, phylo_options, initial) {
    // Make a node id based on name and node count
    // only assign on initial load
    if (initial) {
        node.id = phylo_options.tree.node_count + "-" + node.name.split(".")[0];
        node.collapsed = false;
        phylo_options.tree.node_dict = node;
        depth += 1;
        phylo_options.tree.node_count += 1;
    }
    if (node.children == undefined) {
        // Check if this is the longest branch
        if (node.distance_from_root > phylo_options.tree.longest_distance_from_root_to_extent) {
            phylo_options.tree.longest_distance_from_root_to_extent = node.distance_from_root;
        }
        if (depth > phylo_options.tree.max_depth) {
            phylo_options.tree.max_depth = depth;
        }
        // Set the max children of the node to be 0.
        node.max_children = 1;
        if (initial) {
            phylo_options.tree.extents.push(node);
        }
        return;
    }
    // Otherwise we need to calculate the cumulative branch lengths 
    // of the children and assign the nodes the value as:
    //      node.distance_from_root\
    for (var n in node.children) {
        len_c_left = node.children[n].branch_length;
        node.children[n].distance_from_root = node.distance_from_root + len_c_left;

        // Add this node as the parent of these children
        node.children[n].parent_node = node;

        // Add to a dictionary of nodes.
        // Will use this when traversing from the extents up to the parent.
        //phylo_options.node_dict[node.id] = node;

        get_distance_from_root(node.children[n], depth, phylo_options, initial);
    }
}


/**
 *
 * Traverse the tree from the extents (i.e. leaf nodes and 
 * assign the number of children below).
 *
 * Assign the node to have the max number of children, 
 * this will be used to calculate how large the x 
 * area is that we want to assign.
 *
 */
var assign_num_children = function (node) {
    var left_child_count = node.children[0].max_children + 2;
    var right_child_count = node.children[1].max_children + 2;

    if (isNaN(left_child_count)) {
        left_child_count = 0;
    }

    if (isNaN(right_child_count)) {
        right_child_count = 0;
    }

    if (left_child_count > right_child_count) {
        node.max_children = left_child_count;
    } else {
        node.max_children = right_child_count;
    }

    if (node.parent_node == undefined) {
        return; // We have reached the root
    }
    return assign_num_children(node.parent_node);
}


/**
 * Recur one more time and add all the children.
 **/
var add_children_nodes = function (node, initial) {

    if (node.children != undefined) {
        for (var n in node.children) {
            if (n == 0) {

                // Make the branch from parent out to children x's
                // Check if both children exist
                var branch_parent = {
                    id: node.id,
                    y1: node.y,
                    y2: node.y,
                    x1: node.children[0].x,
                    x2: node.children[node.children.length - 1].x
                };
                // Make each of the children branches, these are vertical connectors
                // between the parent center branch and the child nodes.
                var branch_left_child = {
                    id: node.id,
                    y1: node.y,
                    y2: node.children[0].y,
                    x1: node.children[0].x,
                    x2: node.children[0].x,
                    label: node.children[0].branch_length
                };
                // Add the branches to a list of all branches to be drawn later
                phylo_options.tree.all_branches.push(branch_parent);
                phylo_options.tree.all_branches.push(branch_left_child);

                var left_child = make_child(node.children[0], true);
                phylo_options.tree.node_dict[node.children[0].id] = node.children[0];
                phylo_options.tree.all_nodes.push(left_child);
            } else {
                var branch_right_child = {
                    id: node.id,
                    y1: node.y,
                    y2: node.children[n].y,
                    x1: node.children[n].x,
                    x2: node.children[n].x,
                    label: node.children[n].branch_length
                };
                x2 = node.children[n].x;
                phylo_options.tree.all_branches.push(branch_right_child);
                var right_child = make_child(node.children[n], false, phylo_options.tree.all_nodes.length);
                phylo_options.tree.node_dict[node.children[n].id] = node.children[n];
                phylo_options.tree.all_nodes.push(right_child);
            }
        }
    } else {
        return;
    }
    for (var n in node.children) {
        add_children_nodes(node.children[n], initial);
    }
}

/**
 * Assign node coods updates the node x and y coords
 * to be valyes to draw on the page rather than placement
 * variables i.e. scales the coordinates depending on the
 * with and height of the VSG element.
 *
 * Parameters:
 *      node: the node that we are adding -> recursively
 *          calls the function on the children nodes.
 *
 *      depth: Used when we are making the tree into a cladogram 
 *          rather than an additive tree.
 */
var assign_node_coords = function (node, depth) {
    var additive = phylo_options.tree.additive;
    var node_instep = phylo_options.tree.node_instep;


    if (additive) {
        node.y = phylo_options.y_scale(node.distance_from_root);
    } else {
        node.y = phylo_options.y_scale(depth);
    }


    // Check that the node.x is not NAN
    if (node.is_left) {
        // We add a instep if it is on the LHS and RHS so that we
        // don't get overlap.
        node.x = phylo_options.x_scale(node.raw_x + node_instep);
    } else {
        node.x = phylo_options.x_scale(node.raw_x - node_instep);
    }

    if (node.children == undefined) {
        if (additive == false) {
            node.y -= phylo_options.y_scale(0.2);
        }
        if (node.is_left) {
            node.x = phylo_options.x_scale(node.raw_x + node_instep);
        } else {
            node.x = phylo_options.x_scale(node.raw_x - node_instep);
        }
    }

    // Recursively call the assign node coords on each child of
    // the node.
    if (node.children != undefined) {
        for (var n in node.children) {
            assign_node_coords(node.children[n], depth + 1);
        }
    }
    // Return after recurring.
    return;
}


/**
 * Parsing the newick format of a tree to JSON.
 * From:
 *      https://github.com/daviddao/biojs-io-newick
 *      under: Apache2 license
 */
var parse_newick = function (s) {
    var ancestors = [];
    var tree = {};
    var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        switch (token) {
            case '(': // new children
                var subtree = {};
                tree.children = [subtree];
                ancestors.push(tree);
                tree = subtree;
                break;
            case ',': // another branch
                var subtree = {};
                ancestors[ancestors.length - 1].children.push(subtree);
                tree = subtree;
                break;
            case ')': // optional name next
                tree = ancestors.pop();
                break;
            case ':': // optional length next
                break;
            default:
                var x = tokens[i - 1];
                if (x == ')' || x == '(' || x == ',') {
                    tree.name = token;
                } else if (x == ':') {
                    tree.branch_length = parseFloat(token);
                }
        }
    }
    return tree;
};




/**
 * From: http://bl.ocks.org/jakosz/ce1e63d5149f64ac7ee9
 */
function contextMenu() {
    var height = 40,
            width = 250,
            margin = 10, // fraction of width
            items = [],
            rescale = false,
            style = {
                'rect': {
                    'mouseout': {
                        'fill': phylo_options.style.contextmenu_fill,
                        'stroke': 'white',
                        'stroke-width': phylo_options.style.stroke_width
                    },
                    'mouseover': {
                        'fill': phylo_options.style.contextmenu_hover_fill,
                    }
                },
                'text': {
                    'fill': phylo_options.style.text_fill,
                    'font-size': '16'
                }
            };

    function menu(x, y, node_name, node_fill, node_id) {
        d3.select('.context-menu').remove();
        //scaleItems();

        // Draw the menu
        phylo_options.group
                .append('g').attr('class', 'context-menu')
                .selectAll('tmp')
                .data(items).enter()
                .append('g').attr('class', 'menu-entry')
                .style({'cursor': 'pointer'})
                .on('mouseover', function () {
                    d3.select(this).select('rect').style(style.rect.mouseover)
                })
                .on('mouseout', function () {
                    d3.select(this).select('rect').style(style.rect.mouseout)
                });


        d3.selectAll('.menu-entry')
                .append('rect')
                .attr("id", node_name)
                .attr('name', function (d) {
                    return d;
                })
                .attr('x', x)
                .attr('y', function (d, i) {
                    return y + (i * height);
                })
                .attr('width', width)
                .attr('height', height)
                .style(style.rect.mouseout)
                .on('click', function () {
                    var call = d3.select(this);
                    context_menu_action(call, node_fill, node_id);
                });


        d3.selectAll('.menu-entry')
                .append('text')
                .text(function (d) {
                    return d;
                })
                .attr('x', x)
                .attr('y', function (d, i) {
                    return (y + (i * height)) - height / 3;
                })
                .attr('dy', height - margin / 2)
                .attr('dx', margin)
                .style(style.text)
                .attr("id", node_name)
                .attr('name', function (d) {
                    return d;
                })
                .on('click', function () {
                    var call = d3.select(this);
                    context_menu_action(call, node_fill, node_id);
                });

        // Other interactions
        d3.select('body')
                .on('click', function () {
                    d3.select('.context-menu').remove();
                });
    }

    menu.items = function (e) {
        if (!arguments.length)
            return items;
        for (i in arguments)
            items.push(arguments[i]);
        rescale = true;
        return menu;
    }

    // Automatically set width, height, and margin;
    function scaleItems() {
        if (rescale) {
            d3.select('svg').selectAll('tmp')
                    .data(items).enter()
                    .append('text')
                    .text(function (d) {
                        return d;
                    })
                    .style(style.text)
                    .attr('x', -1000)
                    .attr('y', -1000)
                    .attr('class', 'tmp');
            var z = d3.selectAll('.tmp')[0]
                    .map(function (x) {
                        return x.getBBox();
                    });
            width = d3.max(z.map(function (x) {
                return x.width;
            }));
            margin = margin * width;
            width = width + 2 * margin;
            height = d3.max(z.map(function (x) {
                return x.height + margin / 2;
            }));

            // cleanup
            d3.selectAll('.tmp').remove();
            rescale = false;
        }
    }

    return menu;
}

/**
 *  Actions for the context menu.
 *  
 *  1. Add joint reconstruction
 *  2. Add marginal reconstruction
 *  3. view joint
 *  4. collapse subtree
 *  5. expand subtree
 */
var context_menu_action = function (call, node_fill, node_id) {
    var call_type = call.attr("name");

    if (call_type == "View joint reconstruction") {
        select_node(call.attr("id"));
        refresh_tree();
        displayJointGraph(call.attr("id"), node_fill, true);
    } else if (call_type == "Add joint reconstruction") {
        displayJointGraph(call.attr("id"), node_fill, false);
    } else if (call_type == "Expand subtree") {
        var node = phylo_options.tree.node_dict[node_id];
        set_children_un_collapsed(phylo_options.tree.collapse_under);
        phylo_options.tree.collapse_under.terminated = false;
        phylo_options.tree.collapse_under = null;
        refresh_tree();
    } else if (call_type == "Collapse subtree") {
        var node = phylo_options.tree.node_dict[node_id];
        node.terminated = true;
        phylo_options.tree.collapse_under = node;
        set_children_collapsed(phylo_options.tree.collapse_under);
        refresh_tree();
    } else {
        select_node(call.attr("id"));
        refresh_tree();
        perform_marginal(call.attr("id"), node_fill);
    }

}

/**
 *  Sets all the children of a node to be collapsed.
 *  
 */
var set_children_collapsed = function (node) {
    node.collapsed = true;
    for (var n in node.children) {
        set_children_collapsed(node.children[n]);
    }
}

/**
 * Sets all the children of a node back to being not collapsed.
 */
var set_children_un_collapsed = function (node) {
    node.collapsed = false;
    for (var n in node.children) {
        set_children_un_collapsed(node.children[n]);
    }
}

/**
 * Indicate that the node has been selected, and set all other nodes to be not selected (boolean flag node param).
**/
var select_node = function(node) {
    var options = phylo_options.style;
    var nodes = phylo_options.tree.all_nodes;
    for (var n in nodes) {
        if (nodes[n].name == node) {
            phylo_options.tree.selected_node = nodes[n];
            d3.select("#circle-" + nodes[n].id).attr("fill",options.select_colour);
            return;
        }
    }
}

/**
 * Tress Drawing algorithm using buchheim method.
 *
 * Adapted from: https://llimllib.github.io/pymag-trees/
 * 
 * Method:
 *      1.  Post order traversal of the Tree to assign
 *          initial x coords.
 *          if node.children == undefined:
 *
 *              a. if node == left most child:
 *                      -> then need to find whether there
 *                      is a "brother" of this node on the LHS
 *                      if so, add the x coord of the brother + distance
 *              b. if not:
 *                      -> assign the x corrd based on the mid point
 *                      of the children of the node.
 *                      -> check if there is a left brother of the node
 *                      if so add a mod (SHIFT) so we can ensure that
 *                      there are no overlaps.
 *
 *              
 *              
 */


/**
 * A helper function to assign the y coordinate so that we group the 
 * coordinates by the y coord rather than the depth.
 * 
 * i.e. used when we are creating an additive tree rather than a 
 * cladogram -> the nodes are thus placed at depths dependent on how far from the root they 
 * are rather than the pre defined depth.
 *
 * https://stackoverflow.com/questions/8584902/get-closest-number-out-of-array
 */
var assign_depth_from_y = function (num, arr) {

    var curr = arr[0];
    var diff = Math.abs(num - curr);
    for (var val = 0; val < arr.length; val++) {
        var newdiff = Math.abs(num - arr[val]);
        if (newdiff < diff) {
            diff = newdiff;
            curr = arr[val];
        }
    }
    return curr;

}

/**
 * The main function which assigns the node x and y coords.
 * These are done in a recursive manner.
 *
 * 1. depth - how far down the tree the node occurs.
 * 2. mod   - how far we need to move the node to the
 *            right when whave clashes (i.e. for x coord).
 * 3. is_left - whether it is a right or left child (assuming
 *          bifurcating trees).
 * 4. raw_x - the x coord without factoring the width
 *          of the page into account. In this function
 *          the raw_x is preliminary as we update it based on
 *          the contour and mod.
 */
var setup = function (node, depth) {
    node.depth = depth;
    node.mod = 0;
    node.raw_x = 0;

    if (depth > phylo_options.tree.max_y) {
        phylo_options.tree.max_y = depth;
    }

    if (node.children == undefined) {
        node.raw_x = 0;
        node.mod = 0;
        node.is_left = true;
        return node;
    }

    if (node.children.length == 1) {
        node.raw_x = setup(node.children[0], depth + 1).raw_x;
        node.is_left = true;
        node.mod = 0;
        return node;
    }

    var left = setup(node.children[0], depth + 1);
    var right = setup(node.children[1], depth + 1);

    // Set the left node and right node tags
    left.is_left = true;
    right.is_left = false;

    node.raw_x = fix_subtrees(left, right);

    if (node.raw_x < phylo_options.tree.min_x) {
        phylo_options.tree.min_x = node.raw_x;
    }

    return node;
}


/**
 * add mods is a second walk through of the tree.
 * Adds the offsets to the nodes that were calculated when 
 * we did the first walk of the tree and came accross 
 * the clashes.
 *
 * Parameters:
 *      modsum: the cummlative offset from the root of the tree
 *          to add to the x-coord of the node. 
 *      node: the node we are currently adding the mod to.
 *
 * Recurs on the children of the node.
 */
var add_mods = function (node, modsum) {
//    if (phylo_options.tree.min_x < 0) {
    // Don't want to have negative x values so we shift everything
    // by the minimum x.
//        node.raw_x += (-1 * phylo_options.tree.min_x);
//    }

    node.raw_x = node.raw_x + modsum;


    // Keep track of the largest x coord
    if (node.raw_x > phylo_options.tree.max_x) {
        phylo_options.tree.max_x = node.raw_x + 1;
    }

    for (var child in node.children) {
        add_mods(node.children[child], modsum + node.mod);
    }

    // Add the node to a list of nodes so that we can just draw all
    // in a single function that itterates over the array.
    phylo_options.tree.tree_nodes.push(node);
    return;
}

var contour = function (left, right, max_offset, left_offset, right_offset, left_outer, right_outer) {

    var delta = left.raw_x + left_offset - (right.raw_x + right_offset);

    if (max_offset == undefined || delta > max_offset) {
        max_offset = delta;
    }

    if (left_outer == undefined) {
        left_outer = left;
    }

    if (right_outer == undefined) {
        right_outer = right;
    }

    var lo = next_left(left_outer);
    var li = next_right(left);
    var ri = next_left(right);
    var ro = next_right(right_outer);

    if (li != undefined && ri != undefined) {
        left_offset += left.mod;
        right_offset += right.mod;
        return contour(li, ri, max_offset, left_offset, right_offset, lo, ro);
    }
    return {'li': li, 'ri': ri, 'max_offset': max_offset, 'left_offset': left_offset, 'right_offset': right_offset, 'lo': left_outer, 'ro': right_outer};
}


/**
 * Helper function which returns the thread of the next node
 * if one exists.
 *
 * Otherwise if the node has a left child we return that.
 *
 * Undefined is returned otherwise.
 */
var next_left = function (node) {
    if (node.thread != undefined) {
        return node.thread;
    }
    if (node.children != undefined) {
        return node.children[0];
    }
    return undefined;
}

/**
 * Similar to the next_left function.
 */
var next_right = function (node) {
    if (node.thread != undefined) {
        return node.thread;
    }
    if (node.children != undefined) {
        return node.children[1];
    }
    return undefined;
}


/**
 * fix_subtrees updates the subtrees of a node.
 *
 * This is done itterattively so that each time we progress up the levels
 * of the trees we know w edon't have to fix any lower trees as they
 * have already been fixed.
 *
 * Parameters:
 *      left    - the left child of the node, contains the left subtree.
 *      right   - the right child of th node, contains the right subtree.
 *
 * Returns: 
 *      half way between the left and right sub tree children nodes.
 */
var fix_subtrees = function (left, right) {
    // The first time we get the contours we have to srat it with
    // no offsets etc. 
    var contours = contour(left, right, null, null, null, null, null);
    // Contours is recursively called on the tree to determine how far
    // we need to offset the top nodes to ensure that none of the 
    // lower subtrees are conflicting in the x nodes.
    var diff = contours['max_offset'];
    var ri = contours['ri'];
    var ro = contours['ro'];
    var lo = contours['lo'];
    var li = contours['li'];
    var left_offset = contours['left_offset']
    var right_offset = contours['right_offset']

    diff += 1;
    diff += (right.raw_x + diff + left.raw_x) % 2;
    right.mod = diff;
    right.raw_x += diff;

    if (right.children != undefined) {
        right_offset += diff;
    }

    if (ri != undefined && li == undefined) {
        lo.thread = ri;
        lo.mod = right_offset - left_offset;
    } else if (li != undefined && ri == undefined) {
        ro.thread = li;
        ro.mod = left_offset - right_offset;
    }

    return (left.raw_x + right.raw_x) / 2;
}

var refresh_tree = function () {
    if (document.getElementById('additive-toggle').innerHTML.split(" | ")[1] != "Additive") {
        phylo_options.tree.additive = false;
    }
    phylo_options.svg_info.width = window.innerWidth - 200;
    resize_phylo_height();
    redraw_phylo_tree();
    if (document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
    } else {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
    }
    if (document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
    } else {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
    }
    if (document.getElementById('extant-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('text.extent').each(function () {
            $(this).attr("opacity", 1);
        });
    }
    if (document.getElementById('node-text-toggle').innerHTML.split(" | ")[1] == "ON") {
        phylo_options.svg.selectAll('circle.node').each(function () {
            $(this).attr("opacity", 0);
        });
        phylo_options.svg.selectAll('text.node').each(function () {
            $(this).attr("opacity", 1);
        });
    }
}
