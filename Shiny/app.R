library(shiny)
library(ASR)
library(ape)
library(ggplot2)
source("json_map.R")
source("plotLogo.R")

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
        tags$body(
          div(id = "optionsdiv", style = "width: 100%; display: none;",
            downloadButton(outputId = "saveAll", label = "Download all output"),
            downloadButton(outputId = "saveAln", label = "Download alignment"),
            HTML("<div><form><label>View extant sequences<input type = 'checkbox' id = 'extants' checked/></form></div>")),
          div(style = "width: 100%; overflow: auto; padding-top: 1em;",
            div(id = "alignmentdiv", style = "width: 100%; overflow: auto; border:1px solid #e3e3e3; margin-bottom: 1em; display:none; padding: 1em; ",
              div(dataTableOutput('alntable'), style = "font-size: 75%; width: 100%")),
            div(style = "clear: both;"),
            div(id="treediv", style = "width: 30%; height: 100%; overflow: auto; float: left; margin: 0; padding: 1em; border:1px solid #e3e3e3; background-color: #f9f9f9; display:none;", 
              HTML("<h5>Phylogenetic Tree</h5><svg id = 'tree_display'; class = 'output'; style = 'padding:0;margin:5px;'></svg><div><form><label>Radial layout<input type = 'checkbox' id = 'layout' unchecked/></form></div>")),
            div(style = "width:70%; height: 100%; float: right; padding: 1em;",
            div(id="pogdiv", style = "width: 100%; height: 100%; overflow: auto; display: none;",
              HTML("<h5>Inferred Ancestral Sequence</h5>"),
              downloadButton(outputId = "savePOG", label = "Download Graph"),
              HTML("<div style = 'clear:both;'></div><div id = 'graphsvg'><svg id = 'graphContainer'; class = 'output'; ></svg></div><div style = 'clear:both;'></div>"),
              HTML("<h5>Extant Sequence Alignment</h5><svg id = 'msagraphContainer'; class = 'output'; ></svg>")),
            div(id = "seq_logo", style = "width: 100%; display: none;",
              HTML("<h5>Logo of Inferred Ancestral Sequence</h5>"),
              downloadButton(outputId = "saveLogo", label = "Download Sequence Logo"),
              plotOutput(outputId = "logoPlot"))),
          div(style = "clear: both;"))
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
  
  # load data to the temporary session folder
  observeEvent(input$submitBtn,{
    # Upload tree and sequence file to server, so we can pass it through to the ASR library
    if (is.null(sessiontmp)) {
      fname$session <- paste(format(Sys.time(), "%d%m%H%M%S%u"), sep="")
      sessiontmp <<- fname$session
      dir.create(file.path(fname$session), showWarnings = FALSE)
    }
    fname$out <- paste(fname$session, input$runId, sep="/")
    fname$tree <- paste(fname$out, input$tree[['name']], sep="")
    fname$seqs <- paste(fname$out, input$alignment[['name']], sep="")
    fname$runId <- input$runId
    print('Copying data to server...')
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
    if (is.null(sessiontmp)) {
      fname$session <- paste(format(Sys.time(), "%d%m%H%M%S%u"), sep="")
      sessiontmp <<- fname$session
      dir.create(file.path(fname$session), showWarnings = FALSE)
    }
    fname$tree <- "default.nwk"
    fname$seqs <- "default.aln"
    fname$out <- paste(fname$session, "default", sep="/")
    fname$runId <- "default"
    print("default")
    loaded$status <- TRUE}, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  observe({
    req(fname$seqs)
    output$alntable <- renderDataTable(read.table(fname$seqs, skip = 1, col.names = c("ID", "Sequence")), options = list(dom = 'ftp', pageLength=5, autoWidth = TRUE))#, columnDefs = list(list(width = '50%', targets = c(0, 1))), scrollX = TRUE))
  })
  
  observe({
    if (is.null(loaded$status)) return()
    session$sendCustomMessage(type ='divvisibility',message = list(show = FALSE, session = fname$session))
    
    print(paste('Loading',fname$runId,'...',sep=" "))
    
        withProgress(message = 'Loading data...', value = 0.1, {
          for (i in 1:55) {
            incProgress(1 / 55)
            Sys.sleep(0.05)
          }
          asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
      
        # find the appropriate label for the root node
        # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
        root_node <- unlist(strsplit(unlist(strsplit(list.files(paste(fname$session,"/", sep=""), pattern = paste(fname$runId,".*(N0).*.(dot)", sep="")), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
        session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node, session = fname$session))
      })
    
    # save all dot files as png files
    for (pog in list.files(paste(fname$session, "/", sep=""), patter = "*.dot")) {
      system(paste("dot -Tpng", paste(paste(fname$session, "/", sep=""), pog, sep=""), "-o", paste(paste(fname$session, "/", sep=""), unlist(strsplit(pog, "[.]"))[1], ".png", sep=""), sep=" "), wait = FALSE)
    }
        
    session$sendCustomMessage(type ='divvisibility',message = list(show = TRUE, session = fname$session))   
    loaded$status <- NULL
  })
  
  # Set up the default values
  treeValues <- reactiveValues(node = "N0")
  logoValues <- reactiveValues(colour = "clustal", cols = NULL, seqs = NULL)
  
  # Downloads all files
  output$saveAll <- downloadHandler(
    filename = function() {
      paste(fname$runId, "zip", sep=".")
    },
    content = function(file) {
      tmp <- paste("ASR_", format(Sys.time(), "%d%m-%H%M-%u"), sep="")
      dir.create(file.path(tmp), showWarnings = FALSE)
      system(paste("cp -r", paste(fname$session, "/", sep=""), paste(tmp, "/", sep=""), sep=" "))
      filenames <- paste(tmp, list.files(paste(tmp, "/", sep="")), sep="/")
      zip(file, filenames)
      unlink(tmp, recursive = TRUE)
    },
    contentType = "application/zip"
  )
  
  # Save sequence logo
  output$saveLogo <- downloadHandler(
    filename = function() {
      paste(fname$runId, input$marginalNode, "_logo.png", sep="")
    },
    content = function(file) {
      file.copy(paste(paste(fname$session, "/", sep=""), fname$runId, input$marginalNode, "_logo.png", sep=""), file)
    },
    contentType = 'image/png'
  )
  
  # Save ancestral partial order graph
  output$savePOG <- downloadHandler(
    filename = function() {
      paste(fname$runId, input$selectedNodeLabel, ".png", sep="")
    },
    content = function(file) {
      file.copy(paste(paste(fname$session, "/", sep=""), fname$runId, input$selectedNodeLabel, ".png", sep=""), file)
    },
    contentType = 'image/png'
  )
  
  # Save alignment partial order graph
  output$saveAln <- downloadHandler(
    filename = function() {
      paste(fname$runId, "MSA.png", sep="")
    },
    content = function(file) {
      file.copy(paste(paste(fname$session, "/", sep=""), fname$runId, "MSA.png", sep=""), file)
    },
    contentType = 'image/png'
  )
  
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
    session$sendCustomMessage(type="loadPOGraph", message=list(node=input$marginalNode, label=fname$runId))
  }))
  
  # Update logo output
  observe({
    req(input$marginalNode, asrValues$defaultASR)
    withProgress(message = paste('Loading sequence logo for ',input$marginalNode,'...'), value = 0.1, {
      for (i in 1:20) {
        incProgress(1 / 20)
        Sys.sleep(0.03)
      }
      output$logoPlot <- renderPlot(plotLogo(paste(sessiontmp, "/", fname$runId, "_distribution.txt", sep="")))
      ggsave(paste(sessiontmp, "/",fname$runId, input$marginalNode, "_logo.png", sep=""), plotLogo(paste(sessiontmp, "/", fname$runId, "_distribution.txt", sep="")))
    })
  })
  
  # Allow the session to reconnect if disconnected (reloaded, etc. "force" for local changes, TRUE for server)
  session$allowReconnect("force") # True
  
  # delete temporary files created for analysis
  session$onSessionEnded(function() {
    unlink(sessiontmp, recursive = TRUE)})
  
}

shinyApp(ui = ui, server = server)
