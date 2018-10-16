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
      // CHeck if we have an error message
      if (data.error !== undefined) {
        document.getElementById("motif-warning-text").innerHTML = data.error;
        $('#motif-warning-alert').removeClass("hidden");
      } else {
        console.log(data);
        resetNodesWithMotif();
        // Now we have an array of the nodeIDs with motifs
        updateNodesWithMotif(data);
      }
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
  _.forEach(nodeLabelList, d => {
    let id = formatTreeNodeId(d);
    let node =  phylo_options.tree.node_dict[id];
    if (node[T_EXTANT]) {
      updateTextDisplay(id);
    } else {
      updateNodesDisplay(id);
    }
  });
  // Also set this to be the current found motif
  phylo_options["nodes_w_motif"] = nodeLabelList;
}

/**
 * Resets the phylo nodes so that we can search another motif.
 */
let resetNodesWithMotif = function () {
  _.forEach(phylo_options["nodes_w_motif"], d => {
    let id = formatTreeNodeId(d);
    let node =  phylo_options.tree.node_dict[id];
    if (node[T_EXTANT]) {
      resetTextDisplay(id);
    } else {
      resetNodesDisplay(id)    }
  });
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
 * Changes the visual aspect of a node in the tree.
 *
 * @param nodeId
 */
let updateTextDisplay = function (nodeId) {
  d3.select( "#text-" + nodeId).attr("fill", "#59B595");
}

/**
 * Resets the node display to have the original params.
 * @param nodeId
 */
let resetNodesDisplay = function (nodeId) {
  d3.select( "#fill-" + nodeId).attr("r", phylo_options.style.node_radius);
  let node =  phylo_options.tree.node_dict[nodeId];

  d3.select( "#fill-" + nodeId).attr("fill", getOriginalColour(node));
}

/**
 * Resets the node display to have the original params.
 * @param nodeId
 */
let resetTextDisplay = function (nodeId) {
  d3.select( "#text-" + nodeId).attr("fill", "black");
}


/**
 * Allows us to reset the color.
 * @param node
 * @returns {*}
 */
let getOriginalColour = function (node) {
  if (node[T_EXTANT]) {
    return phylo_options.style.extent_fill;
  }
  if (node[T_NAME] === phylo_options.tree.selected_node[T_NAME]) {
    return phylo_options.style.select_colour;
  }
  if (node[T_IS_ROOT]) {
    return phylo_options.style.root_node_fill;
  }
  return phylo_options.legend.colour_scale(node[T_Y]);
}

let onMsgClose = function (idToHide) {
  $(idToHide).addClass("hidden");
}
