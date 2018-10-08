

/*
 * Fuses the information from two controller containing edge controller
 * params = edges1 and edges2 are controller containing edge controller
 *	   from two different POAGS.
 *
 * returns object containing the unique edges from each edge object, and
 * for each edge in common a fused edge will be stored in the object with
 * the same information as the two original edges but with y-values
 * corresponding to the highest y-value between the two edges fused.
 */
function getFusedEdges(edges1, edges2, newNodes, metadata1, metadata2) {
  //object to store fused edges
  var newEdges = {};

  //pairwise comparison of edges, fusing if same edge name
  for (var edge1 in edges1) {
    for (var edge2 in edges2) {

      if (edge1 == edge2) {

        var newEdge = fuse_edges(edges1[edge1], edges2[edge2],
            metadata1, metadata2);
        newEdges[edge1] = newEdge;

        break;
      }
    }
  }

  //add uncommon edges
  add_uncommonEdges(edges1, newEdges, newNodes, metadata1);
  add_uncommonEdges(edges2, newEdges, newNodes, metadata2);

  return newEdges;
}

/*
 * Gets unique edges and appends them to newEdge
 *
 * params = -> edges - object containing edges desired to get its
 *		      unique edges.
 * 	       -> edgesFused - array of edge names added to newEdges.
 *	       -> newEdges - array containing all the fused edges
 *			 already proccessed
 *
 * ensures -> All of the unique edges in edges will be added to
 *	     newEdges.
 *	      -> Edges added to newEdges are a deep copy version of
 *	     the edge.
 */
function add_uncommonEdges(edges, newEdges, newNodes, metadata) {

  //adding edges in edges not in newEdges
  for (var edge in edges) {

    if (!(edge in newEdges)) {

      var edgeCopy = [];
      var edgeInfo = edges[edge];

      for (var property in edgeInfo) {
        edgeCopy[property] = edgeInfo[property];
      }

      //setting the new y-values
      setY(edgeCopy, newNodes);

      newEdges[edge] = edgeCopy;
    }
  }
}

/*
 * Sets the y-values for the edges based off the nodes already
 * created due to fusing the graphs
 *
 * params: -> edgeCopy - deepCopy of the edge being created to
 *			be added to the new edges.
 *	      -> newNodes - array of nodes created due to fusing
 *			the two graphs.
 *
 * ensures: -> The edgeCopy has it's y-values set so the edge
 *	      goes from the y specified as the starting node
 *	      in new nodes and goes to the ending nodes y in
 *	      newNodes.
 */
function setY(edgeCopy, newNodes) {

  //looping through each node and checking if involved in edge
  for (var i = 0; i < newNodes.length; i++) {
    var node = newNodes[i];

    //no. of nodes corresponding to edgeCopy
    var hits = 0;

    //Setting the y for the from node
    if (node[G_ID] == edgeCopy[E_FROM]) {
      edgeCopy[E_Y1] = node[N_Y];
      hits++;

      //setting the y for the to node
    } else if (node[G_ID] == edgeCopy.to) {
      edgeCopy[E_Y2] = node[N_Y];
      hits++;
    }

    //edge can only have two nodes, so:
    if (hits == 2) {
      break;
    }
  }
}

/*
 * Fuse the two inputted edges
 *
 * params = two inputted edges with equivalent names from two
 *	   different POAGs
 *
 * returns = A new edge with the same details of both input
 *	    edges but y1 for the edge is equal to the largest
 *	    y1 of the two edges, same for y2.
 */
function fuse_edges(edge1Info, edge2Info, metadata1, metadata2) {

  //initialising new edge with equivalent information to edge1
  var newEdge = [];

  newEdge[E_X1] = edge1Info[E_X1];
  newEdge[E_WEIGHT] = edge1Info[E_WEIGHT];
  newEdge[E_FROM] = edge1Info[E_FROM];
  newEdge[E_TO] = edge1Info[E_TO];
    //   {"x1": edge1Info.x1, "weight": edge1Info[E_WEIGHT],
    // "from": edge1Info.from, "x2": edge1Info.x2,
    // "to": edge1Info.to};

  newEdge[E_CONSENSUS] = edge1Info[E_CONSENSUS] || edge2Info[E_CONSENSUS];
  newEdge[E_RECIPROCATED] = edge1Info[E_RECIPROCATED] || edge2Info[E_RECIPROCATED];

  //making y1 for new edge be equal to edge with largest y1
  if (edge1Info[E_Y1] > edge2Info[E_Y1]) {
    newEdge[E_Y1] = edge1Info[E_Y1];
  } else {
    newEdge[E_Y1] = edge2Info[E_Y1];
  }

  //making y2 for new edge be equal to edge with largest y2
  if (edge1Info[E_Y2] > edge2Info[E_Y2]) {
    newEdge[E_Y2] = edge1Info[E_Y2];
  } else {
    newEdge[E_Y2] = edge2Info[E_Y2];
  }

  return newEdge;
}




