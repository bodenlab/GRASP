#' Run ASRPOG.jar
#' 
#' A wrapper to launch ASRPOG.jar generating all appropriate files according to input. \cr
#' GENERATE SEQUENCE - requires use of Joint inference - returns a tree and alignment file \cr
#' GENERATE DISTRIBUTION - requires use of Marginal inference - returns a tree and distribution file \cr 
#' These two tasks MUST be run SEPARATELY \cr
#' 
#' @param tree_file a newick string representation of the tree of interest
#' @param aln_file a clustal or fasta formatted multiple sequence alignment
#' @param output_file name of the output files, default = "asr"
#' @param inf the inference approach to be selected: "Joint" or "Marginal"
#' @param node the node to be queried in inf = "Marginal
#' @param plot specifies whether or not to save the plots generated when calling this function
#' @param gap_inf specifies whether to use maximum parsimony or maximum likelihood for gap inference
#' @param align specified whether to perform an alignment before the reconstruction, otherwise expects an aligned input file of sequences
#' 
#' @return asrStructure - a named list containing all data structures and files required to run all other functions in package.\cr
#' **output will vary depending on input (see description)**\cr
#' If plot = TRUE, figures associated with generated output (see description) will be generated.\cr
#' All functions can take asrStructure as input (first argument), to use specific objects, 
#' rather than those stored in asrStructure, set the first argument to NULL.\cr
#' asrStructure:\cr
#' $fileNames - string representations of file names (nested list)\cr
#'  $fileNames$FastaFile\cr
#'  $fileNames$Distrib\cr
#'  $fileNames$Tree\cr
#' $loadedFiles - loaded/read in files from FileNames \cr
#'  $loadedFiles$tree - loaded tree file\cr
#'  $loadedFiles$alignment - loaded alignment/fasta file\cr
#'  $loadedFiles$distribution - loaded distribution file \cr
#' $fastaDF - processed fasta file (see \code{\link{read_fasta}})\cr
#' $seqDF - reformatted output from \code{\link{read_fasta}} (see \code{\link{get_seq_df}})\cr
#' $seqHeights - processed probability distribution (see \code{\link{logo_height_aln}})\cr
#' $distribProb - processed distribution file (see \code{\link{read_distrib}})\cr
#' $distribHeights - processed probability distribution (see \code{\link{logo_height_distrib}})\cr
#' 
#' @examples
#'#retrieve example file stored in the package
#'tree <- system.file("extdata", "test_tree.nwk", package="ASR")
#'aln <- system.file("extdata", "test_aln.aln", package="ASR")
#' #alternatively, specify the filename as a string
#' #tree <- "tree.nwk"
#' #aln <- "aln.aln"
#' 
#' runASR(tree, aln)
#' runASR(tree, aln, output_file = "newID")
#' runASR(tree, aln, inf = "Joint")
#' runASR(tree, aln, inf = "Joint", align = TRUE)
#' runASR(tree, aln, inf = "Joint", gap_inf_mp = FALSE)
#' runASR(tree, aln, inf = "Marginal")
#' runASR(tree, aln, inf = "Marginal", node = "N1")
#' 
#' @export

