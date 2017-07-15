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

    //assigning each poag a no. to identify it
    for (var j = 0; j<graphs.length; j++) {
	
	graphs[j].bottom.metadata["npoags"] = j;

    }
  
    //initial graph fusion  
    var fusedGraph = fuse_graphs(graphs[0], graphs[1]);

    fusedGraph.bottom.metadata.npoags = 2;

    //if list of poags >2, fused next poag with the current fused poag
    if (graphs.length>2){

    	for (var i = 2; i<graphs.length; i++){

	    fusedGraph = fuse_graphs(fusedGraph, graphs[i]);
	    fusedGraph.bottom.metadata.npoags += 1;

    	}
    }
    
    //adding the poags which aren't described into seq
    for (var node in fusedGraph.bottom.nodes){

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
    var poagsAbsent = [];
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

    //updating seq appropriately to contain poag with label "0"
    if (poagsAbsent.length > 0){
	
	//inserting absent poags into seq object with label "0"
	seq.chars.push({"label": "0", "value": 0});

	//add absent poags with label "0" for pi chart display
	for (var poagAbsenti in poagsAbsent){

	    var poagAbsent = poagsAbsent[poagAbsenti];

	    var newPoagObject = {"label": "0", 
				"value": 1, "poag": poagAbsent};

	    //poag order in poagValues determines pi chart slice order
	    if (!innerNodeGrouped){

	        poagValues.splice(Number(poagAbsent
		  .charAt(poagAbsent.length-1))-1, 0, newPoagObject);

	    } else{

	 	//groups according to character when pi displayed
		poagValues.push(newPoagObject); //needs changing

	    }

	    seq.chars[seq.chars.length-1].value += 1;
	}
    }
}

/*
* Fuses two inputted POAG graphs
* params = two graphs aligned and aligned nodes have the same ids
* returns single graph with attributes of both graphs fused.
*/
function fuse_graphs(graph1, graph2){
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
    newGraph.bottom.metadata = graph1.bottom.metadata;

    newGraph.bottom.metadata.type = 'fused';
    newGraph.bottom.metadata["subtype"] =
			    graph2.bottom.metadata.type;

    newGraph.bottom.max_depth = graph1.bottom.max_depth;
    newGraph.bottom.edges = fusedEdges;
    newGraph.bottom.nodes = newNodes;

    return newGraph;
}