/*
 * Fuses inputted two list of nodes from two different POAGs
 *
 * param = -> nodes1 and nodes2 are arrays containing node controller from
 *	     different POAGS.
 *	  -> nodes1 can be from a fused type poag, marginal type, or
 *	     joint type.
 *	  -> nodes2 must be from either a marginal type, or joint type
 *	     poag.
 *	  -> metadata1 is the metadata from the nodes1 poag.
 *	  -> metadata2 is the metadata from the nodes2 poag.
 *
 * returns -> list of nodes with the information from the two different
 *						 lists of nodes fused.
 */
function getFusedNodes(nodes1, nodes2, metadata1, metadata2) {

  //fusing the common nodes
  var commonNodeInfo = add_commonNodes(nodes1, nodes2, metadata1,
      metadata2);
  var idNodesFused = commonNodeInfo[0];
  var newNodes = commonNodeInfo[1];

  //adding the uncommon nodes to newNodes in fused format
  add_uncommonNodes(nodes1, idNodesFused, newNodes, metadata1);
  add_uncommonNodes(nodes2, idNodesFused, newNodes, metadata2);

  return newNodes;
}

/*
 * Get common nodes IDs and fuse common nodes
 *
 * params = same as for function 'getFusedNodes'
 *
 * returns -> commonNodeInfo - array containing idNodesFused and newNodes.
 *		-> idNodesFused is an array of ids of common nodes
 *		-> newNodes is an array of the common nodes fused
 */
function add_commonNodes(nodes1, nodes2, metadata1, metadata2) {
  //array to store new, fused nodes
  var newNodes = [];

  //IDs of the nodes already fused
  var idNodesFused = [];

  //pairwise comparison of nodes, fusing if same id
  for (var i = 0; i < nodes1.length; i++) {

    var nodes1Id = nodes1[i][G_ID];

    for (var j = 0; j < nodes2.length; j++) {
      var nodes2Id = nodes2[j][G_ID];

      if (nodes1Id == nodes2Id) {

        idNodesFused.push(nodes1Id);

        var newNode = fuse_nodes(nodes1[i], nodes2[j], newNodes,
            metadata1, metadata2);
        newNodes.push(newNode);

        break;
      }

    }
  }

  var commonNodeInfo = [idNodesFused, newNodes];
  return commonNodeInfo;
}

/*
 * Gets nodes unique to nodes, adds them in ordered way to idNodesFused
 * and newNodes
 *
 * params = -> nodes is an array of nodes.
 *	       -> idNodesFused is an array of ids from nodes present in
 *	                        newNodes.
 * 	       -> newNodes is an array of nodes already fused/added.
 *	       -> metadata is the metadata object from the same poag as
 *	                    nodes.
 *
 * ensures = -> All of the nodes unique to nodes will be added in ascending
 *	      order in both idNodesFused and newNodes depending on node ID.
 *	        -> Nodes added to newNodes are a deep copy version of the nodes,
 *	      (are converted to fused format if not already.
 */
function add_uncommonNodes(nodes, idNodesFused, newNodes, metadata) {

  //adding nodes from first graph not contained in the other graph
  for (var i = 0; i < nodes.length; i++) {

    //checking if node already in newNodes, if not then add
    if (idNodesFused.indexOf(nodes[i][G_ID]) == -1) {

      //adding to idNodesFused in ordered way
      idNodesFused.push(nodes[i][G_ID]);
      idNodesFused.sort(d3.ascending);

      var nodeCopy = node_DeepCopy(nodes[i], metadata);

      //using ordering in idNodesFused to add node to newNodes
      newNodes.splice(idNodesFused.indexOf(nodes[i][G_ID]), 0, nodeCopy);
    }
  }
}


/*
 * Returns deep copy of inputted node, if from an unfused type will return in
 * a fused type format
 *
 * params = -> node is an inputted node from a POAG
 *	       -> metadata is the metdata from the same poag as node
 *
 * returns = -> newNode - is is exactly the same(if node is fused type),
 *	       else returns copy of node in fused type format.
 */