runASR <- function(tree_file, aln_file, output_file = "asr", inf = "Joint", node = NULL, gap_inf_mp = TRUE, id = "RunASRPOG", plot = TRUE, align = FALSE) {
  if (!(inf == "Joint" || inf == "Marginal")) {
    stop("Inference must be 'Joint' or 'Marginal'")
  }
  
  ##Check if input files are in valid formats## 
  if (align == TRUE) {
    #perform MSA
    #msa <- rJava::.jnew("bn/reconstruction/MSA", aln_file)
    #msaString <- rJava::.jcall(msa, returnSig = "S", "toString")
    #asr <- rJava::.jnew("bn/reconstruction/ASRPOG", msaString, tree_file, aln_file, inf == "joint", gap_inf_mp)
  } else if (is.null(node)) {
    asr <- rJava::.jnew("bn/reconstruction/ASRPOG", aln_file, tree_file, inf == "Joint", gap_inf_mp)
  } else {
    asr <- rJava::.jnew("bn/reconstruction/ASRPOG", aln_file, tree_file, aln_file, node, gap_inf_mp)
  }
  
  rJava::.jcall(asr, returnSig="V","saveSupportedAncestors", output_file)
  rJava::.jcall(asr, returnSig="V", "saveGraph", output_file)
  
  if (inf == "Joint") {
    rJava::.jcall(asr, returnSig="V", "save", output_file, TRUE, "fasta")
  } else {
    rJava::.jcall(asr, returnSig="V", "save", output_file, FALSE, "fasta")
  }
  
  fileNames <- list()
  loadedFiles <- list()
  dataStructure <- list()
  
  if (inf == "Joint") {
    fileNames[["FastaFile"]] = paste(output_file, "_aln_full.fa", sep = "")
    fileNames[["Distrib"]] = NULL
    fileNames[["Tree"]] = paste(output_file, "_new_tree.txt", sep = "")
    
    loadedFiles[["tree"]]= as.data.frame(read.table(fileNames$Tree, header = FALSE))
    loadedFiles[["alignment"]]= read.table(fileNames$FastaFile, header = F, sep = "\n")
    loadedFiles[["distribution"]] = NULL

    dataStructure[["fileNames"]] <- fileNames
    dataStructure[["loadedFiles"]] <- loadedFiles
    fasta <- read_fasta(NULL, aln_file = fileNames$FastaFile)
    dataStructure[["fastaDF"]] = fasta
    seqDF <- get_seq_df(NULL, fastaDF = fasta)
    dataStructure[["seqDF"]] = seqDF
    logoSeq <- logo_height_aln(NULL,seqDF = seqDF, alphabetType="AA")
    dataStructure[["seqHeights"]] <- logoSeq
    if (plot) {
      save_tree(NULL, tree_file = fileNames$Tree)
      save_aln(NULL, seqDF = seqDF) 
    }
  } else if (inf == "Marginal") {
    fileNames[["FastaFile"]] = NULL
    fileNames[["Distrib"]] = paste(output_file, "_distribution.txt", sep = "")
    fileNames[["Tree"]] = paste(output_file, "_new_tree.txt", sep = "")
    
    loadedFiles[["tree"]]= as.data.frame(read.table(fileNames$Tree, header = FALSE, sep = "\n"))
    loadedFiles[["alignment"]]= NULL
    loadedFiles[["distribution"]] = read.table(fileNames$Distrib, header = T, row.names = 1, sep = "\t")
    
    dataStructure[["fileNames"]] <- fileNames
    dataStructure[["loadedFiles"]] <- loadedFiles
    
    mDistrib <- read_distrib(NULL, distrib_file = fileNames$Distrib)
    dataStructure[["distribProbs"]] <- mDistrib
    lDistrib <- logo_height_distrib(NULL,distribDF = mDistrib, alphabetType="AA")
    dataStructure[["distribHeights"]] <- lDistrib

    if (plot) {
      save_tree(NULL, tree_file = fileNames$Tree)
      save_distrib(NULL, distribDF = mDistrib)
    }
  }
  dataStructure
  
}

#' Load existing \code{\link{runASR}} or ASR.jar output
#' 
#' A wrapper to initialise required data structure to process and visualise data. Run this code if you have previously
#' generated output from runASR or ASR.jar and want to load the required structures.
#' 
#' @param id the identifier used when running ASR.jar - if files exist in a different directory use: "dir/id" or "dir1/dir2/id" as input. 
#' If you want to use a specific combination of files, put id as NULL
#' @param tree_file a newick string representation of the re-labelled tree generated by ASR.jar [OPTIONAL]
#' @param aln_file a fasta formatted multiple sequence alignment generated by ASR.jar [OPTIONAL]
#' @param distrib_file a matrix generated by ASR.jar that represents distributions across amino acids at columns throughout the alignment [OPTIONAL]
#' @param plot specifies whether or not to save the plots generated when calling this function
#' 
#' @return asrStructure - a named list containing all data structures and files required to run all other functions in package. If plot = TRUE, 
#' figures associated with generated output (see description) will be generated.
#' All functions can take asrStructure as input (first argument), to use specific objects, rather than those stored in asrStructure, 
#' set the first argument to NULL.\cr
#' asrStructure:\cr
#' $fileNames - string representations of file names (nested list)\cr
#'  $fileNames$FastaFile\cr
#'  $fileNames$Distrib\cr
#'  $fileNames$Tree\cr
#' $loadedFiles - loaded/read in files from FileNames \cr
#'  $loadedFiles$tree - loaded tree file\cr
#'  $loadedFiles$alignment - loaded alignment/fasta file\cr
#'  $loadedFiles$distribution - loaded distribution file \cr
#' $fastaDF - processed fasta file (see \code{\link{read_fasta}})\cr
#' $seqDF - reformatted output from \code{\link{read_fasta}} (see \code{\link{get_seq_df}})\cr
#' $seqHeights - processed probability distribution (see \code{\link{logo_height_aln}})\cr
#' $distribProb - processed distribution file (see \code{\link{read_distrib}})\cr
#' $distribHeights - processed probability distribution (see \code{\link{logo_height_distrib}})\cr
#' 
#' @examples
#' loadASR("test_joint") # if you have run runASR with id = "test_joint" and want to reload the output
#' loadASR("test_joint", plot = FALSE) #Don't save any figure output
#' #if you want to specify files to use
#' loadASR(NULL, tree_file = "id_new_tree.txt", aln_file = "id_aln_full.fa") 
#' #if you want to combine results from multiple runs of runASR
#' loadASR(NULL, tree_file = "id_new_tree.txt", aln_file = "id_aln_full.fa",
#' distrib_file = "id2_distribution.txt") 
#' 
#' @export

