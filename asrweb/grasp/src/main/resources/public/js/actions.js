/**
 *  ------------------------------------------------------------------
 *                          Main Function 
 *                          
 *   Runs the JS commands for the phylo tree and the POAG.
 *  ------------------------------------------------------------------
 */

var run_asr_app = function(json_str, recon, label, inf) {

    /**
     * Run POAG setup
     */
    // Set the SVG ID in the poags data struct
    poags.options = poag_options;
    poags.options.data.raw_svg_id = "poag-all"; // HTML representation
    poags.options.data.target = "#poag-all"; // D3 representation

    /**
     * Add inferred graph to the graph array so that when more graphs
     * are added we get a merged copy of the inferred + added graphs
     */
    graph_array.push(JSON.parse(json_str));

    /**
     *
     * Run Tree setup
     */
    set_recon_label(label);
    set_inf_type(inf);
    set_phylo_params("#phylo-tree", recon);
    run_phylo_tree();
    refresh_tree(); // to set height properly
    selectedNode = phylo_options.tree.selected_node.name;
    refresh_elements();

    // draw poags
    setup_poags(json_str, true, true, false, phylo_options.tree.selected_node.name.split("_")[0])
    poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length + 1)] = poags.options.names_to_colour[phylo_options.tree.selected_node.name.split("_")[0]];
    poags.options.name_to_merged_id[phylo_options.tree.selected_node.name.split("_")[0]] = ["poag" + (Object.keys(poags.options.poagColours).length + 1)];
    redraw_poags();
    poags.retain_previous_position = true;
}


/**
 *  ------------------------------------------------------------------------
 *                          Update page scheme
 * ------------------------------------------------------------------------
 */
var update_scheme = function (scheme) {
    var glyphs = document.querySelectorAll(".glyph-selected");
    for (var i = 0; i < glyphs.length; i++) {
        if (!glyphs[i].classList.contains('disable')) {
            glyphs[i].classList.add('disable');
        }
    }
    document.querySelector("#" + scheme + "-selected").classList.remove('disable');
    document.getElementById("selected-scheme").textContent = document.getElementById(scheme).textContent;
    update_colour(scheme);
}



/**
 * ----------------------------------------------------------------------------
 *                        Display the loading screen
 *
 * ----------------------------------------------------------------------------
 */

function displayLoad() {

    if (document.getElementById("selected-example").textContent == 'None') {


        if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            alert('The File APIs are not fully supported in this browser.');
            return;
        }

        input = document.getElementById('filealn');
        if (!input) {
        }
        else if (!input.files) {
            alert("This browser doesn't seem to support the `files` property of file inputs.");
        }
        else if (!input.files[0]) {
        }
        else {
            file = input.files[0];
            fr = new FileReader();
            fr.onload = receivedFile;
            fr.readAsText(file);
        }


        function receivedFile() {

            // Check the number of seqs and positions
            var seqs = getSeqCount(fr.result);
            var pos = getPosCount(fr.result);

            var time = calculateLoad(pos, seqs);
            var progress = $("#progress");

            progress.find(".center-el").html("This reconstruction  " + time);
            progress.removeClass("disable");
        }
    }

    else if (document.getElementById("selected-example").textContent == 'CYP2U1 (139)') {

        progress.find(".center-el").html("This reconstruction should take around 2 minutes");
        progress.removeClass("disable");

    }

    else if (document.getElementById("selected-example").textContent == 'Afriat-Jurnou et al. (29)') {

        progress.find(".center-el").html("This reconstruction should take less than a minutes");
        progress.removeClass("disable");

    }

    else if (document.getElementById("selected-example").textContent == 'Hudson et al. (234)') {

        progress.find(".center-el").html("This reconstruction should take around 3 minutes");
        progress.removeClass("disable");

    }

    else if (document.getElementById("selected-example").textContent == 'Clifton and Jackson (340)') {

        progress.find(".center-el").html("This reconstruction should take around 3 minutes");
        progress.removeClass("disable");

    }



}

/**
 * ----------------------------------------------------------------------------
 *                      Calculate the number of sequences
 *
 * ----------------------------------------------------------------------------
 */

function getSeqCount(alnfile) {
    var seqs = 0;

    if (alnfile.startsWith("CLUSTAL")){
        var lines = alnfile.split("\n");

        lines.shift(); // Remove the header

        // Count the number of sequences in a single section in the file
        var i = lines.length; while (i--) {
            if (lines[i].length > 0 ) {
                seqs += 1;
                if (lines[i-1].length == 0) {
                    return seqs;
                }
            }
        }

        }

    else {
         seqs = alnfile.split('>').length-1;
    }
    return seqs;
}

