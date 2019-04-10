/**
 * -----------------------------------------------------------------------------
 *
 *          This file has the main controller functions for the tree.
 *              - User interaction etc.
 *
 * -----------------------------------------------------------------------------
 */

function initPhyloOptions() {

  phylo_options.group  = phylo_options.svg.append("g")
  .attr("transform", "translate(" + phylo_options.svg_info.margin.left + ","
      + phylo_options.svg_info.margin.top + ")");

  phylo_options.tree.all_nodes = [];
  phylo_options.tree.all_branches = [];

}

/**
 * Sets up the tree and calls the other functions
 */
function runPhyloTree() {
  // Make sure the group has no children
  initPhyloOptions();

  let tree_json = parseNewick(phylo_options.tree_string);

  tree_json[T_DIST_FROM_ROOT] = 0;
  tree_json[T_PARENT] = [];
  tree_json[T_PARENT][T_RAW_X] = 0;
  tree_json[T_PARENT][T_DEPTH] = 0;
  tree_json[T_PARENT][T_DIST_FROM_ROOT] = 0;
  tree_json[T_IS_ROOT] = true;

  // Make the root
  phylo_options.tree.root = makeRootNode(tree_json);

  tree_json = phylo_options.tree.root;

  phylo_options.tree.max_depth = 0;
  phylo_options.tree.max_y = 0;

  assignExtantCount(tree_json);

  // Find the total distance to the root and assign
  // cumulative distances to each of the nodes
  getDistanceFromRoot(tree_json, 0, phylo_options, true);

  makeDepthArray(phylo_options);

  // Now that we have made the scale we need to update the
  // y position of the root node.
  phylo_options.tree.max_x = 0; // Largest factor we'll need to scale with

  /* Assign the x coords */
  phylo_options.leaf_count = 0;
  phylo_options.left_leaf_nodes = [];

  assignLeafXCoords(tree_json, phylo_options);

  /* For each of the leaf nodes iterate back up
   * through the tree and assign x coords to inner nodes. */
  for (let n in phylo_options.left_leaf_nodes) {
    assignInnerXCoords(phylo_options.left_leaf_nodes[n][T_PARENT],
        phylo_options);
  }

  /* Assign x coords of the root */
  tree_json[T_RAW_X] = (tree_json[T_CHILDREN][0][T_RAW_X]
      + tree_json[T_CHILDREN][tree_json[T_CHILDREN].length - 1][T_RAW_X]) / 2;

  /* Set the max x */
  phylo_options.tree.max_x = phylo_options.leaf_count;

  phylo_options = makeTreeScale(phylo_options);
  tree_json[T_Y] = phylo_options.y_scale(0);

  tree_json[T_X] = phylo_options.x_scale(tree_json[T_RAW_X]);

  //phylo_options.tree.node_depth_dict[1] = [];
  //phylo_options.tree.node_depth_dict[1].push(tree_json);
  phylo_options.tree.all_nodes.push(tree_json);
  phylo_options.tree.node_dict[tree_json[T_ID]] = tree_json;

  assignNodeCoords(tree_json, false, 0);

  // collect all the nodes
  let nodes = phylo_options.tree.all_nodes;
  if (phylo_options.tree.selected_node === null) {
    phylo_options.tree.selected_node = nodes[0]; // set root node as selected (initial)
  }

  // Add the children
  addChildrenNodes(phylo_options.tree.root, true);

  setupCrossFilter();

  // Create our crossfilter reference
  drawPhyloTree();

  let ancs = [];
  nodes.forEach(function(node) {
    if (!node[T_EXTANT]) {
      ancs.push(node);
    }
  });
  initDownloadOptions(ancs);

}



/**
 * Set up the phylo tree
 */
function drawPhyloTree() {
  let nodes = getNodeLessThanDepth(10).top(Infinity);

  // Get the node ids from these
  let node_ids = nodes.map(a => a[T_ID]);

  let branches = getBranchesWithNodeID(node_ids).top(Infinity);

  drawTree(nodes, branches);

  // Draw the branches and the node
  assignNumChildren(phylo_options.tree.root);
  //collapseSubtree(phylo_options.tree.root, phylo_options.tree.initial_node_num);

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
function contextMenuAction(call, node_fill, node_id) {

  let call_type = call.attr("name");

  phylo_options.tree.collapsed_selection = null;

  document.getElementById('reset-button').disabled = true;

  if (call_type === "View joint reconstruction") {

    select_node(call.attr("id"));
    refresh_tree();
    displayJointGraph(call.attr("id"), node_fill, true);
    reset_poag_stack();

  } else if (call_type === "Add joint reconstruction") {

    document.getElementById('reset-button').disabled = false;
    d3.select("#fill-" + node_id).attr("stroke",
        phylo_options.style.stacked_colour);
    displayJointGraph(call.attr("id"), node_fill, false);

  } else if (call_type === "Expand subtree") {

    let node = phylo_options.tree.node_dict[node_id];
    phylo_options.tree.collapsed_selection = node;
    let ind = phylo_options.tree.collapse_under.indexOf(node);

    if (ind === -1) {
      return;
    }

    phylo_options.tree.collapse_under.splice(ind, 1);
    set_children_un_collapsed(node);
    node[T_TERMINATED] = false;
    collapse_subtree(node, phylo_options.tree.expand_node_num);
    refresh_tree();

  } else if (call_type === "Collapse subtree") {

    let node = phylo_options.tree.node_dict[node_id];

    if (phylo_options.tree.collapse_under.indexOf(node) > -1) {

      return; // already collapsed

    }

    set_children_collapsed(node);
    node[T_TERMINATED] = true;
    phylo_options.tree.collapsed_selection = node;
    node[T_COLLAPSED] = false;
    phylo_options.tree.collapse_under.push(node);
    refresh_tree()

  } else if (call_type === "Expand subtree and collapse others") {

    let node = phylo_options.tree.node_dict[node_id];
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