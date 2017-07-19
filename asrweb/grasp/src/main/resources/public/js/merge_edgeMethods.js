/*
* Fuses the information from two objects containing edge objects
* params = edges1 and edges2 are objects containing edge objects 
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

	        if (edge1 == edge2){

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
function add_uncommonEdges(edges, newEdges, newNodes, metadata){

    //adding edges in edges not in newEdges
    for (var edge in edges){

        if (!(edge in newEdges)){

	        var edgeCopy = {};
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
function setY(edgeCopy, newNodes){

    //looping through each node and checking if involved in edge
    for (var i=0; i<newNodes.length; i++){
	    var node = newNodes[i];

	    //no. of nodes corresponding to edgeCopy
	    var hits = 0;

	    //Setting the y for the from node
	    if (node.id==edgeCopy.from){
	        edgeCopy.y1 = node.y;
	        hits++;

	    //setting the y for the to node
	    } else if(node.id==edgeCopy.to){
	        edgeCopy.y2 = node.y;
	        hits++;
	    }
	
	    //edge can only have two nodes, so:
	    if (hits==2){
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
function fuse_edges(edge1Info, edge2Info, metadata1, metadata2){

    //initialising new edge with equivalent information to edge1
    var newEdge = {"x1": edge1Info.x1, "weight": edge1Info.weight,
		   "from": edge1Info.from, "x2": edge1Info.x2,
		   "to": edge1Info.to};

    //making y1 for new edge be equal to edge with largest y1
    if (edge1Info.y1 > edge2Info.y1){
	    newEdge.y1 = edge1Info.y1;
    } else {
	    newEdge.y1 = edge2Info.y1;
    }

    //making y2 for new edge be equal to edge with largest y2
    if (edge1Info.y2 > edge2Info.y2) {
	    newEdge.y2 = edge1Info.y2;
    } else {
	    newEdge.y2 = edge2Info.y2;
    }

    return newEdge;
}





