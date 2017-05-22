var inferType; // Keep track of which reconstruction is being displayed
var mutants = 0; // flag for generating mutant distribution

var refresh_elements = function() {
    refresh_labels();
    d3_phylotree_trigger_refresh (tree);
    if (inferType === "marginal") {
        $('input[id="check-mutant"]').bootstrapSwitch('disabled', false);
    } else {
        $('input[id="check-mutant"]').bootstrapSwitch('state', false);
        $('input[id="check-mutant"]').bootstrapSwitch('disabled', true);
    }
};

var refresh_labels = function() {
    var nodeLabels = document.querySelectorAll(".node-label");
    for (var i = 0; i < nodeLabels.length; i++) {
        nodeLabels[i].textContent = selectedNode;
        nodeLabels[i].value = selectedNode;
    }
    var reconLabels = document.querySelectorAll(".infer-label");
    for (var i = 0; i < reconLabels.length; i++) {
        reconLabels[i].textContent = inferType;
    }
};

var set_inf_type = function(type) {
    inferType = type;
};

var set_mutant = function(numMutants) {
    mutants = numMutants;
};

/*
 * View the mutant library distribution instead of the full marginal distribution
 * num - number of mutants to consider
 */
var view_mutant_library = function(num) {
    set_mutant(num);

    // Get graph options to alter mutant library
    var options = setup_options("poag", json_str);

    // TODO: generate mutant library with num mutants
    options.data.bottom = generate_mutants(options.data.bottom);

    // refresh options
    options.nodes = [];
    for (var n in options.data.top.nodes) {
        options.nodes.push(options.data.top.nodes[n]);
    }
    for (var n in options.data.bottom.nodes) {
        options.nodes.push(options.data.bottom.nodes[n]);
    }

    // Re-draw graph with mutants
    refresh_graphs(options);
};

/*
 * Reset view to the full marginal distribution
 */
var view_marginal = function() {
    set_mutant(0);
    refresh_graphs(setup_options("poag", json_str));
}

/*
 * Generate mutant library for graph
 */
var generate_mutants = function(graph) {
    var nodes = graph.nodes;

    // temp functionality: one mutant: keep base with max value
    graph.nodes = [];
    for (var n in nodes) {
        var node = nodes[n];

        //**** find maximum character in distribution (mutants == 1) ***
        var max_mutant = node.mutants.chars[0];
        for (var m in node.mutants.chars) {
            var cur_mutant = node.mutants.chars[m];
            if (cur_mutant.value > max_mutant.value) {
                max_mutant = cur_mutant;
            }
        }

        // update mutant distribution array
        node.mutants.chars = [];
        node.mutants.chars.push(max_mutant);

        // add node to node list
        graph.nodes.push(node);
    }

    return graph;
}

/*
 * re-draw popups to re-position on window size change
 */
$(window).resize(function () {
    $(this).delay(10).queue(function() {
        if ($("#help-btn").attr("aria-pressed") === 'true') {
            $('[data-toggle="popover"]').popover('show');
            if ($("#download-form").attr("aria-expanded") !== 'true') {
                $('#download-form [data-toggle="popover"]').popover('hide');
            }
        } else {
            $('[data-toggle="popover"]').popover('hide');
        }
        $(this).dequeue();
    });
});

