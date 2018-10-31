/**
 * New version of the Phylo tree for GRASP
 * @ariane.mora 29/06/2017
 */

var phylo_options = {
  extentMapping: {},
  svg_info: {
    div_id: "", // The ID of the div you want to draw the graph in.
    width: 1500,
    height: 300,
    margin: {top: 50, left: 50, bottom: 50, right: 150},
    stroke: "#AEB6BF",
    stroke_width: "1px",
    number_aixs_ticks: 10
  },
  tree: {
    longest_distance_from_root_to_extant: 0,
    extant_label_height: 200,
    initial_node_num: 100,
    expand_node_num: 25,
    collapse_under: [],
    selected_node: null,
    collapsed_selection: null,
    all_nodes: [],
    all_nodes_taxonomy: [],
    all_branches: [],
    nodes_sorted: [], // keeps track of sorted nodes (based on increasing evolutionary distance)
    extants: [],
    min_x: 0,
    additive: true, // Whether or not we want to display the branches as additive
    node_instep: 0,
    root: null,
    node_dict: {}, // Keeps track of the node IDs as a dict
    // So we can easily keep track of the children nodes when we're updating
    // the tree's collapsed nodes
    node_count: 0, // Used to assign IDs to the nodes.
    obsolete_list: [], // Keeps track of any sequences in the tree which are obsolete
    failed_taxonomy_list: []
  },
  legend: {
    width: 20,
    height: 100,
    top_colour: "#3C6AC4",
    bottom_colour: "#F7FBFF",
    colours: ["#3C6AC4", "#F7FBFF"]
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
    search_colour: "#87dded",

    // ---------------- Context menu style ----//
    contextmenu_fill: "#F0F8FF",
    contextmenu_hover_fill: "#FCDFFF",
    // --------------- Action styles ----------//
    /**
     * The colour for when a user selects to perform a reconstruction
     * it will be shaded based on how "far" the node is from the root
     */
    select_colour: "#EA78F5",
    stacked_colour: "#EA78F5",           // colour for when a node appears in the poag stack
    collapsed_colour: "black",           // colour for when a node is collapsed
    collapsed_symbol: "triangle-up",     // symbol of tree node when sub-tree is collapsed

    // -------------- Taxonomy style -----------//
    modal_min_width: 700,
    modal_width: 400, // will change if screen is larger than modal_min_width
    modal_height: 400,
    hist_colours: ["#209DD8", "#EF74A4", "#9DCBC2", "#F2DBB7", "#57C9D9",
      "#A3628D", "#83AC9C", "#F1CC96", "#3486C2", "#9E6288"],
    hist_height: 200,
  }
};

/**
 * The context menu, has the names for the events that a user can perform.
 */
var menu = contextMenu().items('View marginal reconstruction',
    'View joint reconstruction', 'Add joint reconstruction', 'Collapse subtree',
    'Expand subtree', 'Expand subtree and collapse others');


/**
 * Makes the tree scale
 */
var make_tree_scale = function (phylo_options) {
  var additive = phylo_options.tree.additive;

  var max_y = phylo_options.tree.max_depth;
  if (additive) {
    max_y = phylo_options.tree.longest_distance_from_root_to_extant;
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
  .range([phylo_options.legend.width + phylo_options.svg_info.margin.left,
    phylo_options.svg_info.width]);

  var legend = phylo_options.svg.append("defs").append(
      "svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1",
      "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");

  legend.append("stop").attr("offset", "0%").attr("stop-color",
      phylo_options.legend.top_colour).attr("stop-opacity", 1);

  legend.append("stop").attr("offset", "100%").attr("stop-color",
      phylo_options.legend.bottom_colour).attr("stop-opacity", 1);

  phylo_options.group.append("rect")
  .attr("width", phylo_options.legend.width)
  .attr("x", 25)
  .attr("y", 0)
  .attr("height", phylo_options.svg_info.height)
  .style("fill", "url(#gradient)");

  phylo_options.group.append("g")
  .attr("class", "axis")
  .attr("stroke", phylo_options.branch_stroke)
  .attr("transform", "translate(" + 30 + ",0)")
  .attr("stroke-width", "0px")
  .call(y_axis);

  phylo_options.legend.colour_scale = d3.scale.linear()
  .domain(linspace(0, phylo_options.svg_info.height, 2))
  .range(phylo_options.legend.colours);

  phylo_options.y_scale = y_scale;
  phylo_options.x_scale = x_scale;
  return phylo_options;
};

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
  .attr("width", "100%")//width + options.margin.left + options.margin.right)
  .attr("height", options.height + options.margin.top + options.margin.bottom);
  phylo_options.svg_info.width = width + options.margin.left
      + options.margin.right;
  phylo_options.svg_info.height = options.height + options.margin.top
      + options.margin.bottom;
  phylo_options.svg = svg;

  return phylo_options;
};

