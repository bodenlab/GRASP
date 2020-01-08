/**
 *
 * File used for annotating the tree.
 *
 * Users are able to upload annotation files and search the values in the tree.
 *
 */
function uploadAnnotFile() {
    phylo_options.tree.nodes_with_data = {};
    let splitValue = '\t';
    let annotData = document.getElementById('annot-text-area').value;

    let lines = annotData.split('\n');
    // line 0 is the header so we want to add this to the options in the dropdown menu
    let header = lines[0].split(splitValue);
    // Need to parse the format
    for (let l in lines) {

        // This is the header so we don't want to include that
        if (l != 0) {
            let lineData = lines[l].split(splitValue);
            // We say the id MUST be in the first element!
            // Check if we have a node with that ID
            let id = formatTreeNodeId(lineData[0]);

            // Do we have that?
            let node = phylo_options.tree.node_dict[id];

            if (node !== undefined) {
                node[T_ANNOT] = true;
                for (let d in lineData) {
                    if (d != 0) {
                        // Lets add this info to the node.
                        node[ANNOT + header[d]] = lineData[d];
                        phylo_options.tree.nodes_with_data[node[T_ID]] = node;
                        d3.select("#text-" + node[T_ID]).style('font-weight', 800);
                    }

                }
            }

        }
    }

}


function searchAnnot(text) {
    // We use the value that's in the key box
    let keys =  document.getElementById('annot-key-value').value.split(',');

    let terms = text.split("*"); // wildcard '*'
    let nodes = phylo_options.tree.nodes_with_data;

    Object.keys(nodes).forEach(function(e) {
        let node = nodes[e];
        let found = false;
        if (text !== "") {
            let ind = 0;
            for (let s in terms) {
                for (let sKey in keys) {
                    let searchKey = keys[sKey];

                    if (node[ANNOT + searchKey] !== undefined && node[ANNOT + searchKey] !== null) {
                        let tax = node[ANNOT + searchKey];

                        if (tax != undefined && (tax.substring(ind,
                            tax.length).toLowerCase().includes(
                            terms[s].toLowerCase()))
                            || (tax === text)) {
                            ind = tax.indexOf(terms[s]) + terms[s].length - 1;
                            found = true;
                            node[T_CONTAINS_SEARCH] = true;
                            break;
                        }
                    } else {
                        found = false;
                        node[T_CONTAINS_SEARCH] = false;
                        break;
                    }
                }
                if (found) {
                    node[T_CONTAINS_SEARCH] = true;
                    break;
                }
            }
            node[T_CONTAINS_SEARCH] = found;
        } else {
            node[T_CONTAINS_SEARCH] = false;
        }
    });

    for (let n in phylo_options.tree.nodes_with_data) {
        let e = phylo_options.tree.nodes_with_data[n];
        if (e[T_CONTAINS_SEARCH]) {
            highlightNode(e);
        } else {
            unhighlightNode(e);
        }
    }

}

function highlightNode(node) {
    if (node[T_COLLAPSED] || node[T_DEPTH] > phylo_options.tree.depth) {
        highlightParent(node);
    }
    if (node[T_EXTANT]) {
        d3.select("#text-" + node[T_ID]).style('fill', phylo_options.style.hover_fill);
    } else {
        if (node[T_TERMINATED]) {
            d3.select("#text-coll-" + node[T_ID]).attr("fill",
                phylo_options.style.hover_fill);
            d3.select("#path-" + node[T_ID]).attr("stroke",
                phylo_options.style.hover_fill);
            d3.select("#text-coll-" + node[T_ID]).style("font-weight", 800);
        } else {
            d3.select("#fill-" + node[T_ID]).attr("r", 2 * phylo_options.style.node_radius);
            d3.select("#fill-" + node[T_ID]).attr("fill", phylo_options.style.hover_fill);

        }
    }
}

function unhighlightNode(node) {
    if (node[T_COLLAPSED] || node[T_DEPTH] > phylo_options.tree.depth) {
        unhighlightParent(node);
    }
    if (node[T_EXTANT]) {

        d3.select("#text-" + node[T_ID]).style('fill', 'black');
    } else {
        if (node[T_TERMINATED]) {
            d3.select("#text-coll-" + node[T_ID]).attr("fill", "black");
            d3.select("#path-" + node[T_ID]).attr("stroke", "black");
            d3.select("#text-coll-" + node[T_ID]).style("font-weight", 400);
        } else {
            d3.select("#fill-" + node[T_ID]).attr("r", phylo_options.style.node_radius);
            d3.select("#fill-" + node[T_ID]).attr("fill", getFillForNode(node));
        }
    }
}

function highlightParent(node) {
    if (node[T_TERMINATED]) {
        highlightNode(node);
        node[T_CONTAINS_SEARCH] = true;
    } else if (node[T_COLLAPSED] || node[T_DEPTH] >= phylo_options.tree.depth) {
        highlightParent(node[T_PARENT]);
        node[T_CONTAINS_SEARCH] = true;
    } else {
        highlightNode(node);
        node[T_CONTAINS_SEARCH] = true;
    }
}


function unhighlightParent(node) {
    if (node[T_COLLAPSED] || node[T_DEPTH] > phylo_options.tree.depth) {
        unhighlightParent(node[T_PARENT]);
        node[T_CONTAINS_SEARCH] = false;
    } else {
        unhighlightNode(node);
        node[T_CONTAINS_SEARCH] = false;
    }
}