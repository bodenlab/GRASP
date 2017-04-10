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

var draw_poag = function (svg_id) {


    //The main options for the graph
    var options = {
        /******** Options for node and edge drawing ***************************/
        graphs_display: true, // Graphs will only display if the data contains
        // graph information -> note histogram information must be there for all
        // node
        seq_display: true, // This is if there is sequence data in the node
        depth: 3, // Indicates how many layers for the nodes
        node: { stroke_width: 2,
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
        
        edge: { stroke_width: 3,
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
        background_stroke_colour:  "black",
        background_stroke_width:  "1px",
        stroke_width:"3px",

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
        tip: tip,//second tip to just display the sample type
        x_axis_text_angle:-45,
        x_axis_title: "Samples",
        x_column: 'Sample_ID',
        x_middle_title: 500,
        y_column: 'Expression_Value',
        y_label_text_size: "14px",
        y_label_x_val: 40,
    };

    return options;
};
//JSON_MSA_STR = {"nodes":{"node-0":{"x":0,"y":0,"label":"M","graph":{"M":100}},"node-2":{"x":1,"y":0,"label":"D","graph":{"D":100}},"node-15":{"x":12,"y":0,"label":"M","graph":{"M":100}},"node-4":{"x":2,"y":0,"label":"S","graph":{"A":7,"S":90,"T":5}},"node-5":{"x":3,"y":0,"label":"I","graph":{"T":10,"I":60,"M":30}},"node-13":{"x":11,"y":0,"label":"K","graph":{"K":100}},"node-6":{"x":4,"y":0,"label":"N","graph":{"N":100}},"node-12":{"x":10,"y":0,"label":"V","graph":{"V":100}},"node-7":{"x":5,"y":0,"label":"F","graph":{"F":100}},"node-11":{"x":9,"y":0,"label":"S","graph":{"S":100}},"node-8":{"x":6,"y":0,"label":"L","graph":{"L":100}},"node-10":{"x":8,"y":0,"label":"K","graph":{"K":100}},"node-21":{"x":18,"y":0,"label":"Q","graph":{"Q":50,"D":8,"E":2,"H":30,"K":8,"N":3}},"node-9":{"x":7,"y":0,"label":"K","graph":{"K":100}},"node-20":{"x":17,"y":0,"label":"L","graph":{"L":100}},"node-19":{"x":16,"y":1,"label":"R","graph":{"R":100}},"node-18":{"x":15,"y":1,"label":"S","graph":{"S":100}},"node-17":{"x":14,"y":1,"label":"E","graph":{"E":100}},"node-16":{"x":13,"y":1,"label":"K","graph":{"K":100}}},"edges":{"edges_19:20":{"y1":1,"x1":16,"y2":0,"weight":50,"from":19,"x2":17,"to":20},"edges_15:16":{"y1":0,"x1":12,"y2":1,"weight":90,"from":15,"x2":13,"to":16},"edges_16:17":{"y1":1,"x1":13,"y2":1,"weight":90,"from":16,"x2":14,"to":17},"edges_17:18":{"y1":1,"x1":14,"y2":1,"weight":68,"from":17,"x2":15,"to":18},"edges_18:19":{"y1":1,"x1":15,"y2":1,"weight":68,"from":18,"x2":16,"to":19},"edges_0:2":{"y1":0,"x1":0,"y2":0,"weight":27,"from":0,"x2":1,"to":2},"edges_10:11":{"y1":0,"x1":8,"y2":0,"weight":81,"from":10,"x2":9,"to":11},"edges_11:12":{"y1":0,"x1":9,"y2":0,"weight":86,"from":11,"x2":10,"to":12},"edges_13:15":{"y1":0,"x1":11,"y2":0,"weight":100,"from":13,"x2":12,"to":15},"edges_10:12":{"y1":0,"x1":8,"y2":0,"weight":13,"from":10,"x2":10,"to":12},"edges_12:13":{"y1":0,"x1":10,"y2":0,"weight":100,"from":12,"x2":11,"to":13},"edges_2:4":{"y1":0,"x1":1,"y2":0,"weight":72,"from":2,"x2":2,"to":4},"edges_15:20":{"y1":0,"x1":12,"y2":0,"weight":9,"from":15,"x2":17,"to":20},"edges_17:20":{"y1":1,"x1":14,"y2":0,"weight":18,"from":17,"x2":17,"to":20},"edges_4:5":{"y1":0,"x1":2,"y2":0,"weight":77,"from":4,"x2":3,"to":5},"edges_20:21":{"y1":0,"x1":17,"y2":0,"weight":50,"from":20,"x2":18,"to":21},"edges_5:6":{"y1":0,"x1":3,"y2":0,"weight":77,"from":5,"x2":4,"to":6},"edges_6:7":{"y1":0,"x1":4,"y2":0,"weight":90,"from":6,"x2":5,"to":7},"edges_6:9":{"y1":0,"x1":4,"y2":0,"weight":4,"from":6,"x2":7,"to":9},"edges_7:8":{"y1":0,"x1":5,"y2":0,"weight":90,"from":7,"x2":6,"to":8},"edges_8:11":{"y1":0,"x1":6,"y2":0,"weight":4,"from":8,"x2":9,"to":11},"edges_8:9":{"y1":0,"x1":6,"y2":0,"weight":86,"from":8,"x2":7,"to":9},"edges_8:10":{"y1":0,"x1":6,"y2":0,"weight":4,"from":8,"x2":8,"to":10},"edges_9:10":{"y1":0,"x1":7,"y2":0,"weight":90,"from":9,"x2":8,"to":10}}};
JSON_MSA_STR = {"nodes":{"node-1":{"x":0,"y":0,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"K","value":4}]}},"node-2":{"x":1,"y":0,"label":"D","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":2},{"label":"D","value":14}]}},"node-15":{"x":13,"y":0,"label":"I","graph":{"bars":[]},"seq":{"chars":[{"label":"T","value":1},{"label":"I","value":5},{"label":"M","value":16}]}},"node-4":{"x":2,"y":0,"label":"A","graph":{"bars":[]},"seq":{"chars":[{"label":"A","value":1},{"label":"S","value":13},{"label":"T","value":1},{"label":"V","value":2}]}},"node-14":{"x":12,"y":1,"label":"Q","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"R","value":3}]}},"node-5":{"x":3,"y":0,"label":"T","graph":{"bars":[]},"seq":{"chars":[{"label":"T","value":2},{"label":"V","value":1},{"label":"I","value":9},{"label":"M","value":5}]}},"node-13":{"x":11,"y":0,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"D","value":4},{"label":"E","value":1},{"label":"H","value":1},{"label":"Y","value":3},{"label":"K","value":9},{"label":"N","value":3}]}},"node-6":{"x":4,"y":0,"label":"S","graph":{"bars":[]},"seq":{"chars":[{"label":"A","value":2},{"label":"S","value":4},{"label":"D","value":1},{"label":"E","value":6},{"label":"N","value":8}]}},"node-12":{"x":10,"y":0,"label":"V","graph":{"bars":[]},"seq":{"chars":[{"label":"V","value":19},{"label":"I","value":3}]}},"node-7":{"x":5,"y":0,"label":"F","graph":{"bars":[]},"seq":{"chars":[{"label":"F","value":20}]}},"node-11":{"x":9,"y":0,"label":"F","graph":{"bars":[]},"seq":{"chars":[{"label":"S","value":9},{"label":"F","value":10}]}},"node-8":{"x":6,"y":0,"label":"L","graph":{"bars":[]},"seq":{"chars":[{"label":"F","value":13},{"label":"L","value":8}]}},"node-10":{"x":8,"y":0,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"K","value":18},{"label":"N","value":2}]}},"node-21":{"x":19,"y":0,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"A","value":2},{"label":"D","value":6},{"label":"H","value":1},{"label":"K","value":1}]}},"node-9":{"x":7,"y":0,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":2},{"label":"R","value":3},{"label":"S","value":1},{"label":"T","value":2},{"label":"E","value":1},{"label":"K","value":11}]}},"node-20":{"x":18,"y":0,"label":"L","graph":{"bars":[]},"seq":{"chars":[{"label":"L","value":17}]}},"node-19":{"x":17,"y":1,"label":"R","graph":{"bars":[]},"seq":{"chars":[{"label":"R","value":15}]}},"node-18":{"x":16,"y":1,"label":"G","graph":{"bars":[]},"seq":{"chars":[{"label":"S","value":8},{"label":"T","value":4},{"label":"G","value":2},{"label":"N","value":1}]}},"node-17":{"x":15,"y":1,"label":"E","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"E","value":13},{"label":"K","value":6}]}},"node-16":{"x":14,"y":1,"label":"K","graph":{"bars":[]},"seq":{"chars":[{"label":"Q","value":1},{"label":"T","value":1},{"label":"K","value":18}]}}},"edges":{"edges_19:20":{"y1":1,"x1":17,"y2":0,"weight":50,"from":19,"x2":18,"to":20},"edges_15:16":{"y1":0,"x1":13,"y2":1,"weight":90,"from":15,"x2":14,"to":16},"edges_17:18":{"y1":1,"x1":15,"y2":1,"weight":68,"from":17,"x2":16,"to":18},"edges_11:12":{"y1":0,"x1":9,"y2":0,"weight":86,"from":11,"x2":10,"to":12},"edges_13:15":{"y1":0,"x1":11,"y2":0,"weight":81,"from":13,"x2":13,"to":15},"edges_13:14":{"y1":0,"x1":11,"y2":1,"weight":18,"from":13,"x2":12,"to":14},"edges_8:11":{"y1":0,"x1":6,"y2":0,"weight":4,"from":8,"x2":9,"to":11},"edges_8:10":{"y1":0,"x1":6,"y2":0,"weight":4,"from":8,"x2":8,"to":10},"edges_14:15":{"y1":1,"x1":12,"y2":0,"weight":18,"from":14,"x2":13,"to":15},"edges_16:17":{"y1":1,"x1":14,"y2":1,"weight":90,"from":16,"x2":15,"to":17},"edges_18:19":{"y1":1,"x1":16,"y2":1,"weight":68,"from":18,"x2":17,"to":19},"edges_10:11":{"y1":0,"x1":8,"y2":0,"weight":81,"from":10,"x2":9,"to":11},"edges_10:12":{"y1":0,"x1":8,"y2":0,"weight":13,"from":10,"x2":10,"to":12},"edges_12:13":{"y1":0,"x1":10,"y2":0,"weight":100,"from":12,"x2":11,"to":13},"edges_1:2":{"y1":0,"x1":0,"y2":0,"weight":18,"from":1,"x2":1,"to":2},"edges_2:4":{"y1":0,"x1":1,"y2":0,"weight":72,"from":2,"x2":2,"to":4},"edges_15:20":{"y1":0,"x1":13,"y2":0,"weight":9,"from":15,"x2":18,"to":20},"edges_17:20":{"y1":1,"x1":15,"y2":0,"weight":18,"from":17,"x2":18,"to":20},"edges_4:5":{"y1":0,"x1":2,"y2":0,"weight":77,"from":4,"x2":3,"to":5},"edges_20:21":{"y1":0,"x1":18,"y2":0,"weight":50,"from":20,"x2":19,"to":21},"edges_5:6":{"y1":0,"x1":3,"y2":0,"weight":77,"from":5,"x2":4,"to":6},"edges_6:7":{"y1":0,"x1":4,"y2":0,"weight":90,"from":6,"x2":5,"to":7},"edges_6:9":{"y1":0,"x1":4,"y2":0,"weight":4,"from":6,"x2":7,"to":9},"edges_7:8":{"y1":0,"x1":5,"y2":0,"weight":90,"from":7,"x2":6,"to":8},"edges_8:9":{"y1":0,"x1":6,"y2":0,"weight":86,"from":8,"x2":7,"to":9},"edges_9:10":{"y1":0,"x1":7,"y2":0,"weight":90,"from":9,"x2":8,"to":10}}};

dataJSON = JSON_MSA_STR;
nodes = JSON_MSA_STR.nodes;
reactions = JSON_MSA_STR.edges;
