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
    tags$script(src = "https://cdn.rawgit.com/exupero/saveSvgAsPng/gh-pages/saveSvgAsPng.js"),
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
        actionButton(inputId = "saveAll", label = "Download all output"),
        HTML("<div><form><label>View extant sequences<input type = 'checkbox' id = 'extants' checked/></form></div>"),
        tags$body(
          div(style = "width: 100%; overflow: auto; padding-top: 1em;",
            div(id = "alignmentdiv", style = "width: 100%; overflow: auto; border:1px solid #e3e3e3; margin-bottom: 1em; display:none; padding: 1em; ",
              div(dataTableOutput('alntable'), style = "font-size: 75%; width: 100%")),
            div(style = "clear: both;"),
            div(id="treediv", style = "width: 30%; height: 100%; overflow: auto; float: left; margin: 0; padding: 1em; border:1px solid #e3e3e3; background-color: #f9f9f9; display:none;", 
              HTML("<h5>Phylogenetic Tree</h5><svg id = 'tree_display'; class = 'output'; style = 'padding:0;margin:5px;'></svg><div><form><label>Radial layout<input type = 'checkbox' id = 'layout' unchecked/></form></div>")),
            div(id="pogdiv", style = "width: 70%; height: 100%; overflow: auto; float: right; display: none; padding: 1em;",
              HTML("<h5>Inferred Ancestral Sequence</h5>"),
              downloadButton(outputId = "savePOG", label = "Download Graph"),
              HTML("<div style = 'clear:both;' /><div id = 'graphsvg'><svg id = 'graphContainer'; class = 'output'; ></svg></div><div style = 'clear:both;' />"),
              HTML("<h5>Extant Sequence Alignment</h5><svg id = 'msagraphContainer'; class = 'output'; ></svg>"),
              div(id = "seq_logo", style = "display: none;",
                  selectInput(inputId = "letter_height", choices = c("Information content", "Score"),
                        selected = "Information content", label = "Letter Height"),
                  div(id = "logo", class = "logo", "data-logo" = "")))),
          div(style = "clear: both;")
        ),
        width = 12)
    )
  )

