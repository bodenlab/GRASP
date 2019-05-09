/**
 * -----------------------------------------------------------------------------
 *
 *          This file uses crossfilter to handle the data access within
 *          the tree & the loading of the newick string.
 *
 * -----------------------------------------------------------------------------
 */

/**
 * Filter options:
 *    1. depth < or > a value.
 *    2. node ids.
 *    3. contains taxanomic info.
 */
function setupCrossFilter() {
  phylo_options.data.node_db = crossfilter(phylo_options.tree.all_nodes);

  phylo_options.data.depth_dimension = phylo_options.data.node_db.dimension(function(d) {
    return d[T_DEPTH] ? +d[T_DEPTH] : 0;
  });

  phylo_options.data.taxa_dimension = phylo_options.data.node_db.dimension(function(d) {
    return d[T_TAXA] ? d[T_TAXA] : "";
  });

  phylo_options.data.node_name = phylo_options.data.node_db.dimension(function(d) {
    return d[T_NAME] ? d[T_NAME] : "";
  });

  phylo_options.data.extent_dimension = phylo_options.data.node_db.dimension(function(d) {
    return d[T_EXTANT] ? d[T_EXTANT] : false;
  });


  // Basically used to get the branches by the node ids
  phylo_options.data.branch_db =  crossfilter(phylo_options.tree.all_branches);

  phylo_options.data.branch_dimension = phylo_options.data.branch_db.dimension(function(d) { return d[B_ID]});

}

function getNodesLessAndEqualToDepth(depthIn) {
  let depth = depthIn ? depthIn : 10;
  let nodesIn = phylo_options.data.depth_dimension.filter(function(d) {
    return d <= depth;
  }).top(Infinity);
  clearFilters();
  return nodesIn;
}
/**
 * Get nodes with a certain name.
 *
 * @param name
 */
function getNodeLessThanDepth(depthIn) {
  let depth = depthIn ? depthIn : 10;

  let nodesIn = phylo_options.data.depth_dimension.filter(function(d) {
        return d <= depth;
      }).top(Infinity);


  nodesIn.forEach(function(d) {
    if (d[T_DEPTH] === depth) {
      d[T_TERMINATED] = true;
    }
  });
  clearFilters();
  // Concat the nodes and the terminating nodes
  return nodesIn;
}

function getNodesEqualToDepth(depth) {
  let nodesOut = phylo_options.data.depth_dimension.filter(function(d) {
    return d === depth;
  }).top(Infinity);

  nodesOut.forEach(function(d) {
    d[T_TERMINATED] = true;
  });
  clearFilters();
  return nodesOut;

}
/**
 * Get nodes with a certain name.
 *
 * @param name
 */
function getExtantNodes() {

  let nodesIn = phylo_options.data.depth_dimension.filter(function(d) {
    return true;
  }).top(Infinity);

  let extants = [];
  nodesIn.forEach(function(d) {
    if (d[T_EXTANT] === true) {
      extants.push(d);
    }
  });
  clearFilters();
  // Concat the nodes and the terminating nodes
  return extants;
}


/**
 * Get nodes with a certain name.
 *
 * @param name
 */
function getNodeWithName(name) {
  let root =  phylo_options.data.node_name.filter(name).top(Infinity);
  clearFilters();
  return root;
}

/**
 * Get nodes with specific taxonomic info.
 *
 * @param name
 */
function getNodesWithTaxa(name) {
  return phylo_options.data.taxa_dimension.filter(function(d) {
    return d.includes(name)
  });
}

function getMaxDistToRootVisible(depth) {
  let nodesIn = phylo_options.data.depth_dimension.filter(function(d) {
    return d < depth;
  }).top(Infinity);

  let maxDistToRoot = 0;
  nodesIn.forEach(function(d) {
    if (d[T_DIST_FROM_ROOT] > maxDistToRoot) {
      maxDistToRoot = d[T_DIST_FROM_ROOT];
    }
  });
  return maxDistToRoot;
}
/**
 * Get branches with a sepcific node id
 *
 * @param name
 */
function getBranchesWithNodeID(nodeIds) {
  return phylo_options.data.branch_dimension.filter(function(d) {
    return nodeIds.includes(d);
  }).top(Infinity);
}



/**
 * Clear any filters on the data.
 */