function node_DeepCopy(node, metadata) {
  //need to check what the point of class, lane, and seq are.
  var newNode = [];
  newNode[G_ID] = node[G_ID];
  newNode[N_X] = node[N_X];
  newNode[N_Y] = node[N_Y];
  newNode[G_LABEL] = node[G_LABEL];
  newNode[N_NUM_OUT_EDGES] = node[N_NUM_OUT_EDGES];
    //   {"id": node[G_ID], "x": node[N_X], "y": node.y, "label": node[G_LABEL],
    // "num_out_edges": node.num_out_edges};

  //checking if node from fused poag and
  if (metadata[N_TYPE] == "fused" && node[G_GRAPH_BARS][0][POAG_VALUES] != undefined) {

    //already in fused format, just add deep copies of graph and seq
    newNode[G_GRAPH_BARS] = graph_deepCopy(node);
    newNode[G_SEQ_CHARS] = seq_deepCopy(node);

  } else if (metadata[N_TYPE] != "marginal") {

    //putting in details in fused type format
    newNode[G_SEQ_CHARS] = [];
    newNode[G_VALUE_SEQ] = 1;
    newNode[G_LABEL_SEQ] = newNode[G_LABEL];
    newNode[POAG_VALUES] = [];

      //   {"chars": [{"label": newNode[G_LABEL], "value": 1}],
      // "poagValues": []};

    newNode[G_SEQ_CHARS][POAG_VALUES][G_LABEL] = newNode[G_LABEL];
    newNode[G_SEQ_CHARS][POAG_VALUES][G_VALUE_SEQ] = 1;
    newNode[G_SEQ_CHARS][POAG_VALUES][POAG] = "poag" + (metadata.npoags + 1);

      //   {"label": newNode[G_LABEL], "value": 1,
      // "poag": "poag" + (metadata.npoags + 1)});
    newNode[G_GRAPH_BARS][G_LABEL] = newNode[G_LABEL];
    newNode[G_GRAPH_BARS][G_VALUE_BAR] = 100;
    newNode[G_SEQ_CHARS][POAG_VALUES] = {};
    // newNode.graph = {"bars": [{"label": newNode[G_LABEL], "value": 100,
    //     "poagValues": {}}]};

    newNode[G_GRAPH_BARS][0][POAG_VALUES]["poag" + (metadata.npoags + 1)] = 100;

  } else {

    //putting in details in fused type format
    newNode[G_SEQ_CHARS] = [];
    newNode[G_VALUE_SEQ] = 1;
    newNode[G_LABEL_SEQ] = newNode[G_LABEL];
    newNode[POAG_VALUES] = [];

    //   {"chars": [{"label": newNode[G_LABEL], "value": 1}],
    // "poagValues": []};

    newNode[G_SEQ_CHARS][POAG_VALUES][G_LABEL] = newNode[G_LABEL];
    newNode[G_SEQ_CHARS][POAG_VALUES][G_VALUE_SEQ] = 1;
    newNode[G_SEQ_CHARS][POAG_VALUES][POAG] = "poag" + (metadata.npoags + 1);
    //
    // //putting in details in fused type format
    // newNode.seq = {"chars": [{"label": newNode[G_LABEL], "value": 1}],
    //   "poagValues": []};
    //
    // newNode.seq.poagValues.push({"label": newNode[G_LABEL], "value": 1,
    //   "poag": "poag" + (metadata.npoags + 1)});


    //need to treat the marginal graph object differently
    newNode[G_GRAPH_BARS] = add_poagValues(node[G_GRAPH_BARS], metadata.npoags);
    //
    // newNode.graph = add_poagValues(node.graph, metadata.npoags);
  }

  return newNode;
}

/*
 * Creates a fused poag version of the marginal poags graph object
 * (i.e. has poag information)
 *
 * params: -> graph - marginal poags graph object
 *
 * returns: -> fusedGraphObject - fused poag version of graph object
 */
function add_poagValues(graph, npoags) {

  var bars = graph;

  var fusedGraphObject = [];

  for (var bari in bars) {

    var bar = bars[bari];

    //copying over graph information and adding poag info
    let newBar = [];
    newBar[G_LABEL] = bar[G_X_LABEL];
    newBar[G_VALUE] = bar[G_VALUE_BAR];
    newBar[POAG_VALUES] = {};

    // var newBar = {"label": bar[G_X_LABEL], "value": bar[G_VALUE_BAR],
    //   "poagValues": {}};

    newBar[POAG_VALUES]["poag" + (npoags + 1)] = bar[G_VALUE_BAR];

    fusedGraphObject.push(newBar);
  }

  return fusedGraphObject;
}


/*
 * Fuses two inputted nodes
 *
 * params = -> node1, node2, metadata1 & metadata2 same as described
 *	      for 'getFusedNodes' method
 *	       -> newNodes is an array of the fused nodes
 *
 * returns = -> newNode - A single node with attributes of both nodes
 *			 fused.
 */
function fuse_nodes(node1, node2, newNodes, metadata1, metadata2) {
  //need to check what the point of class, lane, and seq are.
  var newNode = [];//{"id": node1[G_ID], "lane": 0, "x": node1[N_X]};
  newNode[G_ID] = node1[G_ID];
  newNode[N_X] = node1[N_X];
  //fusing the nodes appropriately depending on the poags they are from
  if (metadata1[N_TYPE] == "joint" && metadata2[N_TYPE] == "joint") {

    //need to create new graph and seq controller when fusing joint types
    newNode[G_SEQ_CHARS] = create_seqObject(node1, node2);
    newNode[G_GRAPH_BARS] = createGraphObject(newNode[G_SEQ_CHARS], node1, node2);

  } else if (metadata1[N_TYPE] == "fused" && metadata2[N_TYPE] == "joint") {

    //adding the label information from the joint node (node2) to node1
    newNode[G_SEQ_CHARS] = add_labelToSeq(node1, node2, metadata1.npoags);
    newNode[G_GRAPH_BARS] = add_labelToGraph(newNode[G_SEQ_CHARS], node1, node2,
        metadata1.npoags);

  } else if (metadata1[N_TYPE] == "marginal" && metadata2[N_TYPE] == "marginal") {

    //Need to create new seq object with the marginal but fuse distributions
    newNode[G_SEQ_CHARS] = create_seqObject(node1, node2);
    newNode[G_GRAPH_BARS] = fuse_marginalGraphs(node1, node2, metadata1.npoags,
        metadata2.npoags);

  } else if (metadata1[N_TYPE] == "fused" && metadata2[N_TYPE] == "marginal") {

    //need to add label information to seq, but still fuse distributions
    newNode[G_SEQ_CHARS] = add_labelToSeq(node1, node2);
    newNode[G_GRAPH_BARS] = fuse_marginalGraphs(node1, node2, metadata1.npoags,
        metadata2.npoags);
  }

  //node with highest y becomes y of new node
  if (node1[N_Y] > node2[N_Y]) {
    newNode[N_Y] = node1[N_Y];
  } else {
    newNode[N_Y] = node2[N_Y];
  }

  //label with highest frequency becomes new label
  newNode[G_LABEL] = getNodeLabel(newNode[G_SEQ_CHARS]);

  return newNode;
}

