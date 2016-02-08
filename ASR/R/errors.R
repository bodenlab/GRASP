#'Dataframe input error handling
#'
#'Check inputs provided by user for any not allowed values
#'
#'@param asrStructure the named list returned by \code{\link{runASR}}, \code{\link{loadASR}} or \code{\link{reduce_alphabet}}.
#'@param dataframeName the name of the dataframe of interest for the parent function
#'@param dataframe if provided by the user should contain a value, otherwise NULL
#'@param colnames the column names that should be present in the dataframe of interest for the parent function
#'@param inference options "Joint" or "Marginal"
#'
#'@return the dataframe required by the parent function or an error
#'
#'@examples
#'
#'@export

dfError <- function(asrStructure, dataframeName, dataframe, colnames, inference) {
  if (!is.null(asrStructure)) {
    if (typeof(asrStructure) != "list") {
      stop(paste("The input for asrStructure: ", summary(asrStructure), ", is not a list therefore not a valid input", sep = ""))
    }
    df = asrStructure[[dataframeName]]
    if (is.null(df)) {
      stop(paste("asrStructure does not contain required dataframe. 
              To generate the required files and structures to use this function 
              you will need to run runASR() using ", inference, " inference.", seq = ""))
    }
    if (is.data.frame(df)) {
      cols <- colnames(df)
      if (!all(colnames %in% cols)) {
        stop(paste("The dataframe provided as asrStructure$", dataframeName, " is not correctly formatted.", sep=""))
      }
    } else {
      stop(paste("The input for asrStructure$", dataframeName, " is not a dataframe and therefore not a valid input. Sample input: ", df[1:10,], sep = ""))
    }
    return(df)
  } else {
    if(is.null(dataframe)) {
      stop(paste("You have not provided an asrStructure or specified ", dataframeName, ".", sep=""))
    } else {
      if (is.data.frame(dataframe)) {
        cols <- colnames(dataframe)
        if (!all(colnames %in% cols)) {
          stop(paste("The dataframe provided as ", dataframeName, " is not correctly formatted.", sep=""))
        }
      } else {
        stop(paste("The input for ", dataframeName, " is not a dataframe and therefore not a valid input. Sample input: ", dataframe[1:10,], sep = ""))
      }
    }
    return(dataframe)
  }
}