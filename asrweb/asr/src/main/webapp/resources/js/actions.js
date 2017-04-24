var update_colour = function() {
    var chosen_colour = document.getElementsByName("colour_options");
    for (var c in chosen_colour) {
        var scheme = chosen_colour[c];
        if (scheme.checked == true) {
            graph.options.colours = colour_schemes[scheme.value];
            if (scheme.value == "cinema") {
                graph.options.pie.stroke = "grey";
            } else {
                graph.options.pie.stroke = "white";
            }
            break;
        }
    }
    display();
    // redraw the mini nodes in the correct coluors
    graph.mini_group.selectAll("circle.mini_node").remove();
    graph.mini_group.selectAll("rect.mini_rect").remove();
    draw_mini_nodes(graph);
};