/*
 * Fuses the graph information present in two marginal poags or a fused poag
 * and marginal poag
 *
 * params: -> node1 must either be a node from a fused or marginal poag
 *	      -> node2 must be a node from a marginal poag
 *	      -> npoags is the total number of nodes fused thus far
 *	        (refer to fuse_multiplegraphs)
 *
 * returns: -> fusedGraph - fused graph object of the two inputted nodes
 *			   and returns a new graphh object in the fused
 *			   graph format (i.e. has poagValues).
 */
function fuse_marginalGraphs(node1, node2, npoags1, npoags2) {

  var bars1 = node1[G_GRAPH_BARS];
  var bars2 = node2[G_GRAPH_BARS];

  var fusedGraph = [];

  //pairwise comparison of the bars, fusing if have the same label
  for (var bar1i in bars1) {

    var bar1 = bars1[bar1i];

    for (var bar2i in bars2) {
      var bar2 = bars2[bar2i];

      if (bar1[G_X_LABEL] == bar2[G_X_LABEL]) {

        var newBar = fuse_Bar(bar1, bar2, npoags1, npoags2);
        fusedGraph.push(newBar);
      }
    }
  }
  return fusedGraph;
}

/*
 * Fuses two bar controller with the same label
 *
 * params: -> bar1 must be from a graph object from either a fused or
 *	     marginal poag
 *	      -> bar2 must be from a graph object from a marginal poag
 *	         Both bar controller must have the same label.
 *	     -> npoags1 and 2 is the same as described in params for
 *	        'fused_marginalGraphs'
 *
 * returns: -> newBar - object containing information between the
 *		       two bars fused. If bar1 is from a fused graph,
 *		       will appropriately normalise poagValues and add
 *		       the extra poagValue from bar2.
 */
function fuse_Bar(bar1, bar2, npoags1, npoags2) {

  var newValue = (bar1[G_VALUE_BAR] + bar2[G_VALUE_BAR]) / 2;
  var newBar = [];
  newBar[G_LABEL] = bar1[G_X_LABEL];
  newBar[G_VALUE_BAR] = newValue;
  newBar[POAG_VALUES] = {};
      //{"label": bar1[G_X_LABEL], "value": newValue,
    //"poagValues": {}};

  //if has "poagValues", bar1 is from fused type
  if (bar1[POAG_VALUES] != undefined) {

    //Copying over the poagValues from bar1 and normalising
    for (var poag in bar1[POAG_VALUES]) {

      newBar[POAG_VALUES][poag] = bar1[POAG_VALUES][poag] / 2;
    }

  } else {

    //adding new poagValue information since must be marginal type here
    newBar[POAG_VALUES]["poag" + (npoags1 + 1)] = bar1[G_VALUE_BAR] / 2;
  }

  //bar2 is always from marginal type so just add the barValue for that poag
  newBar[POAG_VALUES]["poag" + (npoags2 + 1)] = bar2[G_VALUE_BAR] / 2;

  return newBar;
}

/*
 * Creates a seq object based off the labels of two inputted nodes
 *
 * params: Nodes 1 and 2 are both nodes with the same id from two
 *	      different POAGs which are unfused and represent a
 *	      sequence at an intermediate node in the tree.
 *
 * return: seq object created based off the labels of the inputted nodes
 */
function create_seqObject(node1, node2) {

  var newSeq = [[], []];//{"chars": [], "poagValues": []};

  if (node1[G_LABEL] != node2[G_LABEL]) {

    //creating two new seperate char controller
    newSeq[G_SEQ_CHARS][0] = [];//{"label": node1[G_LABEL], "value": 1};
    newSeq[G_SEQ_CHARS][0][G_LABEL] = node1[G_LABEL];
    newSeq[G_SEQ_CHARS][0][G_VALUE] = 1;
    newSeq[G_SEQ_CHARS][1] = [];//{"label": node1[G_LABEL], "value": 1};
    newSeq[G_SEQ_CHARS][1][G_LABEL] = node2[G_LABEL];
    newSeq[G_SEQ_CHARS][1][G_VALUE] = 1;
    // newSeq[G_SEQ_CHARS][1] = {"label": node2[G_LABEL], "value": 1};
  } else {

    //just adding one new char object, but with a value of 2
    // newSeq[G_SEQ_CHARS][0] = {"label": node1[G_LABEL], "value": 2};
    newSeq[G_SEQ_CHARS][0] = [];//{"label": node1[G_LABEL], "value": 1};
    newSeq[G_SEQ_CHARS][0][G_LABEL] = node1[G_LABEL];
    newSeq[G_SEQ_CHARS][0][G_VALUE] = 2;
  }

  //adding the different values for the poags
  // newSeq[POAG_VALUES][0] = {"label": node1[G_LABEL], "value": 1,
  //   "poag": "poag1"};
  newSeq[G_SEQ_CHARS][0] = [];//{"label": node1[G_LABEL], "value": 1};
  newSeq[G_SEQ_CHARS][0][G_LABEL] = node1[G_LABEL];
  newSeq[G_SEQ_CHARS][0][G_VALUE] = 1;
  newSeq[G_SEQ_CHARS][0][POAG] = "poag2";
    //
    //   newSeq[POAG_VALUES][1] = {"label": node2[G_LABEL], "value": 1,
    // "poag": "poag2"};

  return newSeq;
}