function clearFilters() {

  phylo_options.data.depth_dimension.filterAll();
  phylo_options.data.taxa_dimension.filterAll();
  phylo_options.data.branch_dimension.filterAll();
  phylo_options.data.node_name.filterAll();

}
/**
 * Allows us to change datastructures simply.
 * @returns {{}}
 */
function dataStruct() {
  return {};
}

/**
 * Parsing the newick format of a tree to JSON.
 * From:
 *      https://github.com/daviddao/biojs-io-newick
 *      under: Apache2 license
 */
function parseNewick (s) {

  let ancestors = [];
  let tree = dataStruct();
  let tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
  let subtree;

  for (let i = 0; i < tokens.length; i++) {

    let token = tokens[i];

    switch (token) {

      case '(': // new children

        subtree = dataStruct();
        tree[T_CHILDREN] = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;

      case ',': // another branch

        subtree = dataStruct();
        ancestors[ancestors.length - 1][T_CHILDREN].push(subtree);
        tree = subtree;
        break;

      case ')': // optional name next

        tree = ancestors.pop();
        break;

      case ':': // optional length next

        break;

      default:

        let x = tokens[i - 1];

        if (x === ')' || x === '(' || x === ',') {

          tree[T_NAME] = token;

        } else if (x === ':') {

          tree[T_BRANCH_LEN] = parseFloat(token);

        }
    }
  }
  return tree;
}


/**
 * Assigns the parent nodes based on the x coords of the children.
 *
 * Travels from the leaf nodes up assigning parent node based on
 * 1/2 between left and right child.
 */
function assignInnerXCoords(node, phylo_options) {
  /* Assign the x coords based on that of the children*/
  node[T_RAW_X] = (node[T_CHILDREN][0][T_RAW_X] + node[T_CHILDREN][node[T_CHILDREN].length
  - 1][T_RAW_X]) / 2;

  if (node[T_IS_ROOT] !== true) {
    assignInnerXCoords(node[T_PARENT], phylo_options);
  }
}

/**
 *
 * @param node
 * @returns {*}
 */
function assignExtantCount(node = {}) {
  /* Assign the number of extants under this node by cumulatively adding from it's children */
  let num_extants = 0;

  if (node[T_CHILDREN] !== undefined) {

    for (let n in node[T_CHILDREN]) {

      let child = node[T_CHILDREN][n];

      if (child[T_NUM_EXTANTS] === undefined) {

        assignExtantCount(child);

      }

      if (child[T_NUM_EXTANTS] === 0) {
        child[T_NUM_EXTANTS] = 1;
        num_extants += 1;

      } else {

        num_extants += child[T_NUM_EXTANTS];

      }
    }
  }

  node[T_NUM_EXTANTS] = num_extants;

  return node[T_NUM_EXTANTS];
}

/**
 * Assigns the x coords of leafs/terminating nodes.
 *
 * Leaf is used to define either a left node, i.e. extant or
 * a terminating node (i.e. we are not displaying the children
 * of that node).
 */
