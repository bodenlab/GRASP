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
function fuse_multipleGraphs(graphs, innerNodeGrouped){
    
    var innerNodeGrouped = innerNodeGrouped || false;

    //storing deep copies of the metadata from the first two graphs
    var metadatas = [];

    //assigning each poag a no. to identify it in metadata deep copy
    for (var j = 0; j<graphs.length; j++) {

	    metadatas[j] = metadata_DeepCopy(graphs[j].bottom.metadata);
	    metadatas[j]["npoags"] = j;

    }
  
    //initial graph fusion  
    var fusedGraph = fuse_graphs(graphs[0], graphs[1],
                                 metadatas[0], metadatas[1]);

    fusedGraph.bottom.metadata.npoags = 2;

    //if list of poags >2, fused next poag with the current fused poag
    if (graphs.length>2){

    	for (var i = 2; i<graphs.length; i++){

	    fusedGraph = fuse_graphs(fusedGraph, graphs[i],
	                            fusedGraph.bottom.metadata,
	                            metadatas[i]);
	    fusedGraph.bottom.metadata.npoags += 1;

    	}
    }
    
    //adding the poags which aren't described into seq
    for (var node in fusedGraph.bottom.nodes){

	    var seq = fusedGraph.bottom.nodes[node].seq;
	    // TODO: fix below function so groups like labels. When innerNodeGrouped == true
	    add_poagsToSeq(seq, fusedGraph.bottom.metadata.npoags,
						innerNodeGrouped);
    }

    //adding the mutant information if fusing marginal poags
    if (fusedGraph.bottom.metadata.subtype == "marginal") {

	    // TODO: Need to fix when integrate to grasp
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
function add_poagValuesToMutants(nodes){

    for (var nodei in nodes){

	    var node = nodes[nodei];

	    for (var chari in node.mutants.chars){
	    
	        var char = node.mutants.chars[chari];

	        for (var bari in node.graph.bars){
		
		        var bar = node.graph.bars[bari];

		        if (char.label == bar.label) {
			
		            //adding normalised poagValues
		            char["poagValues"] = {};
		            for (var poag in bar.poagValues){
			
			            char.poagValues[poag] =
			            (bar.poagValues[poag]/bar.value)*char.value;
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
function add_poagsToSeq(seq, npoags, innerNodeGrouped){

    var poagValues = seq.poagValues;

    //getting poags which don't have node
    var poagsAbsent = getPoagsAbsent(npoags, poagValues);

    //updating seq appropriately to contain poag with label "0"
    if (poagsAbsent.length > 0){
	
	    //inserting absent poags into seq object with label "0"
	    seq.chars.push({"label": "0", "value": 0});

        //for determining location of already added poags
        var firstPoagi = -1;

        //getting poagValues length before append extra poags
        var originalLength = poagValues.length;

	    //add absent poags with label "0" for pi chart display
	    for (var poagAbsenti in poagsAbsent){

	        var poagAbsent = poagsAbsent[poagAbsenti];

	        var newPoagObject = {"label": "0",
				                "value": 1, "poag": poagAbsent};

            //getting poag number from poag name (e.g 1 from 'poag1')
            var poagNumber = poagAbsent.charAt(poagAbsent.length-1) - 1;

	        //poag order in poagValues determines pi chart slice order
	        if ( (!innerNodeGrouped) || originalLength == 1 || poagsAbsent.length == 1){

                //nodes ordered according to poagNumber
	            poagValues.splice(poagNumber, 0, newPoagObject);

	        } else{

	 	        //groups according to character when pi displayed
	 	        firstPoagi = addpoag_InnerOrdered(firstPoagi, poagNumber,
	 	                                          poagValues, newPoagObject);
	 	    }

	        seq.chars[seq.chars.length-1].value += 1;
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
function getPoagsAbsent(npoags, poagValues){

    var poagsAbsent = [];

    //getting poags no present in poag values
    for (var poagi = 1; poagi<npoags+1; poagi++){

	    var poagPresent = false;
	    for (var poag in poagValues){

	        if (poagValues[poag].poag == ("poag" + poagi)){

		        poagPresent = true;
		        break;
	        }
	    }

	    if (!poagPresent){

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
function addpoag_InnerOrdered(firstpoagi, poagNumber, poagValues, newPoagObject){

    //groups according to character when pi displayed
    if (firstpoagi == -1 && poagNumber > 0 && poagNumber < poagValues.length-1){

	    for (var i = poagNumber; i<poagValues.length; i++){

	        //adding poag at nearest site to poagNumber between poags with different labels
	 	    if (poagValues[i-1].label != poagValues[i].label){
	 	        poagValues.splice(i, 0, newPoagObject);
	 	        firstpoagi = i;
	 	        break;
	 	    }
	    }

	    //means all of the poags in seq have same label, so don't want to split up
	    if (firstpoagi == -1){

	        //to check whether poag should be inserted at end or start
	 	    var endDist = poagValues.length - poagNumber;

            //if poag closer to end, insert there, else at start
	 	    if (endDist < poagNumber){
	 	        poagValues.push(newPoagObject);
                firstpoagi = poagValues.length-1;

	 	    } else {

	 	        poagValues.splice(0, 0, newPoagObject);
	 	        firstpoagi = 0;
	 	    }
	    }

	} else if (firstpoagi == -1 && poagNumber == 0){

	    //poag can just go at the start, won't split up poags with same labels
	 	poagValues.splice(0, 0, newPoagObject);
	 	firstpoagi = 0;


	} else if (firstpoagi == -1 && poagNumber == poagValues.length-1){

	    //poag can just go at the end, won't split up poags with same labels
	 	poagValues.push(newPoagObject);
	 	firstpoagi = poagValues.length-1;

	} else {

	    //just adding in front of last added absent poag
	 	poagValues.splice(firstpoagi+1, 0, newPoagObject);
	}

	return firstpoagi;
}

/*
* Fuses two inputted POAG graphs
*
* params = -> Graphs 1 and 2 are parsed and aligned poasg.
              Aligned nodes have the same ids
           -> metadata1 is a deep copy of graph 1s metadata
              (unless graph is fused type, then is just the
               same copy present in the fused JSON object)
           -> metadata2 is a deep copy of graph 2s metadata
*
* returns single graph with attributes of both graphs fused.
*/
function fuse_graphs(graph1, graph2, metadata1, metadata2){
    //getting nodes from inputted graphs
    var nodes1 = graph1.bottom.nodes;
    var nodes2 = graph2.bottom.nodes;

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
    newGraph.bottom.metadata = metadata1;

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
function metadata_DeepCopy (metadata){

    var metadataCopy = {};

    //copying over all properties from metadata to metadataCopy
    for (var property in metadata){
        metadataCopy[property] = metadata[property];
    }

    return metadataCopy;
}
