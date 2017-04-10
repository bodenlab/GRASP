/*

 Copyright 2017 Ariane Mora

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.


 This is a standalone unit to call when you want to create a scatter plot graph.

 */



    /*  Setting up the graph including y and x axes */
    setup_graph = function (graph) {
        var options = graph.options;
        
        // Parse the data -> this is only if you are using dot
        // files not JSON files.
        /* try {
  	        options.data = dot_parser(options);
        } catch(err) {
            console.log("Error parsing data");
            return null;
        }*/
        graph = setup_svg(graph);
        options.graph.svg_overlay = graph.svg;
        // Only if we are using dot files
        //graph = assign_x_y_coords(graph); 
        graph = draw_edges(graph);
        graph = draw_nodes(graph);
        return graph;

    };  // end setup_graph


    /**
     * Run at the start of the initialisation of the class
     **/
    init = function (init_options) {
//      var options = default_options();
        var options = init_options;
        var page_options = {}; 
        var graph = {};
        graph.options = options;
        graph = setup_graph(graph);
        var target = $(options.target);
        target.addClass('alignment');
        svg = graph.svg;
    };

