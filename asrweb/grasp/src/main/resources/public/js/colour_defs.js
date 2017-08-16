/**
 *
 * From http://www.bioinformatics.nl/~berndb/aacolour.html
 */


var random = {"C": "#33CCFF", "S": "#A55FEB", "T": "#FF68DD", "Y": "#9A03FE", "Q": "#F900F9", "N": "#A27AFE", "H": "#7979FF", "K": "#86BCFF", "R": "#8CEFFD", "D": "#03F3AB", "E": "#4AE371", "I": "#FF8A8A", "L": "#FF5353", "M": "#FF9331", "V": "#FFCC33", "G": "#FF6600", "P": "#FF9999", "F": "#ff6666", "W": "#FF5353", "A": "#FF0033"};

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
'V': "#6AFB92",
/*white (added by Mikael to cover all 20 AAs) */
'A':"#f6f2f7",
'C':"#f6f2f7",
'Q':"#f6f2f7",
'N':"#f6f2f7",
'D':"#f6f2f7",
'E':"#f6f2f7"};

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
'Y': "#6AFB92", /* Lesk "Introduction to Bioinformatics" 4th ed p196 */
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

var zappo_colours = { /* Picked the RGB from JalView's Help page 17/5/2017 */
    /* aliphatic */
    'I': "#FFAFAF",
    'L': "#FFAFAF",
    'V': "#FFAFAF",
    'A': "#FFAFAF",
    'M': "#FFAFAF",
    /* aromatic */
    'F': "#FFC803",
    'W': "#FFC803",
    'Y': "#FFC803",
    /* positive */
    'K': "#6564FF",
    'R': "#6564FF",
    'H': "#6564FF",
    /* negative */
    'D': "#FF0201",
    'E': "#FF0201",
    /* hydrophilic */
    'S': "#00FF03",
    'T': "#00FF03",
    'N': "#00FF03",
    'Q': "#00FF03",
    /* conformationally special */
    'P': "#FF00FF",
    'G': "#FF00FF",
    /* cysteine */
    'C': "#FFFF04"};

var taylor_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Protein Engineering, Vol 10 , 743-746 (1997) */
    /* aliphatic */
    'I': "#64FF03",
    'L': "#2EFF03",
    'V': "#98FF04",
    'A': "#CBFF04",
    'M': "#00FF03",
    /* aromatic */
    'F': "#00FF66",
    'W': "#00CCFF",
    'Y': "#00FFCC",
    /* positive */
    'K': "#6700FF",
    'R': "#0700FF",
    'H': "#0466FF",
    /* negative */
    'D': "#FF0201",
    'E': "#FF0166",
    /* hydrophilic */
    'S': "#FF3401",
    'T': "#FF6601",
    'N': "#CD00FF",
    'Q': "#FF00CC",
    /* conformationally special */
    'P': "#FFCC03",
    'G': "#FF9902",
    /* cysteine */
    'C': "#FFFF04"};

var hydrophobicity_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#FF0201",
    'V': "#F6020A",
    'L': "#EA0215",
    'F': "#CB0134",
    'C': "#C2013D",
    'M': "#B0004F",
    'A': "#AD0052",
    'G': "#6A0095",
    'S': "#5E00A1",
    'T': "#61009E",
    'W': "#5B00A4",
    'Y': "#5000B0",
    'P': "#4700B9",
    'H': "#1800EA",
    'E': "#1100F3",
    'Q': "#1100F3",
    'D': "#1100F3",
    'N': "#1100F3",
    'K': "#0700FF",
    'R': "#0700FF"
};



var colour_schemes = {'taylor': taylor_colours, 'zappo': zappo_colours, 'random': random, 'clustal': clustal_colours,
		      'lesk': lesk_colours, 'cinema': cinema_colours, 'ma': ma_colours, 'hydrophob': hydrophobicity_colours};
