var update_colour = function(value) {
    graph.options.colours = colour_schemes[value];
    graph.options.graph.colours =  colour_schemes[value];

    selected_colour = colour_schemes[value];

    display();

    if (value == "cinema") {
        graph.options.pie.stroke = "grey";
    } else {
        graph.options.pie.stroke = "white";
    }

    // redraw the mini nodes in the correct coluors
    graph.mini_group.selectAll("circle.mini_node").remove();
    graph.mini_group.selectAll("rect.mini_rect").remove();
    draw_mini_line(graph);//draw_mini_nodes(graph);
};