function assignLeafXCoords(node, phylo_options) {

  if (node[T_COLLAPSED] && !node[T_TERMINATED]) {
    return;
  }

  /* This is a leaf (or terminating node) so assign the current x count */
  if (node[T_CHILDREN] === undefined || node[T_TERMINATED] === true) {

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
  for (let n in node[T_CHILDREN]) {

    (n === '0' ? node[T_CHILDREN][n][T_LEFT] = true : node[T_CHILDREN][n][T_LEFT] = false);

    node[T_CHILDREN][n][T_PARENT] = node;
    assignLeafXCoords(node[T_CHILDREN][n], phylo_options);

  }
}

/**
 * Make the root node
 */
function makeRootNode(node) {
  node[T_ID] = node[T_NAME].split(/[._-]+/)[0];
  node[T_LEFT] = false;
  node[T_DEPTH] = 0;

  if (node[T_COMMON_TAXA] === undefined) {

    node[T_COMMON_RANK] = undefined;
    node[T_COMMON_TAXA] = undefined;

  } else {

    node[T_COMMON_RANK] = node[T_COMMON_TAXA].common_rank;
    node[T_COMMON_TAXA] = node[T_COMMON_TAXA].common_taxonomy;
    node[T_DIFFER_RANK] = node[T_COMMON_TAXA].differ_rank;
    node[T_TAXA] = node[T_TAXA];

  }

  node[T_TERMINATED] = false;
  node[T_CHILDREN] === undefined ? node[T_EXTANT] = true : node[T_EXTANT] = false;

  return node;
}


/**
 * Helper that makes a cut down node.
 */
function makeChild(node, left, depth) {

  let child = dataStruct();

  child[T_ID] = formatTreeNodeId(node[T_NAME]);

  child[T_LEFT] = left;
  child[T_NAME] = node[T_NAME];
  child[T_Y] = node[T_Y];
  child[T_X] = node[T_X];
  child[T_DEPTH] = depth;
  child[T_BRANCH_LEN] = node[T_BRANCH_LEN];
  child[T_NUM_EXTANTS] = node[T_NUM_EXTANTS];
  child[T_COLLAPSED] = false;
  child[T_TERMINATED] = false;
  child[T_CONTAINS_SEARCH] = false;
  child[T_CHILDREN] = node[T_CHILDREN];
  child[T_DIST_FROM_ROOT] = node[T_DIST_FROM_ROOT];

  if (node[T_COMMON_TAXA] === undefined) {

    child[T_COMMON_RANK] = undefined;
    child[T_COMMON_TAXA] = undefined;

  } else {

    child[T_COMMON_RANK] = node[T_COMMON_TAXA].common_rank;
    child[T_COMMON_TAXA] = node[T_COMMON_TAXA].common_taxonomy;
    child[T_DIFFER_RANK] = node[T_COMMON_TAXA].differ_rank;
    child[T_TAXA] = node[T_TAXA];

  }

  child[T_CHILDREN] === undefined ? child[T_EXTANT] = true : child[T_EXTANT] = false;

  return child;
}

/**
 * Helper function that formats a node ID.
 * @param nodeLabel
 * @returns {*|string}
 */
function formatTreeNodeId(nodeLabel) {
  let h = nodeLabel.split(/[._-|]+/);
  let k = h.join('');
  return k;
}

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
function getDistanceFromRoot(node, depth, phylo_options, initial) {
  // Make a node id based on name and node count
  // only assign on initial load
  if (initial) {

    node[T_ID] = formatTreeNodeId(node[T_NAME]);
    node[T_COLLAPSED] = false;
    phylo_options.tree.node_dict[node[T_ID]] = node;
    depth += 1;
    phylo_options.tree.node_count += 1;

  }

  node[T_EXTANT] = false;

  if (node[T_CHILDREN] === undefined) {

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
    node[T_MAX_CHILDREN] = 0;

    return;
  }

  // Otherwise we need to calculate the cumulative branch lengths
  // of the children and assign the nodes the value as:
  //      node[T_DIST_FROM_ROOT]\
  for (let n in node[T_CHILDREN]) {

    node[T_CHILDREN][n][T_DIST_FROM_ROOT] = node[T_DIST_FROM_ROOT] + node[T_CHILDREN][n][T_BRANCH_LEN];

    // Add this node as the parent of these children
    node[T_CHILDREN][n][T_PARENT] = node; // ToDo: was parent_node

    // Add to a dictionary of nodes.
    // Will use this when traversing from the extants up to the parent.
    getDistanceFromRoot(node[T_CHILDREN][n], depth, phylo_options, initial);

  }
}

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
function assignNumChildren(node) {

  if (node[T_CHILDREN] !== undefined) {

    let left_child_count = node[T_CHILDREN][0][T_MAX_CHILDREN] + 2;
    let right_child_count = node[T_CHILDREN][1][T_MAX_CHILDREN] + 2;

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

    if (node[T_PARENT] === undefined) {

      return; // We have reached the root

    }

    return assignNumChildren(node[T_PARENT]);
  }
}

/**
 * Recur one more time and add all the children.
 **/
function addChildrenNodes(node, initial) {

  if (node[T_CHILDREN] !== undefined) {

    for (let n in node[T_CHILDREN]) {

      if (n === '0') {
        node[T_CHILDREN][0][T_DEPTH] = node[T_DEPTH] + 1;
        let left_child = makeChild(node[T_CHILDREN][0], true, node[T_DEPTH] + 1);

        // Make the branch from parent out to children x's
        // Check if both children exist
        let branch_parent = dataStruct();
        branch_parent[B_ID] = node[T_ID];                 /*B_ID*/
        branch_parent[B_Y1] = node[T_DIST_FROM_ROOT];                  /*B_Y1*/
        branch_parent[B_Y2] = node[T_DIST_FROM_ROOT];                  /*B_Y2*/
        branch_parent[B_X1] = left_child[T_X];   /*B_X1*/
        branch_parent[B_Y1_DEPTH] = node[T_DEPTH];                  /*B_Y1*/
        branch_parent[B_Y2_DEPTH] = left_child[T_DEPTH];   /*B_Y2*/
        branch_parent[B_X2] = node[T_CHILDREN][node[T_CHILDREN].length - 1][T_X];  /*B_X2*/


        // Make each of the children branches, these are vertical connectors
        // between the parent center branch and the child nodes.
        let branch_left_child = dataStruct();
        branch_left_child[B_ID] = node[T_ID];                 /*B_ID*/
        branch_left_child[B_Y1] = node[T_DIST_FROM_ROOT];                  /*B_Y1*/
        branch_left_child[B_Y2] = left_child[T_DIST_FROM_ROOT];   /*B_Y2*/
        branch_left_child[B_X1] = left_child[T_X];
        branch_left_child[B_X2] = left_child[T_X];
        branch_left_child[B_Y1_DEPTH] = node[T_DEPTH];                  /*B_Y1*/
        branch_left_child[B_Y2_DEPTH] = left_child[T_DEPTH];   /*B_Y2*/
        branch_left_child[B_LABEL] = left_child[T_BRANCH_LEN];

        // Add the branches to a list of all branches to be drawn later
        phylo_options.tree.all_branches.push(branch_parent);
        phylo_options.tree.all_branches.push(branch_left_child);

        phylo_options.tree.all_nodes.push(left_child);

      } else {
        node[T_CHILDREN][n][T_DEPTH] = node[T_DEPTH] + 1;

        let right_child = makeChild(node[T_CHILDREN][n], false, node[T_DEPTH] + 1);

        let branch_right_child = dataStruct();
        branch_right_child[B_ID] = node[T_ID];                 /*B_ID*/
        branch_right_child[B_Y1] = node[T_DIST_FROM_ROOT];                  /*B_Y1*/
        branch_right_child[B_Y2] = right_child[T_DIST_FROM_ROOT];   /*B_Y2*/
        branch_right_child[B_Y1_DEPTH] = node[T_DEPTH];                  /*B_Y1*/
        branch_right_child[B_Y2_DEPTH] = right_child[T_DEPTH];   /*B_Y2*/
        branch_right_child[B_X1] = right_child[T_X];
        branch_right_child[B_X2] = right_child[T_X];
        branch_right_child[B_LABEL] = right_child[T_BRANCH_LEN];

        phylo_options.tree.all_branches.push(branch_right_child);
        phylo_options.tree.all_nodes.push(right_child);

      }
    }
  } else {
    return;
  }

  for (let n in node[T_CHILDREN]) {

    addChildrenNodes(node[T_CHILDREN][n], initial);

  }

}

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
function assignNodeCoords(node, depth) {
  let additive = phylo_options.tree.additive;
  let node_instep = phylo_options.tree.node_instep;

  if (!additive) {

    node[T_Y] = node[T_DIST_FROM_ROOT];

  } else {

    node[T_Y] = depth;
  }

  // Check that the node.x is not NAN
  if (node[T_IS_LEFT]) {
    // We add a instep if it is on the LHS and RHS so that we
    // don't get overlap.
    node[T_X] = node[T_RAW_X] + node_instep;

  } else {

    node[T_X] = node[T_RAW_X] - node_instep;
  }

  if (node[T_CHILDREN] === undefined) {

    if (additive === true) {

      node[T_Y] -= 0.2;

    }

    if (node[T_IS_LEFT]) {

      node[T_X] = node[T_RAW_X] + node_instep;

    } else {

      node[T_X] = node[T_RAW_X] - node_instep;

    }
  }

  // Recursively call the assign node coords on each child of
  // the node.
  if (node[T_CHILDREN] !== undefined) {

    for (let n in node[T_CHILDREN]) {

      assignNodeCoords(node[T_CHILDREN][n], depth + 1);

    }
  }
  // Return after recurring.

}


/**
 * Makes an array of "depths" from the logest distance
 * from the root so we don't get overlapping tree branches.
 */
function makeDepthArray(phylo_options) {

  let depth = 0;
  let depth_array = [];
  let depth_size = phylo_options.tree.longest_distance_from_root_to_extant
      / (phylo_options.tree.max_depth / 2);

  while (depth < phylo_options.tree.longest_distance_from_root_to_extant) {
    depth_array.push(depth);
    depth += depth_size;
  }

  phylo_options.depth_array = depth_array;
  return phylo_options;

}