library(shiny)
library(ASR)
library(ape)
library(ggplot2)
source("json_map.R")

setwd("./www")

ui <- fluidPage(
  tags$head(

    # CSS / JavaScript for PhyloTree
    tags$link(type = "text/css", rel = "stylesheet", href = "http://netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap-theme.min.css"),
    tags$link(type = "text/css", rel = "stylesheet", href = "http://netdna.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"),
    tags$link(type = "text/css", rel = "stylesheet", href = "http://veg.github.io/phylotree.js/phylotree.css"),
    tags$script(src = "https://s3.eu-central-1.amazonaws.com/cdn.bio.sh/msa/latest/msa.min.gz.js"),
    tags$link(type = "text/css", rel = "stylesheet", href = "asr.css"),
    tags$link(type = "text/css", rel = "stylesheet", href = "index.css"),
    
    tags$script(src = "http://code.jquery.com/jquery.js"),
    tags$script(src =
                  "http://netdna.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"),
    tags$script(src = "http://d3js.org/d3.v3.min.js"),
    tags$script(src = "http://veg.github.io/phylotree.js/phylotree.js"),
    tags$script(src = "http://cpettitt.github.io/project/graphlib-dot/latest/graphlib-dot.min.js"),
    tags$script(src = "http://cpettitt.github.io/project/dagre-d3/latest/dagre-d3.js"),
    
    tags$script(src = "tree.js"),
    tags$script(src = "index.js")
    
  ),
  
  titlePanel("bnkit: Ancestral Sequence Reconstruction"),
  sidebarLayout(sidebarPanel(tabsetPanel(
    tabPanel(
      "Run",
      tags$br(),
      tags$br(),
      actionButton(inputId = "default", label = "Load Default Data"),
      
      tags$br(),
      tags$br(),
      textInput(inputId = "runId", label = "Label your run"),
      
      div(
        style = "display:inline-block", fileInput(
          inputId = "tree", label = "Select your Newick file:", width = 140
        )
      ),
      div(
        style = "display:inline-block", fileInput(
          inputId = "alignment", label = "Select your FASTA file:", width = 140
        )
      ),
      actionButton(inputId = "submit", label = "Reconstruct Ancestors")
    )
    
  ), width = 2),
  
  mainPanel(
    tabsetPanel(

      # JavaScript Tree tab
      tabPanel(
        "JavaScript Tree",
        textInput(inputId = "marginalNode", label = "Compute a marginal reconstruction at this node:"),
        actionButton(inputId = "marginalButton", label = "Create marginal reconstruction"),
        downloadButton(outputId = "saveTree", label = "Save full tree"),
        actionButton(inputId = "saveAll", label = "Save all output"),
        
        
        
        tags$body(
          HTML(
            '<div>
            <form>
            <label>Radial layout
            <input type = "checkbox" id = "layout" unchecked/>
            </form>
            </div>'
          ),
          tags$script(
            '
            window.onload = function() {
            function readSingleFile(e, label) {
            // var filepath = "graph.dot";
            var filepath = label + e.name + ".dot";
            jQuery.get(filepath, function(data) {
            displayGraph(data);
            });
            }
            
            
            function displayGraph(contents){
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
            svg.style.height = bbox.height + 40.0 + "px";
            svg.style.width = bbox.width + 40.0 + "px";

            
            }
            
            
            
            Shiny.addCustomMessageHandler("message",
            function(message) {
            
            
            example_tree = message.a;
            label = message.b;
            var height = 500;
            var width = 1500;
            
            
            
            
            var tree = d3.layout.phylotree()
            // create a tree layout object
            .svg (d3.select ("#tree_display"))
            .options (
            { "selectable" : true,})
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
            
            tree (d3_phylotree_newick_parser (example_tree))
            // parse the Newick into a d3 hierarchy object with additional fields
            // handle custom node styling
            .layout();
            // layout and render the tree
            // add a custom menu for (in this case) terminal nodes
            
            tree.get_nodes().forEach (function (tree_node) {
            d3_add_custom_menu (tree_node, // add to this node
            my_menu_title, // display this text for the menu
            function () { createMarginal(tree_node);} // condition on when to display the menu
            // a function that takes node as an argument
            );
            });
            
            tree.get_nodes().forEach (function (tree_node) {
            d3_add_custom_menu (tree_node, // add to this node
            my_menu_title2, // display this text for the menu
            function () { readSingleFile(tree_node, label);}
            );
            });
            
            function showDot(tree_node){
            console.log("SHOW DOT", tree_node.name);
            
            };
            
            function createMarginal(tree_node){
            console.log("Creating marginal at ", tree_node.name);
            Shiny.onInputChange("marginalNode", tree_node.name);
            d3_phylotree_trigger_refresh (tree);
            
            
            };
            
            $("#layout").on ("click", function (e) {
            tree.radial ($(this).prop ("checked")).placenodes().update ();
            });
            
            
            }
            );}'

          ),
          
          
          # HTML("<div id = 'wrapper'>"),
          
            fillRow(
            HTML(
              "<svg id = 'tree_display'/>

              "
            ),
            HTML(
              "
              <svg id='graphContainer'>
              </svg>
              "
              
            )
            
          
            )

      
          
),

        # HTML("</div>"),
        
        downloadButton(outputId = "saveAln", label = "Download alignment")
        
          ),
      
      
      
      tabPanel(
        "Sequence logo",
        div(htmlOutput("sequence_logo")),
        selectInput(
          inputId = "letter_height", choices = c("Information content", "Score"),
          selected = "Information content", label = "Letter Height"
        )
      )
          )
    ))
  )



