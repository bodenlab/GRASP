var update_colour = function(value) {

console.log(value);
    /*var chosen_colour = document.getElementsByName("colour_options");
    for (var c in chosen_colour) {
        var scheme = chosen_colour[c];
        if (scheme.checked == true) {*/
            graph.options.colours = colour_schemes[value];//scheme.value];
            graph.options.graph.colours =  colour_schemes[value];
            if (value == "cinema") {
                graph.options.pie.stroke = "grey";
            } else {
                graph.options.pie.stroke = "white";
            }
    /*        break;
        }
    }*/


//    selected_colour = colour_schemes[value];
//
//    graph.options.colours = colour_schemes[value];//scheme.value];
//    graph.options.graph.colours = colour_schemes[value];
//    if (value == "cinema") {
//        graph.options.pie.stroke = "grey";
//    } else {
//        graph.options.pie.stroke = "white";
//    }

    display();
    // redraw the mini nodes in the correct coluors
    graph.mini_group.selectAll("circle.mini_node").remove();
    graph.mini_group.selectAll("rect.mini_rect").remove();
    draw_mini_line(graph);//draw_mini_nodes(graph);
};