// if you don't specify a html file, the sniper will generate a div with id "rootDiv"


//An array of colours which are used for the different probes

// uncharged polar side chains, then Basic side chains, acidic, the hydrophobic


var selected_colour = taylor_colours;
var graph_array = [];


var setup_options = function (svg_id) {
    //The main options for the graph
    var options = {
        stored_data: {
            msa: null,
            inferred: [],
        },
        number_of_edges_to_be_interesting: 2, // Min number of edges to consider it interesting

        /******** Options for node and edge drawing ***************************/
        graphs_display: true, // Graphs will only display if the data contains
        // graph information -> note histogram information must be there for all
        // node
        seq_display: true, // This is if there is sequence data in the node

        /**************** Options for the lanes (used when showing both an inferred and raw POAG)   **/
        depth: 3, // Indicates how many layers for the nodes
        lane_height: 5, // A "lane" is the region where a POAG is drawn this is
        // lane height is the lane height of the mini graph
        lane_padding: 10,
        mini_radius: 7,
        interesting_many_edges_colour: "Crimson",
        diff_colour: "SlateGrey",
        diff_opacity: 0.15,
        num_start_nodes : 10,// How many nodes that it starts with
        x_padding: 0, // the padding to the left of teh first node in relation to the y axis titles
        // Used when drawingthe line for the mini nodes
        mini: {
            draw_mini_nodes: false,
            stroke: "grey",
            stroke_width: 3
        },
        multi: {
            main_height: 300,
            mini_height: 10
        },
        position: {
            text_padding: 10, // How high above the mini it will appear
            level_1: 1, // Means that we will draw a position for every node
            level_2: 5, // We will draw a position at every 5 nodes
            level_3: 10, // Draw position at every 10
            level_unlimited: 25,
            level_1_node_limit: 10, // if < 10 nodes in the main element draw 10
            level_2_node_limit: 50, // lvl 2 < 50 nodes
            level_3_node_limit: 100 // If we have more than 50 nodes don't draw positions
        },
         /**************** Options for changing the style of the nodes *************************/
        node: {
            stroke_width: 2,
            stroke: "#d3d3d3",
            hover_radius: 10,
            text_size: "18px",
            font_family: "Gill Sans, sans-serif",
            text_padding: 5,
            gradient: false,
            x_size: 150, // Multiplication factor for positions
            y_size: 100,
            x_start: 200, // where to put the first node
            y_start: 400
        },
        /**************** Options for style of the edges between nodes **********************/
        edge: {
            y_curve_amount: 10,
            stroke_width: 3,
            stroke: "grey",
            stroke_opacity: 1,
            x_length: 160,
            text_size: "12px",
            font_family: "Gill Sans, sans-serif",
            font_color: "grey",
            text_stroke_width: 1
            //y_length: 20

        },
        /********** Pie chart options ***************************************/
        pie: {
            label_position: 22, // Makes the label this distance in from the outer radius
            radius: 50,
            stroke_width: 3,
            stroke: "white",
            text_size: "12px",
            font_family: "Gill Sans, sans-serif",
            max_seq_len: 6 // Number of sequences in a pie chart where we don't draw the dividing lines between (stroke
                           // width gets set to 0;
        },
        /*********** Histogram options  ************************************/
        graph: {
            draw_position_in_histogram: true, // Draws the position as a title above the node
            x_size: 150, // Multiplication factor for positions
            y_size: 100,
            y_start: 400,
            x_start: 200,
            svg_overlay: null,
            x: 0,
            y: 0,
            graph_outer_circle_colour: "gray",
            graph_outer_circle_opacity: 0.5,
            graph_outer_circle_radius: 85,
            graphs: new Array(),
            size: 80,
            colours: selected_colour,
            offset_graph_width: -35,
            offset_graph_height: -30,
            width: 80,
            div_factor: 1,
            graph_height: 70,
            max_height: 10,
            max_bar_count: 2,
            hover: true,
            metabolite_count: 0,
            display_label_text: false, // true means display the label text below the MSA graph
            display_axis_text: true, // Text on the axis (as in the numbers on the y axis)
            draw_axis: true // Whether or not to draw the y axis
        },
        /******** Options for Sizing *****************************************/
        legend_padding: 0,
        legend_rect_size: 0,
        height: 500,
        width: document.getElementById(svg_id).offsetWidth,//600,
        margin: {top: 100, left: 60, bottom: 0, right: 10},
        initial_padding: 0,
        colours: selected_colour,
	    poagColours: {},//{"poag1": "red", "poag2": "blue", "poag3": "yellow", "poag4": "orange", "poag5": "green"}, // tODO: change based on tree colours
        svg_padding: 40, // The padding of the svg within the div given
        padding_between_views: 100,
        /*********** End of sizing options **********************************/
        background_colour: "white",
        background_stroke_colour: "grey",
        background_stroke_width: "1px",
        stroke_width: "3px",
        /********** Data ***************************************************/
        raw_svg_id: svg_id,
        target: '#' + svg_id,
        /********** Text options ******************************************/
        font_style: "Arial",
        text_size: "12px",
        title: "Alignment Vis Tool",
        title_text_size: "16px",
        x_axis_text_angle: -45,
        x_axis_title: "Samples",
        x_column: 'Sample_ID',
        x_middle_title: 500,
        y_column: 'Expression_Value',
        y_label_text_size: "12px",
        y_label_x_val: 40,
    };

    return options;
};
