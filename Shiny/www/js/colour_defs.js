/**
 * 
 * From http://www.bioinformatics.nl/~berndb/aacolour.html
 */


var random = {"C": "#33CCFF", "S": "#A55FEB", "T": "#FF68DD", "Y": "#9A03FE", "Q": "#F900F9", "N": "#A27AFE", "H": "#7979FF", "K": "#86BCFF", "R": "#8CEFFD", "D": "#03F3AB", "E": "#4AE371", "I": "#FF8A8A", "L": "#FF5353", "M": "#FF9331", "V": "#FFCC33", "G": "#FF6600", "P": "#FF9999", "F": "#FF4848", "W": "#FF5353", "A": "#FF0033"};

var clustal_colours = {
 /*orange*/   
'G': "#F05F40",
'P': "#F05F40",
'S': "#F05F40",
'T': "#F05F40",
/*red*/
'H': "#F75D59",
'K': "#F75D59",
'R': "#F75D59",
/*blue*/
'F': "#3BB9FF",
'W': "#3BB9FF",
'Y': "#3BB9FF",
/*green*/
'I': "#6AFB92",
'L': "#6AFB92",
'M': "#6AFB92",
'V': "#6AFB92"};

var lesk_colours = {
/*orange*/
'G': "orange",
'A': "orange",
'S': "orange",
'T': "orange",
/*red*/
'D': "#F75D59",
'E': "#F75D59",
/*green*/
'C': "#6AFB92",
'V': "#6AFB92",
'I': "#6AFB92",
'L': "#6AFB92",
'P': "#6AFB92",
'F': "#6AFB92",
'M': "#6AFB92",
'W': "#6AFB92",
/*magenta*/
'N': "#F778A1",
'Q': "#F778A1",
'H': "#F778A1",
/*blue*/
'K': "#3BB9FF",
'R': "#3BB9FF"
};

var cinema_colours = {
/*blue*/
'H': "#3BB9FF",
'K': "#3BB9FF",
'R': "#3BB9FF",
/*red*/
'D': "#F75D59",
'E': "#F75D59",
/*green*/
'S': "#6AFB92",
'T': "#6AFB92",
'N': "#6AFB92",
'Q': "#6AFB92",
/*white*/
'A':"#FEFCFF",
'V':"#FEFCFF",
'L':"#FEFCFF",
'I':"#FEFCFF",
'M':"#FEFCFF",
/*magenta*/
'F': "#F778A1",
'W': "#F778A1",
'Y': "#F778A1",
/*brown*/
'G': "#B38481",
'P': "#B38481",
/*yellow*/
'C':"#FFDB58",
/**/
'B':"#E9CFEC",
'Z':"#E9CFEC",
'X':"#E9CFEC"
}

var ma_colours = {
/*light green*/
'A': "#98FF98",
'G': "#98FF98",
/*green*/
'C': "#6AFB92",
/*dark green*/
'D': "#54C571",
'E': "#54C571",
'N': "#54C571",
'Q': "#54C571",
/*blue*/
'I': "#3BB9FF",
'L': "#3BB9FF",
'M': "#3BB9FF",
'V': "#3BB9FF",
/*lilac*/
'F': "#D462FF",
'W': "#D462FF",
'Y': "#D462FF",
/*dark blue*/
'H': "#0000A0",
/*orange*/
'K': "#F05F40",
'R': "#F05F40",
/*pink*/
'P': "#F433FF",
/*red*/
'S': "#F75D59",
'T': "#F75D59"
};

var colour_schemes = {'random': random, 'clustal': clustal_colours, 
    'lesk': lesk_colours, 'cinema': cinema_colours, 'ma': ma_colours};