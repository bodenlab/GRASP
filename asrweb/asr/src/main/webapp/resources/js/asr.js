var inferType; // Keep track of which reconstruction is being displayed

var refresh_elements = function() {
    refresh_labels();
    d3_phylotree_trigger_refresh (tree);
};

var refresh_labels = function() {
    console.log(selectedNode);
    var nodeLabels = document.querySelectorAll(".node-label");
    for (var i = 0; i < nodeLabels.length; i++) {
        nodeLabels[i].textContent = selectedNode;
        nodeLabels[i].value = selectedNode;
    }
    console.log(inferType);
    var reconLabels = document.querySelectorAll(".infer-label");
    for (var i = 0; i < reconLabels.length; i++) {
        reconLabels[i].textContent = inferType;
    }
};

var set_inf_type = function(type) {
    inferType = type;
    console.log(inferType);
}
