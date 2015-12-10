#' Clustal colour scheme
#' 
#' Colour scheme described in \url{http://www.ebi.ac.uk/Tools/msa/clustalw2/help/faq.html#24}
#' 
#' @param alphabet a vector of amino acids which specify the order in which the colour palette will
#' be specified
#' 
# ' @export

colours_clustal <- function(alphabet){
  red <- c("A", "V", "F", "P", "M", "I", "L", "W")
  blue <- c("D", "E")
  magenta <- c("R", "K")
  green <- c("S", "T", "Y", "H", "C", "N", "G", "Q")
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    letter = alphabet[a]
    if (letter %in% red) {
      colours[a] = "Red"
    } else if (letter %in% blue) {
      colours[a] = "Blue"
    } else if (letter %in% magenta) {
      colours[a] = "Magenta"
    } else if (letter %in% green) {
      colours[a] = "Green"
    } else {
      colours[a] = "Grey"
    }
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
# ' @export

colours_zappo <- function(alphabet) {
  
  pink <- c("I", "L", "V", "A", "M")
  orange <- c("F", "W", "Y") 
  red <- c("K", "R", "H")
  green <- c("D", "E")
  blue <- c("S", "T", "N", "Q")
  magenta <- c("P", "G")
  yellow <- c("C")
  
  colours <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    letter = alphabet[a]
    if (letter %in% red) {
      colours[a] = "Red"
    } else if (letter %in% blue) {
      colours[a] = "Blue"
    } else if (letter %in% magenta) {
      colours[a] = "Magenta"
    } else if (letter %in% orange) {
      colours[a] = "orange"
    } else if (letter %in% green) {
      colours[a] = "Green"
    } else if (letter %in% pink) {
      colours[a] = "salmon"
    } else if (letter %in% yellow) {
      colours[a] = "yellow"
    } else {
      colours[a] = "Grey"
    }
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
# ' @export
colours_taylor <- function(alphabet) {
  
  colour <- rep(0, length(alphabet))
  for (a in seq(1, length(alphabet), 1)) {
    letter = alphabet[a]
    if (letter == "V") {
      colour[a] = "#99FF00"
    } else if (letter == "I") {
      colour[a] = "#66FF00"
    } else if (letter == "L") {
      colour[a] = "#33FF00"
    } else if (letter == "F") {
      colour[a] = "#00FF66"
    } else if (letter == "Y") {
      colour[a] = "#00FFCC"
    } else if (letter == "W") {
      colour[a] = "#00CCFF"
    } else if (letter == "H") {
      colour[a] = "#0066FF"
    } else if (letter == "R") {
      colour[a] = "#0000FF"
    } else if (letter == "K") {
      colour[a] = "#6600FF"
    } else if (letter == "N") {
      colour[a] = "#CC00FF"
    } else if (letter == "Q") {
      colour[a] = "#FF00CC"
    } else if (letter == "E") {
      colour[a] = "#FF0066"
    } else if (letter == "D") {
      colour[a] = "#FF0000"
    } else if (letter == "S") {
      colour[a] = "#FF3300"
    } else if (letter == "T") {
      colour[a] = "#FF6600"
    } else if (letter == "G") {
      colour[a] = "#FF9900"
    } else if (letter == "P") {
      colour[a] = "#FFCC00"
    } else if (letter == "C") {
      colour[a] = "#FFFF00"
    } else if (letter == "A") {
      colour[a] = "#CCFF00"
    } else if (letter == "M") {
      colour[a] = "#00FF00"
    } else if (letter == "-") {
      colour[a] = "grey"
    }
  }
  colour
}

#' Nucleotide colour scheme
#' 
#' Colour scheme described in \url{http://www.jalview.org/help/html/colourSchemes/nucleotide.html}
#' 
#' @param alphabet a vector of nucleotides which specify the order in which the colour palette will
#' be specified
#' 
# ' @export
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


