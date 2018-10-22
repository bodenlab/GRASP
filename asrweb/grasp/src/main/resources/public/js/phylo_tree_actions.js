
var expand_all_nodes = function () {
  phylo_options.tree.collapse_under = [];
  phylo_options.tree.collapsed_selection = null;
  set_children_un_terminated(phylo_options.tree.root);
  collapse_subtree(phylo_options.tree.root, phylo_options.tree.all_nodes.length
      - 1);
  redraw_phylo_tree();
  refresh_tree();
}

var search_tree = function (search, clear, exact) {
  var terms = search.split("*"); // wildcard '*'
  var found_in_any = false; // keep track of if found in ANY extants (for populating parent nodes)
  for (var n in phylo_options.tree.extants) {
    var extant = phylo_options.tree.extants[n];
    var found = false;
    if (search != "") {
      var ind = 0;
      for (var s in terms) {
        if ((!exact && extant[T_NAME].substring(ind,
                extant[T_NAME].length).toLowerCase().includes(
                terms[s].toLowerCase()))
            || (exact && extant[T_NAME] == search)) {
          ind = extant[T_NAME].indexOf(terms[s]) + terms[s].length - 1;
          found = true;
        } else {
          if (extant[T_TAXA] !== undefined && extant[T_TAXA] !== null) {
            var ranks = ["domain", "kingdom", "phylum", "class", "order",
              "family", "genus", "species"]

            for (var rank in ranks) {
              var tax = extant[T_TAXA][ranks[rank]];
              if (tax !== undefined && tax !== null) {
                if ((!exact && tax.substring(ind,
                        tax.length).toLowerCase().includes(
                        terms[s].toLowerCase()))
                    || (exact && tax == search)) {
                  ind = tax.indexOf(terms[s]) + terms[s].length - 1;
                  found = true;
                  break;
                }
              }
            }
          } else {
            found = false;
            break;
          }
        }
        if (found) {
          break;
        }
      }
    }
    if (clear === true || found === true || extant[T_CONTAINS_SEARCH]
        == undefined) {
      extant[T_CONTAINS_SEARCH] = found;
    }
  }
  // if extant contains a search term, then iterate up the tree to indicate to all ancestral nodes that a child
  // contains the search term (this will be used when nodes are collapsed)
  // update parents to show if children contains search terms
  set_all_contains_search(phylo_options.tree.root, false);
  for (var n in phylo_options.tree.extants) {
    var extant = phylo_options.tree.extants[n];
    if (extant[T_CONTAINS_SEARCH]) {
      var parent = extant[T_PARENT];
      // only search until constains_search is true (may have been set from a different extant)
      while (parent != undefined && (parent[T_CONTAINS_SEARCH] == undefined
          || !parent[T_CONTAINS_SEARCH])) {
        parent[T_CONTAINS_SEARCH] = true;
        parent = parent[T_PARENT];
      }
    }
  }
  refresh_tree();
}

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
