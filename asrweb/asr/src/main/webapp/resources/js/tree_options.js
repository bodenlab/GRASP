
var selectedNode = "root";              // Keep track of which tree node is selected
var tree; // global tree object for updating parameters, etc

/*
** Function to set the tree node colours; selected node is a different colour to other nodes
*/
var node_colorizer = function(element, node) {
    if (node.name == selectedNode) {
        element.select("circle").style('fill', "hsl(352,90%,70%)");
    } else {
        element.select("circle").style('fill', "hsl(352,0%,70%)");
    }
};

/*
** Function to set up the phylogenetic tree structure (options and menu items)
*/
var setup_tree = function(tree_div, newick_string) {
    tree = d3.layout.phylotree()
                    .svg (d3.select(tree_div))
                    .options({
                         'selectable': false,
                         'collapsible': true})
                    .radial(false)
                    .node_circle_size(6)
                    .style_nodes(node_colorizer);
    tree(d3_phylotree_newick_parser(newick_string)).layout();

    // add a custom menu for (in this case) terminal nodes
    tree.get_nodes().forEach (function (node) {
        d3_add_custom_menu (node, // add to this node
      	        function(node) {return("Create marginal reconstruction")},
      		    function () {
      		        perform_marginal(node);
      		    }
     	 	);
     	d3_add_custom_menu (node, // add to this node
      		function(node) {return("View joint reconstruction results");},
      			 function () {
                     displayJointGraph(node);
                 }
            );
    });
};

/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node) {
    $("#progress").removeClass("disable");
    selectedNode = node.name;
    inferType = "marginal";
    $.ajax({
        url : "/asr",
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {
            refresh_elements();
            refresh_graphs(data);
            $("#progress").addClass("disable");
        }
    });
};

/*
** Refresh the results view to show joint reconstruction results of the selected tree node
*/
var displayJointGraph = function(node) {
    selectedNode = node.name;
    inferType = "joint";
    $.ajax({
        url : "/asr",
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {
            refresh_elements();
            refresh_graphs(data);
        }
    });
};

/*
** Refresh the graph to be the latest reconstructed
*/
var refresh_graphs = function(graph_json) {
    d3.select(".svg-content").remove();
    var options = setup_options("poag", graph_json);
    console.log(graph_json);
    options = create_poags(options);
};