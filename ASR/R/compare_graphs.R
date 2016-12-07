#'Graph comparison function
#'
#'Takes a list of filepaths to partial order graphs and performs a set operation (i.e. union, intersection or complement)
#'on the full list of graphs. Saves the resulting partial order graph.\cr
#'
#'@param type operation to perform on the graphs. "union", "intersection" or "complement".
#'@param extants filepath to the extant sequence file (clustal or fasta)
#'@param ... filepaths to graph structures to perform the operation on.
#'
#'@export
#'
compare_graphs <- function(type,extants,...) {
  gu <- rJava::.jnew("bn/math/GraphUtility")
  
  inputGraphFiles <- list(...)
  
  for (graph in inputGraphFiles) {
    els <- unlist(strsplit(graph, "[/]"))
    label <- unlist(strsplit(els[length(els)], "[.]"))[1]
    pog <- rJava::.jnew("dat/POGraph", graph, extants)
    rJava::.jcall(gu, returnSig="V", "addGraph", label, pog)
  }
  
  if (type == "complement") {
    rJava::.jcall(gu, returnSig="V", "savePerformComplement", "./")
  } else if (type == "intersection") {
    rJava::.jcall(gu, returnSig="V", "savePerformIntersection", "./")
  } else {
    rJava::.jcall(gu, returnSig="V", "savePerformUnion", "./")
  }
}