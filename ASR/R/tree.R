#'Tree plotting function
#'
#'Creates a plot of a tree stored as a Newick string
#'
#'@param asrStructure the named list returned by \code{\link{runASR}} or \code{\link{loadASR}}. Set this to NULL
#'to specify other variables
#'@param tree_file output file from ASR.jar containing a Newick string
#'
#'@return plots a figure containing the tree of interest
#'
#'@examples
#'data(asrStructure)
#'
#'plot_tree(asrStructure)
#'
#'#retrieve example file stored in the package
#'new_tree <- system.file("extdata", "runASR_new_tree.txt", package="ASR")
#' #alternatively, specify the filename as a string
#' #new_tree <- "id_new_tree.txt"
#' 
#'plot_tree(NULL, tree_file = new_tree) # if you want to use a specific tree file
#'
#'@export

plot_tree <- function(asrStructure, tree_file=NULL) {
  
  if (!is.null(asrStructure)) {
    if (typeof(asrStructure) != "list") {
      stop(paste("The input for asrStructure: ", asrStructure, ", is not a list therefore not a valid input", sep = ""))
    }
    newickTree = asrStructure$loadedFiles$tree
    if (is.null(newickTree)) {
      stop("asrStructure does not contain required tree file information")
    }
  } else {
    if(is.null(tree_file)) {
      stop("You have not provided an asrStructure or specified tree_file")
    } else if (!file.exists(tree_file)) {
      stop(paste(tree_file, " does not exist"))
    } else {
      newickTree = as.data.frame(read.table(tree_file, header = FALSE, sep = "\n"))
      ##CHECK THIS IS VALID##
    }
  }
  
  tree = ape::read.tree(file = NULL, text = as.character(newickTree[1,]))
  plot(tree, show.node.label=TRUE)
  ape::add.scale.bar(0, 0.5)
}

#' Tree saving function
#' 
#' Creates a plot of a tree stored as a Newick string and saves it as an
#' image using the name of the tree_file argument
#' 
#' @param asrStructure the named list returned by \code{\link{runASR}} or \code{\link{loadASR}}. Set this to NULL
#'to specify other variables
#' @param tree_file output file from ASR>jar containing a Newick string
#' @param format specifies format to save figure in. Options: "pdf" or "png"
#' @param name what name would you like the figure saved under?
#' 
#' @examples
#'data(asrStructure)
#'
#' save_tree(asrStructure)
#' save_tree(asrStructure, format="png")
#' 
#' # if you want to use a specific tree file
#'#retrieve example file stored in the package
#'new_tree <- system.file("extdata", "runASR_new_tree.txt", package="ASR")
#' #alternatively, specify the filename as a string
#' #new_tree <- "id_new_tree.txt"
#' 
#'save_tree(NULL, tree_file = new_tree) # if you want to use a specific tree file
#' 
#' save_tree(asrStructure, format = "png", name = "new_name")
#' 
#' @export

save_tree <- function(asrStructure, tree_file=NULL, format = "pdf", name = NULL) {
  
  if (!is.null(asrStructure)) {
    if (typeof(asrStructure) != "list") {
      stop(paste("The input for asrStructure: ", asrStructure, ", is not a list therefore not a valid input", sep = ""))
    }
    newickTree = asrStructure$loadedFiles$tree
    if (is.null(newickTree)) {
      stop("asrStructure does not contain required tree file information")
    }
  } else {
    if(is.null(tree_file)) {
      stop("You have not provided an asrStructure or specified tree_file")
    } else if (!file.exists(tree_file)) {
      stop(paste(tree_file, " does not exist"))
    } else {
      newickTree = as.data.frame(read.table(tree_file, header = FALSE, sep = "\n"))
      ##CHECK THIS IS VALID##
    }
  }
  
  if (is.null(name)) {
    if (is.null(asrStructure)) {
      name = tree_file
    } else {
      name = asrStructure$fileNames$Tree
    }
  }
  
  tree = ape::read.tree(file = NULL, text = as.character(newickTree[1,]))
  if (format == "pdf") {
    pdf(paste(name, "_plot.", format, sep=""), width=20, height=20)
    t <- plot(tree, show.node.label=TRUE)
    ape::add.scale.bar(0, 0.5)
    dev.off()
    return(paste("Plot saved as:", name, "_plot.", format, sep=""))
  } else if (format == "png") {
    png(paste(name, "_plot.", format, sep=""), width=2000, height=2000)
    t <- plot(tree, show.node.label=TRUE)
    ape::add.scale.bar(0, 0.5)
    dev.off()
    return(paste("Plot saved as:", name, "_plot.", format, sep=""))
  } else {
    stop("Invalid format for save_tree")
  }
}


