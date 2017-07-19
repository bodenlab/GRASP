/*
* Fuses inputted two list of nodes from two different POAGs
*
* param = -> nodes1 and nodes2 are arrays containing node objects from 
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
function add_commonNodes(nodes1, nodes2, metadata1, metadata2){
    //array to store new, fused nodes
    var newNodes = [];

    //IDs of the nodes already fused
    var idNodesFused = [];

    //pairwise comparison of nodes, fusing if same id
    for (var i = 0; i < nodes1.length; i++){

            var nodes1Id = nodes1[i].id;

            for ( var j = 0; j < nodes2.length; j++ ){
                var nodes2Id = nodes2[j].id;

                if (nodes1Id == nodes2Id) {

                    idNodesFused.push(nodes1Id);

                    var newNode = fuse_nodes(nodes1[i], nodes2[j], newNodes, 
						      metadata1, metadata2);
                    newNodes.push( newNode );

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
*	   -> idNodesFused is an array of ids from nodes present in 
*	      newNodes.
* 	   -> newNodes is an array of nodes already fused/added.
*	   -> metadata is the metadata object from the same poag as 
*	      nodes.
*
* ensures = -> All of the nodes unique to nodes will be added in ascending 
*	      order in both idNodesFused and newNodes depending on node ID.
*	   -> Nodes added to newNodes are a deep copy version of the nodes, 
*	      (are converted to fused format if not already.
*/
function add_uncommonNodes(nodes, idNodesFused, newNodes, metadata){
	
    //adding nodes from first graph not contained in the other graph
    for (var i = 0; i < nodes.length; i++){

	//checking if node already in newNodes, if not then add
        if (idNodesFused.indexOf(nodes[i].id) == -1){

	    //adding to idNodesFused in ordered way
	    idNodesFused.push(nodes[i].id);
	    idNodesFused.sort(d3.ascending);

	    var nodeCopy = node_DeepCopy(nodes[i], metadata);
	
	    //using ordering in idNodesFused to add node to newNodes
	    newNodes.splice(idNodesFused.indexOf(nodes[i].id), 0, nodeCopy);
	}
    }

}


