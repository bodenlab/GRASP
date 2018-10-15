/**
 * This file handles any of the consensus actions and items.
 */

/**
 * Get a list of node labels that contain a motif.
 */
let getNodesWithMotif = function () {
  let motif = document.getElementById("find-motif-value").value;
  $.ajax({
    url: "/motif",
    type: "POST",
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify({"motif": motif}),
    success: function (data) {
      console.log(data);
      resetNodesWithMotif();
      // Now we have an array of the nodeIDs with motifs
      updateNodesWithMotif(data);
    }, error: function (err) {
      console.log(err);
      $('#motif-warning-alert').removeClass("hidden");
    }
  })
}

/**
 * Updates the nodes to display visually that they contain the motif.
 *
 * @param nodeLabelList
 */
let updateNodesWithMotif = function (nodeLabelList) {
  _.forEach(nodeLabelList, d => updateNodesDisplay(formatTreeNodeId(d)));
  // Also set this to be the current found motif
  phylo_options["nodes_w_motif"] = nodeLabelList;
}

/**
 * Resets the phylo nodes so that we can search another motif.
 */
let resetNodesWithMotif = function () {
  _.forEach(phylo_options["nodes_w_motif"], d => resetNodesDisplay(formatTreeNodeId(d)));
  // Also set this to be the current found motif
  phylo_options["nodes_w_motif"] = [];
}

/**
 * Changes the visual aspect of a node in the tree.
 *
 * @param nodeId
 */
let updateNodesDisplay = function (nodeId) {
  d3.select( "#fill-" + nodeId).attr("r", phylo_options.style.node_radius * 2);
  d3.select( "#fill-" + nodeId).attr("fill", "#59B595");
}

/**
 * Resets the node display to have the original params.
 * @param nodeId
 */
let resetNodesDisplay = function (nodeId) {
  d3.select( "#fill-" + nodeId).attr("r", phylo_options.node_radius);
  let node =  phylo_options.tree.node_dict[nodeId];

  d3.select( "#fill-" + nodeId).attr("fill", getOriginalColour(node));
}

/**
 * Allows us to reset the color.
 * @param node
 * @returns {*}
 */
let getOriginalColour = function (node) {
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
}

