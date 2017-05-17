var inferType; // Keep track of which reconstruction is being displayed

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

// re-draw popups to re-position on window size change
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