/*
* Returns deep copy of inputted node, if from an unfused type will return in 
* a fused type format
*
* params = -> node is an inputted node from a POAG
*	   -> metadata is the metdata from the same poag as node
*
* returns = -> newNode - is is exactly the same(if node is fused type), 
*	       else returns copy of node in fused type format.
*/
function node_DeepCopy(node, metadata) {
    //need to check what the point of class, lane, and seq are.
    var newNode = {"id": node.id, "x": node.x, "y": node.y, "label": node.label, 
		  "num_out_edges": node.num_out_edges};
    
    //checking if node from fused poag and 
    if (metadata.type == "fused" && node.graph.bars[0]
					       .hasOwnProperty("poagValues")) {

	//already in fused format, just add deep copies of graph and seq
	newNode.graph = graph_deepCopy(node);
        newNode.seq = seq_deepCopy(node);

    } else if (metadata.type != "marginal") {

	//putting in details in fused type format
	newNode.seq = {"chars": [{"label": newNode.label, "value": 1}], 
							     "poagValues": []};

	newNode.seq.poagValues.push({"label": newNode.label, "value": 1, 
					"poag": "poag" + (metadata.npoags+1)});

	newNode.graph = {"bars": [{"label": newNode.label, "value": 100, 
							   "poagValues": {}}]};

	newNode.graph.bars[0].poagValues["poag" + (metadata.npoags+1)] = 100;

    } else{
	
	//putting in details in fused type format
	newNode.seq = {"chars": [{"label": newNode.label, "value": 1}], 
							     "poagValues": []};

	newNode.seq.poagValues.push({"label": newNode.label, "value": 1, 
					"poag": "poag" + (metadata.npoags+1)});
	
	//need to treat the marginal graph object differently
	newNode.graph = add_poagValues(node.graph, metadata.npoags);

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
function add_poagValues(graph, npoags){

    var bars = graph.bars;

    var fusedGraphObject = {"bars":[]};

    for (var bari in bars) {

	var bar = bars[bari];

	//copying over graph information and adding poag info
	var newBar = {"label": bar.x_label, "value": bar.value, 
						"poagValues": {}};

	newBar.poagValues["poag" + (npoags+1)] = bar.value;

	fusedGraphObject.bars.push(newBar);
    }

    return fusedGraphObject;
}


/*
* Fuses two inputted nodes
*
* params = -> node1, node2, metadata1 & metadata2 same as described 
*	      for 'getFusedNodes' method
*	   -> newNodes is an array of the fused nodes
*
* returns = -> newNode - A single node with attributes of both nodes 
*			 fused.
*/
function fuse_nodes(node1, node2, newNodes, metadata1, metadata2) {
    //need to check what the point of class, lane, and seq are.
    var newNode = {"id": node1.id, "lane": 0, "x": node1.x};

    //fusing the nodes appropriately depending on the poags they are from
    if (metadata1.type == "joint" && metadata2.type == "joint") {

	//need to create new graph and seq objects when fusing joint types
    	newNode.seq = create_seqObject(node1, node2);
	newNode.graph = createGraphObject(newNode.seq, node1, node2); 

    } else if (metadata1.type == "fused" && metadata2.type == "joint") {

	//adding the label information from the joint node (node2) to node1
	newNode.seq = add_labelToSeq(node1, node2, metadata1.npoags);
	newNode.graph = add_labelToGraph(newNode.seq, node1, node2, 
							metadata1.npoags);

    } else if (metadata1.type == "marginal" && metadata2.type == "marginal"){

	//Need to create new seq object with the marginal but fuse distributions
	newNode.seq = create_seqObject(node1, node2);
	newNode.graph = fuse_marginalGraphs(node1, node2, metadata1.npoags, 
							 metadata2.npoags);

    } else if (metadata1.type == "fused" && metadata2.type == "marginal"){

	//need to add label information to seq, but still fuse distributions
	newNode.seq = add_labelToSeq(node1, node2);
	newNode.graph = fuse_marginalGraphs(node1, node2, metadata1.npoags, 
							 metadata2.npoags);
    }

    //node with highest y becomes y of new node
    if (node1.y > node2.y) {
        newNode.y = node1.y;
    } else {
        newNode.y = node2.y;
    }

    //label with highest frequency becomes new label
    newNode.label = getNodeLabel(newNode.seq);

    return newNode;
}

/*
* Fuses the graph information present in two marginal poags or a fused poag 
* and marginal poag
*
* params: -> node1 must either be a node from a fused or marginal poag
*	  -> node2 must be a node from a marginal poag
*	  -> npoags is the total number of nodes fused thus far 
*	     (refer to fuse_multiplegraphs in merge_poag.js)
*
* returns: -> fusedGraph - fused graph object of the two inputted nodes 
*			   and returns a new graphh object in the fused 
*			   graph format (i.e. has poagValues).
*/
function fuse_marginalGraphs(node1, node2, npoags1, npoags2){

    var bars1 = node1.graph.bars;
    var bars2 = node2.graph.bars;

    var fusedGraph = {"bars": []};

    //pairwise comparison of the bars, fusing if have the same label
    for (var bar1i in bars1){
	
	var bar1 = bars1[bar1i];

	for (var bar2i in bars2){
	    var bar2 = bars2[bar2i];

	    if (bar1.x_label == bar2.x_label){
		
		var newBar = fuse_Bar(bar1, bar2, npoags1, npoags2);
		fusedGraph.bars.push(newBar);
	    }
	}
    }

    return fusedGraph;
}

/*
* Fuses two bar objects with the same label
*
* params: -> bar1 must be from a graph object from either a fused or
*	     marginal poag
*	  -> bar2 must be from a graph object from a marginal poag
*	     Both bar objects must have the same label.
*	  -> npoags1 and 2 is the same as described in params for 
*	     'fused_marginalGraphs'
*
* returns: -> newBar - object containing information between the 
*		       two bars fused. If bar1 is from a fused graph, 
*		       will appropriately normalise poagValues and add
*		       the extra poagValue from bar2.
*/
function fuse_Bar(bar1, bar2, npoags1, npoags2){

    var newValue = (bar1.value + bar2.value)/2;
    var newBar = {"label": bar1.x_label, "value": newValue, 
						"poagValues": {}};

    //if has "poagValues", bar1 is from fused type
    if (bar1.hasOwnProperty("poagValues")) {
	
	//Copying over the poagValues from bar1 and normalising
	for (var poag in bar1.poagValues){
			
	    newBar.poagValues[poag] = bar1.poagValues[poag]/2;
	}

    } else {
	
	//adding new poagValue information since must be marginal type here
	newBar.poagValues["poag" + (npoags1+1)] = bar1.value/2;
    }
	
    //bar2 is always from marginal type so just add the barValue for that poag
    newBar.poagValues["poag" + (npoags2+1)] = bar2.value/2;

    return newBar;
}

/*
* Creates a seq object based off the labels of two inputted nodes
*
* params: Nodes 1 and 2 are both nodes with the same id from two 
*	  different POAGs which are unfused and represent a 
*	  sequence at an intermediate node in the tree.
*
* return: seq object created based off the labels of the inputted nodes
*/
function create_seqObject(node1, node2){

    var newSeq = {"chars": [], "poagValues": []};

    if (node1.label!=node2.label){
	
	//creating two new seperate char objects
	newSeq.chars[0] = {"label": node1.label, "value": 1};
	newSeq.chars[1] = {"label": node2.label, "value": 1};

    } else{
	
	//just adding one new char object, but with a value of 2
	newSeq.chars[0] = {"label": node1.label, "value": 2};
    }

    //adding the different values for the poags
    newSeq.poagValues[0] = {"label": node1.label, "value": 1, 
							"poag": "poag1"};

    newSeq.poagValues[1] = {"label": node2.label, "value": 1, 
							"poag": "poag2"};

    return newSeq;
}

/*
* Adds to the existing seq object in node1 based off the seq label in 
* node2
*
* params: -> node1 - is from a POAG which is fused
*	  -> node2 - has the same ID as node1, and is from either 
*	     joint or marginal poag
*	  -> npoags - same as described in 'fused_marginalGraphs'
*
* returns: -> seq - A seq object in node1 updated to include node2's 
*		    label details. Added if label already present in chars, 
*		    otherwise label added as new char with value of 1.
*/
function add_labelToSeq(node1, node2, npoags){

    //getting deep copy of characters in seq object
    var newSeq = seq_deepCopy(node1);
    var chars = newSeq.chars;

    var foundMatch = false;
    for (var i=0; i<chars.length; i++){

	//if found match, increment character value
        if ( node2.label == chars[i].label ){
	    chars[i].value += 1;
	    foundMatch = true;
	    break;

        } 
	
    }

    //adding new char object if no match found
    if (!foundMatch){
	chars.push({});
	chars[chars.length-1].label = node2.label
	chars[chars.length-1].value = 1;
    } 

    //adding the poagValue in
    newSeq.poagValues.push({"label": node2.label, "value": 1, 
				    "poag": ("poag" + (npoags+1))});

    return newSeq;
}

/*
* Creates deep copy of seq object in inputted node
*
* params: node -> node wish to make deep copy of its seq object, 
*		  must be fused type
*
* returns: -> newSeq - Deep copy of node seq, is identical to node.seq.
*/
function seq_deepCopy(node){
    //to store all the sequence information
    var newSeq = {"chars": [], "poagValues": []};

    for (var i=0; i<node.seq.chars.length; i++) {

	//adding seq details from inputted node to seq object of new node
	newSeq.chars.push({});
	newSeq.chars[i].label = node.seq.chars[i].label;
        newSeq.chars[i].value = node.seq.chars[i].value;
    }

    //copying over the poagValue details
    var poagValues = node.seq.poagValues;
    for (var j = 0; j<poagValues.length; j++) {
	newSeq.poagValues.push({"label": poagValues[j].label, "value": 
		      poagValues[j].value, "poag": poagValues[j].poag});
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
    for (var i = 1; i<seq.chars.length; i++) {
	if (chars[i].value > chars[chars.indexOf(charMaxFreq)].value) {
	    charMaxFreq = chars[i];   
	}
    }

    return charMaxFreq.label;
}

/*
* Creates node graph object from inputted seq object and 
* nodes from joint type poags. Called on initial graph fusion.
*
* params = -> seq - fused seq object generated from 
*		     create_seqObject(node1, node2).
*	   -> node1 - node from joint type poag
*	   -> node2 - node from joint type poag
* 
* require = -> node1.label == node2.label
*	    -> node1 and node2 from different poags
*
* returns = -> newGraph - A new graph object generated from 
*			  the seq and node data
*/
function createGraphObject(seq, node1, node2){
    var overallCharCount = 0;
    var chars = seq.chars;
    
    var newGraph = {"bars": []};
	
    //getting total character count
    for (var i = 0; i < chars.length; i++){
        overallCharCount += chars[i].value;
    }

    //calculating freq of each character relative to total
    for (var i = 0; i < chars.length; i++){

        var char = chars[i];
        var graphValue = (char.value/overallCharCount)*100;
	
	//adding the char label and value
        newGraph.bars.push({"label": char.label, "value": 
				graphValue, "poagValues": {}});
	
	if (char.label == node1.label && char.label == node2.label){

	    //add both the poags to poag values since match char
	    newGraph.bars[i].poagValues["poag1"] = 
					(1/overallCharCount)*100;

	    newGraph.bars[i].poagValues["poag2"] = 
					(1/overallCharCount)*100;

	} else if (char.label == node1.label) {

	    //add just node1s poag to graph object
	    newGraph.bars[i].poagValues["poag1"] = 
					(1/overallCharCount)*100;	    

	} else {

	    //add just node2s poag to graph object
	    newGraph.bars[i].poagValues["poag2"] = 
					(1/overallCharCount)*100;

	}
    }

    return newGraph;
}

/*
* Adds the information from node2 to the graph in node1
*
* params = -> seq - fused seq object from nodes inputted
*	   -> node1 - node from fused poag
*	   -> node2 - node from joint poag
*	   -> npoags - number of poags fused in the poag from 
*		       which node1 is derived.
*
* returns = -> newGraph - new graph object which is the same as 
*			  node1s graph but with the extra label 
*			  information incorporated from node2.
*/
function add_labelToGraph(seq, node1, node2, npoags){
    var overallCharCount = 0;
    var chars = seq.chars;

    var newGraph = graph_deepCopy(node1);
	
    //getting total character count
    for (var i = 0; i < chars.length; i++){
        overallCharCount += chars[i].value;
    }

    //calculating freq of each character relative to total
    for (var i = 0; i < chars.length; i++){
        var char = chars[i];
	
	var graphValue = (char.value/overallCharCount)*100;

	var graphBars = newGraph.bars;

	var labelIndex = -1;

	for (var k=0; k < graphBars.length; k++) {

	    if (graphBars[k].label == node2.label && 
				node2.label == char.label ){

		graphBars[k].value = graphValue;
		    
		labelIndex = k;
		break;
	    } 
	}

	/****updating the poag values for every poagvalue*****/
	for (var k = 0; k<graphBars.length; k++) {
		
	//for updating the whole bars value
	graphBars[k].value = 0;

	    for (var poagValue in graphBars[k].poagValues){ 
		
	        graphBars[k].poagValues[poagValue] = 
				      (1/overallCharCount)*100;

		graphBars[k].value += (1/overallCharCount)*100;

	    }
	}

	/*********adding new graph poag info *************/
	if (labelIndex != -1) {

	    graphBars[labelIndex].poagValues["poag" + 
			     (npoags+1)] = (1/overallCharCount)*100;

	    graphBars[labelIndex].value += (1/overallCharCount)*100;

	} else if (char.label == node2.label) {

	    graphBars.push({"label": char.label, "value": graphValue, 
						  "poagValues": {}});

	    graphBars[graphBars.length-1].poagValues["poag" + 
			     (npoags+1)] = (1/overallCharCount)*100;

	}

    }

    return newGraph;
}

/*
* Creates deep copy of graph object in node, graph must be fused type
* param: node object of fused type
* returns deep copy of graph in node
*/
function graph_deepCopy(node, npoags){

    //to store graph information
    var newGraph = {"bars": []};

    for (var i=0; i<node.seq.chars.length; i++) {
	//adding graph details from node to graph object of new node
	if (i >= node.graph.bars.length) {
	    return newGraph;
	}
	newGraph.bars.push({});

	var newBars = newGraph.bars;
	var nodeBars = node.graph.bars;
	newBars[i].value = nodeBars[i].value;
	newBars[i].label = nodeBars[i].label;

	newBars[i]["poagValues"] = {};

	for (var poagValue in nodeBars[i].poagValues){  

	    newBars[i].poagValues[poagValue] = nodeBars[i]
					      .poagValues[poagValue];
	}
    }

    return newGraph;
}


