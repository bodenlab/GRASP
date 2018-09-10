
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
        if ((!exact && extant.name.substring(ind,
                extant.name.length).toLowerCase().includes(
                terms[s].toLowerCase()))
            || (exact && extant.name == search)) {
          ind = extant.name.indexOf(terms[s]) + terms[s].length - 1;
          found = true;
        } else {
          if (extant.taxonomy !== undefined && extant.taxonomy !== null) {
            var ranks = ["domain", "kingdom", "phylum", "class", "order",
              "family", "genus", "species"]

            for (var rank in ranks) {
              var tax = extant.taxonomy[ranks[rank]];
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
    if (clear === true || found === true || extant.contains_search
        == undefined) {
      extant.contains_search = found;
    }
  }
  // if extant contains a search term, then iterate up the tree to indicate to all ancestral nodes that a child
  // contains the search term (this will be used when nodes are collapsed)
  // update parents to show if children contains search terms
  set_all_contains_search(phylo_options.tree.root, false);
  for (var n in phylo_options.tree.extants) {
    var extant = phylo_options.tree.extants[n];
    if (extant.contains_search) {
      var parent = extant.parent_node;
      // only search until constains_search is true (may have been set from a different extant)
      while (parent != undefined && (parent.contains_search == undefined
          || !parent.contains_search)) {
        parent.contains_search = true;
        parent = parent.parent_node;
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
  if (node.children != undefined) {
    node.contains_search = flag;
    for (var n in node.children) {
      set_all_contains_search(node.children[n], flag);
    }
  }
}
