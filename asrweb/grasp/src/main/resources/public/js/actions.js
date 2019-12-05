
/**
 * Saves the current reconstruction, the user inputs an email and they get
 * notified once it is complete.
 */
let saveRecon = function(email) {
    // Get the email
    $.ajax({
      url: "/saveRecon",
      type: "POST",
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify({"email": email}),
      success: function (data) {
          saved = true;
        // CHeck if we have an error message
        if (data.value === "login") {
          window.alert("You need to login to save a reconstruction. Now that you have hit save, you can login to your account and your saving will automatically start.");
        } else if (data.value  === "isSaving") {
            window.alert("You can only save one reconstruction at a time, please wait until the previous one has finished.");
        } else if (data.value === 'exists') {
            window.alert("This reconstruction is already saved");
        } else {
          window.alert("Saving reconstruction, check your emails ");
        }
      }, error: function (err) {
        console.log(err);
        $('#motif-warning-alert').removeClass("hidden");
      }
    })
}


var run_asr_app = function(json_str, recon, label, inf, node, proteinIds) {

    /**
     * Run POAG setup
     */
    // Set the SVG ID in the poags data struct
    poags.options = poag_options;
    poags.options.data.raw_svg_id = "poag-all"; // HTML representation
    poags.options.data.target = "#poag-all"; // D3 representation
    poags.page_width = $(window).width();

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

    //set_phylo_params("#phylo-tree", recon);
  phylo_options.svg_info.div_id = "#phylo-tree";
  phylo_options.tree_string = recon;

    runPhyloTree();
    // Set up the svg
    setupPhyloSvg(phylo_options);
    makeTreeScale(phylo_options);
    drawPhyloTree();

    selectedNode = phylo_options.tree.selected_node[T_ID];

    refresh_elements();

    // draw poags
    setup_poags(json_str, true, true, false, phylo_options.tree.selected_node[T_ID]);

    poags.options.poagColours["poag" + (Object.keys(poags.options.poagColours).length + 1)] = poags.options.names_to_colour[phylo_options.tree.selected_node[T_NAME]];
    poags.options.name_to_merged_id[phylo_options.tree.selected_node[T_NAME]] = ["poag" + (Object.keys(poags.options.poagColours).length + 1)];

    redraw_poags();

    poags.retain_previous_position = true;

    refresh_elements();

    // Once everything is complete we want to start getting the taxonIds
    setUpTaxonomy(proteinIds.ncbi, proteinIds.uniprot, proteinIds.ncbi_mapping, proteinIds.uniprot_mapping);
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

    var progress = $("#progress");

    progress.removeClass("disable");

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
        var i = lines.length;
        while (i--) {
            if (lines[i].length > 0 ) {
                seqs += 1;
                if (lines[i-1].length == 0) {
                    return seqs;
                }
            }
        }
    } else {
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
 *                      Reset the POAG stack
 *
 * ----------------------------------------------------------------------------
*/
var reset_poag_stack = function () {
    document.getElementById('reset-button').disabled = true;
    for (var n in phylo_options.tree.all_nodes) {
        var node = phylo_options.tree.all_nodes[n];
        if (!node[T_EXTANT]) {
            d3.select('#fill-' + node[G_ID]).attr("stroke", phylo_options.legend.colour_scale(node[T_Y]));
            d3.select('#fill-' + node[G_ID]).attr("fill", phylo_options.legend.colour_scale(node[T_Y]));
        }
    }
    var cur_node = phylo_options.tree.selected_node;
    d3.select('#fill-' + cur_node[G_ID]).attr("stroke", phylo_options.style.select_colour);
    d3.select('#fill-' + cur_node[G_ID]).attr("fill", phylo_options.style.select_colour);
    poags.multi.nodes = {};
    poags.multi.names = [];
    poags.merged.nodes = [];
    poags.merged.edges = [];
    poags.single.edges = {};
    poags.single.nodes = {};
    poags = process_msa_data(poags);
    poags = process_edges(poags, poags.single.raw.msa, poags.root_poag_name, true);
    poags = process_poag_data(poags, poags.single.raw.inferred, poags.inferred_poag_name, true, false);
    poags = process_edges(poags, poags.single.raw.inferred, poags.inferred_poag_name, true, false);
    redraw_poags();
}

/**
 * ----------------------------------------------------------------------------
 *                      View the consensus sequence path
 *
 * ----------------------------------------------------------------------------
*/
var view_consensus = function () {
    var button_text = document.getElementById('consensus-button').innerHTML.split(" | ")[1];
    if (button_text == "ON") {
        document.getElementById('consensus-button').innerHTML = "View consensus | OFF";
        poags.options.display.draw_consensus = false;
    } else {
        document.getElementById('consensus-button').innerHTML = "View consensus | ON";
        poags.options.display.draw_consensus = true;
    }
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
            var id = nodes[i][G_ID];
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



