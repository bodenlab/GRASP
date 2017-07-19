/**
 * New version of the Phylo tree for GRASP
 * @ariane.mora 29/06/2017
 */

var phylo_options = {
    svg_info: {
        div_id: "", // The ID of the div you want to draw the graph in.
        width: 1500,
        height: 600,
        margin: {top: 150, left: 50, bottom: 200, right: 150},
        stroke: "#AEB6BF",
        stroke_width: "1px",
        number_aixs_ticks: 10,
    },
    tree: {
        longest_distance_from_root_to_extent: 0,
        node_count: 0, // used to assign ids
        all_nodes: new Array(),
        all_branches: new Array(),
        node_depth_dict: {}, // keeps track of the depth of each node
        extents: new Array(),
        min_x: 0,
        additive: true, // Whether or not we want to display the branches as additiv
        node_instep: 0.1,
    },
    legend: {
        width: 50,
        top_colour: "#7F74F3",
        bottom_colour: "#33FFB5",
        colours: ["#7F74F3", "#33FFB5"],

    },

    // Options for node style
    // Extent options are for the extent sequences 
    // node prefex is for internal node style
    style: {
        extent_radius: 5,
        node_radius: 5,
        hover_radius: 35,
        under_node_multiplier: 1.3, 
        /** 
          * There is a "white" node under each 
          * normal node -> allows us to change the opacity to view the text without
          * interfering with hover events. 
          **/
        // --------------- Fills --------------------//
        root_node_fill: "red",
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

        // ----------------- Text ------------------//
        font_family: "Varela Round, sans-serif",
        font_size: "16px",
        font_colour: "#24232d",

        // ---------------- Context menu style ----//
        contextmenu_fill: "#F0F8FF",
        contextmenu_hover_fill: "#FCDFFF",

        // --------------- Action styles ----------//
        /** 
         * The colour for when a user selects to perform a joint reconstruction
         * it will be shaded based on how "far" the node is from the root
         */
        select_colour: "#342D7E"
    }
}

/**
 * The context menu, has the names for the events that a user can perform.
 */
var menu = contextMenu().items('add joint reconstruction', 'add marginal reconstruction',);



/**
 * Makes the tree scale
 */
