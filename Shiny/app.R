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
    tags$script(src = "http://netdna.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"),
    tags$script(src = "http://d3js.org/d3.v3.min.js"),
    tags$script(src = "http://cpettitt.github.io/project/graphlib-dot/latest/graphlib-dot.min.js"),
    tags$script(src = "http://cpettitt.github.io/project/dagre-d3/latest/dagre-d3.js"),
    tags$script(src = "tree.js"),
    tags$script(src = "index.js"),
    tags$script(src = "phylotree.js"),
    # CSS / Javscript for sequence logos
    tags$link(rel = "stylesheet", type = "text/css", href = "hmm_logo.min.css"),
    tags$script(src = "https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"),
    tags$script(src = "hmm_logo.js"), 
    tags$script(src = "shinyasr.js")
  ),

  titlePanel("bnkit: Ancestral Sequence Reconstruction"),
  
  sidebarLayout(sidebarPanel(
      actionButton(inputId = "defaultBtn", label = "Load Default Data"),
      tags$br(),
      tags$br(),
      textInput(inputId = "runId", label = "Label your run", width = "880px"),
      div(style = "float:left; width: 325px; height: 60px;", fileInput(inputId = "tree", label = "Select your Newick file:", width = "95%")),
      div(style = "float:left; width: 325px; height: 60px;", fileInput(inputId = "alignment", label = "Select your FASTA file:", width = "95%")),
      div(style = "float:left; width: 230px; height: 60px; margin-top: 25px;", actionButton(inputId = "submitBtn", label = "Reconstruct Ancestors", width = "100%")), 
      div(style = "clear: both;"),
      width = 12),
  mainPanel(
        "",
        downloadButton(outputId = "saveAln", label = "Download alignment"), 
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
          div(style = "width: 100%; min-height: 400px;",
              div(style = "width: 30%; height: 100%; overflow: auto; float: left;", 
                  HTML("<svg id = 'tree_display'; class = 'output'; />")),
              div(style = "width: 70%; height: 100%; overflow: auto; float: left;",
                  div(id = "seq_logo", style = "display: none; min-height: 400px;",
                      selectInput(
                        inputId = "letter_height", choices = c("Information content", "Score"),
                        selected = "Information content", label = "Letter Height"
                      ),
                      div(id = "logo", class = "logo", "data-logo" = "")),
                  HTML("<svg id = 'graphContainer'; class = 'output'; ></svg>"))),
          div(style = "clear: both;")
        ),
        width = 12)
    )
  )

