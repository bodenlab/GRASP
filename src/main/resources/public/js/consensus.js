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
      // Check if we have an error message
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
 * Get a list of node labels that contain a motif.
 */
let getSimilarNodes = function () {
  let unknownRecon = document.getElementById("unknown-recon").value;
  let nodeLabel = document.getElementById("node-label").value;
  let numNodes = document.getElementById("node-num").value;
  $.ajax({
    url: "/getsimilarnode",
    type: "POST",
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify({"unknown": unknownRecon, "node": nodeLabel, "num": numNodes}),
    success: function (data) {
      // Check if we have an error message
      if (data.error !== undefined) {
        document.getElementById("motif-warning-text").innerHTML = data.error;
        $('#motif-warning-alert').removeClass("hidden");
      } else {
          $('#motif-warning-alert').addClass("hidden");
          resetNodesWithScores();
        // Now we have an array of the nodeIDs with motifs
        updateSimilarNodes(data);
        if (data[0][2] == "saveCSV") {
          let strD = "name,score,method,leaf_count,dist_to_root,orig_dist_to_root,exts_inc_from_orig,exts_no_inc_from_orig,exts_inc,exts_no_inc,count_other_exts\n";
          for (d in data) {
            for (x in data[d]) {
              strD += data[d][x] + ",";
            }
            strD += "\n";
          }
          download(strD, "test.csv", "text/csv")
        } else if (data[0][0] == "save-all") {
          strD = "";
          for (d in data) {
              for (x in data[d]) {
                if (data[d][x] !== "save-all") {
                  strD += data[d][x] + ",";
                }
              }
              strD += "\n";
          }
          download(strD, data[0][1] + "_" + data[0][2] + ".csv", "text/csv")

        }
      }
    }, error: function (err) {
      console.log(err);
      $('#motif-warning-alert').removeClass("hidden");
    }
  })
}



function download (content, fileName, mimeType) {
  var a = document.createElement('a');
  mimeType = mimeType || 'application/octet-stream';
  if (navigator.msSaveBlob) { // IE10
    return navigator.msSaveBlob(new Blob([content], {type: mimeType}),
        fileName);
  } else if ('download' in a) { //html5 A[download]
    a.href = 'data:' + mimeType + ',' + encodeURIComponent(content);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } else { //do iframe dataURL download (old ch+FF):
    var f = document.createElement('iframe');
    document.body.appendChild(f);
    f.src = 'data:' + mimeType + ',' + encodeURIComponent(content);

    setTimeout(function () {
      document.body.removeChild(f);
    }, 300);
    return true;
  }
}


/**
 * Get a list of node labels that contain a motif.
 */
let saveSimilarNodes = function () {
  let unknownRecon = document.getElementById("unknown-recon").value;
  let nodeLabel = document.getElementById("node-label").value;
  let numNodes = document.getElementById("node-num").value;
  $.ajax({
    url: "/savesimilarnode",
    type: "POST",
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify({"unknown": unknownRecon, "node": nodeLabel, "num": numNodes}),
    success: function (data) {
      // CHeck if we have an error message
      if (data.error !== undefined) {
        document.getElementById("motif-warning-text").innerHTML = data.error;
        $('#motif-warning-alert').removeClass("hidden");
      } else {
        let csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(function(rowArray){
          let row = rowArray.join(",");
          csvContent += row + "\r\n";
        });
        var encodedUri = encodeURI(csvContent);
        window.open(encodedUri);
        resetNodesWithScores();
        // Now we have an array of the nodeIDs with motifs
        updateSimilarNodes(data);
      }
    }, error: function (err) {
      console.log(err);
      $('#motif-warning-alert').removeClass("hidden");
    }
  })
}





/**
 * Updates the nodes to display visually that they are the most similar.
 *
 * @param nodeLabelList
 */
let updateSimilarNodes = function (scoredNodes) {
  // Get the color scale - first need to find the min and max
  let min = 10000000;
  let max = 0;
  _.forEach(scoredNodes, d => {
    if (d[S_SCORE] < min) {
      min = d[S_SCORE];
    }
    if (d[S_SCORE] > max) {
      max = d[S_SCORE];
    }
  });
  let colour = makeColorScale(min, max);
  let scoredIds = [];
  _.forEach(scoredNodes, d => {
    let id = formatTreeNodeId(d[S_NAME]);
    let node =  phylo_options.tree.node_dict[id];
    if (node !== undefined) {
      if (node[T_EXTANT]) {
        updateTextDisplay(id, colour(d[S_SCORE]));
      } else {
        updateNodesDisplay(id, colour(d[S_SCORE]));
      }
      scoredIds.push(d[S_NAME]);
    }
  });

  // Also set this to be the current found motif
  phylo_options["nodes_w_scores"] = scoredIds;
}


/**
 * Resets the nodes with the scores
 */
let resetNodesWithScores = function () {
  _.forEach(phylo_options["nodes_w_scores"], d => {
    let id = formatTreeNodeId(d);
    let node =  phylo_options.tree.node_dict[id];
    if (node !== undefined) {
      if (node[T_EXTANT]) {
        resetTextDisplay(id);
      } else {
        resetNodesDisplay(id)
      }
    }
  });
  // Also set this to be the current found motif
  phylo_options["nodes_w_scores"] = [];
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
    // Need to check if it exists first as it may be hidden
    if (node !== undefined) {
      if (node[T_EXTANT]) {
        updateTextDisplay(id, "#39CDA0");
      } else {
        updateNodesDisplay(id, "#39CDA0");
      }
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
    if (node !== undefined) {
      if (node[T_EXTANT]) {
        resetTextDisplay(id);
      } else {
        resetNodesDisplay(id)
      }
    }
  });
  // Also set this to be the current found motif
  phylo_options["nodes_w_motif"] = [];
}

/**
 * Changes the visual aspect of a node in the tree.
 *
 * @param nodeId
 */
let updateNodesDisplay = function (nodeId, colour) {
  d3.select( "#fill-" + nodeId).attr("r", phylo_options.style.node_radius * 2);
  d3.select( "#fill-" + nodeId).attr("fill", colour);
}

/**
 * Changes the visual aspect of a node in the tree.
 *
 * @param nodeId
 */
let updateTextDisplay = function (nodeId, colour) {
  d3.select( "#text-" + nodeId).attr("fill", colour);
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

/**
 * Make a color scale for the similarity of nodes.
 *
 * @param min
 * @param max
 */
let makeColorScale = function (min, max) {
  let color = d3.scale.linear().domain([min, max])
  .interpolate(d3.interpolateHcl)
  .range([d3.rgb("#ff4d66"), d3.rgb('#FFF500')]);
  return color;
}