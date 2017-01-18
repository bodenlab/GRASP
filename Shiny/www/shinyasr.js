window.onload = function() {
      
    function readSingleFile(e, label) {
      if (e.name === "root") {
      	var node = rootNode;
      } else {
      	var node = e.name;
      }
      var filepath = "sessiontmp/" + label + node + ".dot";
      jQuery.get(filepath, function(data) {
      	displayGraph(data, node);
      });
    }
      
    function displayGraph(contents, node){
      document.getElementById("seq_logo").style.display = "none";
      document.getElementById("graphContainer").style.display = "block";
      
      console.log(contents);
      var g = graphlibDot.read(contents);
      console.log("G IS " + g);
      
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
    }
      
    Shiny.addCustomMessageHandler("message",
    	function(message) {
   			example_tree = message.a;
    		label = message.b;
      		rootNode = message.root;
      		var height = 500;
      		var width = 450;
      
      		var tree = d3.layout.phylotree()
      		// create a tree layout object
      		.svg (d3.select ("#tree_display"))
      		.options ({ "selectable" : true,})
      		.radial(false)
      		.size([height,width]);
      
      		// render to this SVG element
      	function my_node_style_text (node) {
      		node["text-italic"] = ! node["text-italic"];
      		d3_phylotree_trigger_refresh (tree);
      	}
      
     	function my_menu_title (node) {
      		return "Create marginal reconstruction";
      	}
      
      	function my_menu_title2 (node) {
      		return "Show partial order graph at this node";
      	}
      
      	function my_menu_title3 (node) {
      		return "Show sequence logo at this node";
      	}
      
      	// parse the Newick into a d3 hierarchy object with additional fields
      	// handle custom node styling
      	// layout and render the tree
      	tree(d3_phylotree_newick_parser(example_tree)).layout();
      
      	// add a custom menu for (in this case) terminal nodes
      	tree.get_nodes().forEach (function (tree_node) {
      		d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title, // display this text for the menu
      			function () { createMarginal(tree_node);} // condition on when to display the menu
     	 	);
      	});
      
      	tree.get_nodes().forEach (function (tree_node) {
      		d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title2, // display this text for the menu
      			function () { displayGraph(tree_node);}
      		);
      	});
      
      	tree.get_nodes().forEach (function (tree_node) {
      		d3_add_custom_menu (tree_node, // add to this node
      			my_menu_title3, // display this text for the menu
      			function () { displayLogo(tree_node);}
      		);
      	});
      
      	function displayGraph(tree_node){
      		readSingleFile(tree_node, label);
      	};
      
      	function createMarginal(tree_node){
      		Shiny.onInputChange("marginalNode", tree_node.name);
      		d3_phylotree_trigger_refresh (tree);
      	};
      
      	function displayLogo(tree_node){
      		// unhide sequence logo div, hide PO Graph div
      		document.getElementById("seq_logo").style.display = "block";
      		document.getElementById("graphContainer").style.display = "none";
      		$("#logo").empty();
      		$("#logo").hmm_logo();
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
	});
}