loadASR <- function(id, tree_file = NULL, aln_file = NULL, distrib_file = NULL, plot = TRUE) {
  
  loadedFiles <- list()
  dataStructure <- list()
  
  if (!is.null(id)) {
    fileNames <- list()
    fileNames[["Tree"]] = paste(id, "_new_tree.txt", sep = "")
    fileNames[["FastaFile"]] = paste(id, "_aln_full.fa", sep = "")
    fileNames[["Distrib"]] = paste(id, "_distribution.txt", sep = "")
  } else {
    fileNames <- list()
    if (!is.null(tree_file)) {
      fileNames[["Tree"]] = tree_file
    } else {
      fileNames[["Tree"]] = NULL
    }
    if (!is.null(aln_file)) {
      fileNames[["FastaFile"]] = aln_file
    } else {
      fileNames[["FastaFile"]] = NULL
    }
    if (!is.null(distrib_file)) {
      fileNames[["Distrib"]] = distrib_file
    } else {
      fileNames[["Distrib"]] = NULL
    }
  }
  
  if (is.null(fileNames$Tree)) {
    print("No tree recorded")
  } else if (file.exists(fileNames$Tree)) {
    loadedFiles[["tree"]]= as.data.frame(read.table(fileNames$Tree, header = FALSE, sep = "\n"))
    if (plot) {
      save_tree(NULL, tree_file = fileNames$Tree)
    }
  } else if (!file.exists(fileNames$Tree)) {
    print("Tree file does not exist - setting Tree to NULL")
    fileNames$Tree = NULL
  }
  
  if (is.null(fileNames$FastaFile)) {
    print("No fasta file recorded")
  } else if (file.exists(fileNames$FastaFile)) {
    loadedFiles[["alignment"]]= read.table(fileNames$FastaFile, header = F, sep = "\n")
    fasta <- read_fasta(NULL, aln_file = fileNames$FastaFile)
    dataStructure[["fastaDF"]] <- fasta
    seqDF <- get_seq_df(NULL, fastaDF = fasta)
    dataStructure[["seqDF"]] <- seqDF
    logoSeq <- logo_height_aln(NULL,seqDF = seqDF, alphabetType="AA")
    dataStructure[["seqHeights"]] <- logoSeq
    if (plot) {
      save_aln(NULL, seqDF = seqDF) 
    }
  } else if (!file.exists(fileNames$FastaFile)) {
    print("Fasta file does not exist - setting FastaFile to NULL")
    fileNames$FastaFile = NULL
  }
  
  if (is.null(fileNames$Distrib)) {
    print("No distribution file recorded")
  } else if (file.exists(fileNames$Distrib)) {
    loadedFiles[["distribution"]] = read.table(fileNames$Distrib, header = T, row.names = 1, sep = "\t")
    mDistrib <- read_distrib(NULL, distrib_file = fileNames$Distrib)
    dataStructure[["distribProbs"]] <- mDistrib
    lDistrib <- logo_height_distrib(NULL, distribDF = mDistrib, alphabetType="AA")
    dataStructure[["distribHeights"]] <- lDistrib
    if (plot) {
      save_distrib(NULL, distribDF = mDistrib)
    }
  } else if (!file.exists(fileNames$Distrib)) {
    print("Distribution file does not exist - setting Distrib to NULL")
    fileNames$Distrib = NULL
  }
  
  dataStructure[["fileNames"]] <- fileNames
  dataStructure[["loadedFiles"]] <- loadedFiles
  dataStructure  
}
