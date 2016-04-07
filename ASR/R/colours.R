#' Clustal colour scheme
#' 
#' Colour scheme described in \url{http://www.ebi.ac.uk/Tools/msa/clustalw2/help/faq.html#24}
#' 
#' @param alphabet a vector of amino acids which specify the order in which the colour palette will
#' be specified
#' 
#' @export

colours_clustal <- function(alphabet){
  letters <- c("A", "V", "F", "P", "M", 
               "I", "L", "W", "D", "E", 
               "R", "K", "S", "T", "Y", 
               "H", "C", "N", "G", "Q", "-")
  cols <- c(rep("Red", 8), rep("Blue", 2), rep("Magenta", 2), rep("Green", 8), "Grey")
  df <- data.frame(letters, cols)
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    colours[a] <- as.character(df[df$letters == alphabet[a],]$cols)
  }
  colours
}

#' Zappo colour scheme
#' 
#' Colour scheme described in \url{http://www.jalview.org/version118/documentation.html#zappo}
#' 
#' @param alphabet a vector of amino acids which specify the order in which the colour palette will
#' be specified
#' 
#' @export

colours_zappo <- function(alphabet) {
  letters <- c("I", "L", "V", "A", "M", 
               "F", "W", "Y", "K", "R", 
               "H", "D", "E","S", "T", 
               "N", "Q", "P", "G","C","-")
  cols <- c(rep("salmon", 5), rep("orange", 3), rep("red", 3), rep("green", 2), rep("blue", 4), rep("magenta", 2), "yellow", "grey")
  df <- data.frame(letters, cols)
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    colours[a] <- as.character(df[df$letters == alphabet[a],]$cols)
  }
  colours
}

#' Taylor colour scheme
#' 
#' Colour scheme described in \url{http://www.jalview.org/version118/documentation.html#taylor}
#' 
#' @param alphabet a vector of amino acids which specify the order in which the colour palette will
#' be specified
#' 
#' @export
colours_taylor <- function(alphabet) {
  letters <- c("V", "I", "L", "F", "Y", "W", 
               "H", "R", "K", "N", "Q", "E", 
               "D", "S", "T", "G", "P", "C", 
               "A", "M", "-")
  cols <- c("#99FF00", "#66FF00", "#33FF00", "#00FF66", "#00FFCC", 
            "#00CCFF", "#0066FF", "#0000FF", "#6600FF", "#CC00FF", 
            "#FF00CC", "#FF0066", "#FF0000", "#FF3300", "#FF6600", 
            "#FF9900", "#FFCC00", "#FFFF00", "#CCFF00", "#00FF00", "grey")
  df <- data.frame(letters, cols)
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    colours[a] <- as.character(df[df$letters == alphabet[a],]$cols)
  }
  colours
}

#' Nucleotide colour scheme
#' 
#' Colour scheme described in \url{http://www.jalview.org/help/html/colourSchemes/nucleotide.html}
#' 
#' @param alphabet a vector of nucleotides which specify the order in which the colour palette will
#' be specified
#' 
#' @export
colours_nt <- function(alphabet) {
  
  if (length(alphabet) > 5) {
    stop(paste("The alphabet used to select colours: ", alphabet, ", contains more letters than available in this colour scheme", sep = ""))
  }
  
  colour <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    letter = alphabet[a]
    if (letter == "A") {
      colour[a] = "green"
    } else if (letter == "C") {
      colour[a] = "orange"
    } else if (letter == "G") {
      colour[a] = "red"
    } else if (letter == "T" || letter == "U") {
      colour[a] = "blue"
    } else if (letter == "-") {
      colour[a] = "grey"
    }
  }
  colour
}

#' Yosephine's colour scheme
#' 
#' @param alphabet a vector of amino acids which specify the order in which the colour palette
#' will be specified
#' 
#' @export

colours_yos <- function(alphabet) {
  letters <- c("A", "I", "L", "M", "V", "F", 
               "W", "N", "Q", "S", "T", "H", 
               "K", "R", "D", "E", "C", "G", 
               "P", "Y","-")
  cols <- c("yellow", "wheat", "gold", "orange", "orange4", 
            "violet", "purple", "chartreuse", "darkolivegreen4", "limegreen", 
            "seagreen", "turquoise3", "royalblue1", "skyblue", "red", 
            "pink", "brown", "lightslategrey", "black", "cyan", "gray88")
  df <- data.frame(letters, cols)
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    colours[a] <- as.character(df[df$letters == alphabet[a],]$cols)
  }
  colours
}