var make_tree_scale = function (phylo_options) {
    var additive = phylo_options.tree.additive;

    var max_y = phylo_options.tree.max_y;
    if (additive) {
        max_y = phylo_options.tree.longest_distance_from_root_to_extent;
    }

    var y_scale = d3.scale.linear()
                    .domain([0, max_y])
                    .range([0, phylo_options.svg_info.height]);

    var y_axis = d3.svg.axis()
                  .scale(y_scale)
                  .orient("left")
                  .ticks(5);

    var x_scale = d3.scale.linear()
                    .domain([phylo_options.tree.min_x - 2, phylo_options.tree.max_x])
                    .range([phylo_options.legend.width + phylo_options.svg_info.margin.left, phylo_options.svg_info.width]);


    var legend = phylo_options.svg.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");

    legend.append("stop").attr("offset", "0%").attr("stop-color", phylo_options.legend.top_colour).attr("stop-opacity", 1);

    legend.append("stop").attr("offset", "100%").attr("stop-color", phylo_options.legend.bottom_colour).attr("stop-opacity", 1);


    phylo_options.group.append("rect")
        .attr("width", phylo_options.legend.width)
        .attr("x", - phylo_options.legend.width/2 + 5)
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
    while(i < (n - 1)) { 
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
    var width = graph.page_options.width;//document.getElementById(options.raw_svg_id).offsetWidth;

    var svg = d3.select(options.div_id).append("svg")
            .attr("width", width + options.margin.left + options.margin.right)
            .attr("height", options.height + options.margin.top + options.margin.bottom); // Add the height of the action panel
    
   
    phylo_options.svg = svg;

    return phylo_options;
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
        .attr("id", n)
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
            if (node.root_node) {
                options.root_node_fill;
            }
            if (node.extent) {
                return options.extent_fill;
            }
            else {
                return phylo_options.legend.colour_scale(node.y);
            } 
        })  
        .attr("stroke", options.stroke)
        .attr("opacity", options.opacity)
        .attr("stroke-width", options.stroke_width)
        .on("mouseover", function() {
            var node_selected = d3.select(this);
            // call function to update componenets
            on_node_mouseover(node_selected);
        })
        .on("mouseout", function() {
            var node_selected = d3.select(this);
            // update components
            on_node_mouseout(node_selected);
        })
        .on("contextmenu", function() {
            var node_name = d3.select("#text-" + d3.select(this).attr("id")).attr("class");
            var node_fill = phylo_options.legend.colour_scale(node.y);//d3.select("#circle-" + d3.select(this).attr("id")).attr("fill");
            console.log(node_name, node_fill);
            d3.event.preventDefault();
            menu(d3.mouse(this)[0], d3.mouse(this)[1], node_name, node_fill);
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

    group.append("text")
        .attr("id", "text-" + n)
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("class", node.name)
        .text(node.name)
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("fill", options.font_colour)
        .attr("text-anchor", "middle")
        .attr("opacity", 0);

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
        .attr("id", "circle-" + n)
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
                return options.extent_radius * options.under_node_multiplier;
            } else {
                return options.node_radius * options.under_node_multiplier;
            }
        })
        .attr("fill", "white")
        .attr("stroke", options.under_stroke)
        .attr("opacity", options.opacity)
        .attr("stroke_width", options.stroke_width)
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
var draw_phylo_nodes = function (phylo_options) {
    var group = phylo_options.group;
    for (var n in phylo_options.tree.all_nodes) {
        var node = phylo_options.tree.all_nodes[n];

        // Add a white under circle to make it pretty
        draw_phylo_under_circle(group, node, n);        

        // Add the node label
        draw_phylo_text(group, node, n);        

        // Add the node which has the colour for extents and the
        // function for hover
        draw_phylo_circle(group, node, n);
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

    node_selected.attr("r", options.hover_radius);
    node_selected.attr("fill", options.hover_fill);
    node_selected.attr("opacity", 0.2);
    node_selected.attr("stroke-width", "0px")
    d3.select("#circle-" + node_selected.attr("id")).attr("r", options.hover_radius * options.under_node_multiplier);
    d3.select("#text-" + node_selected.attr("id")).style("opacity", 1);

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

    if (node_selected.attr("class") == "extent") {
        node_selected.attr("r", options.extent_radius);
        d3.select("#circle-" + node_selected.attr("id")).attr("r", options.extent_radius * options.under_node_multiplier);
        node_selected.attr("fill", options.extent_fill);
    } else {
        node_selected.attr("r", options.node_radius);
        d3.select("#circle-" + node_selected.attr("id")).attr("r", options.node_radius * options.under_node_multiplier);
        var y = d3.select("#circle-" + node_selected.attr("id")).attr("cy");
        node_selected.attr("fill", phylo_options.legend.colour_scale(y));
    }
    node_selected.attr("opacity", 1);
    node_selected.attr("stroke-width", options.stroke_width)
    d3.select("#text-" + node_selected.attr("id")).style("opacity",  0);
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
var on_contextmenu = function(node_name, node_fill) {
    d3.event.preventDefault();
    menu(d3.mouse(this)[0], d3.mouse(this)[1]);
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
        .attr("x", branch.x1 + 5) // add a little padding for prettiness sake
        .attr("y", (branch.y1 + branch.y2) / 2)
        .text(branch.label.toFixed(4)) // Limit to 4 decimal places
        .attr("class", "branch-text")
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("fill", options.branch_stroke)
        .attr("text-anchor", "start")
        .attr("opacity", 1);

}

/**
 * User can select to toggle the branch text on or off
 * Action: Gets called when user clicks a button.
 */

var toggle_branch_text = function () {
    var button_text = document.getElementById('branch-text-toggle').innerHTML.split(" ")[2];
    if (button_text == "on") {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
        document.getElementById('branch-text-toggle').innerHTML = "Branch text off";
    } else {
        phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
        document.getElementById('branch-text-toggle').innerHTML = "Branch text on";
    }
}

var toggle_additive = function () {
    var additive = document.getElementById('additive-toggle').innerHTML;
    if (additive == "Additive") {
        clear_svg();
        phylo_options.tree.additive = false;
        run_phylo_tree();
        document.getElementById('additive-toggle').innerHTML = "Cladogram";
    } else {
        clear_svg();
        phylo_options.tree.additive = true;
        run_phylo_tree();
        document.getElementById('additive-toggle').innerHTML = "Additive";
    }
}



/**
 * Draws the branches of the phylo tree
 */
var draw_phylo_branches = function (phylo_options) {
    var group = phylo_options.group;
    var options = phylo_options.style;

    for (var b in phylo_options.tree.all_branches) {
        var branch = phylo_options.tree.all_branches[b];
        if (branch.x1 == undefined) {
            console.log(branch);
        }
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

/**
 * Makes an array of "depths" from the logest distance
 * from the root so we don't get overlapping tree branches.
 */
var make_depth_array = function(phylo_options) {
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
    phylo_options.tree_string = tree_string;
    //var tree_json = parse_newick(tree_string);
    //phylo_options.tree_json = tree_json;
    phylo_options = setup_phylo_svg(phylo_options);
}


var clear_svg = function() {
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

    phylo_options.tree.max_depth = 0;
    phylo_options.tree.max_y = 0;

    // Find the total distance to the root and assign
    // cummulative distances to each of the nodes
    get_distance_from_root(tree_json, 0, phylo_options);

    phylo_options = make_depth_array(phylo_options);

    // Now that we have made the scale we need to update the 
    // y position of the root node.

    phylo_options.tree.tree_nodes = [];
    phylo_options.tree.max_x = 0; // Largest factor we'll need to scale with
    phylo_options.tree.max_y = 0;


    tree_json = setup(tree_json, 0);

    add_mods(tree_json, 0, phylo_options)

    phylo_options = make_tree_scale(phylo_options);
    tree_json.y = phylo_options.y_scale(0);

    tree_json.x = phylo_options.x_scale(tree_json.raw_x);
    tree_json.parent_y = 0;

    phylo_options.tree.node_depth_dict[1] = [];
    phylo_options.tree.node_depth_dict[1].push(tree_json);

    phylo_options.tree.all_nodes.push(make_child(tree_json, false));

    assign_node_coords(tree_json, false, 0);
    add_children_nodes(tree_json);

    // collect all the nodes
    var nodes = phylo_options.tree.all_nodes;
 
    // Draw the branches and the nodes
    draw_phylo_branches(phylo_options);

    draw_phylo_nodes(phylo_options);
}



/**
 * Helper that makes a cut down node.
 */
var make_child = function(node, left) {

    var child = {};
    child.left = left;
    child.depth = node.depth;
    child.name = node.name;
    child.branch_length = node.branch_length;
    child.y = node.y;
    child.x = node.x;
    if (node.children == undefined) {
        child.extent = true;
    } else {
        child.extent = false;
    }

    if (node.root_node == undefined) {
        child.root_node = false;
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
var get_distance_from_root = function(node, depth, phylo_options) {
    // Make a node id based on name and node count
    node.id = phylo_options.tree.node_count + "-" + node.name;
    depth += 1;
    phylo_options.tree.node_count += 1;
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
        phylo_options.tree.extents.push(node);
        return;
    }
    // Otherwise we need to calculate the cumulative branch lengths 
    // of the children and assign the nodes the value as:
    //      node.distance_from_root
    len_c_left = node.children[0].branch_length;
    len_c_right = node.children[1].branch_length;
 

    node.children[0].distance_from_root = node.distance_from_root + len_c_left;
    node.children[1].distance_from_root = node.distance_from_root + len_c_right;

    // Add this node as the parent of these children
    node.children[0].parent_node = node;
    node.children[1].parent_node = node;

    // Add to a dictionary of nodes.
    // Will use this when traversing from the extents up to the parent.
    //phylo_options.node_dict[node.id] = node;

    return get_distance_from_root(node.children[0], depth, phylo_options) ||
                get_distance_from_root(node.children[1], depth, phylo_options);
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
var assign_num_children = function(node) {
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
var add_children_nodes = function(node) {
    if (node.children != undefined) {
        var x2 = 0;
        if (node.children[1] != undefined) {
            var branch_right_child = {
                y1: node.y,
                y2: node.children[1].y,
                x1: node.children[1].x,
                x2: node.children[1].x,
                label: node.children[1].branch_length
            };
            x2 = node.children[1].x;
        phylo_options.tree.all_branches.push(branch_right_child);
        var right_child = make_child(node.children[1], false);
        phylo_options.tree.all_nodes.push(right_child);

        } else {
            x2 = node.x;
        }

        // Make the branch from parent out to children x's
        // Check if both children exist
        var branch_parent = {
            y1: node.y,
            y2: node.y,
            x1: node.children[0].x,
            x2: x2
        };
        // Make each of the children branches, these are vertical connectors
        // between the parent center branch and the child nodes.
        var branch_left_child = {
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
        phylo_options.tree.all_nodes.push(left_child);

    } else {
        return;
    }
    for (var n in node.children) {
        add_children_nodes(node.children[n]);
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
    var instep = phylo_options.tree.node_instep;


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
            node.x = phylo_options.x_scale(node.raw_x + 0.3);
        } else {
            node.x = phylo_options.x_scale(node.raw_x - 0.3);
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
	for (var i=0; i<tokens.length; i++) {
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
				ancestors[ancestors.length-1].children.push(subtree);
				tree = subtree;
				break;
			case ')': // optional name next
				tree = ancestors.pop();
				break;
			case ':': // optional length next
				break;
			default:
				var x = tokens[i-1];
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
    
    function menu(x, y, node_name, node_fill) {
        d3.select('.context-menu').remove();
        //scaleItems();

        // Draw the menu
        phylo_options.group
            .append('g').attr('class', 'context-menu')
            .selectAll('tmp')
            .data(items).enter()
            .append('g').attr('class', 'menu-entry')
            .style({'cursor': 'pointer'})
            .on('mouseover', function(){ 
                d3.select(this).select('rect').style(style.rect.mouseover) })
            .on('mouseout', function(){ 
                d3.select(this).select('rect').style(style.rect.mouseout) });
             
   
        d3.selectAll('.menu-entry')
            .append('rect')
            .attr("id", node_name)
            .attr('class', function(d) { return d;})
            .attr('x', x)
            .attr('y', function(d, i){ return y + (i * height); })
            .attr('width', width)
            .attr('height', height)
            .style(style.rect.mouseout)
            .on('click', function() {
                var call_type = d3.select(this).attr("class");
                if (call_type == "add joint reconstruction") {
                    displayJointGraph(d3.select(this).attr("id"), node_fill);
                } else {
                    perform_marginal(d3.select(this).attr("id"), node_fill);
                }
            }); 

         
        d3.selectAll('.menu-entry')
            .append('text')
            .text(function(d){ return d; })
            .attr('x', x)
            .attr('y', function(d, i){ return (y + (i * height)) - height/3; })
            .attr('dy', height - margin / 2)
            .attr('dx', margin)
            .style(style.text)
            .attr("id", node_name)
            .attr('class', function(d) { return d;})
            .on('click', function() {
                var call_type = d3.select(this).attr("class");
                if (call_type == "add joint reconstruction") {
                    displayJointGraph(d3.select(this).attr("id"), node_fill);
                } else {
                    perform_marginal(d3.select(this).attr("id"), node_fill);
                }
            });

        // Other interactions
        d3.select('body')
            .on('click', function() {
                d3.select('.context-menu').remove();
            });
    }
    
    menu.items = function(e) {
        if (!arguments.length) return items;
        for (i in arguments) items.push(arguments[i]);
        rescale = true;
        return menu;
    }

    // Automatically set width, height, and margin;
    function scaleItems() {
        if (rescale) {
            d3.select('svg').selectAll('tmp')
                .data(items).enter()
                .append('text')
                .text(function(d){ return d; })
                .style(style.text)
                .attr('x', -1000)
                .attr('y', -1000)
                .attr('class', 'tmp');
            var z = d3.selectAll('.tmp')[0]
                      .map(function(x){ return x.getBBox(); });
            width = d3.max(z.map(function(x){ return x.width; }));
            margin = margin * width;
            width =  width + 2 * margin;
            height = d3.max(z.map(function(x){ return x.height + margin / 2; }));
            
            // cleanup
            d3.selectAll('.tmp').remove();
            rescale = false;
        }
    }

    return menu;
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
    var diff = Math.abs (num - curr);
    for (var val = 0; val < arr.length; val++) {
        var newdiff = Math.abs (num - arr[val]);
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
var setup = function(node, depth) {
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
var next_left = function(node) {
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
var next_right = function(node) {
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

    return (left.raw_x +  right.raw_x) /2;
}

