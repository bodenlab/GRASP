
var selectedNode = "root";              // Keep track of which tree node is selected
var tree; // global tree object for updating parameters, etc

/*
** Function to set the tree node colours; selected node is a different colour to other nodes
*/
var node_colorizer = function(element, node) {
    if (node.name == selectedNode) {
        element.select("circle").style('fill', "hsl(219,70%,80%)");
    } else {
        element.select("circle").style('fill', "hsl(211,10%,80%)");
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

var get_num_nodes = function() {
    return tree.get_nodes().length;
};

/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node) {
    $("#progress").removeClass("disable");
    var selectedNode = node.name;
    var inferType = "marginal";
    $.ajax({
        url : window.location,
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {

            var json_str = data;
            console.log(json_str);
            add_new_poag(json_str);

            // if mutant library is selected, display mutant library with the selected number of mutants, else just
            // display the marginal distribution in the nodes
            if ($("#mutant-btn").attr("aria-pressed") === 'true') {
                set_draw_mutants(true);
                $('#mutant-input').fadeIn();
                view_mutant_library($('#text-mutant').val());
            } else {
                set_draw_mutants(false);
                $('#mutant-input').fadeOut();
                view_marginal();
            }
            $("#progress").addClass("disable");
            
        }
    });
};

/*
** Refresh the results view to show joint reconstruction results of the selected tree node
*/
var displayJointGraph = function(node) {
    var selectedNode = node.name;
    var inferType = "joint";

    $("#progress").removeClass("disable");
    selectedNode = node.name;
    inferType = "joint";

    $.ajax({
        url : window.location,
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {
            //refresh_elements();
            drawMutants = false;
            var json_str = data;
            console.log(json_str);
            add_new_poag(json_str);
            $("#progress").addClass("disable");

        }
    });
};