# #'Tree plotting function
# #'
# #'Creates a plot of a tree stored as a Newick string
# #'
# #'@param asrStructure the named list returned by \code{\link{runASR}} or \code{\link{loadASR}}. Set this to NULL
# #'to specify other variables
# #'@param tree_file output file from ASR.jar containing a Newick string
# #'
# #'@return 
# #'
# #'@examples
# #'
# #'@export
# 
# plot_modified_tree <- function(asrStructure, tree_file=NULL) {
#   
#   if (!is.null(asrStructure)) {
#     if (typeof(asrStructure) != "list") {
#       stop(paste("The input for asrStructure: ", asrStructure, ", is not a list therefore not a valid input", sep = ""))
#     }
#     newickTree = asrStructure$loadedFiles$tree
#     if (is.null(newickTree)) {
#       stop("asrStructure does not contain required tree file information")
#     }
#   } else {
#     if(is.null(tree_file)) {
#       stop("You have not provided an asrStructure or specified tree_file")
#     } else if (!file.exists(tree_file)) {
#       stop(paste(tree_file, " does not exist"))
#     } else {
#       newickTree = as.data.frame(read.table(tree_file, header = FALSE, sep = "\n"))
#       ##CHECK THIS IS VALID##
#     }
#   }
#   
#   newickTree <- aneh$loadedFiles$tree
#   tree = ape::read.tree(file = NULL, text = as.character(newickTree[1,]))
#  
#   input <- as.data.frame(read.table("temp_figtree_annotations.txt", header = T, sep = "\t"))
#   colRange <- rainbow(dim(input)[[1]]/2)
#   input$Colour <- colRange[as.numeric(cut(input$Prediction, breaks = dim(input)[[1]]/2))]
#   node_order <- c(tree$tip, tree$node)[tree$edge[,2]]
#   cols <- rep(0, length(node_order))
#   for (i in seq(1, length(node_order), 1)){
#     cols[i] = input[input$Name == node_order[i], ]$Colour    
#   }
#   
#   plot.phylo(tree, edge.col = cols)
#   
#   
#   newickTree = asrStructure$loadedFiles$tree
#   tree = ape::read.tree(file = NULL, text = as.character(newickTree[1,]))
#   node_order <- c(tree$tip, tree$node)[tree$edge[,2]]
#   col <- c(N1="red", N2="black", N3="yellow", N4="magenta", extant_1="blue", extant_2="green", extant_3="purple", extant_4="grey", extant_5="salmon", extant_6="chocolate", N0="skyblue")
#   colours <- stack(col)
#   colnames(colours) <- c("Colour", "Name")
#   cols <- rep(0, length(node_order))
#   for (i in seq(1, length(node_order), 1)){
#     cols[i] = colours[colours$Name == node_order[i], ]$Colour    
#   }
#   plot.phylo(tree, edge.col = cols)
#   
#   col <- c(N1="red", N2="black", N3="yellow", N4="magenta", extant_1="blue", extant_2="green", extant_3="purple", extant_4="grey", extant_5="salmon", extant_6="chocolate", N0="skyblue")
#   selColors <- col[match(n, names(col), nomatch=1)]
#   plot.phylo(tree, edge.col=selColors)
# }

#'Tree plotting function
#'
#'Creates a plot of a tree stored as a Newick string and labels extant and internal nodes according to their sequence in 
#'a specified column. AAs can also be coloured using available schemes
#'
#'@param asrStructure the named list returned by \code{\link{runASR}} or \code{\link{loadASR}}. Set this to NULL
#'to specify other variables
#'@param column the column that you wish to see sequences for
#'@param type the way the sequence should be displayed. Options: "text", "shape", "both"
#'@param colour the colour scheme selected, default "black", options: "clustal", "zappo", "taylor". Also an option to provide
#'a user specified colour e.g. colour="red" or colour="#FF0000"
#'
#'@examples
#'plot_tree_seq(asrStructure, 3)
#'plot_tree_seq(asrStructure, 3, type="both", colour="clustal")
#'plot_tree_seq(asrStructure, 3, type="shape", colour="clustal")
#'
#'
#'@export

