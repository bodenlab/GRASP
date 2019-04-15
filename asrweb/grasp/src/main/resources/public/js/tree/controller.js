/**
 * -----------------------------------------------------------------------------
 *
 *          This file has the main controller functions for the tree.
 *              - User interaction etc.
 *
 * -----------------------------------------------------------------------------
 */

function initPhyloOptions() {

  phylo_options.tree.all_nodes = [];
  phylo_options.tree.all_branches = [];

}

/**
 * Sets up the tree and calls the other functions
 */
function runPhyloTree() {

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


  // Set up the svg
  phylo_options = setupPhyloSvg(phylo_options);
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


  let ancs = [];
  nodes.forEach(function(node) {
    if (!node[T_EXTANT]) {
      ancs.push(node);
    }
  });
  initDownloadOptions(ancs);

}


function increaseDepth() {
  phylo_options.tree.depth += 1;
  drawPhyloTree();
}

function decreaseDepth() {
  phylo_options.tree.depth -= 1;
  if (phylo_options.tree.depth <= 1) {
    phylo_options.tree.depth = 1;
  }
  drawPhyloTree();
}

/**
 * Set up the phylo tree
 */
function drawPhyloTree() {
  let nodes = getNodeLessThanDepth(phylo_options.tree.depth);

  // Get the node ids from these
  let node_ids = nodes.map(a => a[T_ID]);

  let branches = getBranchesWithNodeID(node_ids);

  // Here we add in the nodes (but we didn't want the branches for these ones
  // as they are terminated)
  nodes = nodes.concat(getNodesEqualToDepth(phylo_options.tree.depth));

  drawTree(nodes, branches);

  resizePhyloHeight();

}
