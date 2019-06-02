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

  tree_json[T_Y] = 0;

  tree_json[T_X] = tree_json[T_RAW_X];

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
  phylo_options.tree.extants = [];

  nodes.forEach(function(node) {
    if (!node[T_EXTANT]) {
      ancs.push(node);
    } else {
      phylo_options.tree.extants.push(node);
    }
  });
  initDownloadOptions(ancs);
}


// find gene in clustergram
function findNode(){
  // get the searched gene
  let node = $('#node_search_box').val();

  d3.select("#fill-" + node).attr('fill', 'red');
  clicked("#" + node);
}

function increaseDepth() {
  phylo_options.tree.depth += 1;
  setupPhyloSvg(phylo_options);
  // We also want to reset the scale
  drawPhyloTree();
}

function decreaseDepth() {
  phylo_options.tree.depth -= 1;
  if (phylo_options.tree.depth <= 1) {
    phylo_options.tree.depth = 1;
  }
  setupPhyloSvg(phylo_options);
  // We also want to reset the scale
  drawPhyloTree();
}
/**
 * At this point we only add the children nodes that are within the depth of
 * 3 from the last ancestor. This is done to
 */
function addExpandedChildrenNodes(node, allChildren, isCollapsed, depth) {
  if (node[T_EXTANT]) {
    allChildren.add(node);
    node[T_COLLAPSED] = isCollapsed;
    node[T_IS_SET] = true;
    return;
  }
  if (node[T_DEPTH] === depth + 3) {
    node[T_COLLAPSED] = isCollapsed;
    node[T_TERMINATED] = true;
    node[T_IS_SET] = true;
    allChildren.add(node);
    return;
  }
  if (node[T_DEPTH] < depth + 3) {
    node[T_CHILDREN].forEach(child => addExpandedChildrenNodes(child, allChildren, isCollapsed, depth));
    node[T_COLLAPSED] = isCollapsed;
    node[T_IS_SET] = true;
    allChildren.add(node);

  }

}



/**
 * At this point we only add the children nodes that are within the depth of
 * 3 from the last ancestor. This is done to
 */
function setAllCollapsed(node, isCollapsed) {

  if (node[T_EXTANT]) {
    node[T_COLLAPSED] = isCollapsed;
    return;
  }

  node[T_CHILDREN].forEach(child => setAllCollapsed(child, isCollapsed));
  node[T_COLLAPSED] = isCollapsed;
}

/**
 * Add any parents of the node we were expanding so it doesn't look odd
 */
function addExpandedParentNodes(node, allParents) {
  if (node[T_PARENT] == null) {
    node[T_COLLAPSED] = false;
    return;
  }
  node[T_COLLAPSED] = false;
  allParents.add(node[T_PARENT]);
  addExpandedParentNodes(node[T_PARENT], allParents);
}


/**
 * Set up the phylo tree
 */
function drawPhyloTree() {
  var nodes = getNodeLessThanDepth(phylo_options.tree.depth);

  nodes.sort(function(a, b){return a[T_DEPTH] - b[T_DEPTH]});

  let intermediateNodes = new Set();

  // Reset parameters.
  for (let n in phylo_options.tree.node_dict) {
    let node = phylo_options.tree.node_dict[n];
    node[T_COLLAPSED] = undefined;
    node[T_TERMINATED] = undefined;
    node[T_IS_SET] = undefined;
  }

  // Here we always need to iterate through and work out if there are any nodes
  // that should have their children added.
  nodes.forEach(function(node) {
    let nodeStored = phylo_options.tree.node_dict[node[T_ID]];
    nodeStored[T_TERMINATED] = false;
    if (nodeStored[T_EXPANDED] === true && nodeStored[T_COLLAPSED] !== true) {

      // We want to add each of the children to the nodes object
      addExpandedChildrenNodes(nodeStored, intermediateNodes, false,
          nodeStored[T_DEPTH]);

      // Check if we also need to add the parents of this node
      if (nodeStored[T_DEPTH] > phylo_options.tree.depth) {
        addExpandedParentNodes(nodeStored, intermediateNodes);
      }
      nodeStored[T_TERMINATED] = false;

    }

    // Colapse all nodes
    if (nodeStored[T_EXPANDED] === false) {
      // We want to add each of the children to the nodes object
      // CHeck if this node has already been terminated

      if (nodeStored[T_COLLAPSED] !== true) {
        nodeStored[T_TERMINATED] = true;
        nodeStored[T_IS_SET] = true;
        nodeStored[T_CHILDREN].forEach(child => setAllCollapsed(child, true));
      }
    }

    if (nodeStored[T_IS_SET] !== true) {
      if (nodeStored[T_DEPTH] === phylo_options.tree.depth) {
        nodeStored[T_TERMINATED] = true;
      } else {
        nodeStored[T_TERMINATED] = false;
      }
    }

    if (nodeStored[T_COLLAPSED] !== true) {
      intermediateNodes.add(nodeStored);
    }

  });

  let nodeIdsForBranches = [];
  let visibleNodes = [];

  intermediateNodes.forEach(function(node) {

    if (node[T_COLLAPSED] !== true) {
      // If it's not collapsed we want to see it
      visibleNodes.push(node);

      if (node[T_TERMINATED] !== true) {
        // If it's not terminted we want to see the branches
        nodeIdsForBranches.push(node[T_ID]);
      }
    }
    node[T_IS_SET] = false;
    node[T_COLLAPSED] = undefined;
  });

  let branches = getBranchesWithNodeID(nodeIdsForBranches);

  phylo_options.tree.current_visible_nodes = visibleNodes;

  // We also want to reset the scale
  clearSvg();

  makeTreeScale(phylo_options);

  drawTree(visibleNodes, branches);

  resizePhyloHeight();

  if (phylo_options.tree.current_search_value !== undefined || null) {
    searchTree(phylo_options.tree.current_search_value, true, false);
  }
}


