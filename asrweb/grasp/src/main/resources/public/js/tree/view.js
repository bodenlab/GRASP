/**
 * -----------------------------------------------------------------------------
 *
 *          This file uses contains all the functions to update the views
 *          of the tree.
 *
 * -----------------------------------------------------------------------------
 */


let phylo_options = {
  data: {
    node_db: null,
    branch_db: null,
    depth_dimension: null,
    taxa_dimension: null,
    branch_dimension: null
  },
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
    additive: false, // Whether or not we want to display the branches as additive
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



var refresh_tree = function () {
  if (document.getElementById("additive-toggle").innerHTML.split(" | ")[1] === "Additive") {
    phylo_options.tree.additive = false;
  } else {
    phylo_options.tree.additive = true;
  }
  phylo_options.svg_info.width = window.innerWidth - 200;
  resizePhyloHeight();
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
  drawPhyloTree();
};

/**
 * Makes the tree scale
 */
function makeTreeScale(phylo_options) {
  phylo_options.svg_info.width = window.innerWidth - 200;
  let additive = phylo_options.tree.additive;

  let max_y = phylo_options.tree.max_depth;
  if (additive === false) {
    max_y = phylo_options.tree.longest_distance_from_root_to_extant;
  }

  let y_scale = d3.scale.linear()
  .domain([0, max_y])
  .range([0, phylo_options.svg_info.height]);

  let y_axis = d3.svg.axis()
  .scale(y_scale)
  .orient("left")
  .ticks(6);

  let x_scale = d3.scale.linear()
  .domain([phylo_options.tree.min_x - 2, phylo_options.tree.max_x])
  .range([phylo_options.legend.width + phylo_options.svg_info.margin.left,
    phylo_options.svg_info.width]);

  let legend = phylo_options.svg.append("defs").append(
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
}

/**
 * Helper function for the scaling from:
 * https://bl.ocks.org/starcalibre/6cccfa843ed254aa0a0d
 */
function linspace(start, end, n) {
  let out = [];
  let delta = (end - start) / (n - 1);

  let i = 0;
  while (i < (n - 1)) {
    out.push(start + (i * delta));
    i++;
  }

  out.push(end);
  return out;
}

function setupPhyloSvg(phylo_options) {
  let tree_div = phylo_options.svg_info.div_id;

  let options = phylo_options.svg_info;
  let width = poags.options.style.width;

  let svg = d3.select(tree_div).append("svg")
  .attr("width", "100%")
  .attr("height", options.height + options.margin.top + options.margin.bottom)
  .attr("id", "phylo-tree-svg")
  .attr("class", "svg");

  phylo_options.svg_info.width = width + options.margin.left
      + options.margin.right;
  phylo_options.svg_info.height = options.height + options.margin.top
      + options.margin.bottom;
  phylo_options.svg = svg;

  return phylo_options;
};

/**
 * Have a look at this function & confirm it is doing what we expect...
 * ToDo: Evaluate
 */
function resizePhyloHeight() {
  for (let e in phylo_options.tree.extants) {
    if (phylo_options.tree.extants[e][T_NAME].length * 7 > phylo_options.tree.extant_label_height) {
      phylo_options.tree.extant_label_height = phylo_options.tree.extants[e][T_NAME].length * 7;
    }
  }
  phylo_options.svg.attr("height", phylo_options.svg_info.height
      + phylo_options.tree.extant_label_height);
  phylo_options.legend.height = phylo_options.svg_info.height + 0.25
      * phylo_options.tree.extant_label_height;

}


function initDownloadOptions(options) {
  $.map(options, function (x) {
    return $('#multiselect-download').append("<option>" + x + "</option>");
  });
}

function setPhyloParams(tree_div, tree_string) {
  phylo_options.svg_info.div_id = tree_div;
  phylo_options.svg_info.width = '100%';//window.innerWidth - 200;
  phylo_options.tree_string = tree_string;
  phylo_options = setupPhyloSvg(phylo_options);
}


function clearSvg() {
  let group = phylo_options.group;
  group.selectAll("path").remove();
  group.selectAll("line").remove();
  group.selectAll("text").remove();
  group.selectAll("rect").remove();
  group.selectAll("circle").remove();

}




/**
 * -----------------------------------------------------------------------------
 *
 *                    Actual Drawing Functions
 *
 * -----------------------------------------------------------------------------
 */

function drawTree(nodes, branches) {
  clearSvg();
  makeTreeScale(phylo_options);
  drawPhyloBranches(phylo_options, branches);
  drawPhyloNodes(phylo_options, nodes);
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
function drawPhyloNodes(phylo_options, nodes) {
  let group = phylo_options.group;

  nodes.forEach(function (node) {
    if (!node[T_EXTANT] && !node[T_TERMINATED]) {
      // Add a white under circle to make it pretty
      drawPhyloUnderCircle(group, node);

      // Add the node label
      drawPhyloText(group, node);

      // Add the node which has the colour for extants and the
      // function for hover
      drawPhyloCircle(group, node);
    }

    drawPhyloText(group, node);

    if (node[T_TERMINATED]) {
      drawCollapsedSymbol(group, node);
    }
  })
}

/**
 * Draws the branches of the phylo tree
 */
function drawPhyloBranches(phylo_options, branches) {
  let group = phylo_options.group;
  let options = phylo_options.style;

  branches.forEach( function(branch) {
    if (!branch[T_COLLAPSED] && !branch[T_TERMINATED]) {

      group.append("line")
      .attr("class", "branch")
      .style("stroke", options.branch_stroke)
      .style("stroke-width", options.branch_stroke_width)
      .attr("x1", branch[B_X1])
      .attr("x2", branch[B_X2])
      .attr("y1", branch[B_Y1])
      .attr("y2", branch[B_Y2]);

      // If it isn't a parent branch add the branch length
      if (branch[B_Y1] !== branch[B_Y2]) {
        drawBranchText(group, branch);
      }
    }
  });
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
function drawBranchText(group, branch) {
  let options = phylo_options.style;

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
}

/**
 * Draw the collapsed node symbol.
 * @param group
 * @param node
 */
function drawCollapsedSymbol(group, node) {
  let options = phylo_options.style;

  group.append("path")
  .attr("id", "path-" + node[T_ID])
  .attr("class", "collapsed-node")
  .attr("d", d3.svg.symbol().type(options.collapsed_symbol).size(70))
  .attr("transform", "translate(" + node[T_X] + "," + node[T_Y] + ")")
  .style("fill", options.collapsed_colour);

  group.append("text")
  .attr("id", "text-coll-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("fill", node[T_CONTAINS_SEARCH] ? options.search_colour : options.font_colour)
  .attr("text-anchor", "middle")
  .attr("transform", "translate(" + node[T_X] + "," + node[T_Y] + 20 + ")")
  .text("(" + node[T_NUM_EXTANTS] + ")");

  group.append("text")
  .attr("id", "text-tax-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("font-style", "italic")
  .attr("fill", node[T_CONTAINS_SEARCH] ? options.search_colour : options.font_colour)
  .attr("text-anchor", "start")
  .attr("transform", "translate(" + node[T_X] + "," +  node[T_Y] + 30 + ") rotate(" + 90
      + ") translate(2,2)")
  .text(function () {
    if (node[T_COMMON_RANK] === null || node[T_COMMON_RANK] === undefined) {
      return "";
    }
    return node[T_COMMON_RANK].charAt(0).toUpperCase() + node[T_COMMON_RANK].slice(1)
        + ": " + node[T_COMMON_TAXA];
  });
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
function drawPhyloCircle(group, node) {
  let options = phylo_options.style;

  // Node
  group.append("circle")
  .attr("id", "fill-" + node[T_ID])
  .attr("name", node[T_NAME])
  .attr("class", node[T_EXTANT] ? 'extant' : 'node')
  .attr("cx", node[T_X])
  .attr("cy", node[T_Y])
  .attr("r", function (d) {
    if (node[T_EXTANT]) {
      return options.extent_radius;
    } else if (phylo_options.tree.collapsed_selection != null && node[T_ID]
        === phylo_options.tree.collapsed_selection[T_ID]) {
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
        === phylo_options.tree.collapsed_selection[G_ID]) {
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
    .text(node[T_NAME]);

    // find number in histogram (only want modal large if there are many items in the histogram)
    let node_info = phylo_options.tree.node_dict[node[T_ID]];

    if ($(window).width() > options.modal_min_width && node_info[T_COMMON_TAXA]
        !== undefined) {
      let tax_diff = node_info[T_TAXA][node_info[T_COMMON_TAXA].differ_rank];
      options.modal_width = 0.8 * $(window).width() - 2
          * options.modal_min_width / Object.keys(tax_diff).length;
    } else {
      options.modal_width = options.modal_min_width;
    }
    let modal_container = d3.select("#modalTree")
    .append("svg")
    .attr("id", "usedTreeModal")
    .attr("width", options.modal_width)
    .attr("height", options.modal_height)
    .style("display", "block")
    .style("margin", "auto");

    let modal_group = modal_container.append("g")
    .attr("opacity", 1);
    //.attr("transform", "translate(100, 50)scale(1.5)");

    add_taxonomy_modal_info(node, modal_group, options);
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
function drawPhyloText(group, node) {
  let options = phylo_options.style;
  let class_label = "node";
  let deg = 0;
  let x = node[T_X];
  let y = node[T_Y];
  let anchor = 'middle';

  if (node[T_EXTANT]) {
    anchor = 'start';
    class_label = "extent";
    deg = 90;
  }

  group.append("text")
  .attr("id", "text-" + node[T_ID])
  .attr("class", class_label)
  .attr("name", node[T_NAME])
  .attr("font-family", options.font_family)
  .attr("font-size", options.font_size)
  .attr("fill", "#2b2b2b") //node[COLOUR])
  .attr("text-anchor", anchor)
  .attr("opacity", function () {
    if (node[T_EXTANT] || (phylo_options.tree.collapsed_selection != null
            && node[T_ID] === phylo_options.tree.collapsed_selection[T_ID])) {
      return 1;
    } else {
      return 0;
    }
  })
  .attr("transform", "translate(" + x + "," + y + ") rotate(" + deg
      + ") translate(2,2)")
  .text(node[T_NAME]);
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
function drawPhyloUnderCircle(group, node) {
  let options = phylo_options.style;

  group.append("circle")
  .attr("id", "circle-" + node[T_ID])
  .attr("class", node[T_EXTANT] ? 'extant' : 'node')
  .attr("cx", node[T_X])
  .attr("cy", node[T_Y])
  .attr("r", node[T_EXTANT] ?  options.extent_radius * options.under_node_multiplier : options.node_radius * options.under_node_multiplier)
  .attr("fill", "white")
  .attr("stroke", options.under_stroke)
  .attr("opacity", options.opacity)
  .attr("stroke_width", options.stroke_width);
}



/**
 * -----------------------------------------------------------------------------
 *
 *        Toggle Functions : User can select to toggle the branch text on or off
 *        Action: Gets called when user clicks a button.
 *
 * -----------------------------------------------------------------------------
 */
let toggle_branch_text = function () {
  let button_text = document.getElementById(
      'branch-text-toggle').innerHTML.split(" | ")[1];
  if (button_text === "ON") {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 0);
    document.getElementById(
        'branch-text-toggle').innerHTML = "View branch length | OFF";
  } else {
    phylo_options.svg.selectAll('text.branch-text').attr("opacity", 1);
    document.getElementById(
        'branch-text-toggle').innerHTML = "View branch length | ON";
  }
};

let toggle_node_text = function () {
  let button_text = document.getElementById('node-text-toggle').innerHTML.split(
      " | ")[1];
  phylo_options.svg.selectAll('circle.node').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") === 1) ? 0 : 1);
  });
  phylo_options.svg.selectAll('text.node').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") === 1) ? 0 : 1);
  });
  if (button_text === "ON") {
    document.getElementById(
        'node-text-toggle').innerHTML = "View node labels | OFF";
  } else {
    document.getElementById(
        'node-text-toggle').innerHTML = "View node labels | ON";
  }
};


var toggle_additive = function () {
  let additive = document.getElementById('additive-toggle').innerHTML.split(
      " | ")[1];
  if (additive === "Additive") {
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
  let button_text = document.getElementById(
      'extant-text-toggle').innerHTML.split(" | ")[1];
  phylo_options.svg.selectAll('text.extent').each(function () {
    $(this).attr("opacity", ($(this).attr("opacity") == 1)
        ? phylo_options.style.extant_label_opacity : 1);
  });
  if (button_text === "ON") {
    document.getElementById(
        'extant-text-toggle').innerHTML = "View extant labels | OFF";
  } else {
    document.getElementById(
        'extant-text-toggle').innerHTML = "View extant labels | ON";
  }
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

}

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
 * The context menu, has the names for the events that a user can perform.
 */
const menu = contextMenu().items('View marginal reconstruction',
    'View joint reconstruction', 'Add joint reconstruction', 'Collapse subtree',
    'Expand subtree', 'Expand subtree and collapse others');