/**
 * ----------------------------------------------------------------------------
 *                      Calculate the number of positions
 *
 * ----------------------------------------------------------------------------
 */

function getPosCount(alnfile){
    var total = 0;

    if (alnfile.startsWith("CLUSTAL")){

        var lines = alnfile.split("\n");
        lines.shift(); // Remove the header

        var i = lines.length; while (i--) {
            if (lines[i].length > 0) {
                var split = lines[i].split(" ");

                // Get the remainder sequence length from the final section
                var remainder = split[split.length - 1];

                // Get the identifier that occurs before the remainder sequence
                var identifier = lines[i].split(remainder)[0];


                // Identifier occurs in this many sections (besides the final one)
                var re = new RegExp(identifier, 'g');
                var sections = (alnfile.match(re) || []).length - 1;

                // Positions are equal to (50 * num of sections) + length of remainder sequence
                var total = sections * 50 + remainder.length;
                return total
            }
        }

    }

    else {

        // Isolate a single entry
        var entry = alnfile.split(">");
        var lines =entry[1].split("\n");
        lines.shift();

        // Make sure we have all the number of positions from the first entry
        var total = 0;
         var i = lines.length; while (i--) {
            if (lines[i].length > 0) {
                total += lines[i].length
            }
        }

    }

    return total;
}


/**
 * ----------------------------------------------------------------------------
 *                      Calculate the loading duration
 *
 * ----------------------------------------------------------------------------
 */
function calculateLoad(cols, seqs){
    
    var equationLookup = {
        50: [0.0358, 0.4741],
        100: [0.0645, 0.5637],
        150: [0.1147, 0.6532],
        200: [0.1635, 0.7479],
        250: [0.2394, 0.8323],
        300: [0.3028, 0.8586],
        350: [0.4223, 1.0511],
        400: [0.5327, 0.9666],
        450: [0.727, 1.165],
        500: [0.8805, 1.0664],
        550: [1.0799, 1.3722],
        600: [1.3218, 1.2047],
        650: [1.6367, 1.3811],
        700: [1.8567, 1.3268],
        750: [2.231, 1.639],
        800: [2.7039, 1.1248],
        850: [3.0639, 1.6541],
        900: [3.7598, 1.0558],
        950: [4.1819, 2.1209],
        1000: [4.7697, 1.8128]
        };
    alert('round')
    alert (Math.round(seqs / 50))
    var roundedSeqs = Math.round(seqs / 50) *50;
    alert (roundedSeqs);

    if (roundedSeqs > 1000) {
        return "will take a long time to complete.";
    }
    var duration = cols * equationLookup[roundedSeqs][0] + equationLookup[roundedSeqs][1];

    alert (duration);

    if (duration < 60) {
        return "should take less than a minute";
    }
    // Calculate the hours and minutes it will take
    var hours = duration / 3600;
    var absoluteHours = Math.floor(hours);
    var absoluteMins = Math.floor((hours - absoluteHours) * 60);


    // Format to only show the hours and minutes if we have values for them
    var hoursFinal = absoluteHours > 0 ? absoluteHours  + " hours" : "";
    var minsFinal = absoluteMins > 0 ? absoluteMins  + " minutes" : "";

    // Format to remove plural if it isn't needed
    hoursFinal = absoluteHours == 1 ? hoursFinal.slice(0, -1) : hoursFinal;
    minsFinal = absoluteMins == 1 ? minsFinal.slice(0, -1): minsFinal;

    // Tidy up the duration
    var durationFinal = absoluteHours <= 0 || absoluteMins <= 0 ? "should take around " + hoursFinal + minsFinal : "should take around " + hoursFinal + " and " + minsFinal;
    return durationFinal;

}