var resize_phylo_height = function () {
  for (var e in phylo_options.tree.extants) {
    if (phylo_options.tree.extants[e][T_NAME].length * 7
        > phylo_options.tree.extant_label_height) {
      phylo_options.tree.extant_label_height = phylo_options.tree.extants[e][T_NAME].length
          * 7;
    }
  }
  phylo_options.svg.attr("height", phylo_options.svg_info.height
      + phylo_options.tree.extant_label_height);
  phylo_options.legend.height = phylo_options.svg_info.height + 0.25
      * phylo_options.tree.extant_label_height;

};

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
  group.append("path")
  .attr("id", "path-" + node[T_ID])
  .attr("class", function () {
    if (node[T_TERMINATED]) {
      return "collapsed-node";
    } else {
      return "uncollapsed-node";
    }
  })
  .attr("d", d3.svg.symbol().type(options.collapsed_symbol).size(70))
  .attr("transform", function (d) {
    return "translate(" + node[T_X] + "," + node[T_Y] + ")";
  })
  .style("fill", options.collapsed_colour)
  .style("opacity", function () {
    if (!node[T_COLLAPSED] && node[T_TERMINATED]) {
      return 1;
    } else {
      return 0;
    }
  });

  // Extant % under collapsed nodes
  var x = node[T_X];
  var y = node[T_Y] + 20;
  group.append("text")
  .attr("id", "text-coll-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("fill", function () {
    if (node[T_CONTAINS_SEARCH]) {
      return options.search_colour;
    } else {
      return options.font_colour;
    }
  })
  .attr("text-anchor", "middle")
  .attr("opacity", function () {
    if (!node[T_COLLAPSED] && node[T_TERMINATED]) {
      return 1;
    } else {
      return 0;
    }
  })
  .attr("transform", "translate(" + x + "," + y + ")")
  .text(function () {
    return "(" + node[T_NUM_EXTANTS] + ")";
  });

  // Taxonomy under collapsed nodes
  var x = node[T_X];
  var y = node[T_Y] + 30;
  var deg = 90;
  group.append("text")
  .attr("id", "text-tax-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("font-style", "italic")
  .attr("fill", function () {
    if (node[T_CONTAINS_SEARCH]) {
      return options.search_colour;
    } else {
      return options.font_colour;
    }
  })
  .attr("text-anchor", "start")
  .attr("opacity", function () {
    if (!node[T_COLLAPSED] && node[T_TERMINATED]) {
      return 1;
    } else {
      return 0;
    }
  })
  .attr("transform", "translate(" + x + "," + y + ") rotate(" + deg
      + ") translate(2,2)")
  .text(function () {
    if (node[T_COMMON_RANK] === null || node[T_COMMON_RANK] === undefined) {
      return "";
    }
    return node[T_COMMON_RANK].charAt(0).toUpperCase() + node[T_COMMON_RANK].slice(1)
        + ": " + node[T_COMMON_TAXA];
  });

  // Node
  group.append("circle")
  .attr("id", "fill-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("class", function () {
    if (node[T_EXTANT]) {
      return "extent";
    } else {
      return "node";
    }
  })
  .attr("cx", node[T_X])
  .attr("cy", node[T_Y])
  .attr("r", function (d) {
    if (node[T_EXTANT]) {
      return options.extent_radius;
    } else if (phylo_options.tree.collapsed_selection != null && node[T_ID]
        == phylo_options.tree.collapsed_selection[T_ID]) {
      return options.hover_radius;
    } else {
      return options.node_radius;
    }
  })
  .attr("fill", function (d) {
    if (node[T_EXTANT]) {
      return options.extent_fill;
    }
    if (node[T_NAME] === phylo_options.tree.selected_node[T_NAME]) {
      return options.select_colour;
    }
    if (node[T_IS_ROOT]) {
      return options.root_node_fill;
    }
    return phylo_options.legend.colour_scale(node[T_Y]);
  })
  .attr("stroke", function (d) {
    if (node[T_NAME] === phylo_options.tree.selected_node[T_NAME]) {
      return options.select_colour;
    }
    if (poags.multi.names.includes(node[T_NAME])) {
      return options.stacked_colour;
    }
    if (node[T_IS_ROOT]) {
      return options.root_node_fill;
    }
    else {
      return phylo_options.legend.colour_scale(node[T_Y]);
    }
  })
  .attr("opacity", function () {
    if (phylo_options.tree.collapsed_selection != null && node[T_ID]
        == phylo_options.tree.collapsed_selection[G_ID]) {
      return 0.2;
    } else if (node[T_EXTANT] || node[T_TERMINATED]) {
      return 0;
    } else {
      return options.opacity;
    }
  })
  .attr("stroke-width", options.stroke_width)
  .attr("data-toggle", "modal")
  .attr("data-target", "#resultsTreeModal")
  .on("mouseover", function () {
    var node_selected = d3.select(this);
    // call function to update components
    on_node_mouseover(node_selected);
  })
  .on("mouseout", function () {
    var node_selected = d3.select(this);
    // update components
    on_node_mouseout(node_selected);
  })
  .on("contextmenu", function () {
    var id = d3.select(this).attr("id").split("fill-")[1];
    var node_name = d3.select("#text-" + id).attr("name");
    var node_id = id;
    var node_fill = phylo_options.legend.colour_scale(node[N_Y]);
    d3.event.preventDefault();
    if (!node[T_EXTANT]) {
      menu(d3.mouse(this)[0], d3.mouse(this)[1], node_name, node_fill, node_id);
    }
  })
  .on("click", function () {
    this.parentNode.appendChild(this);

    d3.selectAll("#usedTreeModal").remove();
    d3.selectAll("#text-modal-tax-label").remove();

    d3.select("#modalTreeHeader").append("text")
    .attr("id", "text-modal-tax-label")
    .attr("name", node[T_NAME])
    .attr("font-family", options.font_family)
    .attr("font-size", options.font_size)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("opacity", 1)
    .attr("transform", "translate(0,20)")
    .text(function () {
      return node[T_NAME];
      // if (node[T_EXTANT]) {
      //   return node[T_NAME];
      // } else {
      //   return node[T_NAME];
      // }
    });

    // find number in histogram (only want modal large if there are many items in the histogram)
    var node_info = phylo_options.tree.node_dict[node[T_ID]];

    if ($(window).width() > options.modal_min_width && node_info[T_COMMON_TAXA]
        !== undefined) {
      var tax_diff = node_info[T_TAXA][node_info[T_COMMON_TAXA].differ_rank];
      options.modal_width = 0.8 * $(window).width() - 2
          * options.modal_min_width / Object.keys(tax_diff).length;
    } else {
      options.modal_width = options.modal_min_width;
    }
    var modal_container = d3.select("#modalTree")
    .append("svg")
    .attr("id", "usedTreeModal")
    .attr("width", options.modal_width)
    .attr("height", options.modal_height)
    .style("display", "block")
    .style("margin", "auto");

    var modal_group = modal_container.append("g")
    .attr("opacity", 1);
    //.attr("transform", "translate(100, 50)scale(1.5)");

    add_taxonomy_modal_info(node, modal_group, options);

  });

};

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
  var x = node[T_X];
  var y = node[T_Y];
  if (node[T_EXTANT]) {
    class_label = "extent";
    deg = 90;
  }
  group.append("text")
  .attr("id", "text-" + node[T_ID])
  .attr("class", class_label)
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("fill", function () {
    if (node[T_CONTAINS_SEARCH]) {
      return options.search_colour;
    } else {
      return options.font_colour;
    }
  })
  .attr("text-anchor", function () {
    if (node[T_EXTANT]) {
      return "start";
    } else {
      return "middle";
    }
  })
  .attr("opacity", function () {
    if (node[T_EXTANT] || (phylo_options.tree.collapsed_selection != null
            && node[T_ID] == phylo_options.tree.collapsed_selection[T_ID])) {
      return 1;
    } else {
      return 0;
    }
  })
  .attr("transform", "translate(" + x + "," + y + ") rotate(" + deg
      + ") translate(2,2)")
  .text(function () {
    return node[T_NAME];
  });
};

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
  .attr("id", "circle-" + node[T_ID])
  .attr("class", function () {
    if (node[T_EXTANT]) {
      return "extent";
    } else {
      return "node";
    }
  })
  .attr("cx", node[T_X])
  .attr("cy", node[T_Y])
  .attr("r", function (d) {
    if (node[T_EXTANT]) {
      return options.extent_radius * options.under_node_multiplier;
    } else {
      return options.node_radius * options.under_node_multiplier;
    }
  })
  .attr("fill", "white")
  .attr("stroke", options.under_stroke)
  .attr("opacity", function () {
    if (node[T_EXTANT] || node[T_TERMINATED]) {
      return 0;
    } else {
      return options.opacity;
    }
  })
  .attr("stroke_width", options.stroke_width);
};

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
    if (initial || !phylo_options.tree.node_dict[node[T_ID]][T_COLLAPSED]) {
      // Add a white under circle to make it pretty
      draw_phylo_under_circle(group, node, n);

      // Add the node label
      draw_phylo_text(group, node, n);

      // Add the node which has the colour for extants and the
      // function for hover
      draw_phylo_circle(group, node, n);
    }

  }
};

