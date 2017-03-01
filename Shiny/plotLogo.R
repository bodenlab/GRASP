require(ggplot2)
require(reshape2)

plotLogo <- function(filepath, alphabet = "AA") {

  if (alphabet == "AA") {
    cols <- c("A", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M", "N", "P", "Q", "R", "S", "T", "V", "W", "Y", "-")
  } else {
    cols <- c("A", "C", "G", "T")
  }
  print("here")

  distdf <- t(read.table(filepath))
  rownames(distdf) <- 1:nrow(distdf)
  distdf[is.nan(distdf)] = 0
  distdf[is.na(distdf)] = 0
  distdf <- as.data.frame(distdf)
  for (row in 1:nrow(distdf)) {
    if (all(distdf[row,]==0)) {
      distdf[row,21] = 1
    }
  }
  distdf$position = as.numeric(rownames(distdf))
  distdf$height <- apply(distdf[,cols], MARGIN=1,
                       FUN=function(x){2-sum(log(x^x,base=2))})
  logodistdf <- data.frame(distdf$height*distdf[,cols], position=distdf$position)
  lmf <- melt(logodistdf, id.var='position', value.name="bits", variable.name="Character")
  
  colourPalette = getColors(cols)
  p <- ggplot(data=lmf, aes(x=position, y=bits, fill=Character, width=0.6))  +
  geom_bar(stat='identity', color="white", alpha=0.4) +
  scale_fill_manual(values = colourPalette) + 
  scale_x_continuous(expand = c(0, 0)) + scale_y_continuous(expand = c(0, 0)) +
  geom_text(aes(label=Character, x=position, y=bits, vjust=0.5, hjust=0.5, size=bits), position='stack') +
  theme_bw()
  
  return(p)
}

getColors <- function(order, type = "Clustal") {
  letters <- c("A", "I", "L", "M", "F", 
               "W", "V", "R", "K", "N", 
               "Q", "S", "T", "E", "D", 
               "G", "H", "Y", "P", "C", "-")
  clustal_cols <- c(rep("Blue", 7), rep("Red", 2), rep("Green", 4), rep("Magenta", 2), 
            "Orange", rep("Cyan", 2), "Yellow", "Pink", "Grey")
  
  if (type == "Clustal") {
    scheme <- data.frame(clustal_cols)
  }
  row.names(scheme) <- letters
  scheme <- t(scheme)
  colours <- scheme[,order]
  return(colours)
}

