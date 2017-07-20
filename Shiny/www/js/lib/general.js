/**
 * Sets up the SVG element
 */
setup_svg = function (graph) {
    /* We are just making sure that the sorting options are in the correct
     * format with how we expect it to be i.e. no spaces insetad we
     * put underscores in */
    options = graph.options;

    graph.full_width = options.width;
    graph.full_height = options.height;
    background_stroke_width = options.background_stroke_width;
    background_stroke_colour = options.background_stroke_colour;

    // Get id of target div
    var idname = options.target.id;

    // clear out html
    $(options.target)
            .html('')
            .css('width', graph.full_width + 'px')
            .css('height', graph.full_height + 'px');

    // Add svg
    var svg = d3.select(options.target).append("svg")
            .attr("width", graph.full_width)
            .attr("height", graph.full_height)
            .attr("id", idname + "-svg")
            .attr("class","graph-svg")
            // From Escher
            .call(d3.behavior.zoom().on("zoom", function () {
                svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
            }))
            .append("g")
            .attr("id", idname + "-group")
            .attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

    // Add a background color
    // from: http://stackoverflow.com/questions/20142951/how-to-set-the-background-color-of-a-d3-js-svg
    svg.append("rect")
            .attr("width", options.width)
            .attr("height", options.height)
            .attr("fill", options.background_colour);

    // Add markers for drawing arrows between nodes
    svg.append("svg:defs").append("svg:marker")
          .attr("id", "triangle-end")
          .attr("refX", 0)
          .attr("refY", 2)
          .attr("markerWidth", 8)
          .attr("markerHeight", 8)
          .attr("orient", "auto")
          .attr("fill", "grey")
          .append("path")
          .attr('d', "M 0 0 4 2 0 4 0 2");

    svg.append('defs').append('clipPath')
	.attr('id', 'clip')
	.append('rect')
		.attr('width',  options.width)
		.attr('height', options.multi.main_height);
        
    options.svg = svg;
    graph.svg = svg;
    return graph;
}; // setup_svg

