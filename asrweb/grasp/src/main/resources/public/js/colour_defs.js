/**
 *
 * From http://www.bioinformatics.nl/~berndb/aacolour.html
 */


var random = {"C": "#33CCFF", "S": "#A55FEB", "T": "#FF68DD", "Y": "#9A03FE", "Q": "#F900F9", "N": "#A27AFE", "H": "#7979FF", "K": "#86BCFF", "R": "#8CEFFD", "D": "#03F3AB", "E": "#4AE371", "I": "#FF8A8A", "L": "#FF5353", "M": "#FF9331", "V": "#FFCC33", "G": "#FF6600", "P": "#FF9999", "F": "#ff6666", "W": "#FF5353", "A": "#FF0033"};

var clustal_colours = {
 /*orange*/
'G': "#F5A259",
/*green*/
'N':"#00f900",
'Q':"#00f900",
'S': "#00f900",
'T': "#00f900",
/*red*/
'K': "#f62f00",
'R': "#f62f00",
/*blue/purple*/
'A':"#92b2f3",
'I': "#92b2f3",
'L': "#92b2f3",
'M': "#92b2f3",
'V': "#92b2f3",
'W': "#92b2f3",
'F': "#92b2f3",
/*yellow*/
'P': "#FFFB00",
/*pink*/
'C':"#F59692",
/*aqua*/
'H': "#04B2B3",
'Y': "#04B2B3",
/*purple*/
'D':"#CE64CB",
'E':"#CE64CB"};

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
    'I': "#FFBEBC",
    'L': "#FFBEBC",
    'V': "#FFBEBC",
    'A': "#FFBEBC",
    'M': "#FFBEBC",
    /* aromatic */
    'F': "#FFD000",
    'W': "#FFD000",
    'Y': "#FFD000",
    /* positive */
    'K': "#777FFF",
    'R': "#777FFF",
    'H': "#777FFF",
    /* negative */
    'D': "#FF2700",
    'E': "#FF2700",
    /* hydrophilic */
    'S': "#00F900",
    'T': "#00F900",
    'N': "#00F900",
    'Q': "#00F900",
    /* conformationally special */
    'P': "#FF41FF",
    'G': "#FF41FF",
    /* cysteine */
    'C': "#FFFB00"};

var taylor_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Protein Engineering, Vol 10 , 743-746 (1997) */
    /* aliphatic */
    'V': "#A6FA00",
    'A': "#D4FA00",
    'I': "#72F900",
    'L': "#32F900",
    'M': "#00F900",
    /* aromatic */
    'F': "#00FA79",
    'W': "#00D6FF",
    'Y': "#00FBD6",
    /* positive */
    'K': "#7B36FF",
    'R': "#0432FF",
    'H': "#0080FF",
    /* negative */
    'D': "#FF2700",
    'E': "#FF2D79",
    /* hydrophilic */
    'S': "#FF4C00",
    'T': "#FF7C00",
    'N': "#D83DFF",
    'Q': "#FF39D6",
    /* conformationally special */
    'P': "#FFD300",
    'G': "#FFA900",
    /* cysteine */
    'C': "#FFFB00"};

var hydrophobicity_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#FF2700",
    'V': "#FA2602",
    'L': "#F02319",
    'F': "#D72044",
    'C': "#CF214E",
    'M': "#C01F61",
    'A': "#BE2065",
    'G': "#7F23A6",
    'S': "#7324B0",
    'T': "#7624AE",
    'W': "#7024B4",
    'Y': "#6326BE",
    'P': "#5927C6",
    'H': "#1E2FEE",
    'E': "#1031F6",
    'Q': "#1031F6",
    'D': "#1031F6",
    'N': "#1031F6",
    'K': "#0432FF",
    'R': "#0432FF"
};

var helix_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#9C899C",
    'V': "#988E97",
    'L': "#BD6BBC",
    'F': "#A97EA9",
    'C': "#16DD2E",
    'M': "#F541F2",
    'A': "#EE44EC",
    'G': "#00F900",
    'S': "#3CCF45",
    'T': "#54C158",
    'W': "#9C899C",
    'Y': "#0FDF2B",
    'P': "#00F900",
    'H': "#889B87",
    'E': "#889B87",
    'Q': "#A482A3",
    'D': "#89998A",
    'N': "#00E324",
    'K': "#B177AF",
    'R': "#81A083"
};

var strand_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#F0EC14",
    'V': "#FFFB00",
    'L': "#BFBE5F",
    'F': "#CDCB4E",
    'C': "#ADAB75",
    'M': "#949490",
    'A': "#6B6FB6",
    'G': "#5B61C3",
    'S': "#5B61C3",
    'T': "#ADAB75",
    'W': "#CBC950",
    'Y': "#DBD838",
    'P': "#2F41E3",
    'H': "#7376AF",
    'E': "#0432FF",
    'Q': "#9E9D86",
    'D': "#2C40E5",
    'N': "#7779AC",
    'K': "#595FC4",
    'R': "#7E80A5"
};

var turn_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#00FDFF",
    'V': "#00F8FA",
    'L': "#00E6E9",
    'F': "#05E5E7",
    'C': "#B86C6A",
    'M': "#05E5E7",
    'A': "#2BDADC",
    'G': "#FF2700",
    'S': "#EA3526",
    'T': "#869D9D",
    'W': "#869D9D",
    'Y': "#AE7776",
    'P': "#FA2702",
    'H': "#83A0A0",
    'E': "#89999A",
    'Q': "#4BCACB",
    'D': "#EF2F1C",
    'N': "#FF2700",
    'K': "#919393",
    'R': "#83A0A0"
};

var buried_colours = { /* Picked the RGB from JalView's Help page 17/5/2017, see also Kyte, J., and Doolittle, R.F., J. Mol. Biol. 1157, 105-132, 1982 */
    'I': "#006ABA",
    'V': "#0074B0",
    'L': "#008D96",
    'F': "#00988B",
    'C': "#0432FF",
    'M': "#00A57B",
    'A': "#00AF6F",
    'G': "#00AA75",
    'S': "#00D837",
    'T': "#00DC2F",
    'W': "#00B36A",
    'Y': "#00E621",
    'P': "#00E029",
    'H': "#00D92F",
    'E': "#00EE0B",
    'Q': "#00EE0B",
    'D': "#00EA17",
    'N': "#00EA17",
    'K': "#00F900",
    'R': "#00F700"
};


var colour_schemes = {'taylor': taylor_colours, 'zappo': zappo_colours, 'random': random, 'clustal': clustal_colours,
		      'lesk': lesk_colours, 'cinema': cinema_colours, 'ma': ma_colours, 'hydrophob': hydrophobicity_colours,
		      'helix': helix_colours, 'strand': strand_colours, 'turn': turn_colours, 'buried': buried_colours};
