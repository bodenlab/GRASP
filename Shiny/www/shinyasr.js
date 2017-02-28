window.onload = function() {
    
    // list to keep track of which nodes marginal reconstruction has been performed on (so only require the computation once)
    var marginalNodesPerformed = [];
    
    function showDivs(visible) {
      if (visible === true) {
        document.getElementById("treediv").style.display = "block";
        document.getElementById("pogdiv").style.display = "block";
        document.getElementById("alignmentdiv").style.display = "block";
        document.getElementById("optionsdiv").style.display = "block";
      } else {
        document.getElementById("treediv").style.display = "none";
        document.getElementById("pogdiv").style.display = "none";
        document.getElementById("alignmentdiv").style.display = "none";
        document.getElementById("optionsdiv").style.display = "none";
        document.getElementById("seq_logo").style.display = "none";
      }
    }
    
    function plotMSA(width){
      // display MSA graph
        jQuery.get(sessionId + "/" + label + "MSA.dot", function(data) {
      	  var g = graphlibDot.read(data);
      	  g.nodes().forEach(function(v) {
      	    var node = g.node(v);
      	    node.style= "fill:" + node.fillcolor;
      	    node.fixedsize = true;
      	    node.shape = "circle";
          });
          var renderer = dagreD3.render();
          d3.select("svg#msagraphContainer").call(renderer, g);
          var svg = document.querySelector("svg#msagraphContainer");
          var bbox = svg.getBBox();
          svg.style.height = bbox.height + 80.0 + "px";
          svg.style.width = bbox.width + 80.0 + "px";
        });
    }
    
    function readSingleFile(nodeName, label) {
      var node;
      if (nodeName === "root") {
      	node = rootNode;
      } else {
      	node = nodeName;
      }
      var filepath = sessionId + "/" + label + node + ".dot";
      jQuery.get(filepath, function(data) {
      	displayGraph(data, node);
      });
    }
      
    function displayGraph(contents, node){
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
      svg.style.height = bbox.height + 80.0 + "px";
      svg.style.width = bbox.width + 80.0 + "px";
      document.getElementById("seq_logo").style.width = bbox.width + 140.0 + "px";
      
      // redraw MSA because of width
      plotMSA(bbox.width + 80.0);
    }
  
    Shiny.addCustomMessageHandler("divvisibility",
      function(message) {
        if (message.show === true) {
          showDivs(true);
        } else {
          showDivs(false);
        }
      }
    );
    
    Shiny.addCustomMessageHandler("showphylo",
      function(message) {
        
      }
    );
      
    Shiny.addCustomMessageHandler("message",
    	function(message) {
   			asrtree = message.a;
    		label = message.b;
      	rootNode = message.root;
        sessionId = message.session;
        
        showDivs(true);
        document.getElementById("seq_logo").style.display = "none";
        $("#extants").prop("checked", true);
        
        // display root graph
        selectedNode = "root";
        console.log(selectedNode);
        console.log("rootenode: " + rootNode);
      	Shiny.onInputChange("selectedNodeLabel", rootNode);
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
          svg.style.height = bbox.height + 80.0 + "px";
          svg.style.width = bbox.width + 80.0 + "px";
          plotMSA(bbox.width + 80.0);
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
      
      	// parse the Newick into a d3 hierarchy object with additional fields
      	// handle custom node styling
      	// layout and render the tree
      	tree(d3_phylotree_newick_parser(asrtree)).layout();
      
      	// add a custom menu for (in this case) terminal nodes
      	tree.get_nodes().forEach (function (tree_node) {
      		d3_add_custom_menu (tree_node, // add to this node
      			function(node) {return("Create marginal reconstruction");},
      			function () { 
      			  createMarginal(tree_node);
      			  displayPOGraph(tree_node);
      			  displayLogo(tree_node);
      			}
     	 	  );
     	 	  d3_add_custom_menu (tree_node, // add to this node
      			function(node) {return("Show partial order graph");},
      			function () { 
      	      Shiny.onInputChange("inferredSeq", "");
      			  document.getElementById("seq_logo").style.display = "none";
              displayPOGraph(tree_node);}
      		);
      		d3_add_custom_menu (tree_node, // add to this node
      			function(node) {return("Show sequence logo");},
      			function () { 
        	    Shiny.onInputChange("inferredSeq", "");
      			  displayPOGraph(tree_node);
      			  displayLogo(tree_node);
      			}
      		);
      	});
      
    function displayPOGraph(tree_node){
      readSingleFile(tree_node.name, label);
      selectedNode = tree_node.name;
      Shiny.onInputChange("selectedNodeLabel", tree_node.name);
      tree.update();
    }
      
    function createMarginal(tree_node){
      if (marginalNodesPerformed.indexOf(tree_node.name) == -1) {
        // perform reconstruction
        marginalNodesPerformed.push(tree_node.name);
        Shiny.onInputChange("marginalNode", tree_node.name);
      } else {
        // already performed marginal
        displayPOGraph(tree_node);
        displayLogo(tree_node);
      }
    }
      
    function displayLogo(tree_node){
      if (marginalNodesPerformed.indexOf(tree_node.name) != -1) {
        document.getElementById("seq_logo").style.display = "block";
        selectedNode = tree_node.name;
        Shiny.onInputChange("selectedNodeLabel", tree_node.name);
      } else {
        // perform reconstruction
        createMarginal(tree_node);
        displayPOGraph(tree_node);
        displayLogo(tree_node);
      }
    }
    
    Shiny.addCustomMessageHandler("loadLogo",
      function(tree_node){
        displayLogo(tree_node);
      }
    );
    
    // update PO Graph view
    Shiny.addCustomMessageHandler("loadPOGraph",
      function(message) {
        readSingleFile(message.node, message.label);
        tree.update();
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