/**
 * Changes the node text to be visible when a user hovers over a node.
 * Also updates the node to increase in size so it is obvious which node is being selected.
 *
 * Parameter:
 *      node_selected: d3 node object, contains styling and coords etc.
 */
var on_node_mouseover = function (node_selected) {
  var options = phylo_options.style;
  var id = node_selected.attr("id").split("fill-")[1];
  var view_node_labels = document.getElementById(
      'node-text-toggle').innerHTML.split(" | ")[1] == "ON";
  var view_extant_labels = document.getElementById(
      'extant-text-toggle').innerHTML.split(" | ")[1] == "ON";
  if (node_selected.attr("class") == "extent") {
    d3.select("#text-" + id).attr("opacity",
        view_extant_labels ? options.extant_label_opacity : 1);
  }
  if (!view_node_labels && node_selected.attr("class") == "node") {
    d3.select("#path-" + id).style("opacity", 0);
    node_selected.attr("r", options.hover_radius);
    var y = d3.select("#circle-" + id).attr("cy");
    if (node_selected.attr("name") == phylo_options.tree.selected_node.name) {
      node_selected.attr("fill", phylo_options.style.select_colour);
    } else {
      node_selected.attr("fill", phylo_options.legend.colour_scale(y));
    }
    node_selected.attr("opacity", 0.2);
    node_selected.attr("stroke-width", "0px");
    d3.select("#text-" + id).attr("opacity", 1);
  }
};

/**
 * Changes the node back to the original colour and size.
 * Changes the text i.e. node name back to being hidden.
 *
 * Parameter:
 *      node_selected: d3 node object, contains styling and coords etc.
 */
var on_node_mouseout = function (node_selected) {
  var options = phylo_options.style;
  var id = node_selected.attr("id").split("fill-")[1];
  var view_node_labels = document.getElementById(
      'node-text-toggle').innerHTML.split(" | ")[1] == "ON";
  var view_extant_labels = document.getElementById(
      'extant-text-toggle').innerHTML.split(" | ")[1] == "ON";
  if (node_selected.attr("class") == "extent") {
    d3.select("#text-" + id).attr("opacity",
        view_extant_labels ? 1 : options.extant_label_opacity);
  }
  var terminated = d3.select("#path-" + id).attr("class") == "collapsed-node";
  if (!view_node_labels && node_selected.attr("class") == "node") {
    node_selected.attr("r", options.node_radius);
    d3.select("#circle-" + id).attr("r", options.node_radius
        * options.under_node_multiplier);
    var y = d3.select("#fill-" + id).attr("cy");
    if (node_selected.attr("name") == phylo_options.tree.selected_node.name) {
      node_selected.attr("fill", phylo_options.style.select_colour);
    } else {
      node_selected.attr("fill", phylo_options.legend.colour_scale(y));
    }
    if (!terminated) {
      // draw circle
      node_selected.attr("opacity", 1);
      node_selected.attr("stroke-width", options.stroke_width);
    } else {
      // draw collapsed symbol
      d3.select("#path-" + id).style("opacity", 1);
    }
    d3.select("#text-" + id).attr("opacity", 0);
  }

};

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
};

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
  .text(branch[B_LABEL].toFixed(4)) // Limit to 4 decimal places
  .attr("class", "branch-text")
  .attr("text-anchor", "middle")
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("fill", options.branch_stroke)
  .attr("transform", "translate(" + branch[B_X1] + 5 + "," + (branch[B_Y1]
      + branch[B_Y2]) / 2 + ") rotate(90) translate(1,-5)")
  .attr("opacity", 0);
};

/**
 * User can select to toggle the branch text on or off
 * Action: Gets called when user clicks a button.
 */

var toggle_branch_text = function () {
  var button_text = document.getElementById(
      'branch-text-toggle').innerHTML.split(" | ")[1];
  if (button_text == "ON") {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
    document.getElementById(
        'branch-text-toggle').innerHTML = "View branch length | OFF";
  } else {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
    document.getElementById(
        'branch-text-toggle').innerHTML = "View branch length | ON";
  }
};

var toggle_node_text = function () {
  var button_text = document.getElementById('node-text-toggle').innerHTML.split(
      " | ")[1];
  phylo_options.svg.selectAll('circle.node').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") == 1) ? 0 : 1);
  });
  phylo_options.svg.selectAll('text.node').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") == 1) ? 0 : 1);
  });
  if (button_text == "ON") {
    document.getElementById(
        'node-text-toggle').innerHTML = "View node labels | OFF";
  } else {
    document.getElementById(
        'node-text-toggle').innerHTML = "View node labels | ON";
  }
};

var toggle_additive = function () {
  var additive = document.getElementById('additive-toggle').innerHTML.split(
      " | ")[1];
  if (additive == "Additive") {
    document.getElementById(
        'additive-toggle').innerHTML = "View tree type | Cladogram";
  } else {
    document.getElementById(
        'additive-toggle').innerHTML = "View tree type | Additive";
  }
  clear_svg();
  refresh_tree();
};

var toggle_extant_text = function () {
  var button_text = document.getElementById(
      'extant-text-toggle').innerHTML.split(" | ")[1];
  phylo_options.svg.selectAll('text.extent').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") == 1)
        ? phylo_options.style.extant_label_opacity : 1);
  });
  if (button_text == "ON") {
    document.getElementById(
        'extant-text-toggle').innerHTML = "View extant labels | OFF";
  } else {
    document.getElementById(
        'extant-text-toggle').innerHTML = "View extant labels | ON";
  }
};

/**
 * Draws the branches of the phylo tree
 */
var draw_phylo_branches = function (phylo_options, initial) {
  var group = phylo_options.group;
  var options = phylo_options.style;

  for (var b in phylo_options.tree.all_branches) {
    var branch = phylo_options.tree.all_branches[b];
    if (initial || (!phylo_options.tree.node_dict[branch[B_ID]][T_COLLAPSED]
            && !phylo_options.tree.node_dict[branch[B_ID]][T_TERMINATED])) {
      group.append("line")
      .attr("class", "branch")
      .style("stroke", options.branch_stroke)
      .style("stroke-width", options.branch_stroke_width)
      .attr("x1", branch[B_X1])
      .attr("x2", branch[B_X2])
      .attr("y1", branch[B_Y1])
      .attr("y2", branch[B_Y2]);
      // If it isn't a parent branch add the branch length
      if (branch[B_Y1] != branch[B_Y2]) {
        draw_branch_text(group, branch);
      }
    }
  }
};

