
var selectedNode = "root";              // Keep track of which tree node is selected
var tree; // global tree object for updating parameters, etc

/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node_name, node_fill) {
    $("#progress").removeClass("disable");
    selectedNode = node_name;
    inferType = "marginal";
    $.ajax({
        url : window.location,
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {
            json_str = data;
            graph_array = [];
            //add_new_poag(json_str, node_name, node_fill);
            // if mutant library is selected, display mutant library with the selected number of mutants, else just
            // display the marginal distribution in the nodes
            if ($("#mutant-btn").attr("aria-pressed") === 'true') {
                set_draw_mutants(true);
                $('#mutant-input').fadeIn();
                view_mutant_library($('#text-mutant').val());
            } else {
                set_draw_mutants(false);
                $('#mutant-input').fadeOut();
                set_mutant(0);
                graph_array.push(JSON.parse(json_str));
                // Add the colours of the POAG assigned by name and merged_id
                poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length+1)] = poags.options.names_to_colour['Inferred'];
                poags.options.name_to_merged_id[name] = ["poag" + (Object.keys(poags.options.poagColours).length+1)];

                setup_poags(json_str, true, false, false, 'Inferred');
                redraw_poags();
            }
            refresh_elements();
        }
    });
    $("#progress").addClass("disable");
};

/*
** Refresh the results view to show joint reconstruction results of the selected tree node
*/
var displayJointGraph = function(node_name, node_fill, reset_graphs = false) {
    selectedNode = node_name;
    if (reset_graphs == false && inferType == "marginal") {
        reset_graphs = true;
    }
    inferType = "joint";
    $.ajax({
        url : window.location,
        type : 'POST',
        data : {infer: inferType, node: selectedNode},
        success: function(data) {
            json_str = data;
            drawMutants = false;
            //problem below, this only colours for the second poag, leaving the colour for 'poag1'
            //undefined, hence why it comes up black for the fused nodes -> I may have fixed this
            if (reset_graphs) {
                graph_array = [];
            }
            graph_array.push(JSON.parse(json_str));
            poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length+1)] = node_fill;
            poags.options.name_to_merged_id[node_name] = ["poag" + (Object.keys(poags.options.poagColours).length+1)];
            poags.options.names_to_colour[node_name] = node_fill;

            if (reset_graphs) {
                setup_poags(json_str, true, false, false, 'Inferred');
                refresh_elements();
            } else {
                setup_poags(json_str, false, false, false, node_name);
                var new_graph = fuse_multipleGraphs(graph_array);
                setup_poags(new_graph, false, false, true, 'Merged');
            }
            redraw_poags();
        }
    });
    $("#progress").addClass("disable");
};
