// if you don't specify a html file, the sniper will generate a div with id "rootDiv"


//An array of colours which are used for the different probes

// uncharged polar side chains, then Basic side chains, acidic, the hydrophobic

var colours = {"C": "#33CCFF", "S": "#A55FEB", "T": "#FF68DD", "Y": "#9A03FE", "Q": "#F900F9", "N": "#A27AFE", "H": "#7979FF", "K": "#86BCFF", "R": "#8CEFFD", "D": "#03F3AB", "E": "#4AE371", "I": "#FF8A8A", "L": "#FF5353", "M": "#FF9331", "V": "#FFCC33", "G": "#FF6600", "P": "#FF9999", "F": "#FF4848", "W": "#FF5353", "A": "#FF0033"};

/* Tip which is displayed when hovering over the nodes */
var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, +110])
        .html(function (d) {
            //label = d.label;
            temp =
                    "Sample Type: <br/>"
            return temp;
        });

var draw_poag = function (svg_id, json_str) {
    
    dataJSON = JSON.parse(json_str);
    nodes = dataJSON.nodes;
    reactions = dataJSON.edges;
    //The main options for the graph
    var options = {
        /******** Options for node and edge drawing ***************************/
        graphs_display: true, // Graphs will only display if the data contains
        // graph information -> note histogram information must be there for all
        // node
        seq_display: true, // This is if there is sequence data in the node
        depth: 3, // Indicates how many layers for the nodes
        node: {stroke_width: 2,
            stroke: "#d3d3d3",
            radius: 30,
            hover_radius: 10,
            text_size: "18px",
            font_family: "Gill Sans, sans-serif",
            text_padding: 5,
            font_colour: "#233",
            gradient: false,
            x_size: 150, // Multiplication factor for positions
            y_size: 100,
            x_start: 200, // where to put the first node
            y_start: 400
        },
        edge: {stroke_width: 3,
            stroke: "grey",
            stroke_opacity: 1,
            x_length: 160,
            text_size: "12px",
            font_family: "Gill Sans, sans-serif",
            font_color: "grey",
            text_stroke_width: 1,
            y_length: 70
        },
        pie: {
            label_position: 22, // Makes the label this distance in from the outer radius
            radius: 50,
            stroke_width: 3,
            stroke: "grey",
            text_size: "12px",
            font_family: "Gill Sans, sans-serif"
        },
        graph: {
            x_size: 150, // Multiplication factor for positions
            y_size: 100,
            y_start: 400,
            x_start: 200,
            svg_overlay: null,
            x: 0,
            y: 0,
            x_label_array: ['one', 'two'],
            graph_outer_circle_colour: "blue",
            graph_outer_circle_opacity: 0.5,
            graph_outer_circle_radius: 65,
            graphs: new Array(),
            size: 60,
            colours: colours,
            offset_graph_width: -29,
            offset_graph_height: -15,
            width: 60,
            div_factor: 1,
            graph_height: 50,
            max_height: 10,
            max_bar_count: 2,
            hover: true,
            metabolite_count: 0
        },
        /******** Options for Sizing *****************************************/
        legend_padding: 0,
        legend_rect_size: 0,
        height: 1000,
        width: 2000,
        margin: {top: 0, left: 0, bottom: 0, right: 0},
        initial_padding: 0,
        colours: colours,
        /*********** End of sizing options **********************************/
        background_colour: "white",
        background_stroke_colour: "black",
        background_stroke_width: "1px",
        stroke_width: "3px",
        /********** Data ***************************************************/
        data: dataJSON,
        nodes: nodes,
        reactions: reactions,
        target: svg_id,
        /********** Text options ******************************************/
        font_style: "Arial",
        text_size: "12px",
        title: "Alignment Vis Tool",
        title_text_size: "16px",
        tip: tip, //second tip to just display the sample type
        x_axis_text_angle: -45,
        x_axis_title: "Samples",
        x_column: 'Sample_ID',
        x_middle_title: 500,
        y_column: 'Expression_Value',
        y_label_text_size: "14px",
        y_label_x_val: 40,
    };

    return options;
};
