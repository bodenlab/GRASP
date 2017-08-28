/**
 *  ------------------------------------------------------------------
 *                          Main Function 
 *                          
 *   Runs the JS commands for the phylo tree and the POAG.
 *  ------------------------------------------------------------------
 */

var run_asr_app = function(json_str, recon, label) {

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
 * Keep the MSA and the infferd at the top of the page 
 * i.e. ignore the scroll.
 * 
 */
//document.getElementById("poag-content").addEventListener('scroll', function(evt) {
//    // For the MSA POAG we want to stick it to the top
//    var group = poags.groups.single[poags.single.names[0]];
//    group.node().setAttribute('y', 10 + this.scrollTop);
//}, false)


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
 *                      Update the colour of the POAGS
 * 
 * ----------------------------------------------------------------------------
 */
var update_colour = function (value) {
    poags.options.colours = colour_schemes[value];
    poags.options.display.colours = colour_schemes[value];
    poags.options.graph.colours = colour_schemes[value];
    //selected_colour = colour_schemes[value];

    //if (value == "cinema") {
    //    poags.options.pie.stroke = "grey";
    //} else {
    //    poags.options.pie.stroke = "white";
    //}

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
    var svgString = getSVGString(poags.svg.node());
    var width = poag_options.style.width;
    var height = poag_options.style.height;
    svgString2Image(svgString, 2 * width, 2 * height, 'png', save); // passes Blob and filesize String to the callback

    function save(dataBlob, filesize) {
        saveAs(dataBlob, 'D3 vis exported to PNG.png'); // FileSaver.js function
    }
};
// Set-up the export button
var save_phylo_svg_to_png = function () {
    var svgString = getSVGString(phylo_options.svg.node());
    var width = phylo_options.svg_info.width;
    var height = phylo_options.svg_info.height;
    svgString2Image(svgString, 2 * width, 2 * height, 'png', save); // passes Blob and filesize String to the callback

    function save(dataBlob, filesize) {
        saveAs(dataBlob, 'D3 vis exported to PNG.png'); // FileSaver.js function
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
