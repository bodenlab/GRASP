var update_colour = function(value) {
    poags.options.colours = colour_schemes[value];
    poags.options.display.colours = colour_schemes[value];
    poags.options.graph.colours =  colour_schemes[value];

    //selected_colour = colour_schemes[value];

    if (value == "cinema") {
        poags.options.pie.stroke = "grey";
    } else {
        poags.options.pie.stroke = "white";
    }

    redraw_poags();
};