server <- function(input, output, session) {
  # Setup reactive values for asr output
  asrValues <- reactiveValues(default = asrStructure)
  
  # Perform joint reconstruction
  observeEvent(input$submit, {
    withProgress(message = 'Reconstructing ancestors...', value = 0.1, {
      for (i in 1:55) {
        incProgress(1 / 55)
        Sys.sleep(0.25)
      }
      
    })
    asrValues$default <-
      runASR(input$tree, input$alignment, inf = "Joint", output_file = input$runId)
    
    session$sendCustomMessage(
      type = 'message',
      message = list(
        a = asrValues$default$loadedFiles$tree$V1, b = input$runId,  alignment = asrValues$default$loadedFiles$alignment$v1
      )
    )
    
    session$sendCustomMessage(
      type = 'phylomessage',
      message = list(a = asrValues$default$loadedFiles$tree$V1)
    )
    session$sendCustomMessage(
      type = 'message2',
      
      message = list(
        a = ">322\nGGA\n>13\nGGP", b = asrValues$default$FastaFile,  alignment = paste(asrValues$default$loadedFiles$alignment$V, collapse =
                                                                                         "\n")
      )
    )
    
    output$ancestorText <- renderText({
      paste(
        "The predicted sequence for the ancestor at the root node is", as.character(asrValues$default$fastaDF$Sequence[1])
      )
    })
    
  })
  
  # Load default data
  observeEvent(input$default, {
    asrValues$default <- asrStructure
    asrValues$marginal <- asrStructure
    
    asrValues$json = createJSON(asrValues$default,input$letter_height, "Marginal")
    
    session$sendCustomMessage(
      type = 'message',
      message = list(a = asrValues$default$loadedFiles$tree$V1)
    )
    
    session$sendCustomMessage(
      type = 'phylomessage',
      message = list(a = asrValues$default$loadedFiles$tree$V1)
    )
    
    session$sendCustomMessage(
      type = 'message2',
      
      message = list(
        a = ">322\nGGA\n>13\nGGP", b = asrValues$default$FastaFile,  alignment = paste(asrValues$default$loadedFiles$alignment$V, collapse =
                                                                                         "\n")
      )
    )
    
    output$ancestorText <- renderText({
      paste(
        "The predicted sequence for the ancestor at the root node is", as.character(asrValues$default$fastaDF$Sequence[1])
      )
    })
    
    
  })
  
  # Perform marginal reconstruction
  observeEvent(input$marginalButton, {
    asrValues$marginal <-
      runASR(
        input$tree, input$alignment, inf = "Marginal", node = input$marginalNode, output_file = input$runId
      )
    asrValues$json = createJSON(asrValues$marginal,input$letter_height, "Marginal")
  })
  
  
  
  # Set up the default values for all of the plots
  alnValues <-
    reactiveValues(
      type = "colouredText", colour = "clustal", cols = NULL, seqs = NULL
    )
  treeValues <- reactiveValues(node = "N0")
  distValues <-
    reactiveValues(
      type = "colouredText", colour = NULL, cols = NULL, aas = NULL
    )
  logoValues <-
    reactiveValues(colour = "taylor", cols = NULL, seqs = NULL)
  
  
  
  # Update the alignment plot parameters based on user values
  observeEvent(input$alnButton, {
    alnValues$type <- input$alnType
    alnValues$colour <- input$alnColour
    alnValues$cols <- if (identical(input$alnCols, ""))
      NULL
    else {
      input$alnCols
    }
    alnValues$seqs <- if (identical(input$alnSeqs, ""))
      NULL
    else {
      input$alnSeqs
    }
    
  })
  
  # Save the alignment
  output$saveAln <- downloadHandler(
    filename = "testname",
    content = function(file) {
      write(as.character(asrValues$default$loadedFiles$alignment$V1), file)
    }
  )
  
  
  # Change tree parameters for subtree based on user input
  observeEvent(input$makeSubTree, {
    treeValues$node <- input$subTree
  })
  
  # Change tree parameters for subtree back to full tree
  observeEvent(input$showFullTree, {
    treeValues$node <- "N0"
  })
  
  # Save the tree
  output$saveTree <- downloadHandler(
    filename = "testname",
    content = function(file) {
      write(as.character(asrValues$default$loadedFiles$tree$V1), file)
    }
  )
  
  # Update the marginal distribution plot parameters based on user values
  observeEvent(input$distButton, {
    distValues$type <- input$distType
    distValues$colour <- input$distColour
    distValues$cols <- if (identical(input$distCols, ""))
      NULL
    else {
      input$distCols
    }
    distValues$aas <- if (identical(input$distAAs, ""))
      NULL
    else {
      input$distSeqs
    }
    
  })
  
  # Update the logo plot parameters based on user input
  observeEvent(input$logoButton, {
    logoValues$colour <- input$logoColour
    logoValues$cols <- if (identical(input$logoCols, ""))
      NULL
    else {
      input$logoCols
    }
    logoValues$seqs <- if (identical(input$logoSeqs, ""))
      NULL
    else {
      input$logoSeqs
    }
    
  })
  
  # Update alignment output
  observe({
    if (input$default != 0 || input$submit != 0) {
      output$alnPlot <-
        renderPlot(
          plot_aln(
            asrValues$default, NULL, alnValues$type,
            alnValues$colour, alnValues$cols, alnValues$seqs
          ),
          height = 4000, width = 4000
        )
    }
  })
  
  # Update tree output
  observe({
    if (input$default != 0 || input$submit != 0) {
      output$treePlot <-
        renderPlot(plot_subtree(asrValues$default, treeValues$node))
    }
  })
  
  # Receive node to base marginal reconstruction around
  output$marginalText = renderPrint({
    input$marginalNode
  })
  
  observe({
    if ((input$default != 0 ||
         input$submit != 0) && input$marginalNode != "") {
      asrValues$marginal <-
        runASR(
          input$tree, input$alignment, inf = "Marginal", node = if (input$marginalNode == "root") {
            "N0"
          } else {
            input$marginalNode
            
          }, output_file = input$runId
        )
      
    }
  })
  
  #     output$marginalDist <-         renderPlot(
  #       plot_distrib(
  #         asrValues$marginal, input$marginalNode, distValues$type, distValues$colour, distValues$cols, distValues$aas
  #       )
  #     )
  
  
  # Update marginal distribution output
  observe({
    if (input$default != 0 || input$submit != 0)
    {
      output$marginalDist <-
        renderPlot(
          plot_distrib(
            asrValues$marginal, NULL, distValues$type, distValues$colour, distValues$cols, distValues$aas
          )
        )
    }
  })
  
  
  
  # Update logo output
  observe({
    if (input$default != 0 || input$submit != 0)
    {
      output$logoPlot <-
        renderPlot(
          plot_logo_aln(
            asrValues$default, NULL, logoValues$colour, logoValues$cols, logoValues$seqs
          )
        )
    }
  })
  
  
  #Update sequence logo
  observe({
    if (input$default != 0 ||
        (input$submit != 0 && input$marginalNode != "")) {
      getPage = function() {
        return(tags$body(
          tags$link(
            rel = "stylesheet", type = "text/css", href = "hmm_logo.min.css"
          ),
          tags$script(src = "https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"),
          tags$script(src = "hmm_logo.js"),
          tags$div(
            id = "logo", class = "logo",`data-logo` = asrValues$json
          ),
          tags$script(
            '$(document).ready(function () {
            $("#logo").hmm_logo();
      });'
)
        ))
      }
      output$sequence_logo = renderUI({
        getPage()
      })
      }
  })
  
  }

shinyApp(ui = ui, server = server)
