
/*
** Perform marginal reconstruction of the selected tree node
*/
var perform_marginal = function(node_name, node_fill) {
    $("#status").text("");
    $('#progress-status').fadeIn();
    $('#progress').removeClass('disable');
    selectedNode = node_name;
    set_inf_type("marginal");
        $.ajax({
            url : window.location.pathname.split("?")[0],
            type : 'POST',
            data : {infer: inferType, node: selectedNode},
            success: function(data) {
                var inter = setInterval(function() {
                    $.ajax({
                        url : window.location.pathname.split("?")[0],
                        type : 'GET',
                        data : {request: "status"},
                        success: function(data) {
                            // redirect to results if finished.. otherwise, update user...
                            if (data == "done") {
                                $("#status").text(" finishing up...");
                                $.ajax({
                                    url : window.location.pathname.split("?")[0],
                                    type : 'POST',
                                    data : {getrecongraph: node_name},
                                    success: function(data) {
                                        var json_str = data;
                                        graph_array = [];
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
                                            view_mutant_library();
                                        } else {
                                            set_draw_mutants(false);
                                            $('#mutant-input').fadeOut();
                                            set_mutant(0);
                                        }
                                    }
                                });
                                clearInterval(inter);
                                $('#progress-status').fadeOut();
                                $('#progress').addClass('disable');
                            } else if (data.includes("error")) {
                                clearInterval(inter);
                                $('#progress-status').fadeOut();
                                $('#progress').addClass('disable');
                                $("#warning").attr('style', "display: block;");
                                $("#warning-text").text(data.split("\t")[1]);
                               // window.location.replace(window.location.pathname.split("?")[0] + "error");
                            } else {
                                $("#status").text(data);
                            }
                        }
                    });
                }, 1000);
            }
        });
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
    $("#status").text("");
    $('#progress-status').fadeIn();
    $('#progress').removeClass('disable');
    set_inf_type("joint");
    $.ajax({
        url : window.location.pathname.split("?")[0],
        type : 'POST',
        data : {infer: inferType, node: node_name},
        success: function(data) {
            var inter = setInterval(function() {
                $.ajax({
                    url : window.location.pathname.split("?")[0],
                    type : 'GET',
                    data : {request: "status"},
                    success: function(data) {
                        // redirect to results if finished.. otherwise, update user...
                        if (data == "done") {
                            $.ajax({
                                url : window.location.pathname.split("?")[0],
                                type : 'POST',
                                data : {getrecongraph: node_name},
                                success: function(data) {
                                    var json_str = data;
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
                            clearInterval(inter);
                            $('#progress-status').fadeOut();
                            $('#progress').addClass('disable');
                        } else if (data.includes("error")) {
                            clearInterval(inter);
                            $('#progress-status').fadeOut();
                            $('#progress').addClass('disable');
                            $("#warning").attr('style', "display: block;");
                            $("#warning-text").text(data.split("\t")[1]);
                            //window.location.replace(window.location.pathname.split("?")[0] + "error");
                        } else {
                            $("#status").text(data);
                        }
                    }
                });
            }, 1000);
        }
    });
    redraw_poags();
};