/**
 * Makes an array of "depths" from the logest distance
 * from the root so we don't get overlapping tree branches.
 */
var make_depth_array = function (phylo_options) {
  var depth = 0;
  var depth_array = [];
  var depth_size = phylo_options.tree.longest_distance_from_root_to_extant
      / (phylo_options.tree.max_depth / 2);

  while (depth < phylo_options.tree.longest_distance_from_root_to_extant) {
    depth_array.push(depth);
    depth += depth_size;
  }

  phylo_options.depth_array = depth_array;
  return phylo_options;
};

var set_phylo_params = function (tree_div, tree_string) {
  phylo_options.svg_info.div_id = tree_div;
  phylo_options.svg_info.width = '100%';//window.innerWidth - 200;
  phylo_options.tree_string = tree_string;
  phylo_options = setup_phylo_svg(phylo_options);
};

var clear_svg = function () {
  var group = phylo_options.group;
  group.selectAll("path").remove();
  group.selectAll("line").remove();
  group.selectAll("text").remove();
  group.selectAll("rect").remove();
  group.selectAll("circle").remove();

};

/**
 * Sets up the tree and calls the other functions
 */
var run_phylo_tree = function () {
  // Make sure the group has no children

  var group = phylo_options.svg.append("g")
  .attr("transform", "translate(" + phylo_options.svg_info.margin.left + ","
      + phylo_options.svg_info.margin.top + ")");

  phylo_options.group = group;

  phylo_options.tree.all_nodes = [];
  phylo_options.tree.all_branches = [];

  var tree_json = parse_newick(phylo_options.tree_string);

  tree_json[T_DIST_FROM_ROOT] = 0;
  tree_json[T_PARENT] = [];
  tree_json[T_PARENT][T_RAW_X] = 0;
  tree_json[T_PARENT][T_DEPTH] = 0;
  tree_json[T_PARENT][T_DIST_FROM_ROOT] = 0; //{raw_x: 0, depth: 0, distance_from_root: 0};
  tree_json[T_IS_ROOT] = true;
  phylo_options.tree.root = makeRootNode(tree_json);
  tree_json = phylo_options.tree.root;

  phylo_options.tree.max_depth = 0;
  phylo_options.tree.max_y = 0;

  assign_extant_count(tree_json);

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

  /* For each of the leaf nodes iterate back up
   * through the tree and assign x coords to inner nodes. */
  for (var n in phylo_options.left_leaf_nodes) {
    assign_inner_x_coords(phylo_options.left_leaf_nodes[n][T_PARENT],
        phylo_options);
  }

  /* Assign x coords of the root */
  tree_json[T_RAW_X] = (tree_json[T_CHILDREN][0][T_RAW_X]
      + tree_json[T_CHILDREN][tree_json[T_CHILDREN].length - 1][T_RAW_X]) / 2;

  /* Set the max x */
  phylo_options.tree.max_x = phylo_options.leaf_count;

  phylo_options = make_tree_scale(phylo_options);
  tree_json[T_Y] = phylo_options.y_scale(0);

  tree_json[T_X] = phylo_options.x_scale(tree_json[T_RAW_X]);

  //phylo_options.tree.node_depth_dict[1] = [];
  //phylo_options.tree.node_depth_dict[1].push(tree_json);
  phylo_options.tree.all_nodes.push(tree_json);
  phylo_options.tree.node_dict[tree_json[T_ID]] = tree_json;

  assign_node_coords(tree_json, false, 0);

  // collect all the nodes
  var nodes = phylo_options.tree.all_nodes;
  if (phylo_options.tree.selected_node === null) {
    phylo_options.tree.selected_node = nodes[0]; // set root node as selected (initial)
  }

  // Draw the branches and the nodes
  draw_phylo_branches(phylo_options, true);
  draw_phylo_nodes(phylo_options, true);
  assign_num_children(phylo_options.tree.root);
  collapse_subtree(phylo_options.tree.root, phylo_options.tree.initial_node_num);

  let ansc = [];
  for (let n in phylo_options.tree.all_nodes) {
    if (!phylo_options.tree.all_nodes[n][T_EXTANT]) {
      ansc.push(phylo_options.tree.all_nodes[n][T_NAME]);
    }
  }
  initDownloadOptions(ansc);
};

let initDownloadOptions = function (options) {
  $.map(options, function (x) {
    return $('#multiselect-download').append("<option>" + x + "</option>");
  });
}

/**
 *  Collapse the subtree from node, leaving num_expanded leaves or collapsed nodes in total
 */
var collapse_subtree = function (node, num_expanded) {
  var threshold = get_collapse_threshold(node, num_expanded);

  // search through children until evolutionary distance is crossed and collapse under this
  collapse_above_threshold(node, threshold);

  refresh_tree()
};

var collapse_above_threshold = function (node, threshold) {
  var all_children_above = true;
  for (var c in node[T_CHILDREN]) {
    if (node[T_CHILDREN][c][T_DIST_FROM_ROOT] <= threshold) {
      all_children_above = false;
    }
  }
  if (all_children_above && node[T_CHILDREN] !== undefined) {
    set_children_collapsed(node);
    phylo_options.tree.collapse_under.push(node);
  } else {
    for (var c in node[T_CHILDREN]) {
      collapse_above_threshold(node[T_CHILDREN][c], threshold);
    }
  }
};

/**
 * Find the evolutionary distance-based threshold for collapsing nodes.
 * @param node
 * @param num_expanded
 */
var get_collapse_threshold = function (node, num_expanded) {
  var nodes = [];
  // populate nodes list of all child nodes of current node
  nodes = populate_node_list(node, nodes);

  nodes = quicksort_evol_dist(nodes, 0, nodes.length - 1);

  if (num_expanded >= nodes.length) {
    return nodes[nodes.length - 1][T_DIST_FROM_ROOT];
  }

  // ensure this node does not get set to collapse
  for (var c in node[T_CHILDREN]) {
    if (node[T_CHILDREN][c][T_DIST_FROM_ROOT]
        > nodes[num_expanded][T_DIST_FROM_ROOT]) {
      return node[T_CHILDREN][c][T_DIST_FROM_ROOT];
    }
  }
  return nodes[num_expanded][T_DIST_FROM_ROOT];
};

var populate_node_list = function (node, nodes) {
  nodes.push(node);
  for (var c in node[T_CHILDREN]) {
    nodes = populate_node_list(node[T_CHILDREN][c], nodes);
  }
  return nodes;
};