/*
 * Adds to the existing seq object in node1 based off the seq label in
 * node2
 *
 * params: -> node1 - is from a POAG which is fused
 *	      -> node2 - has the same ID as node1, and is from either
 *	                 joint or marginal poag
 *	      -> npoags - same as described in 'fused_marginalGraphs'
 *
 * returns: -> seq - A seq object in node1 updated to include node2's
 *		    label details. Added if label already present in chars,
 *		    otherwise label added as new char with value of 1.
 */
function add_labelToSeq(node1, node2, npoags) {

  //getting deep copy of characters in seq object
  var newSeq = seq_deepCopy(node1);
  var chars = newSeq[G_SEQ_CHARS];

  var foundMatch = false;
  for (var i = 0; i < chars.length; i++) {

    //if found match, increment character value
    if (node2[G_LABEL] == chars[i][G_LABEL]) {
      chars[i][G_VALUE_SEQ] += 1;
      foundMatch = true;
      break;
    }

  }

  //adding new char object if no match found
  if (!foundMatch) {
    chars.push([]);
    chars[chars.length - 1][G_LABEL] = node2[G_LABEL]
    chars[chars.length - 1][G_VALUE_SEQ] = 1;
  }

  //adding the poagValue in
  let newPoagValue = [];
  newPoagValue[G_LABEL] = node2[G_LABEL];
  newPoagValue[G_VALUE] = 1;
  newPoagValue[POAG] = "poag" + (npoags + 1);

  newSeq[POAG_VALUES].push(newPoagValue);

  // newSeq[POAG_VALUES].push({"label": node2[G_LABEL], "value": 1,
  //   "poag": ("poag" + (npoags + 1))});

  return newSeq;
}

/*
 * Creates deep copy of seq object in inputted node
 *
 * params: node -> node wish to make deep copy of its seq object,
 *		          must be fused type
 *
 * returns: -> newSeq - Deep copy of node seq, is identical to node.seq.
 */
function seq_deepCopy(node) {
  //to store all the sequence information
  var newSeq = [[], []]; //{"chars": [], "poagValues": []};

  for (var i = 0; i < node[G_SEQ_CHARS].length; i++) {

    //adding seq details from inputted node to seq object of new node
    newSeq[G_SEQ_CHARS].push([]);
    newSeq[G_SEQ_CHARS][i][G_LABEL] = node[G_SEQ_CHARS][i][G_LABEL];
    newSeq[G_SEQ_CHARS][i][G_VALUE_SEQ] = node[G_SEQ_CHARS][i][G_VALUE_SEQ];
  }

  //copying over the poagValue details
  var poagValues = node[G_SEQ_CHARS][POAG_VALUES];
  for (var j = 0; j < poagValues.length; j++) {
    let newPoagValue = [];
    newPoagValue[G_LABEL] = poagValues[j][G_LABEL];
    newPoagValue[G_VALUE] = poagValues[j][G_VALUE_SEQ];
    newPoagValue[POAG] = poagValues[j][POAG];
    newSeq.poagValues.push(newPoagValue);
    //{"label": poagValues[j][G_LABEL], "value":
    //poagValues[j][G_VALUE_SEQ], "poag": poagValues[j].poag}
  }

  return newSeq;
}

/*
 * Gets the label in a given seq object with the highest value.
 *
 * params: -> seq - seq object from a node from any type of poag
 *
 * returns: -> label with the highest associated value in the seq object
 */
function getNodeLabel(seq) {
  //getting the characters
  var chars = seq.chars;

  //initially assigning chars with max freq as the first
  var charMaxFreq = chars[0];

  //getting char with max freq
  for (var i = 1; i < seq[G_SEQ_CHARS].length; i++) {
    if (chars[i][G_VALUE_SEQ] > chars[chars.indexOf(charMaxFreq)][G_VALUE_SEQ]) {
      charMaxFreq = chars[i];
    }
  }

  return charMaxFreq[G_LABEL];
}

/*
 * Creates node graph object from inputted seq object and
 * nodes from joint type poags. Called on initial graph fusion.
 *
 * params = -> seq - fused seq object generated from
 *		     create_seqObject(node1, node2).
 *	       -> node1 - node from joint type poag
 *	       -> node2 - node from joint type poag
 *
 * require = -> node1[G_LABEL] == node2[G_LABEL]
 *	        -> node1 and node2 from different poags
 *
 * returns = -> newGraph - A new graph object generated from
 *			  the seq and node data
 */
