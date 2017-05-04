
var selectedNode = "root"; // Keep track of which tree node is selected
var tree; // global tree object for updating parameters, etc

var refresh_elements = function() {
    console.log(selectedNode);
    var nodeLabels = document.querySelectorAll(".node-label");
    for (var i = 0; i < nodeLabels.length; i++) {
        nodeLabels[i].textContent = selectedNode;
    }
    d3_phylotree_trigger_refresh (tree);
};

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
      		function(node) {return("Show partial order graph");},
      			 //function () {
                 //    displayPOGraph(node);
                 //}
            );
    });
};

/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node) {
    selectedNode = node.name;
    console.log("Node: " + node.name);
    $.ajax({
        url : "/asr",
        type : 'POST',
        data : {infer: "marginal", node: selectedNode},
        success: function(data) {
            refresh_elements();
            refresh_graphs(data);
        }
    });
};

var refresh_graphs = function(graph_json) {
    d3.select(".svg-content").remove();
    var options = setup_options("poag", graph_json);
    console.log(graph_json);
    options = create_poags(options);
};