var quicksort_evol_dist = function (list, left, right) {

  var pivot;
  if (left < right) {
    pivot = right;
    var index = partition(list, pivot, left, right);

    // sort left and right sides of the list
    quicksort_evol_dist(list, left, index - 1);
    quicksort_evol_dist(list, index + 1, right);
  }

  return list;
};

var partition = function (list, pivot, left, right) {
  var pivot_value = list[pivot];
  var index = left;

  for (var i = left; i < right; i++) {
    if (list[i][T_DIST_FROM_ROOT] < pivot_value[T_DIST_FROM_ROOT]) {
      swap(list, i, index);
      index++;
    }
  }
  swap(list, right, index);
  return index;
};

var swap = function (list, i, j) {
  var tmp = list[i];
  list[i] = list[j];
  list[j] = tmp;
};

/**
 * Iterate through tree from node, collapsing any nodes not in collapse_list
 */

var inorder_collapse = function (node, collapse_list) {

  if (node != null) {
    if (node[T_CHILDREN] != undefined) {
      // If this node isn't in the expand list

      if (collapse_list.indexOf(node[N_NAME]) == -1) {
        set_children_collapsed(node);
        phylo_options.tree.collapse_under.push(node);
      } else {
        for (var c in node[T_CHILDREN]) {
          inorder_collapse(node[T_CHILDREN][c], collapse_list);
        }
      }

    }
  }

};

/**
 * Expand under a certain node while collapsing all the other nodes
 */

var expand_and_collapse_others = function (node) {
  var parent_list = [];
  var expand_list = get_parents_to_root(node, parent_list);

  inorder_collapse(phylo_options.tree.root, expand_list);
  var ind = phylo_options.tree.collapse_under.indexOf(node);
  if (ind == -1) {
    return;
  }
  phylo_options.tree.collapse_under.splice(ind, 1);
  set_children_un_collapsed(node);
  node[T_TERMINATED] = false;
  node[T_COLLAPSED] = false;

  collapse_subtree(node, phylo_options.tree.expand_node_num);
  refresh_tree()

};

/**
 * Get a list of the nodes leading to the root from a certain node
 */

var get_parents_to_root = function (node, parent_list) {

  // if we're at the root
  if (node.parent == undefined) {
  }
  else {
    parent_list.push(node.parent.name);
    get_parents_to_root(node.parent, parent_list)
  }
  return parent_list
};

/**
 * Returns if there exists values that intersect arr1 and arr2
 *
 * @param arr1
 * @param arr2
 */
var is_intersect = function (arr1, arr2) {
  for (var a1 in arr1) {
    if (arr2.includes(a1)) {
      return true;
    }
  }
  for (var a2 in arr2) {
    if (arr1.includes(a2)) {
      return true;
    }
  }
  return false;
};

/**
 *  Redraw the tree structure stored in phylo_options.tree
 */
var redraw_phylo_tree = function () {
  var options = phylo_options;
  var root = phylo_options.tree.root;

  clear_svg();
  phylo_options.leaf_count = 0; // reset, will be re-calculated based on visible nodes TODO
  // reset x value for drawing
  for (var n in phylo_options.tree.node_dict) {
    phylo_options.tree.node_dict[n][T_RAW_X] = 0;
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
    assign_inner_x_coords(phylo_options.left_leaf_nodes[n][T_PARENT],
        phylo_options);
  }

  /* Assign x coords of the root */
  root[T_RAW_X] = (root[T_CHILDREN][0][T_RAW_X] + root[T_CHILDREN][root[T_CHILDREN].length
  - 1][T_RAW_X]) / 2;

  /* Set the max x */
  phylo_options.tree.max_x = phylo_options.leaf_count;

  phylo_options = make_tree_scale(phylo_options);
  root[T_Y] = phylo_options.y_scale(0);

  root[T_X] = phylo_options.x_scale(root[T_RAW_X]);

  assign_node_coords(root, 0);

  // re-populate all_nodes and all_branches for drawing
  phylo_options.tree.all_nodes_taxonomy = [];
  phylo_options.tree.all_branches = [];
  phylo_options.tree.all_nodes = [];
  phylo_options.tree.all_nodes.push(make_child(root, false, phylo_options.tree.all_nodes.length));
  add_children_nodes(root, false);

  // Draw the branches and the nodes
  draw_phylo_branches(phylo_options, false);

  if (phylo_options.tree.collapse_under.length > 0) {
    for (var n in phylo_options.tree.collapse_under) {
      phylo_options.tree.collapse_under[n][T_COLLAPSED] = false;
      phylo_options.tree.collapse_under[n][T_TERMINATED] = true;
    }
  }

  draw_phylo_nodes(phylo_options, false);

};

/**
 * Assigns the parent nodes based on the x coords of the children.
 *
 * Travels from the leaf nodes up assigning parent node based on
 * 1/2 between left and right child.
 */
var assign_inner_x_coords = function (node, phylo_options) {
  /* Assign the x coords based on that of the children*/
  node[T_RAW_X] = (node[T_CHILDREN][0][T_RAW_X] + node[T_CHILDREN][node[T_CHILDREN].length
  - 1][T_RAW_X]) / 2;

  if (node[T_IS_ROOT] != true) {
    assign_inner_x_coords(node[T_PARENT], phylo_options);
  }
};

var assign_extant_count = function (node) {
  /* Assign the number of extants under this node by cumulatively adding from it's children */
  var num_extants = 0;
  if (node[T_CHILDREN] !== undefined) {
    for (var n in node[T_CHILDREN]) {
      var child = node[T_CHILDREN][n];
      if (child[T_NUM_EXTANTS] === undefined) {
        assign_extant_count(child);
      }
      if (child[T_NUM_EXTANTS] === 0) {
        num_extants += 1;
      } else {
        num_extants += child[T_NUM_EXTANTS];
      }
    }
  }
  node[T_NUM_EXTANTS] = num_extants;
  return node[T_NUM_EXTANTS];
};

/**
 * Assigns the x coords of leafs/terminating nodes.
 *
 * Leaf is used to define either a left node, i.e. extant or
 * a terminating node (i.e. we are not displaying the children
 * of that node).
 */
var assign_leaf_x_coords = function (node, phylo_options) {

  if (node[T_COLLAPSED] && !node[T_TERMINATED]) {
    return;
  }

  /* This is a leaf (or terminating node) so assign the current x count */
  if (node[T_CHILDREN] == undefined || node[T_TERMINATED] == true) {
    node[T_RAW_X] = phylo_options.leaf_count;
    phylo_options.leaf_count += 1;
    /* Add one of the children to the leaf node array so
     * we traverse up from only half the nodes when assigning
     * parent coords. */
    if (node[T_LEFT]) {
      phylo_options.left_leaf_nodes.push(node);
    }
    return;
  }

  /* Otherwise DFS left child first */
  for (var n in node[T_CHILDREN]) {
    if (n == 0) {
      node[T_CHILDREN][n][T_LEFT] = true;
    } else {
      node[T_CHILDREN][n][T_LEFT] = false;
    }
    node[T_CHILDREN][n][T_PARENT] = node;
    assign_leaf_x_coords(node[T_CHILDREN][n], phylo_options);
  }
};