/**
 * ----------------------------------------------------------------------------
 *                      Reset the POAG stack
 *
 * ----------------------------------------------------------------------------
*/
var reset_poag_stack = function () {
    document.getElementById('reset-button').disabled = true;
    for (var n in phylo_options.tree.all_nodes) {
        var node = phylo_options.tree.all_nodes[n];
        if (!node.extent) {
            d3.select('#fill-' + node.id).attr("stroke", phylo_options.legend.colour_scale(node.y));
            d3.select('#fill-' + node.id).attr("fill", phylo_options.legend.colour_scale(node.y));
        }
    }
    var cur_node = phylo_options.tree.selected_node;
    d3.select('#fill-' + cur_node.id).attr("stroke", phylo_options.style.select_colour);
    d3.select('#fill-' + cur_node.id).attr("fill", phylo_options.style.select_colour);
    poags.multi.nodes = {};
    poags.multi.names = [];
    poags.merged.nodes = [];
    poags.merged.edges = [];
    poags.single.edges = {};
    poags.single.nodes = {};
    poags = process_msa_data(poags);
    poags = process_edges(poags, poags.single.raw.msa, poags.root_poag_name, true);
    poags = process_poag_data(poags, poags.single.raw.inferred, cur_node.name.split("_")[0], true, false);
    poags = process_edges(poags, poags.single.raw.inferred, cur_node.name.split("_")[0], true, false);
    redraw_poags();
}


/**
 * ----------------------------------------------------------------------------
 *                      Update the colour of the POAGS
 * 
 * ----------------------------------------------------------------------------
 */
var update_colour = function (value) {
    poags.options.colours = colour_schemes[value];
    poags.options.display.colours = colour_schemes[value];
    poags.options.graph.colours = colour_schemes[value];
    redraw_poags();
}
/**
 * ---------------------------------------------------------------------------
 *                           Save as PNG
 * http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
 * ---------------------------------------------------------------------------
 */
// Set-up the export button
var save_poag_svg_to_png = function () {
    var svgString = getSVGString(poags.single_svg.node());// + poags.svg.node());
    var width = $("#poag-msa").width();
    var height = $("#poag-msa").height();
    svgString2Image(svgString, 2 * width, 2 * height, 'png', save); // passes Blob and filesize String to the callback
    function save(dataBlob, filesize) {
        saveAs(dataBlob, document.querySelector("#recon-label").textContent.slice(2) + '_graph.png');
    } // FileSaver.js function    }
};
// Set-up the export button
var save_phylo_svg_to_png = function () {
    var width = $("#phylo-tree").width();
    var height = $("#phylo-tree").height();
    phylo_options.svg.attr("width", $("#phylo-tree").width());
    var svgString = getSVGString(phylo_options.svg.node());
    svgString2Image(svgString, 2*width, 2*height, 'png', save); // passes Blob and filesize String to the callback

    function save(dataBlob, filesize) {
        saveAs(dataBlob, document.querySelector("#recon-label").textContent.slice(2) + '_tree.png');
    }
};
// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString(svgNode) {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    var cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);
    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

    return svgString;
    function getCSSStyles(parentElement) {
        var selectorTextArr = [];
        // Add Parent element Id and Classes to the list
        selectorTextArr.push('#' + parentElement.id);
        for (var c = 0; c < parentElement.classList.length; c++)
            if (!contains('.' + parentElement.classList[c], selectorTextArr))
                selectorTextArr.push('.' + parentElement.classList[c]);
        // Add Children element Ids and Classes to the list
        var nodes = parentElement.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            if (!contains('#' + id, selectorTextArr))
                selectorTextArr.push('#' + id);
            var classes = nodes[i].classList;
            for (var c = 0; c < classes.length; c++)
                if (!contains('.' + classes[c], selectorTextArr))
                    selectorTextArr.push('.' + classes[c]);
        }

        // Extract CSS Rules
        var extractedCSSText = "";
        for (var i = 0; i < document.styleSheets.length; i++) {
            var s = document.styleSheets[i];
            try {
                if (!s.cssRules)
                    continue;
            } catch (e) {
                if (e.name !== 'SecurityError')
                    throw e; // for Firefox
                continue;
            }

            var cssRules = s.cssRules;
            for (var r = 0; r < cssRules.length; r++) {
                if (contains(cssRules[r].selectorText, selectorTextArr))
                    extractedCSSText += cssRules[r].cssText;
            }
        }


        return extractedCSSText;
        function contains(str, arr) {
            return arr.indexOf(str) === -1 ? false : true;
        }

    }

    function appendCSS(cssText, element) {
        var styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore(styleElement, refNode);
    }
}


function svgString2Image(svgString, width, height, format, callback) {
    var format = format ? format : 'png';
    var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    var image = new Image();
    image.onload = function () {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(function (blob) {
            var filesize = Math.round(blob.length / 1024) + ' KB';
            if (callback)
                callback(blob, filesize);
        });
    };
    image.src = imgsrc;
}
