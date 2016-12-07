library(jsonlite)
library(ASR)

createJSON = function(asrfile, letter_height, inf){
  if(inf=="Joint"){
    seq_length = length(levels(asrfile$distribProbs$Column))
  }
  
  if(inf=="Marginal"){
    seq_length = length(levels(asrfile$seqDF$Column))
  }
  
  json = list()
  
  #ali_map, column label
  json$ali_map = seq(1,seq_length)
  
  #mmline, ?? meaning
  json$mmline = rep(0,seq_length)
  
  #height_calc
  if(letter_height == "Information content"){
    json$height_calc = "info_content_all"
  }
  if(letter_height == "Score"){
    json$height_calc = "score"
  }
  
  #delete_probs
  json$delete_probs = rep("1.00",seq_length)
  
  #Marginal reconstruction
  if(inf == "Marginal"){
    d = asrfile$loadedFiles$distribution
    probs = asrfile$distribProbs
    heights = asrfile$distribHeights
    
    #max_height_obs
    json$max_height_obs = as.character(max(heights$Height, na.rm=TRUE))
    
    #Probabilities
    df_probs = data.frame(matrix(, 21, nrow(probs)/21))
    for(i in 1:(nrow(probs)/21)){
      df_probs[,i] = probs[probs$Column==i,]$Probability
    }
    row.names(df_probs) = row.names(d)
    
    #Heights
    df_heights = data.frame(matrix(, 20, nrow(heights)/20))
    for(i in 1:(nrow(heights)/20)){
      df_heights[,i] = heights[heights$Column==i,]$Height
    }
    row.names(df_heights) = row.names(d)[1:20]
    
    #Function create matrix
    create_matrix = function(df){
      mat = matrix(, nrow = nrow(df), ncol = ncol(df))
      #create sorted matrix with new names
      for(i in 1:ncol(df)){
        sort_col = df[order(df[,i]),i]
        row_names = row.names(df[order(df[,i]),])
        for(j in 1:length(row_names)){
          mat[j,i] = paste(row_names[j],sort_col[j],sep=":")
        }
      }
      mat = t(mat)
      return(mat)
    }
    
    df_heights_mat = create_matrix(df_heights)
    df_probs_mat = create_matrix(df_probs)
  }
  
# if(inf == "Joint"){
#   heights = asrfile$seqHeights
#   
#   #max_height_obs
#   json$max_height_obs = as.character(max(heights$Height, na.rm=TRUE))
#   
#   } 
  
  #height_arr
  json$height_arr = df_heights_mat
  
  #insert_lengths
  json$insert_lengths = c(2,2,2,2,2,2,2,0)
  
  #insert_probs
  json$insert_probs = rep("0.00",ncol(d))
  
  #alphabet
  json$alphabet = "aa"
  
  #probs_arr
  json$probs_arr = df_probs_mat
  
  #min_height_obs
  json$min_height_obs = as.character(min(heights$Height))
  
  #max_height_theory
  json$max_height_theory = max(heights$Height)+1
  
  #processing
  json$processing = "observed"
  
  json$probs_arr = json$probs_arr[,1:20]
  return(toJSON(json, auto_unbox = TRUE))
}