/**
 * Make the root node
 */
let makeRootNode = function (node) {
  node[T_ID] = node[T_NAME].split(/[._-]+/)[0];
  node[T_LEFT] = false;

  if (node[T_COMMON_TAXA] === undefined) {
    node[T_COMMON_RANK] = undefined;
    node[T_COMMON_TAXA] = undefined;
  } else {
    node[T_COMMON_RANK] = node[T_COMMON_TAXA].common_rank;
    node[T_COMMON_TAXA] = node[T_COMMON_TAXA].common_taxonomy;
    node[T_DIFFER_RANK] = node[T_COMMON_TAXA].differ_rank;
    node[T_TAXA] = node[T_TAXA];
  }
  if (node[T_CHILDREN] === undefined) {
    node[T_EXTANT] = true;
  } else {
    node[T_EXTANT] = false;
  }
  return node;
};


/**
 * Helper that makes a cut down node.
 */
var make_child = function (node, left, id) {
  var child = [];
  child[T_ID] = formatTreeNodeId(node[T_NAME]);
  child[T_LEFT] = left;
  child[T_NAME] = node[T_NAME];
  child[T_Y] = node[T_Y];
  child[T_X] = node[T_X];
  child[T_NUM_EXTANTS] = node[T_NUM_EXTANTS];
  child[T_COLLAPSED] = node[T_COLLAPSED];
  child[T_TERMINATED] = node[T_TERMINATED];
  child[T_CONTAINS_SEARCH] = node[T_CONTAINS_SEARCH];
  if (node[T_COMMON_TAXA] === undefined) {
    child[T_COMMON_RANK] = undefined;
    child[T_COMMON_TAXA] = undefined;
  } else {
    child[T_COMMON_RANK] = node[T_COMMON_TAXA].common_rank;
    child[T_COMMON_TAXA] = node[T_COMMON_TAXA].common_taxonomy;
    child[T_DIFFER_RANK] = node[T_COMMON_TAXA].differ_rank;
    child[T_TAXA] = node[T_TAXA];
  }
  if (node[T_CHILDREN] === undefined) {
    child[T_EXTANT] = true;
  } else {
    child[T_EXTANT] = false;
  }

  return child;
};

/**
 * Helper function that formats a node ID.
 * @param nodeLabel
 * @returns {*|string}
 */
let formatTreeNodeId = function (nodeLabel) {
  let h = nodeLabel.split(/[._-|]+/);
  let k = h.join('');
  return k;
};

/**
 * Before we can assign depths need to first determine the longest
 * branch length.
 *
 * This involves traversing down the tree from root to tip
 * and keeping track of the longest branch.
 *
 * During this function we will also make the reverse relationship ->
 * i.e. keep track of each nodes parent and also store the extants.
 *
 * This way we will be able to assign coords to x based on how many children
 * a node has and ensure the tree continues to look somewhat balenced even if
 * one branch stops early on.
 */
var get_distance_from_root = function (node, depth, phylo_options, initial) {
  // Make a node id based on name and node count
  // only assign on initial load
  if (initial) {
    node[T_ID] = formatTreeNodeId(node[T_NAME]); //phylo_options.tree.node_count;//+ node[T_NAME].split(/[._-]+/)[0];
    node[T_COLLAPSED] = false;
    phylo_options.tree.node_dict[node[T_ID]] = node;
    depth += 1;
    phylo_options.tree.node_count += 1;
  }
  node[T_EXTANT] = false;
  if (node[T_CHILDREN] == undefined) {
    node[T_EXTANT] = true;
    // Check if this is the longest branch
    if (node[T_DIST_FROM_ROOT]
        > phylo_options.tree.longest_distance_from_root_to_extant) {
      phylo_options.tree.longest_distance_from_root_to_extant = node[T_DIST_FROM_ROOT];
    }
    if (depth > phylo_options.tree.max_depth) {
      phylo_options.tree.max_depth = depth;
    }
    // Set the max children of the node to be 0.
    node[T_MAX_CHILDREN] = 1;
    if (initial) {
      phylo_options.tree.extants.push(node);
    }
    return;
  }
  // Otherwise we need to calculate the cumulative branch lengths
  // of the children and assign the nodes the value as:
  //      node[T_DIST_FROM_ROOT]\
  for (var n in node[T_CHILDREN]) {
    node[T_CHILDREN][n][T_DIST_FROM_ROOT] = node[T_DIST_FROM_ROOT] + node[T_CHILDREN][n][T_BRANCH_LEN];

    // Add this node as the parent of these children
    node[T_CHILDREN][n][T_PARENT] = node; // ToDo: was parent_node

    // Add to a dictionary of nodes.
    // Will use this when traversing from the extants up to the parent.
    //phylo_options.node_dict[node.id] = node;

    get_distance_from_root(node[T_CHILDREN][n], depth, phylo_options, initial);
  }
};

/**
 *
 * Traverse the tree from the extants (i.e. leaf nodes and
 * assign the number of children below).
 *
 * Assign the node to have the max number of children,
 * this will be used to calculate how large the x
 * area is that we want to assign.
 *
 */
var assign_num_children = function (node) {
  if (node[T_CHILDREN] != undefined) {
    var left_child_count = node[T_CHILDREN][0][T_MAX_CHILDREN] + 2;
    var right_child_count = node[T_CHILDREN][1][T_MAX_CHILDREN] + 2;

    if (isNaN(left_child_count)) {
      left_child_count = 0;
    }

    if (isNaN(right_child_count)) {
      right_child_count = 0;
    }

    if (left_child_count > right_child_count) {
      node[T_MAX_CHILDREN] = left_child_count;
    } else {
      node[T_MAX_CHILDREN] = right_child_count;
    }

    if (node[T_PARENT] == undefined) {
      return; // We have reached the root
    }
    return assign_num_children(node[T_PARENT]);
  }
};

/**
 * Recur one more time and add all the children.
 **/
