var json_str = "";

/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node_name, node_fill) {
    $("#progress").removeClass("disable");
    selectedNode = node_name;
    set_inf_type("marginal");
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
            graph_array.push(JSON.parse(json_str));
            // Add the colours of the POAG assigned by name and merged_id
            poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length+1)] = poags.options.names_to_colour['Inferred'];
            poags.options.name_to_merged_id[name] = ["poag" + (Object.keys(poags.options.poagColours).length+1)];

            setup_poags(json_str, true, false, false, node_name.split("_")[0]);
            redraw_poags();
            refresh_elements();
            if ($("#mutant-btn").attr("aria-pressed") === 'true') {
                set_draw_mutants(true);
                $('#mutant-input').fadeIn();
                view_mutant_library($('#text-mutant').val());
            } else {
                set_draw_mutants(false);
                $('#mutant-input').fadeOut();
                set_mutant(0);
            }
        }
    });
    $("#progress").addClass("disable");
};

/*
** Refresh the results view to show joint reconstruction results of the selected tree node
*/
var displayJointGraph = function(node_name, node_fill, reset_graphs = false) {
    if (reset_graphs == false && inferType == "marginal") {
        reset_graphs = true;
        selectedNode = node_name;
        select_node(selectedNode);
        refresh_tree();
    }
    // check if we are adding a joint reconstruction, and if so, only add if it hasn't already been added
    if (!reset_graphs) {
        for (var n in poags.multi.names) {
            if (poags.multi.names[n] === node_name) {
                return;
            }
        }
    }
    set_inf_type("joint");
    $.ajax({
        url : window.location,
        type : 'POST',
        data : {infer: inferType, node: node_name},
        success: function(data) {
            json_str = data;
            drawMutants = false;
            //problem below, this only colours for the second poag, leaving the colour for 'poag1'
            //undefined, hence why it comes up black for the fused nodes -> I may have fixed this
            if (reset_graphs) {
                graph_array = [];
                merged_graphs = [];
            }
            graph_array.push(JSON.parse(json_str));
            poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length+1)] = node_fill;
            poags.options.name_to_merged_id[node_name.split("_")[0]] = ["poag" + (Object.keys(poags.options.poagColours).length+1)];
            poags.options.names_to_colour[node_name.split("_")[0]] = node_fill;
            if (reset_graphs) {
                selectedNode = node_name;
                setup_poags(json_str, true, false, false, node_name.split("_")[0]);
            } else {
                setup_poags(json_str, false, false, false, node_name.split("_")[0]);
                var new_graph = fuse_multipleGraphs(graph_array);
                setup_poags(new_graph, false, false, true, 'Merged');
            }
            refresh_elements();
            redraw_poags();
        }
    });
    $("#progress").addClass("disable");
    redraw_poags();
};