function createGraphObject(seq, node1, node2) {
  var overallCharCount = 0;
  var chars = seq.chars;

  var newGraph = [];

  //getting total character count
  for (var i = 0; i < chars.length; i++) {
    overallCharCount += chars[i][G_VALUE_BAR];
  }

  //calculating freq of each character relative to total
  for (var i = 0; i < chars.length; i++) {

    var char = chars[i];
    var graphValue = (char[G_VALUE_BAR] / overallCharCount) * 100;

    //adding the char label and value
    let newPoagValue = [];
    newPoagValue[G_LABEL] = char[G_LABEL];
    newPoagValue[G_VALUE] = graphValue;
    newPoagValue[POAG_VALUES] = {};
    newGraph.push(newPoagValue);
      //
      //   {"label": char[G_LABEL], "value":
      // graphValue, "poagValues": {}});

    if (char[G_LABEL] == node1[G_LABEL] && char[G_LABEL] == node2[G_LABEL]) {

      //add both the poags to poag values since match char
      newGraph[i][POAG_VALUES]["poag1"] =
          (1 / overallCharCount) * 100;

      newGraph[i][POAG_VALUES]["poag2"] =
          (1 / overallCharCount) * 100;

    } else if (char[G_LABEL] == node1[G_LABEL]) {

      //add just node1s poag to graph object
      newGraph[i][POAG_VALUES]["poag1"] =
          (1 / overallCharCount) * 100;

    } else {

      //add just node2s poag to graph object
      newGraph[i][POAG_VALUES]["poag2"] =
          (1 / overallCharCount) * 100;

    }
  }
  return newGraph;
}

/*
 * Adds the information from node2 to the graph in node1
 *
 * params = -> seq - fused seq object from nodes inputted
 *	       -> node1 - node from fused poag
 *	       -> node2 - node from joint poag
 *	       -> npoags - number of poags fused in the poag from
 *		       which node1 is derived.
 *
 * returns = -> newGraph - new graph object which is the same as
 *			  node1s graph but with the extra label
 *			  information incorporated from node2.
 */
function add_labelToGraph(seq, node1, node2, npoags) {
  var overallCharCount = 0;
  var chars = seq;

  var newGraph = graph_deepCopy(node1);

  //getting total character count
  for (var i = 0; i < chars.length; i++) {
    overallCharCount += chars[i][G_VALUE_BAR];
  }

  //calculating freq of each character relative to total
  for (var i = 0; i < chars.length; i++) {
    var char = chars[i];

    var graphValue = (char[G_VALUE_BAR] / overallCharCount) * 100;

    var graphBars = newGraph;

    var labelIndex = -1;

    for (var k = 0; k < graphBars.length; k++) {

      if (graphBars[k][G_LABEL] == node2[G_LABEL] &&
          node2[G_LABEL] == char[G_LABEL]) {

        graphBars[k][G_VALUE_BAR] = graphValue;

        labelIndex = k;
        break;
      }
    }

    /****updating the poag values for every poagvalue*****/
    for (var k = 0; k < graphBars.length; k++) {

      //for updating the whole bars value
      graphBars[k][G_VALUE_BAR] = 0;

      for (var poagValue in graphBars[k][POAG_VALUES]) {

        graphBars[k][POAG_VALUES][poagValue] =
            (1 / overallCharCount) * 100;

        graphBars[k][G_VALUE_BAR] += (1 / overallCharCount) * 100;
      }
    }

    /*********adding new graph poag info *************/
    if (labelIndex != -1) {

      graphBars[labelIndex][POAG_VALUES]["poag" +
      (npoags + 1)] = (1 / overallCharCount) * 100;

      graphBars[labelIndex][G_VALUE_BAR] += (1 / overallCharCount) * 100;

    } else if (char[G_LABEL] == node2[G_LABEL]) {

      graphBars.push({"label": char[G_LABEL], "value": graphValue,
        "poagValues": {}});

      graphBars[graphBars.length - 1][POAG_VALUES]["poag" +
      (npoags + 1)] = (1 / overallCharCount) * 100;

    }
  }

  return newGraph;
}

/*
 * Creates deep copy of graph object in node, graph must be fused type
 * param: node object of fused type
 * returns deep copy of graph in node
 */
function graph_deepCopy(node, npoags) {

  //to store graph information
  var newGraph = [];

  for (var i = 0; i < node[G_SEQ_CHARS].length; i++) {
    //adding graph details from node to graph object of new node
    if (i >= node[G_GRAPH_BARS].length) {
      return newGraph;
    }
    newGraph.push([]);

    let newBars = newGraph;
    let nodeBars = node[G_GRAPH_BARS];
    newBars[i][G_VALUE_BAR] = nodeBars[i][G_VALUE_BAR];
    newBars[i][G_LABEL] = nodeBars[i][G_LABEL];

    newBars[i][POAG_VALUES] = {};

    for (var poagValue in nodeBars[i][POAG_VALUES]) {

      newBars[i][POAG_VALUES][poagValue] = nodeBars[i][POAG_VALUES][poagValue];
    }
  }
  return newGraph;
}

//  Have moved the following code to results.html line 140

//var graph1 = JSON.parse(json_str);
//var graph2 = JSON.parse(poag_json_n4);
//var graph3 = JSON.parse(poag_json_n9);
//var graph5 = JSON.parse(joint4);
//var graph6 = JSON.parse(joint5);