var add_children_nodes = function (node, initial) {
  if (node[T_CHILDREN] != undefined) {
    for (var n in node[T_CHILDREN]) {
      if (n == 0) {

        // Make the branch from parent out to children x's
        // Check if both children exist
        var branch_parent = [
          node[T_ID],   /*B_ID*/
          node[T_Y],       /*B_Y1*/
          node[T_Y],       /*B_Y2*/
          node[T_CHILDREN][0][T_X],  /*B_X1*/
          node[T_CHILDREN][node[T_CHILDREN].length - 1][T_X]  /*B_X2*/
        ];
        // Make each of the children branches, these are vertical connectors
        // between the parent center branch and the child nodes.
        var branch_left_child = [
          node[T_ID],
          node[T_Y],
          node[T_CHILDREN][0][T_Y],
          node[T_CHILDREN][0][T_X],
          node[T_CHILDREN][0][T_X],
          node[T_CHILDREN][0][T_BRANCH_LEN] /*B_LABEL*/
        ];
        // Add the branches to a list of all branches to be drawn later
        phylo_options.tree.all_branches.push(branch_parent);
        phylo_options.tree.all_branches.push(branch_left_child);

        var left_child = make_child(node[T_CHILDREN][0], true, phylo_options.tree.all_nodes.length);
        // phylo_options.tree.node_dict[left_child[T_ID]] = left_child;
        phylo_options.tree.all_nodes.push(left_child);
      } else {
        var branch_right_child = [
          node[T_ID],
          node[T_Y],
          node[T_CHILDREN][n][T_Y],
          node[T_CHILDREN][n][T_X],
          node[T_CHILDREN][n][T_X],
          node[T_CHILDREN][n][T_BRANCH_LEN]
        ];
        let x2 = node[T_CHILDREN][n][T_X];
        phylo_options.tree.all_branches.push(branch_right_child);
        var right_child = make_child(node[T_CHILDREN][n], false,
            phylo_options.tree.all_nodes.length);
        // phylo_options.tree.node_dict[right_child[T_ID]] = right_child;
        phylo_options.tree.all_nodes.push(right_child);
      }
    }
  } else {
    return;
  }
  for (var n in node[T_CHILDREN]) {
    add_children_nodes(node[T_CHILDREN][n], initial);
  }
};

/**
 * Assign node coods updates the node x and y coords
 * to be valyes to draw on the page rather than placement
 * variables i.e. scales the coordinates depending on the
 * width and height of the SVG element.
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
    node[T_Y] = phylo_options.y_scale(node[T_DIST_FROM_ROOT]);
  } else {
    node[T_Y] = phylo_options.y_scale(depth);
  }

  // Check that the node.x is not NAN
  if (node[T_IS_LEFT]) {
    // We add a instep if it is on the LHS and RHS so that we
    // don't get overlap.
    node[T_X] = phylo_options.x_scale(node[T_RAW_X] + node_instep);
  } else {
    node[T_X] = phylo_options.x_scale(node[T_RAW_X] - node_instep);
  }

  if (node[T_CHILDREN] == undefined) {
    if (additive == false) {
      node[T_Y] -= phylo_options.y_scale(0.2);
    }
    if (node[T_IS_LEFT]) {
      node[T_X] = phylo_options.x_scale(node[T_RAW_X] + node_instep);
    } else {
      node[T_X] = phylo_options.x_scale(node[T_RAW_X] - node_instep);
    }
  }

  // Recursively call the assign node coords on each child of
  // the node.
  if (node[T_CHILDREN] != undefined) {
    for (var n in node[T_CHILDREN]) {
      assign_node_coords(node[T_CHILDREN][n], depth + 1);
    }
  }
  // Return after recurring.

};

/**
 * Parsing the newick format of a tree to JSON.
 * From:
 *      https://github.com/daviddao/biojs-io-newick
 *      under: Apache2 license
 */
var parse_newick = function (s) {
  var ancestors = [];
  var tree = [];
  var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    switch (token) {
      case '(': // new children
        var subtree = [];
        tree[T_CHILDREN] = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': // another branch
        var subtree = [];
        ancestors[ancestors.length - 1][T_CHILDREN].push(subtree);
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
          tree[T_NAME] = token;
        } else if (x == ':') {
          tree[T_BRANCH_LEN] = parseFloat(token);
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
    if (!arguments.length) {
      return items;
    }
    for (let i in arguments) {
      items.push(arguments[i]);
    }
    rescale = true;
    return menu;
  };

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
  phylo_options.tree.collapsed_selection = null;
  document.getElementById('reset-button').disabled = true;
  if (call_type == "View joint reconstruction") {
    select_node(call.attr("id"));
    refresh_tree();

    displayJointGraph(call.attr("id"), node_fill, true);
    reset_poag_stack();
  } else if (call_type == "Add joint reconstruction") {
    document.getElementById('reset-button').disabled = false;
    d3.select("#fill-" + node_id).attr("stroke",
        phylo_options.style.stacked_colour);
    displayJointGraph(call.attr("id"), node_fill, false);
  } else if (call_type == "Expand subtree") {
    var node = phylo_options.tree.node_dict[node_id];
    phylo_options.tree.collapsed_selection = node;
    var ind = phylo_options.tree.collapse_under.indexOf(node);
    if (ind == -1) {
      return;
    }
    phylo_options.tree.collapse_under.splice(ind, 1);
    set_children_un_collapsed(node);
    node[T_TERMINATED] = false;
    collapse_subtree(node, phylo_options.tree.expand_node_num);
    refresh_tree();

  } else if (call_type == "Collapse subtree") {
    var node = phylo_options.tree.node_dict[node_id];
    if (phylo_options.tree.collapse_under.indexOf(node) > -1) {
      return; // already collapsed
    }
    set_children_collapsed(node);
    node[T_TERMINATED] = true;
    phylo_options.tree.collapsed_selection = node;
    node[T_COLLAPSED] = false;
    phylo_options.tree.collapse_under.push(node);
    refresh_tree()
  } else if (call_type == "Expand subtree and collapse others") {
    var node = phylo_options.tree.node_dict[node_id];
    phylo_options.tree.collapsed_selection = node;
    expand_and_collapse_others(node);
  } else {
    select_node(call.attr("id"));
    perform_marginal(call.attr("id"), node_fill);
    reset_poag_stack();

    /**
     * ToDo : may need to move the reset POAG stack function back above.
     */
  }

};

/*
var show_expand_collapse_node = function (node) {
    for (var n in phylo_options.tree.node_dict) {
        if (n.id != node.id) {

        }
    }
    node.attr("r", options.hover_radius);
    node.attr("opacity", 0.2);
}*/

/**
 *  Sets all the children of a node to be collapsed.
 *
 */
var set_children_collapsed = function (node) {
  node[T_COLLAPSED] = true;
  node[T_TERMINATED] = false;
  //if (node.parent_node !== undefined) {
  //    node.parent_node[T_TERMINATED] = true;
  //}

  // Remove all nodes from the collapse under array
  var ind = phylo_options.tree.collapse_under.indexOf(node);
  if (ind != -1) {
    phylo_options.tree.collapse_under.splice(ind, 1);
  }

  for (var n in node[T_CHILDREN]) {
    set_children_collapsed(node[T_CHILDREN][n]);
  }
};

/**
 * Sets all the children of a node back to being not collapsed.
 */
