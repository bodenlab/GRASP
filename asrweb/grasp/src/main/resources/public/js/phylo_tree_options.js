/*
** Perform marginal reconstruction of the selected tree node
*/
var currentNodeName = 'N0';
$('#error-modal').on('shown.bs.modal', function () {
  $('#error-modal').trigger('focus')
});
var perform_marginal = function (node_name) {
  if (node_name !== undefined) {
    currentNodeName = node_name;
  } else if (node_name === undefined) {
    node_name = currentNodeName;
  }
  $("#status").text("");
  $('#progress-status').fadeIn();
  $('#progress').removeClass('disable');
  selectedNode = node_name;
  set_inf_type("marginal");
  $.ajax({
    url: '/getmarginalrecon',
    type: 'POST',
    dataType: 'json',
    contentType: "application/json",
    timeout: 2000,
    data: JSON.stringify({'infer': inferType, 'nodeLabel': selectedNode, 'addgraph': false}),
    error: function(data) {
        // Check if it is actually an error or if the recon is running
        if (data.responseText === 'running') {
          // This means we're still running our marginal
          setTimeout(perform_marginal, 2000);
        } else {
          $('#progress-status').fadeOut();
          $('#progress').addClass('disable');
          document.getElementById(
              "error-modal-text").innerHTML = data.responseText;
          $('#error-modal').modal('show');
        }
      },
    success: function (data) {
      try {
        // Check if there was an error or if the marginal is still runnning
        if (data[0] === 'e') {
          // We have an error so return
          // Show the error
          document.getElementById("error-modal-text").innerHTML = data;
          $('#error-modal').on('shown.bs.modal', function () {
            $('#error-modal').trigger('focus')
          });
          console.log("error" + data)
        } else if (data === 'running') {
          // This means we're still running our marginal
          setTimeout(perform_marginal, 2000);
        }
        graph_array = [];
        // if mutant library is selected, display mutant library with the selected number of mutants, else just
        // display the marginal distribution in the nodes
        graph_array.push(data);
        // Add the colours of the POAG assigned by name and merged_id
        poags.options.poagColours["poag" + (Object.keys(
            poags.options.poagColours).length
            + 1)] = poags.options.names_to_colour['Inferred'];
        poags.options.name_to_merged_id[name] = ["poag"
        + (Object.keys(poags.options.poagColours).length + 1)];
        setup_poags(data, true, false, false, node_name);
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
        $('#progress-status').fadeOut();
        $('#progress').addClass('disable');
      } catch {
        // If some sort of error occurs we want to remove the processing
        // ToDo: Add in what the error was to a message.
        $('#progress-status').fadeOut();
        $('#progress').addClass('disable');
      }
    },
  });
};

/*
** Refresh the results view to show joint reconstruction results of the selected tree node
*/
var displayJointGraph = function (node_name, node_fill, reset_graph_call = false) {
  // check if we are adding a joint reconstruction, and if so, only add if it hasn't already been added
  if (!reset_graph_call) {
    for (var n in poags.multi.names) {
      if (poags.multi.names[n] === node_name) {
        return;
      }
    }
  }
  $.ajax({
    url: "/getrecon",
    type: 'POST',
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify({joint: true, nodeLabel: node_name, addgraph: reset_graph_call}),
    error: function(data) {
      $('#progress-status').fadeOut();
      $('#progress').addClass('disable');
      document.getElementById("error-modal-text").innerHTML = data.responseText;
      $('#error-modal').modal('show');
    },
    success: function (data) {
      if (data[0] === 'e') {
        // We have an error so return
        // Show the error
        document.getElementById("error-modal-text").innerHTML = data;
        $('#error-modal').on('shown.bs.modal', function () {
          $('#error-modal').trigger('focus')
        });
        console.log("error" + data)
        return;
      }
      drawMutants = false;
      if (reset_graph_call) {
        graph_array = [];
        merged_graphs = [];
      }
      graph_array.push(data);
      poags.options.poagColours["poag" + (Object.keys(
          poags.options.poagColours).length + 1)] = node_fill;
      poags.options.name_to_merged_id[node_name.split(
          "_")[0]] = ["poag" + (Object.keys(
          poags.options.poagColours).length + 1)];
      poags.options.names_to_colour[node_name.split(
          "_")[0]] = node_fill;
      if (reset_graph_call) {
        selectedNode = node_name;
        /**
         * ToDo: May need to look into this!
         */

        let dataToProcess = {};
        dataToProcess.top = poags.single.raw.msa;
        dataToProcess.bottom = data;
        setup_poags(dataToProcess, true, false, false, node_name);
        redraw_poags();
      } else {
        poags = process_poags_joint(data, poags, false, false, false, node_name);
        //var new_graph = fuse_multipleGraphs(graph_array);
        //setup_poags(new_graph, false, false, true, 'Merged');
      }
      refresh_elements();
      redraw_poags();
    }
  });
  redraw_poags();
};