plot_tree_seq <- function(asrStructure, column, type = "text", colour="black") {
  
  if (!is.null(asrStructure)) {
    if (typeof(asrStructure) != "list") {
      stop(paste("The input for asrStructure: ", asrStructure, ", is not a list therefore not a valid input", sep = ""))
    }
    newickTree = asrStructure$loadedFiles$tree
    if (is.null(newickTree)) {
      stop("asrStructure does not contain required tree file information")
    }
    seqDF = asrStructure$seqDF
    if (is.null(seqDF)) {
      stop("asrStructure does not contain required sequence information")
    }
    if (is.data.frame(seqDF)) {
      cols <- colnames(seqDF)
      if (!("Column" %in% cols && "AA" %in% cols && "Label" %in% cols)) {
        stop("The dataframe provided as asrStructure$seqDF is not correctly formatted. See get_seq_df()")
      }
    } else {
      stop(paste("The input for asrStructure$seqDF is not a dataframe and therefore not a valid input. Input: ", seqDF, sep = ""))
    }
  } else {
    stop("This function requires the provision of asrStructure, it cannot function without it")
  }
  
  newickTree = asrStructure$loadedFiles$tree
  tree = ape::read.tree(file = NULL, text = as.character(newickTree[1,]))
  
  tip_labels <- rep(0, length(tree$tip))
  for (i in seq(1, length(tree$tip), 1)){
    sequence = seqDF[seqDF$Label == tree$tip[i], ]
    colSpec = sequence[sequence$Column == column, ]$AA
    tip_labels[i] = as.character(colSpec)    
  }
  node_labels <- rep(0, length(tree$node))
  for (i in seq(1, length(tree$node), 1)){
    sequence = seqDF[seqDF$Label == tree$node[i], ]
    colSpec = sequence[sequence$Column == column, ]$AA
    node_labels[i] = as.character(colSpec)    
  }
  node_order <- c(tree$tip, tree$node)[tree$edge[,2]]
  new_node <- rep(0, length(node_order))
  for (i in seq(1, length(node_order), 1)){
    sequence = seqDF[seqDF$Label == node_order[i], ]
    colSpec = sequence[sequence$Column == column, ]$AA
    new_node[i] = as.character(colSpec)    
  }
  if (colour == "clustal") {
    tipColour = colours_clustal(tip_labels)
    nodeColour = colours_clustal(node_labels)
  } else if (colour == "zappo") {
    tipColour = colours_zappo(tip_labels)
    nodeColour = colours_zappo(node_labels)
  } else if (colour == "taylor") {
    tipColour = colours_taylor(tip_labels)
    nodeColour = colours_taylor(node_labels)
  } else if (colour == "black") {
    nodeColour = "black"
    tipColour = "black"
  } else if (!is.null(colour)) {
    nodeColour = colour
    tipColour = colour
  } else {
    stop("Invalid colour choice for plot_aln()")
  }
  
  if (type == "text") {
    ape::plot.phylo(tree, show.tip.label=F)
    ape::nodelabels(node_labels, frame="none",col=nodeColour,adj=c(-0.8))
    ape::tiplabels(tip_labels, frame="none",col=tipColour,adj=c(-0.8))
  } else if (type == "shape") {
    ape::plot.phylo(tree, show.tip.label=F)
    ape::nodelabels(node_labels, frame="circle",col=nodeColour,bg=nodeColour)
    ape::tiplabels(tip_labels, frame="circle",col=tipColour,bg=tipColour)
  } else if (type == "both") {
    ape::plot.phylo(tree, show.tip.label=F)
    ape::nodelabels(node_labels, frame="circle",col=nodeColour,bg="ivory")
    ape::tiplabels(tip_labels, frame="circle",col=tipColour,bg="ivory")
  }
}
