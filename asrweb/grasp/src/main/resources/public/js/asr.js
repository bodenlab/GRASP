var inferType = "joint"; // Keep track of which reconstruction is being displayed
var mutants = 0; // flag for generating mutant distribution
var drawMutants = false;    // flag for drawing mutants (only during marginal)

var refresh_elements = function() {
    refresh_labels();
    d3_phylotree_trigger_refresh (tree);
    if (inferType === "marginal") {
        $('#mutant-btn').removeClass("disabled");
        $('#mutant-btn').prop("disabled", false);
    } else {
        drawMutants = false;
        $('#mutant-input').fadeOut();
        $('#mutant-btn').prop("disabled", true);
        $('#mutant-btn').addClass("disabled");
        $('#mutant-btn').removeClass("active");
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

var set_recon_label = function(label) {
    document.querySelector("#recon-label").textContent = "  " + label;
};

var set_mutant = function(numMutants) {
    mutants = numMutants;
};

var set_draw_mutants = function(flag) {
    drawMutants = flag;
};

/*
 * View the mutant library distribution instead of the full marginal distribution
 * num - number of mutants to consider
 */
var view_mutant_library = function(num) {
    set_mutant(num);

    // Get graph options to alter mutant library
    var options = setup_options("poag-all", json_str);

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
    refresh_graphs(setup_options("poag-all", json_str));
}

/* Define the alphabet so we can convert to distributions to numeric arrays */
var alphabet = ['I','V','L','F','C','M','A','G','S','T','W','Y','P','H','E','Q','D','N','K','R'];

/*
 Return the indices of the top/max N elements
 */
function getTopN(arr, N) {
    var idx = [];
    var visited = []
    for (var i = 0; i < arr.length; i++) {
        visited[i] = -1;
    }
    for (var j = 0; j < N; j ++) {
        var best = -1;
        for (var i = 0; i < arr.length; i++) {
            if (visited[i] != -1) // if already included, ignore it
                continue;
            if (best == -1) { // if this is the first we look at, just take it
                best = i;
            } else if (arr[i] > arr[best]) {
                best = i;
            }
        }
        if (best != -1) {
            idx[j] = best;
            visited[best] = j;
        }
    }
    return idx;
}

/*
 Determine the Q for a given P and n. "
 */
function getQ(P, N) {
    var Q = [];
    for (var i = 0; i < P.length; i ++)
        Q[i] = 0;
    // Sort the distrib, pick n top, and set to 1/N in Q
    var idx = getTopN(P, N);
    for (var i in idx)
        Q[idx[i]] = 1.0 / N;
    return Q
}

/*
 Calculate the KL divergence between the given distributions P and Q. "
 */
function KL_div(P, Q) {
    var pseudo = 2E-16;
    var sum = 0.0
    for (var i = 0; i < P.length; i ++) {
        if (P[i] != 0)
            sum += P[i] * Math.log2((P[i]) / (Q[i] + pseudo))
    }
    return sum;
}

/**
 * Convert the label/value data structure to a numeric, and normalised distribution
 * @param arrLabelValue
 * @returns {Array}
 */
function makeNumDistrib(arrLabelValue) {
    var ret = [];
    for (var i = 0; i < alphabet.length; i ++)
        ret[i] = 0;
    var sum = 0;
    for (var d in arrLabelValue)
        sum += arrLabelValue[d].value;
    for (var d in arrLabelValue) {
        for (var i = 0; i < alphabet.length; i++) {
            if (alphabet[i] == arrLabelValue[d].label) {
                ret[i] = arrLabelValue[d].value / sum;
                break;
            }
        }
    }
    return ret;
}

/*
 * Generate mutant library for graph
 */
var generate_mutants = function(graph) {

    var nMutants = mutants;
    var nodes = graph.nodes;
    var Ns = [];
    var myPs = [];
    var KLcur = [];
    var KLnxt = [];
    var KLgains = [];

    // prepare arrays to hold info about the distributions in individual nodes
    for (var i = 0; i < nodes.length; i ++) {
        var node = nodes[i];
        Ns[i] = 1;
        myPs[i] = makeNumDistrib(node.mutants.chars);
        var myQ1 = getQ(myPs[i], Ns[i]);
        var myQ2 = getQ(myPs[i], Ns[i] + 1);
        KLcur[i] = KL_div(myPs[i], myQ1);
        KLnxt[i] = KL_div(myPs[i], myQ2);
        KLgains[i] = Math.max(KLcur[i] - KLnxt[i], 0);
    }

    // for each mutant...
    for (var mutcnt = 1; mutcnt < nMutants; mutcnt ++) {
        var best = -1;
        for (var i = 0; i < nodes.length; i ++) {
            if (KLgains[i] == 0)
                continue;
            if (best == -1)
                best = i;
            else if (KLgains[best] < KLgains[i])
                best = i;
        }
        if (best == -1)
            break;
        Ns[best] += 1;
        KLcur[best] = KLnxt[best];
        var myQ2 = getQ(myPs[best], Ns[best] + 1);
        KLnxt[best] = KL_div(myPs[best], myQ2);
        KLgains[best] = Math.max(KLcur[best] - KLnxt[best], 0);
    }

    graph.nodes = [];
    // now back to the nodes...
    for (var i = 0; i < nodes.length; i ++) {
        var node = nodes[i];
        // update mutant distribution array
        node.mutants.chars = [];
        var idx = getTopN(myPs[i], Ns[i]);
        for (var j in idx) {
            var myMutantLabel = alphabet[idx[j]];
            var myMutantValue = 1.0 / Ns[i];
            var myMutant = {value:myMutantValue,label:myMutantLabel};
            node.mutants.chars.push(myMutant);
        }
        // add node to node list
        graph.nodes.push(node);
    }
    return graph;
}

/*
 * re-draw popups to re-position on window size change
 */
$(window).resize(function () {
    $(this).delay(100).queue(function() {
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
    clearTimeout(window.resizedFinished);
    window.resizedFinished = setTimeout(function () {
        // TODO: re-size tree so it's 100% div sizing (like graphs)
        // redraw graphs for sizing
        display();
    }, 100);
});