server <- function(input, output, session) {
  # Setup reactive values for asr output
  asrValues <- reactiveValues(defaultASR = NULL)
  fname <- reactiveValues(tree = NULL, seqs = NULL, out = NULL, runId = NULL)

  # Perform joint reconstruction
  observeEvent(input$submitBtn, {
    req(fname$tree, fname$seqs, fname$out, fname$runId)
    
      print("submit")
      withProgress(message = 'Reconstructing ancestors...', value = 0.1, {
        for (i in 1:55) {
          incProgress(1 / 55)
          Sys.sleep(0.05)
        }
        asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
      })
    
      # find the appropriate label for the root node
      # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
      root_node <- unlist(strsplit(unlist(strsplit(list.files("sessiontmp/", pattern = ".*(N0).*"), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
      session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node))
      output$ancestorText <- renderText({paste("The predicted sequence for the ancestor at the root node is", as.character(asrValues$defaultASR$fastaDF$Sequence[1]))})
  })
  
  # load data to the temporary session folder
  observe({
    req(input$runId, input$tree, input$alignment)
    
    # Upload tree and sequence file to server, so we can pass it through to the ASR library
    fname$out <- paste("sessiontmp/", input$runId, sep="")
    fname$tree <- paste("sessiontmp/", input$runId, input$tree[['name']], sep="")
    fname$seqs <- paste("sessiontmp/", input$runId, input$alignment[['name']], sep="")
    fname$runId <- input$runId
    
    if (dir.exists("sessiontmp"))
      unlink("sessiontmp", recursive = TRUE)
    dir.create(file.path("sessiontmp"), showWarnings = FALSE)
    str <- readChar(input$tree[['datapath']], file.info(input$tree[['datapath']])$size)
    fc <- file(fname$tree)
    writeLines(str, fc)
    close(fc)
    str <- readChar(input$alignment[['datapath']], file.info(input$alignment[['datapath']])$size)
    fc <- file(fname$seqs)
    writeLines(str, fc)
    close(fc)
  })
  
  # Load default data
  observeEvent(input$defaultBtn,{
    print(input$default)
    
      isolate({
        print('loading default...')
        fname$tree <- "default.nwk"
        fname$seqs <- "default.aln"
        fname$out <- "sessiontmp/default"
        fname$runId <- "default"
        
        withProgress(message = 'Loading default data...', value = 0.1, {
          if (dir.exists("sessiontmp"))
            unlink("sessiontmp", recursive = TRUE)
          dir.create(file.path("sessiontmp"), showWarnings = FALSE)
          for (i in 1:55) {
            incProgress(1 / 55)
            Sys.sleep(0.05)
          }
          asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
        })
      
        # find the appropriate label for the root node
        # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
        root_node <- unlist(strsplit(unlist(strsplit(list.files("sessiontmp/", pattern = ".*(N0).*"), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
        session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node))
      })
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
  }, ignoreNULL = TRUE)
  
  # Save the alignment
  output$saveAln <- downloadHandler(
    filename = "testname",
    content = function(file) {
      write(as.character(asrValues$defaultASR$loadedFiles$alignment$V1), file)
    }
  )
  
  # Change tree parameters for subtree based on user input
  #observeEvent(input$makeSubTree, {
  #  treeValues$node <- input$subTree
  #})
  
  # Change tree parameters for subtree back to full tree
  #observeEvent(input$showFullTree, {
  #  treeValues$node <- "N0"
  #})
  
  # Save the tree
  output$saveTree <- downloadHandler(
    filename = "testname",
    content = function(file) {
      write(as.character(asrValues$defaultASR$loadedFiles$tree$V1), file)
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
  }, ignoreNULL = TRUE)
  
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
    #if (!is.nan(input$defaultBtn) || input$defaultBtn > 0 || input$submitBtn > 0) {
      output$alnPlot <- renderPlot(plot_aln(asrValues$defaultASR, NULL, alnValues$type,alnValues$colour, alnValues$cols, alnValues$seqs),
          height = 4000, width = 4000)
    #}
  })
  
  # Update tree output
  observe({
    #if (!is.nan(input$defaultBtn) || input$defaultBtn > 0 || input$submitBtn > 0) {
      output$treePlot <- renderPlot(plot_subtree(asrValues$defaultASR, treeValues$node))
    #}
  })
  
  observe({
    req(input$marginalNode, fname$tree, fname$seqs, fname$out)
    print("marginal")
    treeValues$node <- input$marginalNode
    withProgress(message = paste('Performing marginal reconstruction at ',input$marginalNode,'...'), value = 0.1, {
      for (i in 1:55) {
        incProgress(1 / 55)
        Sys.sleep(0.05)
      }
      
      asrValues$marginal <- runASR(fname$tree, fname$seqs, inf = "Marginal", node = if (input$marginalNode == "root") {
                NULL
              } else {
                input$marginalNode
              }, output_file = fname$out)
    })
  })
  
  # update logo
  observe({
    req(asrValues$marginal)
    asrValues$json = createJSON(asrValues$marginal,input$letter_height, "Marginal")
    session$sendCustomMessage(type="updateJsonAttr", asrValues$json)
    session$sendCustomMessage(type="loadLogo", input$marginalNode)
  })
  
  output$marginalDist <- renderPlot(plot_distrib(asrValues$marginal, input$marginalNode, distValues$type, distValues$colour, distValues$cols, distValues$aas))
  
  # Update marginal distribution output
  observe({
    req(asrValues$marginal)
    output$marginalDist <- renderPlot(plot_distrib(asrValues$marginal, NULL, distValues$type, distValues$colour, distValues$cols, distValues$aas))
  })
  
  # Update logo output
  observe({
    req(input$marginalNode, asrValues$defaultASR)
    output$logoPlot <- renderPlot(plot_logo_aln(asrValues$defaultASR, NULL, logoValues$colour, logoValues$cols, logoValues$seqs))
  })
  
  # Allow the session to reconnect if disconnected (reloaded, etc. "force" for local changes, TRUE for server)
  session$allowReconnect("force") # True
  
  # delete temporary files created for analysis
  session$onSessionEnded(function() {unlink("sessiontmp", recursive = TRUE)})
  
}

shinyApp(ui = ui, server = server)
