#'Reduce the alphabet across all relevant features of ASR structure
#'
#'
#'@param asrStructure the named list returned by \code{\link{runASR}} or \code{\link{loadASR}}. Set this to NULL
#'to specify other variables
#'@param alphabet a list of letters representing the 1:1 mapping of the new alphabet to the original AA alphabet
#'@param alphabetType the original alphabet type of the reconstruction
#'
#'@return a new asrStructure with the relevant data structures updated to the reduced alphabet
#' 
#' @examples
#' data(asrStructure)
#' 
#'#             "A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"
#'#              |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
#'alphabet <- c("H", "H", "H", "C", "C", "C", "R", "R", "R", "R", "P", "P", "P", "P", "N", "N", "N", "N", "H", "H")
#'newASR <- reduce_alphabet(asrStructure, alphabet)
#'
#' @export

reduce_alphabet <- function(asrStructure, alphabet, alphabetType="AA") {
  #new <- c("H", "H", "H", "C", "C", "C", "R", "R", "R", "R", "P", "P", "P", "P", "N", "N", "N", "N", "H", "H")
  seq = FALSE
  distrib = FALSE
  if (!is.vector(alphabet)){
    stop('Provided alphabet must be a vector with letters mapped in this order: "A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"')
  }
  
  if (length(alphabet) < 20) {
    stop('Provided alphabet must be a vector with letters mapped in this order: "A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y"')
  }
  
  if (!is.null(asrStructure)) {
    if (typeof(asrStructure) != "list") {
      stop(paste("The input for asrStructure: ", summary(asrStructure), ", is not a list therefore not a valid input", sep = ""))
    }
    seqDF = asrStructure[["seqDF"]]
    distribProbs = asrStructure[["distribProbs"]]
    if (is.null(seqDF)) {
      print(paste("asrStructure does not contain a sequence dataframe - seqDF. 
              To generate the required files and structures to use this function 
              you will need to run runASR() using joint inference. Alphabet reduction will not update alignment.", seq = ""))
    } else if (is.data.frame(seqDF)) {
      cols <- colnames(seqDF)
      if (!all(c("Column", "Label", "AA") %in% cols)) {
        stop(paste("The dataframe provided as asrStructure$seqDF is not correctly formatted.", sep=""))
      }
      seq = TRUE
    } else {
      stop(paste("The input for asrStructure$seqDF is not a dataframe and therefore not a valid input.", sep = ""))
    }
    if (is.null(distribProbs)) {
      print(paste("asrStructure does not contain a distribution dataframe - distribProbs. 
              To generate the required files and structures to use this function 
              you will need to run runASR() using marginal inference. Alphabet reduction will not update distribution.", seq = ""))
    } else if (is.data.frame(distribProbs)) {
      cols <- colnames(distribProbs)
      if (!all(c("Column", "AA", "Probability") %in% cols)) {
        stop(paste("The dataframe provided as asrStructure$distribProbs is not correctly formatted.", sep=""))
      }
      distrib=TRUE
    } else {
      stop(paste("The input for asrStructure$distribProbs is not a dataframe and therefore not a valid input.", sep = ""))
    }    
  }
  
  aa = c("A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y")
  dna = c("A", "T", "G", "C")
  rna = c("A", "U", "G", "C")
  
  if(seq) {
    seqDF$AA <- as.character(seqDF$AA)
    seqDF <- cbind(seqDF, rep("-", dim(seqDF)[[1]]))
    colnames(seqDF) <- c("Label", "Column", "AA", "RA")
    seqDF$RA <- as.character(seqDF$RA)
    
    #Relabel all amino acids
    if (alphabetType == "AA") { #mapping from full AA alphabet to reduced AA alphabet
      for (i in seq(1,length(aa), 1)) {
        seqDF$RA[seqDF$AA == aa[i]] <- alphabet[i]        
      }
      seqDF$AA <- NULL
      colnames(seqDF) <- c("Label", "Column", "AA")
    }
    asrStructure$seqDF <- seqDF
    #Recalculate heights
    asrStructure$seqHeights <- logo_height_aln(asrStructure, alphabet = alphabet)
  }
  
  if (distrib) {
    distribProbs <- asrStructure$distribProbs
    distribProbs$AA <- as.character(distribProbs$AA)
    distribProbs <-cbind(distribProbs, rep("-", dim(distribProbs)[[1]]))
    colnames(distribProbs) <- c("AA", "Column", "Probability", "RA")
    distribProbs$RA <- as.character(distribProbs$RA)
    
    #Relabel all amino acids
    if (alphabetType == "AA") { #mapping from full AA alphabet to reduced AA alphabet
      for (i in seq(1,length(aa), 1)) {
        distribProbs$RA[distribProbs$AA == aa[i]] <- alphabet[i]
      }
      distribProbs <- aggregate(Probability~Column+RA, data=distribProbs, FUN=sum)
      distribProbs$AA <-  NULL
      distribProbs <- distribProbs[c(2,1,3)]
      colnames(distribProbs) <- c("AA", "Column", "Probability")
    }
    asrStructure$distribProbs <- distribProbs
    #Recalculate heights
    asrStructure$distribHeights <- logo_height_distrib(asrStructure, alphabet = alphabet)
  }
  asrStructure
}