server <- function(input, output, session) {
  # Setup reactive values for asr output
  asrValues <- reactiveValues(defaultASR = NULL)
  fname <- reactiveValues(session = NULL, tree = NULL, seqs = NULL, out = NULL, runId = NULL)
  loaded <- reactiveValues(status = NULL)
  sessiontmp <- NULL
  
  # Perform joint reconstruction
  #observeEvent(input$submitBtn, {
  #  req(fname$tree, fname$seqs, fname$out, fname$runId)
  #  asrRun <- fname$runId
  #  return(asrRun);
  #})
  #    print("submit")
  #    withProgress(message = 'Reconstructing ancestors...', value = 0.1, {
  #      for (i in 1:55) {
  #        incProgress(1 / 55)
  #        Sys.sleep(0.05)
  #      }
  #      asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
  #    })
    
      # find the appropriate label for the root node
  #    # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
  #    root_node <- unlist(strsplit(unlist(strsplit(list.files("sessiontmp/", pattern = ".*(N0).*"), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
  #    session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node))
  #    output$ancestorText <- renderText({paste("The predicted sequence for the ancestor at the root node is", as.character(asrValues$defaultASR$fastaDF$Sequence[1]))})
  #})
  
  # load data to the temporary session folder
  observeEvent(input$submitBtn,{
    # Upload tree and sequence file to server, so we can pass it through to the ASR library
    fname$session <- paste(input$runId, format(Sys.time(), "%d-%m-%H%M%S"), sep="")
    sessiontmp <<- fname$session
    fname$out <- paste(fname$session, input$runId, sep="/")
    fname$tree <- paste(fname$out, input$tree[['name']], sep="")
    fname$seqs <- paste(fname$out, input$alignment[['name']], sep="")
    fname$runId <- input$runId
    print('Copying data to server...')
    dir.create(file.path(fname$session), showWarnings = FALSE)
    str <- readChar(input$tree[['datapath']], file.info(input$tree[['datapath']])$size)
    fc <- file(fname$tree)
    writeLines(str, fc)
    close(fc)
    str <- readChar(input$alignment[['datapath']], file.info(input$alignment[['datapath']])$size)
    fc <- file(fname$seqs)
    writeLines(str, fc)
    close(fc)
    loaded$status <- TRUE}, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  # Load default data
  observeEvent(input$defaultBtn,{
    fname$session <- paste("default", format(Sys.time(), "%d-%m-%H%M%S"), sep="")
    sessiontmp <<- fname$session
    fname$tree <- "default.nwk"
    fname$seqs <- "default.aln"
    fname$out <- paste(fname$session, "default", sep="/")
    fname$runId <- "default"
    dir.create(file.path(fname$session), showWarnings = FALSE)
    print("default")
    loaded$status <- TRUE}, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  observe({
    req(fname$seqs)
    output$alntable <- renderDataTable(read.table(fname$seqs, skip = 1, col.names = c("ID", "Sequence")), options = list(dom = 'ftp', pageLength=5, autoWidth = TRUE))#, columnDefs = list(list(width = '50%', targets = c(0, 1))), scrollX = TRUE))
  })
  
  observe({
    if (is.null(loaded$status)) return()
    
    print(paste('Loading',fname$runId,'...',sep=" "))
    
        withProgress(message = 'Loading data...', value = 0.1, {
          for (i in 1:55) {
            incProgress(1 / 55)
            Sys.sleep(0.05)
          }
          asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
      
        # find the appropriate label for the root node
        # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
        root_node <- unlist(strsplit(unlist(strsplit(list.files(paste(fname$session,"/", sep=""), pattern = ".*(N0).*"), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
        session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node, session = fname$session))
      })
    loaded$status <- NULL
  })
  
  # Set up the default values
  treeValues <- reactiveValues(node = "N0")
  logoValues <- reactiveValues(colour = "taylor", cols = NULL, seqs = NULL)
  
  # Save the alignment
#  output$saveAln <- downloadHandler(
#    filename = fname$out,
#    content = function(file) {
#      write(as.character(asrValues$defaultASR$loadedFiles$alignment$V1), file)
#    }
#  )
 
  # Downloads all files
  observeEvent(input$saveAll, {
    filenames <- paste(fname$session, list.files(paste(fname$session, "/", sep="")), sep="/")
    print(filenames)
    zip(fname$out, filenames)
    print(list.files(paste(fname$session, "/", sep="")))
   # filename = fname$out,
  #  content = function(file) {
   #   write(as.character(asrValues$defaultASR$loadedFiles$alignment$V1), file)
    #}
  }, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  # Save the tree
  output$saveTree <- downloadHandler(
    filename = fname$out,
    content = function(file) {
      write(as.character(asrValues$defaultASR$loadedFiles$tree$V1), file)
    }
  )
  
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
  
  # Update tree output
  #observe({
    #if (!is.nan(input$defaultBtn) || input$defaultBtn > 0 || input$submitBtn > 0) {
  #    output$treePlot <- renderPlot(plot_subtree(asrValues$defaultASR, treeValues$node))
    #}
  #})
  
  observeEvent(input$marginalNode, ({
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
  }))
  
  # update logo
  observeEvent(asrValues$marginal, ({
    req(asrValues$marginal, input$marginalNode)
    asrValues$json = createJSON(asrValues$marginal,input$letter_height, "Marginal")
    session$sendCustomMessage(type="updateJsonAttr", asrValues$json)
    session$sendCustomMessage(type="loadLogo", input$marginalNode)
  }))
  
  #output$marginalDist <- renderPlot(plot_distrib(asrValues$marginal, input$marginalNode, distValues$type, distValues$colour, distValues$cols, distValues$aas))
  
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
  session$onSessionEnded(function() {
    print("unlinking tmp folder...")
    print(sessiontmp)
    unlink(sessiontmp, recursive = TRUE)})
  
}

shinyApp(ui = ui, server = server)
