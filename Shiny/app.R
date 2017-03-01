library(shiny)
library(shinyBS)
library(ASR)
library(ape)
library(ggplot2)
library(shinyjs)
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
    #tags$link(rel = "stylesheet", type = "text/css", href = "hmm_logo.min.css"),
    #tags$script(src = "https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"),
    tags$script(src = "shinyasr.js")
  ),
  useShinyjs(),
  titlePanel("bnkit: Ancestral Sequence Reconstruction"),
  
  sidebarLayout(sidebarPanel(
      actionButton(inputId = "defaultBtn", label = "Load Default Data"),
      actionButton(inputId = "helpBtn", label = "? Help"), 
      tags$br(),
      tags$br(),
      textInput(inputId = "runId", label = "Label your run", width = "880px"),
      div(style = "float:left; width: 325px; height: 60px;", fileInput(inputId = "tree", label = "Select your Newick file:", width = "95%")),
      div(style = "float:left; width: 325px; height: 60px;", fileInput(inputId = "alignment", label = "Select your alignment file:", width = "95%")),
      div(style = "float:left; width: 230px; height: 60px; margin-top: 25px;", actionButton(inputId = "submitBtn", label = "Reconstruct Ancestors", width = "100%")),
      tags$br(),tags$br(),
      bsModal("modalnew", "Help", "helpBtn", size = "large",
              HTML("<h3>Default data</h3>
                    <p>A joint reconstruction is performed on a toy dataset when the 'Load Default Data' button is pressed. The toy datasat has 6 
                        sequences with 6 characters. The phylogenetic tree, multiple sequence alignment as a partial order graph and the inferred root node
                        will be initially shown. Clicking on any of the tree nodes will display other reconstruction options.</p>
                    <h3>Uploading data for reconstruction</h3>
                    <p>Upload a newick tree structure representing your phylogenetic tree, and a file of aligned sequences. The files will be 
                        uploaded automatically once selected.</p>
                    <h4>Phylogenetic Tree</h4>
                    <p>The tree structure must be in newick format.</p>
                    <h4>Sequence Data</h4>
                    <p><b>Note: Sequences must already be aligned.</b> The reconstruction will not be performed unless a sequence file is provided where 
                       all sequences have the same length (i.e. have the gap character where appropriate). <br><br>
                      Alignment files can be in either CLUSTAL or FASTA format.
                    </p>
                    <h3>Performing the reconstruction</h3>
                    <p>Submitting a tree file and the aligned sequences will perform a joint reconstruction. Initially, the inferred ancestral root
                        node will be shown. Marginal reconstruction can be performed from a menu that appears when selecting a tree node. this
                        will also provide a sequence logo representing the marginal distribution for that node.</p>
                   ")),
      div(style = "clear: both;"),
      width = 12),
  mainPanel(
        bsAlert("alert"),
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
            div(style = "width:70%; height: 100%; float: right; padding: 1em; overflow: auto;",
            div(id="pogdiv", style = "width: 100%; display: none;",
              HTML("<h5>Inferred Ancestral Sequence</h5>"),
              downloadButton(outputId = "savePOG", label = "Download Graph"),
              HTML("<div style='padding:10px;'></div>"),
              textOutput(outputId = "inferredSeq"),
              HTML("<div style = 'clear:both;'></div><div id = 'graphsvg'><svg id = 'graphContainer'; class = 'output'; ></svg></div><div style = 'clear:both;'></div>"),
              HTML("<h5>Extant Sequence Alignment</h5><svg id = 'msagraphContainer'; class = 'output'; ></svg><div style = 'clear:both;'></div>")),
            div(id = "seq_logo", style = "display: none;",
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
  node <- reactiveValues(selected = NULL)
  sessiontmp <- NULL
  
  # load data to the temporary session folder
  observeEvent(input$submitBtn,{
    if (is.null(input$runId) || input$runId == "") {
      createAlert(session, "alert", "", title = "Error", content = "Must specify a run ID.", append = FALSE)
      return()
    }
    if (tolower(unlist(strsplit(input$tree[['name']], "[.]"))[2]) != "nwk") {
      createAlert(session, "alert", "", title = "Error", content = "Tree file must be .nwk.", append = FALSE)
      return()
    }
    if (!any(tolower(unlist(strsplit(input$alignment[['name']], "[.]"))[2]) == c("aln", "fa", "fasta"))) {
      createAlert(session, "alert", "", title = "Error", content = "Alignment file must be .aln, .fa or .fasta.", append = FALSE)
      return()
    }
    if (is.null(input$tree)) {
      createAlert(session, "alert", "", title = "Error", content = "Must select the filepath of a phylogenetic tree structure.", append = FALSE)
      return()
    }
    if (is.null(input$alignment)) {
      createAlert(session, "alert", "", title = "Error", content = "Must select the filepath of a sequence alignment (clustal or fasta).", append = FALSE)
      return()
    }
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
    loaded$status <- TRUE}, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  # check that tree file is the correct type
  observeEvent(input$tree, {
    if (tolower(unlist(strsplit(input$tree[['name']], "[.]"))[2]) != "nwk") {
      createAlert(session, "alert", "", title = "Error", content = "Tree file must be .nwk.", append = FALSE)
    }
  })
  
  # check that the alignment file is the correct type
  observeEvent(input$seqs, {
    if (!any(tolower(unlist(strsplit(input$seqs[['name']], "[.]"))[2]) == c("aln", "fa", "fasta"))) {
      createAlert(session, "alert", "", title = "Error", content = "Alignment file must be .aln, .fa or .fasta.", append = FALSE)
    }
  })
  
  # show the input sequences in a datatable
  observe({
    req(fname$seqs)
    output$alntable <- renderDataTable(data(), options = list(dom = 'ftp', pageLength=5, autoWidth = TRUE))#, columnDefs = list(list(width = '50%', targets = c(0, 1))), scrollX = TRUE))
  })
  
  # Format the sequences: sequences will need to be combined in the clustal format, sequences will need to be read in separately in the fasta format
  data <- reactive({
    # check if clustal, if so, will need to concatenate sections of the sequence
    f <- file(fname$seqs,"r")
    type <- readLines(f,n=1)
    close(f)
    if (grepl("clustal", tolower(type))) {
      # Clustal format
      datatable <- read.table(fname$seqs, skip = 1, col.names = c("ID", "Sequence"), stringsAsFactors=FALSE)
      # search through datatable and concatenate sequence segments
      repstart = which(datatable$ID == datatable[1,1])[2]
      if (!is.na(repstart)) {
        for (entry in 1:(repstart-1)) {
          nextEntries = which(datatable$ID == datatable[entry,1])[-1]
          for (nextEntry in nextEntries) {
            datatable[entry,]$Sequence = paste(datatable[entry,2], datatable[nextEntry,2], sep="")
          }
          datatable = datatable[-nextEntries,]
        }
      }
    } else {
      # Fasta format
      datatable <- data.frame(ID = "", Sequence = "", stringsAsFactors=FALSE)
      f <- file(fname$seqs,"r")
      seq = 0
      while (TRUE) {
        line <- readLines(f, n=1)
        if (length(line) == 0) {
          break;
        }
        if (substring(line,1,1) == ">") {
          seq = seq + 1
          datatable[seq,]$ID = gsub(" ", "", substring(line,2))
          datatable[seq,]$Sequence = ""
        } else {
          datatable[seq,]$Sequence = paste(datatable[seq,]$Sequence, line, sep="")
        }
      }
      close(f)
    }
    # pop up error message if sequences aren't aligned
    err = checkSeqLen(datatable)
    if (!is.null(err)) {
      createAlert(session, "alert", "", title = "Error", content = err, append = FALSE)
    }
    validate(err)
    # pop up error if there is an invalid character
    err = checkChar(datatable)
    if (!is.null(err)) {
      createAlert(session, "alert", "", title = "Error", content = err, append = FALSE)
    }
    validate(err)
    # pop up error if the tree file and sequence file do not have the same identifiers
    err = checkLabels(datatable)
    if (!is.null(err)) {
      createAlert(session, "alert", "", title = "Error", content = err, append = FALSE)
    }
    validate(err)
    datatable
  })
  
  # Perform error checking on the sequence lengths: sequences (at the moment) must be pre-aligned
  checkSeqLen <- function(datatable){
    # check that all sequences are aligned (The same length) (currently ASR does not perform the alignment)
    seqlen = nchar(datatable[1,2])
    serr = NULL
    for (seq in datatable$Sequence) {
      if (nchar(seq) != seqlen) {
        # inform user and exit loading
        serr = 'Inconsistent sequence length: sequences must be aligned.'
        if (fname$seqs != "default.aln") {
          unlink(fname$seqs)
        }
        reset("alignment")
        fname$seqs <- NULL
        loaded$status <- NULL
      }
    }
    serr
  }
  
  # Perform error checking on alphabet characters for the sequences
  checkChar <- function(datatable) {
    alphabet <- c("A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y", "-")
    serr = NULL
    for (seq in datatable$Sequence) {
      if (grep(paste("[",paste(alphabet, sep="", collapse=""),"]+",sep=""), seq, ignore.case=TRUE) == 0) {
        serr = paste('Invalid character in sequence', seq, sep=" ")
        if (fname$seqs != "default.aln") {
          unlink(fname$seqs)
        }
        reset("alignment")
        fname$seqs <- NULL
        loaded$status <- NULL
      }
    }
    serr
  }
  
  # Perform error checking on tree/sequence labels (must exist in both)
  checkLabels <- function(datatable) {
    # read in tree structure and extract all labels
    f <- file(fname$tree,"r")
    treestring <- readLines(f)
    close(f)
    parsed = matrix(unlist(strsplit(treestring, "[(,]")))
    parsed = parsed[parsed != ""] # remove empty elements
    for (row in 1:length(parsed)) {
      parsed[row] = unlist(strsplit(parsed[row], "[:]"))[1]
    }
    treeseqs = as.data.frame(parsed)
    # check if any sequences in the newick file don't appear in the sequence file
    treeind = 1
    uniquetree <- list()
    for (seq in treeseqs$parsed) {
      if (!any(datatable$ID == seq)) {
        uniquetree[[treeind]] = seq
        treeind = treeind + 1
      }
    }
    # check if any sequences in the sequence file don't appear in the newick file
    seqind = 1
    uniqueseqs <- list()
    for (seq in datatable$ID) {
      if (!any(treeseqs$parsed == seq)) {
        uniqueseqs[[seqind]] = seq
        seqind = seqind + 1
      }
    }
    serr = NULL
    if (length(uniqueseqs) > 0 || length(uniquetree) > 0) {
      serr = ""
      if (length(uniqueseqs) > 0) {
        serr = paste(serr, "Must have the same sequence identifiers in tree and alignment files. Sequence identifiers found in alignment file, but not tree file:", toString(unlist(uniqueseqs)), sep=" ")
        if (fname$seqs != "default.aln") {
          unlink(fname$seqs)
        }
        reset("alignment")
        fname$seqs <- NULL
        loaded$status <- NULL
      }
      if (length(uniquetree) > 0) {
        serr = paste(serr, "Must have the same sequence identifiers in tree and alignment files. Sequence identifiers found in tree file, but not alignment file:", toString(unlist(uniquetree)), sep=" ")
        if (fname$tree != "default.nwk") {
          unlink(fname$tree)
        }
        reset("tree")
        fname$tree <- NULL
        loaded$status <- NULL
      }
    }
    serr
  }
    
  # Perform joint reconstruction on the input sequences/tree
  observe({
    if (is.null(loaded$status)) return()
    session$sendCustomMessage(type ='divvisibility',message = list(show = FALSE, session = fname$session))
    
    print(paste('Loading',fname$runId,'...',sep=" "))
    
        withProgress(message = 'Loading data...', value = 0.1, {
          for (i in 1:55) {
            incProgress(1 / 55)
            Sys.sleep(0.05)
          }
          data() # keep for dependancy on sequence input
          
          asrValues$defaultASR <- runASR(fname$tree, fname$seqs, inf = "Joint", output_file = fname$out)
          # find the appropriate label for the root node
          # (javascript sets the label to 'root', which doesn't match the PO Graph saved files, root node has N0 in the name)
          root_node <- unlist(strsplit(unlist(strsplit(list.files(paste(fname$session,"/", sep=""), pattern = paste(fname$runId,".*(N0).*.(dot)", sep="")), fname$runId, fixed = TRUE)), ".dot", fixed = TRUE))
          session$sendCustomMessage(type = 'message',message = list(a = asrValues$defaultASR$loadedFiles$tree$V1, b = fname$runId,  alignment = asrValues$defaultASR$loadedFiles$alignment$v1, root = root_node, session = fname$session))
          print(asrValues$defaultASR$loadedFiles$tree$V1)
    })
    
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
      system(paste("dot -Tpng", paste(paste(fname$session, "/", sep=""), fname$runId, input$selectedNodeLabel, ".dot", sep=""), "-o", paste(paste(fname$session, "/", sep=""), fname$runId, input$selectedNodeLabel, ".png", sep=""), sep=" "))
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
      system(paste("dot -Tpng", paste(paste(fname$session, "/", sep=""), fname$runId, "MSA.dot", sep=""), "-o", paste(paste(fname$session, "/", sep=""), fname$runId, "MSA.png", sep=""), sep=" "))
      file.copy(paste(paste(fname$session, "/", sep=""), fname$runId, "MSA.png", sep=""), file)
    },
    contentType = 'image/png'
  )
  
  # perform marginal reconstruction of marginalNode (selected via the javascript tree)
  observeEvent(input$marginalNode, ({
    req(input$marginalNode, fname$tree, fname$seqs, fname$out)
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
      
      # load the inferred sequence
      f <- file(paste(sessiontmp, "/", fname$runId, "_recon.fa", sep=""),"r")
      readLines(f, n=1)
      seq = ""
      while (TRUE) {
        line = readLines(f, n=1)
        if (length(line) == 0) {
          break;
        }
        seq = paste(seq, line, sep="")
      }
      close(f)
      output$inferredSeq <- renderText(paste("Inferred consensus sequence for ", input$marginalNode, ": ", seq, sep=""))
    })
    session$sendCustomMessage(type="loadPOGraph", message=list(node=input$marginalNode, label=fname$runId))
  }))
  
  observeEvent(input$inferredSeq, {
    paste(input$inferredSeq)
    output$inferredSeq <- renderText(input$inferredSeq)
  })
  
  # Update logo output
  observeEvent(input$marginalNode, {
    req(asrValues$defaultASR)
    withProgress(message = paste('Loading sequence logo for ',input$marginalNode,'...'), value = 0.1, {
      for (i in 1:20) {
        incProgress(1 / 20)
        Sys.sleep(0.03)
      }
      output$logoPlot <- renderPlot({plotLogo(paste(sessiontmp, "/", fname$runId, "_distribution.txt", sep=""))})
      numnodes = length(list.files(paste(fname$session, "/", sep=""), pattern = "*.dot"))
      # max of 50in
      if (numnodes+0.2*numnodes > 40) {
        numnodes = 40
      } else {
        numnodes = numnodes+0.2*numnodes
      }
      ggsave(paste(sessiontmp, "/",fname$runId, input$marginalNode, "_logo.png", sep=""), plotLogo(paste(sessiontmp, "/", fname$runId, "_distribution.txt", sep="")), width=numnodes, height=6)
    })
  }, ignoreNULL = TRUE, ignoreInit = TRUE)
  
  # Allow the session to reconnect if disconnected (reloaded, etc. "force" for local changes, TRUE for server)
  session$allowReconnect(TRUE)
  
  # delete temporary files created for analysis
  session$onSessionEnded(function() {
    unlink(sessiontmp, recursive = TRUE)})
  
}

shinyApp(ui = ui, server = server)