//var graphs = graph.poags;//[graph1, graph2, graph3, graph5, graph6];

//var marginalGraph1 = JSON.parse(marginal1);
//var marginalGraph2 = JSON.parse(marginal2);

//var marginalGraphs = [marginalGraph1, marginalGraph2];

//var newGraph = fuse_multipleGraphs(graphs);
//console.log(newGraph);

/*
 * Fuses multiple poags of either marginal or joint type
 *
 * params: -> graphs - an array of either marginal or joint poags
 *	  -> innerNodeGrouped - boolean whether the user wants
 *				the nodes displayed with the inner
 *				colours grouped or not.
 *
 * returns: string JSON object (of fused poag object)
 *	   of all the poags in the array.
 */
function fuse_multipleGraphs(graphs, innerNodeGrouped) {

  var innerNodeGrouped = innerNodeGrouped || false;

  //assigning each poag a no. to identify it
  for (var j = 0; j < graphs.length; j++) {

    graphs[j].bottom.metadata["npoags"] = j;

  }

  //initial graph fusion
  var fusedGraph = fuse_graphs(graphs[0], graphs[1]);

  fusedGraph.bottom.metadata.npoags = 2;

  //if list of poags >2, fused next poag with the current fused poag
  if (graphs.length > 2) {

    for (var i = 2; i < graphs.length; i++) {

      fusedGraph = fuse_graphs(fusedGraph, graphs[i]);
      fusedGraph.bottom.metadata.npoags += 1;

    }
  }

  //adding the poags which aren't described into seq
  for (var node in fusedGraph.bottom.nodes) {

    var seq = fusedGraph.bottom.nodes[node].seq;
    add_poagsToSeq(seq, fusedGraph.bottom.metadata.npoags,
        innerNodeGrouped);
  }

  //adding the mutant information if fusing marginal poags
  if (fusedGraph.bottom.metadata.subtype == "marginal") {

    // Need to fix when integrate to grasp
    var fusedGraphBottom = generate_mutants(fusedGraph.bottom);
    add_poagValuesToMutants(fusedGraph.bottom.nodes);

  }

  return JSON.stringify(fusedGraph);
}

/*
 * Add normalised poagValue information to each mutant object in
 * nodes[nodei]
 *
 * params: nodes are nodes from a fused poag
 *
 * ensures: for each node in the list of nodes, poagValues are
 *	   added so that the degree each poag contributes to
 *	    the mutant frequency is present.
 */
function add_poagValuesToMutants(nodes) {

  for (var nodei in nodes) {

    var node = nodes[nodei];

    for (var chari in node[G_MUTANTS_CHARS]) {

      var char = node[G_MUTANTS_CHARS][chari];

      for (var bari in node[G_GRAPH_BARS]) {

        var bar = node[G_GRAPH_BARS][bari];

        if (char[G_LABEL] == bar[G_LABEL]) {

          //adding normalised poagValues
          char["poagValues"] = {};
          for (var poag in bar[POAG_VALUES]) {

            char[POAG_VALUES][poag] =
                (bar[POAG_VALUES][poag] / bar[G_VALUE_BAR]) * char[G_VALUE_BAR];
          }
        }
      }
    }
  }
}

/*
 * Adds to the seq object the poags which were not present with a label of "0"
 *
 * params: -> seq - seq object from the final fused poag
 *	  -> npoags - number of poags fused to created the final fused poag.
 *	  -> innerNodeGrouped - *optional* boolean as to whether the seq
 *				poagValues should be order so that the
 *				kind of labels in the inner pi chart are
 *				grouped.
 *
 * ensures: -> All poags not present in the seq object added with label "0"
 *	      to indicate that poag does not have that node. If
 *	      innerNodeGrouped then poags added so labels grouped together
 *	      in pi chart, else added so pi chart ordered based off poag
 *	      number.
 */
function add_poagsToSeq(seq, npoags, innerNodeGrouped) {

  var poagValues = seq[POAG_VALUES];

  //getting poags which don't have node
  var poagsAbsent = getPoagsAbsent(npoags, poagValues);

  //updating seq appropriately to contain poag with label "0"
  if (poagsAbsent.length > 0) {

    //inserting absent poags into seq object with label "0"
    let tmp = [];
    tmp[G_LABEL] = "0";
    tmp[G_VALUE] = 0;
    seq[G_SEQ_CHARS].push(tmp);//{"label": "0", "value": 0});

    //for determining location of already added poags
    var firstPoagi = -1;

    //getting poagValues length before append extra poags
    var originalLength = poagValues.length;

    //add absent poags with label "0" for pi chart display
    for (var poagAbsenti in poagsAbsent) {

      var poagAbsent = poagsAbsent[poagAbsenti];

      let newPoagObject = [];
      newPoagObject[G_LABEL] = "0";
      newPoagObject[G_VALUE] = 0;
      newPoagObject[POAG] = poagAbsent;
      // var newPoagObject = {"label": "0",
      //   "value": 1, "poag": poagAbsent};

      //getting poag number from poag name (e.g 1 from 'poag1')
      var poagNumber = poagAbsent.charAt(poagAbsent.length - 1) - 1;

      //poag order in poagValues determines pi chart slice order
      if ((!innerNodeGrouped) || originalLength == 1 || poagsAbsent.length == 1) {

        //nodes ordered according to poagNumber
        poagValues.splice(poagNumber, 0, newPoagObject);

      } else {

        //groups according to character when pi displayed
        let firstpoagi = addpoag_InnerOrdered(firstpoagi, poagNumber,
            poagValues, newPoagObject);
      }

      seq[G_SEQ_CHARS][seq[G_SEQ_CHARS].length - 1][G_VALUE_BAR] += 1;
    }
  }
}