var set_children_un_collapsed = function (node) {
  node[T_COLLAPSED] = false;
  for (var n in node[T_CHILDREN]) {
    if (node[T_CHILDREN][n][T_TERMINATED]) {
      return;
    }
    set_children_un_collapsed(node[T_CHILDREN][n]);
  }
};

var set_children_un_terminated = function (node) {
  node[T_TERMINATED] = false;
  node[T_COLLAPSED] = false;
  for (var n in node[T_CHILDREN]) {
    set_children_un_terminated(node[T_CHILDREN][n]);
  }
};

/**
 * Indicate that the node has been selected, and set all other nodes to be not selected (boolean flag node param).
 **/
var select_node = function (node) {
  var options = phylo_options.style;
  var nodes = phylo_options.tree.all_nodes;
  for (var n in nodes) {
    if (nodes[n][T_NAME] == node) {
      phylo_options.tree.selected_node = nodes[n];
      d3.select("#fill-" + nodes[n][T_ID]).attr("fill", options.select_colour);
      return;
    }
  }
};

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

};

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
  node[T_DEPTH] = depth;
  node[T_MOD] = 0;
  node[T_RAW_X] = 0;

  if (depth > phylo_options.tree.max_y) {
    phylo_options.tree.max_y = depth;
  }

  if (node[T_CHILDREN] == undefined) {
    node[T_RAW_X] = 0;
    node[T_MOD] = 0;
    node[T_IS_LEFT] = true;
    return node;
  }

  if (node[T_CHILDREN].length == 1) {
    node[T_RAW_X] = setup(node[T_CHILDREN][0], depth + 1)[T_RAW_X];
    node[T_IS_LEFT] = true;
    node[T_MOD] = 0;
    return node;
  }

  var left = setup(node[T_CHILDREN][0], depth + 1);
  var right = setup(node[T_CHILDREN][1], depth + 1);

  // Set the left node and right node tags
  left[T_IS_LEFT] = true;
  right[T_IS_LEFT] = false;

  node[T_RAW_X] = fix_subtrees(left, right);

  if (node[T_RAW_X] < phylo_options.tree.min_x) {
    phylo_options.tree.min_x = node[T_RAW_X];
  }

  return node;
};

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
//        node[T_RAW_X] += (-1 * phylo_options.tree.min_x);
//    }

  node[T_RAW_X] = node[T_RAW_X] + modsum;

  // Keep track of the largest x coord
  if (node[T_RAW_X] > phylo_options.tree.max_x) {
    phylo_options.tree.max_x = node[T_RAW_X] + 1;
  }

  for (var child in node[T_CHILDREN]) {
    add_mods(node[T_CHILDREN][child], modsum + node[T_MOD]);
  }

  // Add the node to a list of nodes so that we can just draw all
  // in a single function that itterates over the array.
  phylo_options.tree.tree_nodes.push(node);

};

var contour = function (left, right, max_offset, left_offset, right_offset,
    left_outer, right_outer) {

  var delta = left[T_RAW_X] + left_offset - (right[T_RAW_X] + right_offset);

  if (max_offset === undefined || delta > max_offset) {
    max_offset = delta;
  }

  if (left_outer === undefined) {
    left_outer = left;
  }

  if (right_outer === undefined) {
    right_outer = right;
  }

  var lo = next_left(left_outer);
  var li = next_right(left);
  var ri = next_left(right);
  var ro = next_right(right_outer);

  if (li !== undefined && ri !== undefined) {
    left_offset += left[T_MOD];
    right_offset += right[T_MOD];
    return contour(li, ri, max_offset, left_offset, right_offset, lo, ro);
  }
  return [
      li,
      ri,
      max_offset,
      left_offset,
      right_offset,
      lo,
      ro
  ]
  // return {
  //   'li': li,
  //   'ri': ri,
  //   'max_offset': max_offset,
  //   'left_offset': left_offset,
  //   'right_offset': right_offset,
  //   'lo': left_outer,
  //   'ro': right_outer
  // };
};

/**
 * Helper function which returns the thread of the next node
 * if one exists.
 *
 * Otherwise if the node has a left child we return that.
 *
 * Undefined is returned otherwise.
 */
var next_left = function (node) {
  if (node[T_THREAD] !== undefined) {
    return node[T_THREAD];
  }
  if (node[T_CHILDREN] !== undefined) {
    return node[T_CHILDREN][0];
  }
  return undefined;
};

/**
 * Similar to the next_left function.
 */
var next_right = function (node) {
  if (node[N_THREAD] !== undefined) {
    return node[N_THREAD];
  }
  if (node[T_CHILDREN] !== undefined) {
    return node[T_CHILDREN][1];
  }
  return undefined;
};

/**
 * fix_subtrees updates the subtrees of a node.
 *
 * This is done itterattively so that each time we progress up the levels
 * of the trees we know we don't have to fix any lower trees as they
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
  var diff = contours[T_MAX_OFFSET];
  var ri = contours[T_RI];
  var ro = contours[T_RO];
  var lo = contours[T_LO];
  var li = contours[T_LI];
  var left_offset = contours[T_LEFT_OFFSET];
  var right_offset = contours[T_RIGHT_OFFSET];

  diff += 1;
  diff += (right[T_RAW_X] + diff + left[T_RAW_X]) % 2;
  right[N_MOD] = diff;
  right[T_RAW_X] += diff;

  if (right.children !== undefined) {
    right_offset += diff;
  }

  if (ri !== undefined && li === undefined) {
    lo[N_THREAD] = ri;
    lo[N_MOD] = right_offset - left_offset;
  } else if (li !== undefined && ri === undefined) {
    ro[N_THREAD] = li;
    ro[N_MOD] = left_offset - right_offset;
  }

  return (left[T_RAW_X] + right[T_RAW_X]) / 2;
};

var refresh_tree = function () {
  if (document.getElementById("additive-toggle").innerHTML.split(" | ")[1] != "Additive") {
    phylo_options.tree.additive = false;
  } else {
    phylo_options.tree.additive = true;
  }
  phylo_options.svg_info.width = window.innerWidth - 200;
  resize_phylo_height();
  redraw_phylo_tree();
  if (document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1]
      === "ON") {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
  } else {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
  }
  if (document.getElementById('branch-text-toggle').innerHTML.split(" | ")[1]
      === "ON") {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
  } else {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
  }
  if (document.getElementById('extant-text-toggle').innerHTML.split(" | ")[1]
      === "ON") {
    phylo_options.svg.selectAll('text.extent').each(function () {
      $(this).attr("opacity", 1);
    });
  }
  if (document.getElementById('node-text-toggle').innerHTML.split(" | ")[1]
      === "ON") {
    phylo_options.svg.selectAll('circle.node').each(function () {
      $(this).attr("opacity", 0);
    });
    phylo_options.svg.selectAll('text.node').each(function () {
      $(this).attr("opacity", 1);
    });
  }
};
