window.onload = function() {
      
    function readSingleFile(e, label) {
      if (e.name === "root") {
      	var node = rootNode;
      } else {
      	var node = e.name;
      }
      var filepath = sessionId + "/" + label + node + ".dot";
      jQuery.get(filepath, function(data) {
      	displayGraph(data, node);
      });
    }
      
    function displayGraph(contents, node){
      document.getElementById("seq_logo").style.display = "none";
      document.getElementById("graphContainer").style.display = "block";
      var g = graphlibDot.read(contents);
      // Render the graphlib object using d3.
      g.nodes().forEach(function(v) {
      	var node = g.node(v);
      	node.style= "fill:" + node.fillcolor;
      	node.shape = "circle";
      });
      var renderer = dagreD3.render();
      d3.select("svg#graphContainer").call(renderer, g);
      
      // Optional - resize the SVG element based on the contents.
      var svg = document.querySelector("svg#graphContainer");
      var bbox = svg.getBBox();
      svg.style.height = "100%"; //bbox.height + 40.0 + "px";
      svg.style.width = bbox.width + 80.0 + "px";
      
      // save svg to png in the session folder
      //saveSvgAsPng(document.getElementById("graphContainer"), "node.png");
    }
  
    Shiny.addCustomMessageHandler("message",
    	function(message) {
   			asrtree = message.a;
    		label = message.b;
      	rootNode = message.root;
        sessionId = message.session;
        
        document.getElementById("treediv").style.display = "block";
        document.getElementById("pogdiv").style.display = "block";
        document.getElementById("alignmentdiv").style.display = "block";
        
        // display MSA graph
        jQuery.get(sessionId + "/" + label + "MSA.dot", function(data) {
      	  var g = graphlibDot.read(data);
      	  g.nodes().forEach(function(v) {
      	    var node = g.node(v);
      	    node.style= "fill:" + node.fillcolor;
      	    node.shape = "circle";
          });
          var renderer = dagreD3.render();
          d3.select("svg#msagraphContainer").call(renderer, g);
          var svg = document.querySelector("svg#msagraphContainer");
          var bbox = svg.getBBox();
          svg.style.height = "100%";
          svg.style.width = bbox.width + 80.0 + "px";
        });
        
        // display root graph
        selectedNode = "root";
        console.log(selectedNode);
        console.log("rootenode: " + rootNode);
        jQuery.get(sessionId + "/" + label + rootNode + ".dot", function(data) {
      	  var g = graphlibDot.read(data);
      	  g.nodes().forEach(function(v) {
      	    var node = g.node(v);
      	    node.style= "fill:" + node.fillcolor;
      	    node.shape = "circle";
          });
          var renderer = dagreD3.render();
          d3.select("svg#graphContainer").call(renderer, g);
          var svg = document.querySelector("svg#graphContainer");
          var bbox = svg.getBBox();
          svg.style.height = "100%";
          svg.style.width = bbox.width + 80.0 + "px";
        });
        
          var nodeColorizer = function(element, node) {
            console.log(node.name);
            console.log(selectedNode);
            if (node.name == selectedNode) {
              element.select("circle").style('fill', "hsl(352,90%,70%)");
            } else {
              element.select("circle").style('fill', "hsl(352,0%,70%)");
            }
          }
      
      		var height = $('#treediv').height();
      		if (height > 20) {
      		  height -= 20;
      		}
      		var width =  $('#treediv').width();
      		if (width > 20) {
      		  width -= 20;
      		}
      		var tree = d3.layout.phylotree()
      		// create a tree layout object
      		.svg (d3.select ("#tree_display"))
      		.options ({ "selectable" : false,
      		            "collapsible" : true,
      		            'left-right-spacing': 'fit-to-size'
      		})
      		.radial(false)
      		.node_circle_size (6)
      		.size([height,width]);
      
        tree.style_nodes(nodeColorizer);
        tree.update();
          
      		// render to this SVG element
      	function my_node_style_text (node) {
      		node["text-italic"] = ! node["text-italic"];
      		d3_phylotree_trigger_refresh (tree);
      	}
      
     	function my_menu_title (node) {
      		return "Create marginal reconstruction";
      	}
      
      	function my_menu_title2 (node) {
      		return "Show partial order graph";
      	}
      
      	function my_menu_title3 (node) {
      		return "Show sequence logo";
      	}
      
      	// parse the Newick into a d3 hierarchy object with additional fields
      	// handle custom node styling
      	// layout and render the tree
      	tree(d3_phylotree_newick_parser(asrtree)).layout();
      
      	// add a custom menu for (in this case) terminal nodes
      	tree.get_nodes().forEach (function (tree_node) {
      		d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title, // display this text for the menu
      			function () { 
      			  createMarginal(tree_node);
      			  displayGraph(tree_node);
      			  displayLogo(tree_node);
      			}
     	 	  );
     	 	  d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title2, // display this text for the menu
      			function () { displayGraph(tree_node);}
      		);
      		d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title3, // display this text for the menu
      			function () { displayLogo(tree_node);}
      		);
      	});
      
      	function displayGraph(tree_node){
      		readSingleFile(tree_node, label);
      		selectedNode = tree_node.name;
      		//d3_phylotree_trigger_refresh (tree);
      		tree.update();
      	};
      
      	function createMarginal(tree_node){
      		Shiny.onInputChange("marginalNode", tree_node.name);
      		selectedNode = tree_node.name;
      		//d3_phylotree_trigger_refresh (tree);
      		tree.update();
      	};
      
      	function displayLogo(tree_node){
      	  // TODO: can only be shown if the marginal reconstruction has been performed
      		document.getElementById("seq_logo").style.display = "block";
      		selectedNode = tree_node.name;
      		$("#logo").empty();
      		$("#logo").hmm_logo();
      		//d3_phylotree_trigger_refresh (tree);
          tree.update();
      	};
      
      	Shiny.addCustomMessageHandler("updateJsonAttr",
      		function(json){
      			document.getElementById("logo").setAttribute("data-logo", JSON.stringify(json));
      		}
      	);
      
      	Shiny.addCustomMessageHandler("loadLogo",
      		function(tree_node){
      			displayLogo(tree_node);
      		}
      	);
      
      	$("#layout").on ("click", function (e) {
      		tree.radial ($(this).prop ("checked")).placenodes().update ();
      	});
      	
      	$("#extants").on ("click", function (e) {
      		if ($(this).prop ("checked")) {
            document.getElementById("alignmentdiv").style.display = "block";
      		} else {
            document.getElementById("alignmentdiv").style.display = "none";
      		}
      	});
	});
}