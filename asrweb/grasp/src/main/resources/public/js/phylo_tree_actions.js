/**
 * Rotate the phylo tree by 180 degrees
 */
currentRotation = 0;
let rotatePhyloTree = function() {
  let rotations = ['rotate(90deg)', 'rotate(180deg)', 'rotate(270deg)', 'rotate(0deg)'];
  $('#phylo-tree-svg').css('transform', rotations[currentRotation]);
  if (currentRotation % 2 === 0) {
    $('#phylo-tree-svg').css('height', '1600px');
    $('#phylo-tree-svg').css('margin-top', '20px');
  } else {
    $('#phylo-tree-svg').css('height', '100%');
    $('#phylo-tree-svg').css('margin-top', '0px');
  }
  currentRotation ++;
  if (currentRotation > 3) {
    currentRotation = 0;
  }
}




var expand_all_nodes = function () {
  phylo_options.tree.collapse_under = [];
  phylo_options.tree.collapsed_selection = null;
  set_children_un_terminated(phylo_options.tree.root);
  collapse_subtree(phylo_options.tree.root, phylo_options.tree.all_nodes.length
      - 1);
  redraw_phylo_tree();
  refresh_tree();
}

let searchTree = function (search, clear, exact) {
  let terms = search.split("*"); // wildcard '*'
  let nodes = phylo_options.tree.node_dict;

  Object.keys(nodes).forEach(function(e) {
    let node = nodes[e];
    let found = false;
    if (search !== "") {
      let ind = 0;
      for (let s in terms) {
        if ((!exact && node[T_NAME].substring(ind,
                node[T_NAME].length).toLowerCase().includes(
                terms[s].toLowerCase()))
            || (exact && node[T_NAME] === search)) {
          ind = node[T_NAME].indexOf(terms[s]) + terms[s].length - 1;
          found = true;
          node[T_CONTAINS_SEARCH] = true;
        } else {
          if (node[T_TAXA] !== undefined && node[T_TAXA] !== null) {
            let tax = node[T_TEXT];
            if (tax === undefined) {
              if (node[T_EXTANT]) {
                tax = getTaxaAsText(node[T_TAXA], "NONE", node[T_EXTANT], node[T_NAME]);
              } else {
                tax = getTaxaAsText(node[T_TAXA], node[T_COMMON_TAXA][T_DIFFER_RANK],
                    node[T_EXTANT], node[T_NAME]);
              }
              node[T_TEXT] = tax;
            }
            if ((!exact && tax.substring(ind,
                        tax.length).toLowerCase().includes(
                        terms[s].toLowerCase()))
                    || (exact && tax === search)) {
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

  for (let n in phylo_options.tree.node_dict) {
    let e = phylo_options.tree.node_dict[n];
    if (e[T_CONTAINS_SEARCH]) {
      if (e[T_EXTANT]) {
        d3.select("#text-" + e[T_ID]).style('fill', phylo_options.style.hover_fill);
      } else {
        d3.select("#fill-" + e[T_ID]).attr("stroke-width", "10px");
        d3.select("#fill-" + e[T_ID]).attr("stroke", phylo_options.style.hover_fill);
      }
    } else {
      if (e[T_EXTANT]) {
        d3.select("#text-" + e[T_ID]).style('fill', 'black');
      } else {
        d3.select("#fill-" + e[T_ID]).attr("stroke-width", 0)
      }
    }
  }

};

/**
 * Set all parent nodes to specified flag
 *
 * @param node
 * @param flag
 */
var set_all_contains_search = function (node, flag) {
  if (node[T_CHILDREN] != undefined) {
    node[T_CONTAINS_SEARCH] = flag;
    for (var n in node[T_CHILDREN]) {
      set_all_contains_search(node[T_CHILDREN][n], flag);
    }
  }
}