/*
 * Gets the poags not already described in poagValues
 *
 * params: npoags -> number of poags fused in the fused graph object
 *         poagValues -> seq.poagValues from the fused graph object
 *
 * returns: poagsAbsent -> array containing names of poags not present in
 *                         poagValues.
 */
function getPoagsAbsent(npoags, poagValues) {

  var poagsAbsent = [];

  //getting poags no present in poag values
  for (var poagi = 1; poagi < npoags + 1; poagi++) {

    var poagPresent = false;
    for (var poag in poagValues) {

      if (poagValues[poag].poag == ("poag" + poagi)) {

        poagPresent = true;
        break;
      }
    }

    if (!poagPresent) {

      poagsAbsent.push(("poag" + poagi));
    }
  }

  return poagsAbsent;
}

/*
 * Adds the newPoagObject in the appropriate position in poagValues
 * params: firstpoagi -> index in poagValues first poagAbsent was added to.
 *                       firstpoagi == -1 if absent poag not yet added.
 *         poagNumber -> poags number (e.g. 1 from 'poag1') minus 1 for indexing.
 *         poagValues -> same as described in getPoagsAbsent.
 *         newPoagObject -> poagObject describing absent poag corresponding to poagNumber.
 * returns: firstpoagi -> same as described above.
 */
function addpoag_InnerOrdered(firstpoagi, poagNumber, poagValues, newPoagObject) {

  //groups according to character when pi displayed
  if (firstpoagi == -1 && poagNumber > 0 && poagNumber < poagValues.length - 1) {

    for (var i = poagNumber; i < poagValues.length; i++) {

      //adding poag at nearest site to poagNumber between poags with different labels
      if (poagValues[i - 1][G_LABEL] != poagValues[i][G_LABEL]) {
        poagValues.splice(i, 0, newPoagObject);
        firstpoagi = i;
        break;
      }
    }

    //means all of the poags in seq have same label, so don't want to split up
    if (firstpoagi == -1) {

      //to check whether poag should be inserted at end or start
      var endDist = poagValues.length - poagNumber;

      //if poag closer to end, insert there, else at start
      if (endDist < poagNumber) {
        poagValues.push(newPoagObject);
        firstpoagi = poagValues.length - 1;

      } else {

        poagValues.splice(0, 0, newPoagObject);
        firstpoagi = 0;
      }
    }

  } else if (firstpoagi == -1 && poagNumber == 0) {

    //poag can just go at the start, won't split up poags with same labels
    poagValues.splice(0, 0, newPoagObject);
    firstpoagi = 0;


  } else if (firstpoagi == -1 && poagNumber == poagValues.length - 1) {

    //poag can just go at the end, won't split up poags with same labels
    poagValues.push(newPoagObject);
    firstpoagi = poagValues.length - 1;

  } else {

    //just adding in front of last added absent poag
    poagValues.splice(firstpoagi + 1, 0, newPoagObject);
  }

  return firstpoagi;
}

/*
 * Fuses two inputted POAG graphs
 * params = two graphs aligned and aligned nodes have the same ids
 * returns single graph with attributes of both graphs fused.
 */
function fuse_graphs(graph1, graph2) {
  //getting nodes from inputted graphs
  var nodes1 = graph1.bottom.nodes;
  var nodes2 = graph2.bottom.nodes;

  //graph metadata
  var metadata1 = graph1.bottom.metadata;
  var metadata2 = graph2.bottom.metadata;

  var newNodes = getFusedNodes(nodes1, nodes2, metadata1,
      metadata2);

  //Getting edges from inputted graphs
  var edges1 = graph1.bottom.edges;
  var edges2 = graph2.bottom.edges;

  var fusedEdges = getFusedEdges(edges1, edges2, newNodes,
      metadata1, metadata2);

  //Creating the newGraph
  var newGraph = {};
  newGraph.top = graph1.top;
  newGraph.bottom = {};
  newGraph.bottom.metadata = metadata_DeepCopy(graph1.bottom.metadata);

  newGraph.bottom.metadata.type = 'fused';
  newGraph.bottom.metadata["subtype"] =
      graph2.bottom.metadata.type;

  newGraph.bottom.max_depth = graph1.bottom.max_depth;
  newGraph.bottom.edges = fusedEdges;
  newGraph.bottom.nodes = newNodes;

  return newGraph;
}

/*
 * Creates a deep copy of a metadata object
 * params: -> metadata - e.g. from graph.bottom.metadata
 * returns: -> metadataCopy - a deep copy of metadata.
 */
function metadata_DeepCopy(metadata) {

  var metadataCopy = {};

  //copying over all properties from metadata to metadataCopy
  for (var property in metadata) {
    metadataCopy[property] = metadata[property];
  }

  return metadataCopy;
}
