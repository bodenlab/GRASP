var annotate_taxonomy = function () {
  // Add the taxon information to the leaf nodes

  $('#taxonomy-info-alert').removeClass("hidden");

  $.when(get_taxon_ids()).then(function () {
    queue_taxonomy()
  })
};

const NCBI = 12;
const UNIPROT = -3;

/**
 * Stores the ID maping, it is used to collect information while the reconstruction is loading
 */
let idMapping = {};


function queryTaxonIds(ncbiList, uniprotList) {
  let requests = [];

  requests.push(get_taxon_id_from_ncbi(ncbiList.join(","), ncbiList));

  let uniprotNames = "";
  for (let i = 0; i < uniprotList.length; i++) {
    uniprotNames += "id:" + uniprotList[i];
    if (i < uniprotList.length - 1) {
      uniprotNames += "+OR+";
    }
  }
  requests.push(get_taxon_id_from_uniprot(uniprotNames, uniprotList))

  /**
   * When we get the results back we want to post them to the server and that
   * way we can easily access these multiple times rather than having to
   * re-download the taxon information each time.
   */
  return $.when.apply(undefined, requests).then(function () {
    $.ajax({
      url: "/taxa",
      type: "POST",
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify(idMapping),
      success: function (data) {
        console.log(data);
        applyTaxonInfo(data);
      }, error: function (err) {
        console.log(err);
      }
    })
  });
}

/**
 * Helper function to get NCBI or uniprot ID. Modularises it out so it can change.
 */
function getId(extentId, type) {
  if (type == NCBI) {
    return phylo_options.tree.extants[extentId].name.split("|")[0].split(".")[0]
  } else if (type == UNIPROT) {
    return phylo_options.tree.extants[extentId].name.split("|")[1]
  }
  // Otherwise it hasn't been specified so we need to determine it from the identifier.
  if (phylo_options.tree.extants[extentId].name.substr(2, 3) === '|') {
    return phylo_options.tree.extants[extentId].name.split("|")[1];
  }
  return phylo_options.tree.extants[extentId].name.split("|")[0].split(".")[0];
}

/**
 * Adds the taxonomic info to the tree.
 */
function applyTaxonInfo(taxonInfo) {
  for (let i in phylo_options.tree.extants) {
      phylo_options.tree.extants[i].taxonomy = taxonInfo[phylo_options.tree.extants[i].taxon];
  }
  get_common_taxon(phylo_options.tree.root);
  refresh_tree();
}

/**
 * Gets the taxonomic IDS from NCBI.
 */
function get_taxon_id_from_ncbi(extentNames, extentList) {
  let url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id="
      + extentNames + "&retmode=xml&rettype=docsum";
  console.log(url)
  idMapping["ncbi"] = {};
  let idsObsolete = [];
  return promise = $.ajax({
    url: url,
    type: "POST",
    headers: {
      "Content-Type": "text/plain"
      // 'Access-Control-Allow-Origin': "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    },
    async: true,
    success: function (speciesData) {
      if (speciesData != null) {
        for (let i in extentList) {
          let path = "*/DocSum/Item[@Name='AccessionVersion'][contains(., '"
              + extentList[i] + "')]/../Item[@Name='TaxId']/text()";
          let node = speciesData.evaluate(path, speciesData, null,
              XPathResult.ANY_TYPE, null);
          try {
            let thisNode = node.iterateNext();
            while (thisNode) {
              idMapping["ncbi"][extentList[i]] = thisNode.textContent;
              thisNode = node.iterateNext();
            }
          } catch (e) {
            console.log(e)
          }
        }
        let obsoleteCheck = "//DocSum[Item[contains(.," +
            " 'removed')]]//Item[@Name='AccessionVersion']/text()";
        let obsoleteNode = speciesData.evaluate(obsoleteCheck, speciesData,
            null, XPathResult.ANY_TYPE, null);
        try {
          let thisObsoleteNode = obsoleteNode.iterateNext();
          while (thisObsoleteNode) {
            idsObsolete.push(thisObsoleteNode.textContent);
            thisObsoleteNode = obsoleteNode.iterateNext();
          }
        } catch (e) {
          bootstrap_alert.warning("Error: There was a problem reading the XML records "
              + e);
        }
      }
      return null;
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      $("#taxonomy-info-alert").addClass("hidden");
      $("#taxonomy-failed-alert").removeClass("hidden");
      return null;
    }
  });
}

/**
 * Gets the taxonomic IDS from Uniprot.
 */
function get_taxon_id_from_uniprot(extantNames, extentList) {

  let url = "https://www.uniprot.org/uniprot/?query=" + extantNames
      + "&format=tab&columns=id,entry%20name,protein%20names,organism,organism%20id,lineage-id(all),reviewed";
  let speciesDict = {}
  idMapping["uniprot"] = {};
  let idsObsolete = [];
  return promise = $.ajax({
    url: url,
    type: "POST",
    headers: {
      "Content-Type": "text/plain"
      // 'Access-Control-Allow-Origin': "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    },
    async: true,
    success: function (speciesData) {
      let splitData = speciesData.split("\n");
      for (var line in splitData) {
        if (splitData[line] != null) {
          let splitLine = splitData[line].split("\t");
          if (splitLine[2] != null) {
            if (splitLine[2].includes("Deleted") || (splitLine[2].includes(
                    "Merged"))) {
              phylo_options.tree.obsolete_list.push(splitLine[0]);
            }
            else {
              let taxonList = splitLine[4].split(",");
              speciesDict[splitLine[0]] = taxonList[taxonList.length
              - 1].trim();
            }
          }
        }
      }
      for (let i in extentList) {
        if (extentList[i] in speciesDict) {
          idMapping["uniprot"][extentList[i]] = speciesDict[extentList[i]];
        }
      }
      return null;
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      if (errorThrown == "Bad Request") {
        let response = XMLHttpRequest.responseText;
        alert(response.substring(response.indexOf("<ERROR>") + 7,
            response.indexOf("</ERROR>")) + "\n List of IDs was " + idString
            + "\n" + records.length
            + " sequences failed as a result of this and have been added to unmappable");
      }
      else {
        console.log(errorThrown);
      }
    }
  });
}

var queue_taxonomy = function () {

  let requests = [];
  let taxon_array = [];

  let extant_list = phylo_options.tree.extants.slice()

  while (extant_list.length) {
    let taxon_ids = "";
    let chunk = extant_list.splice(0, 20)

    if (chunk !== null && chunk !== undefined) {
      for (let i in chunk) {
        if (chunk[i].taxon_id == undefined) {
          phylo_options.tree.failed_taxonomy_list.push(chunk[i].name)
        }
        else {
          taxon_ids += chunk[i].taxon_id + ","
        }
      }
      // Remove the final comma
      taxon_ids = taxon_ids.substring(0, taxon_ids.length - 1)
      taxon_array.push(taxon_ids)
    }
  }

  for (let i = 0; i < taxon_array.length; i++) {
    requests.push(get_taxonomy(taxon_array[i]))
  }

  return $.when.apply(undefined, requests).then(function () {

    // Assign topmost common taxon information for internal nodes
    get_common_taxon(phylo_options.tree.root);
    refresh_tree();

    // Add a warning if not all the taxonomy annotations worked

    if (phylo_options.tree.failed_taxonomy_list.length > 0) {
      $('#taxonomy-info-alert').addClass("hidden");

      let counts = phylo_options.tree.failed_taxonomy_list.length + " out of "
          + phylo_options.tree.extants.length + " sequences couldn't be mapped."

      add_warning(phylo_options.tree.failed_taxonomy_list,
          "#taxonomy-warning-alert", "Warning! " + counts
          + " The following sequences could not be mapped to their taxonomy: ");
    }
    else { //Everything worked, so add the success alert
      $('#taxonomy-info-alert').addClass("hidden");
      $('#taxonomy-success-alert').removeClass("hidden");
    }
    // Add a warning if we found obsolete sequences
    if (phylo_options.tree.obsolete_list.length > 1) {
      add_warning(phylo_options.tree.obsolete_list, "#obsolete-warning-alert",
          "Warning! The following sequences are obsolete: ");
    }
    redraw_poags();
    // Here we want to send back the taxonomic ID's that had a mapping to the DB
  })
}

/**
 * Annotate the extant sequences with their taxonomic ids
 */
var get_taxonomy = function (taxon_ids) {
  var ranks = ["kingdom", "phylum", "class", "order", "family", "genus",
    "species"]

  var url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=taxonomy&id="
      + taxon_ids + "&retmode=xml&rettype=all"; // Taxonomy url
  console.log(url)
  return promise = $.ajax({
    url: url,
    type: 'POST',
    headers: {
      'Content-Type': 'text/plain'
      // 'Access-Control-Allow-Origin': "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    },
    async: true,
    success: function (speciesData) {
      if (speciesData != null) {
        for (var i in phylo_options.tree.extants) {
          for (var rank in ranks) {
            let path = " //TaxId[.//text()='"
                + phylo_options.tree.extants[i].taxon_id
                + "']/../LineageEx/Taxon/Rank[.//text()='" + ranks[rank]
                + "']/../ScientificName[1]";
            var node = speciesData.evaluate(path, speciesData, null,
                XPathResult.ANY_TYPE, null);
            try {
              var thisNode = node.iterateNext();
              while (thisNode) {
                // If taxonomy dict already exists add to it
                if ("taxonomy" in phylo_options.tree.extants[i]) {
                  phylo_options.tree.extants[i].taxonomy[ranks[rank]] = thisNode.textContent;
                }
                // Create a new taxonomy dict and annotate it with the available taxonomic ranks
                else {
                  phylo_options.tree.extants[i].taxonomy = {};
                  for (rank in ranks) {
                    phylo_options.tree.extants[i].taxonomy[rank] == "";
                  }
                  phylo_options.tree.extants[i].taxonomy[ranks[rank]] = thisNode.textContent;
                }
                thisNode = node.iterateNext();
              }
            } catch (e) {
              console.log(e)
            }
          }
        }
      }
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      if (errorThrown == "Bad Request") {
        // response = XMLHttpRequest.responseText
        // alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable")
      }
      else {

      }
    }
  });

}

var add_warning = function (list, type, msg) {

  var list_string = "";

  for (i = 0; i < list.length; i++) {
    list_string += list[i] + ", "
  }
  // Remove final comma
  list_string = list_string.substring(0, list_string.length - 2)
  $(type).removeClass("hidden").html(msg + list_string)

};



/**
 * Get the most common taxonomy labels for each ancestral node by counting all unique extant taxonomy labels
 * and ranking based on highest number
 */
var get_common_taxon = function (node) {
  if (node.children == undefined) {
    return;
  }
  // var ranks = ["superdomain", "domain", "subdomain", "superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class", "subbclass", "superorder", "order", "suborder", "superfamily", "family", "subfamily", "supergenus", "genus", "subgenus", "superspecies", "species", "subspecies"]
  var ranks = ["domain", "kingdom", "phylum", "class", "order", "family",
    "genus", "species"]

  var taxonomy = {};
  for (var rank in ranks) {
    taxonomy[ranks[rank]] = {};
  }
  for (var n in node.children) {
    var child = node.children[n];
    if (child.taxonomy == undefined) {
      get_common_taxon(child);
    }

    if (child.taxonomy != undefined && child.taxonomy != null) {
      for (var rank in ranks) {
        var tax = taxonomy[ranks[rank]];
        var child_labels = {};
        if (!(child.children == undefined)) {
          for (var r in child.taxonomy[ranks[rank]]) {
            child_labels[r] = child.taxonomy[ranks[rank]][r];
          }
        } else {
          child_labels[child.taxonomy[ranks[rank]]] = 1;
        }
        for (var label in child_labels) {
          var count = child_labels[label];
          if (tax[label] == undefined) {
            tax[label] = 0;
          }
          tax[label] += count;
        }
      }
    }
  }

  var common_tax = null;
  var common_rank = null;
  var differ_rank = null;

  // find first rank that differs (not including undefined)
  for (var r in ranks) {
    var tax = taxonomy[ranks[r]]
    var keys = Object.keys(tax)
    if ((keys.includes('undefined') && keys.length > 2) || (!keys.includes(
            'undefined') && keys.length > 1)) {
      differ_rank = r
      break;
    }
    common_tax = Object.keys(tax)[0];
    common_rank = r;
  }

  var common = {};
  if (common_rank === null) {
    common.common_rank = null;
  } else {
    common.common_rank = ranks[common_rank];
  }
  common.common_taxonomy = common_tax;
  common.differ_rank = ranks[r];
  node.common_taxonomy = common;
  node.taxonomy = taxonomy;

  // update node for drawing
  set_common_tax_node(node);
}

var set_common_tax_node = function (node) {
  for (var n in phylo_options.tree.all_nodes) {
    var phylo_node = phylo_options.tree.all_nodes[n];
    if (phylo_node.id === node.id) {
      phylo_node.common_rank = node.common_taxonomy.common_rank;
      phylo_node.common_taxonomy = node.common_taxonomy.common_taxonomy;
      // add common_taxonomy to poags info for name labelling
      if (phylo_node.common_taxonomy != undefined) {
        poags.taxonomy[node.name.split(
            "_")[0]] = node.common_taxonomy.common_rank.charAt(0).toUpperCase()
            +
            node.common_taxonomy.common_rank.slice(1) + ": "
            + node.common_taxonomy.common_taxonomy;
      }
      return;
    }
  }
}



/**
 * Annotate the extant sequences with their taxonomic ids
 */

// var get_taxon_ids = function () {
//   // Create a new copy of the extant list
//   let extant_list = phylo_options.tree.extants.slice()
//   let ncbi_array = []
//   let uniprot_array = []
//
//   while (extant_list.length) {
//     let ncbi_names = "";
//     let uniprot_names = "";
//     let chunk = extant_list.splice(0, 50)
//
//     for (let i in chunk) {
//       if (chunk[i] !== null && chunk[i] !== undefined) {
//         if (chunk[i].name[2] == "|") {
//           uniprot_names += "id:" + chunk[i].name.split("|")[1] + "+OR+";
//         }
//         else {
//           ncbi_names += chunk[i].name.split("|")[0].split(" ")[0] + ","
//         }
//         if (chunk[i].name.indexOf('|') > -1) {
//           uniprot_names += "id:" + chunk[i].name.split("|")[1] + "+OR+";
//         }
//         else {
//           ncbi_names += chunk[i].name + ","
//         }
//       }
//     }
//     // Remove the final comma or "+OR+"
//     ncbi_names = ncbi_names.substring(0, ncbi_names.length - 1);
//     uniprot_names = uniprot_names.substring(0, uniprot_names.length - 4);
//
//     if (ncbi_names.length > 0) {
//       ncbi_array.push(ncbi_names)
//     }
//
//     if (uniprot_names.length > 0) {
//       uniprot_array.push(uniprot_names)
//     }
//   }
//
//   let requests = []
//   console.log(ncbi_array);
//   console.log(uniprot_array);
//   for (let i = 0; i < ncbi_array.length; i++) {
//     requests.push(get_taxon_id_from_ncbi(ncbi_array[i]))
//   }
//
//   for (let i = 0; i < uniprot_array.length; i++) {
//     requests.push(get_taxon_id_from_uniprot(uniprot_array[i]))
//   }
//
//   return $.when.apply(undefined, requests).then(function () {
//     // console.log("About to return")
//   })
// }

// function get_taxon_id_from_ncbi(extant_names) {
//     var url= "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id=" + extant_names +"&retmode=xml&rettype=docsum";
//
//     return promise = $.ajax({
//         url: url,
//         type: 'POST',
//         headers: {
//             'Content-Type': 'text/plain'
//             // 'Access-Control-Allow-Origin': "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//         },
//         async: true,
//         success: function (speciesData) {
//             if (speciesData != null) {
//                 for (let i in phylo_options.tree.extants) {
//                     let path = "*/DocSum/Item[@Name='AccessionVersion'][contains(., '" + phylo_options.tree.extants[i].name.split("|")[0].split(" ")[0] + "')]/../Item[@Name='TaxId']/text()";
//                     let node = speciesData.evaluate(path, speciesData, null, XPathResult.ANY_TYPE, null);
//                     try {
//                         let thisNode = node.iterateNext();
//                         while (thisNode) {
//                             phylo_options.tree.extants[i].taxon_id = thisNode.textContent;
//                             thisNode = node.iterateNext();
//                         }
//                     } catch (e) {
//                         console.log(e)
//                     }
//                 }
//                 let obsoleteCheck = "//DocSum[Item[contains(.," +
//                     " 'removed')]]//Item[@Name='AccessionVersion']/text()";
//                 let obsoleteNode = speciesData.evaluate(obsoleteCheck, speciesData, null, XPathResult.ANY_TYPE, null);
//                 try {
//                     let thisObsoleteNode = obsoleteNode.iterateNext();
//                     while (thisObsoleteNode) {
//                         phylo_options.tree.obsolete_list.push(thisObsoleteNode.textContent);
//                         thisObsoleteNode = obsoleteNode.iterateNext();
//                     }
//                 } catch (e) {
//                     bootstrap_alert.warning('Error: There was a problem reading the XML records ' + e);
//                 }
//             }
//         },
//         error: function(XMLHttpRequest, textStatus, errorThrown) {
//             $('#taxonomy-info-alert').addClass("hidden");
//             $('#taxonomy-failed-alert').removeClass("hidden");
//             return
//         }
//     });
// }
//
//
// function get_taxon_id_from_uniprot(uniprot_names) {
//
//     let url = "https://www.uniprot.org/uniprot/?query=" + uniprot_names +"&format=tab&columns=id,entry%20name,protein%20names,organism,organism%20id,lineage-id(all),reviewed";
//     let speciesDict = {}
//
//     return promise = $.ajax({
//         url: url,
//         type: 'POST',
//         headers: {
//             'Content-Type':'text/plain'
//             // 'Access-Control-Allow-Origin': "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//         },
//         async: true,
//         success: function(speciesData) {
//             let splitData = speciesData.split("\n");
//             for (var line in splitData) {
//                 if (splitData[line] != null){
//                     let splitLine = splitData[line].split("\t");
//                     if (splitLine[2] != null){
//                         if (splitLine[2].includes("Deleted") || (splitLine[2].includes("Merged"))) {
//                             phylo_options.tree.obsolete_list.push(splitLine[0]);
//                         }
//                         else {
//                             let taxonList = splitLine[4].split(",");
//                             speciesDict[splitLine[0]] = taxonList[taxonList.length - 1].trim();
//                         }
//                     }
//                 }
//             }
//             for (let i in phylo_options.tree.extants) {
//                 if (phylo_options.tree.extants[i].name.split("|")[1] in speciesDict){
//                     // console.log('uniprot update')
//                     phylo_options.tree.extants[i].taxon_id = speciesDict[phylo_options.tree.extants[i].name.split("|")[1]];
//                 }
//             }
//         },
//         error: function(XMLHttpRequest, textStatus, errorThrown) {
//             if (errorThrown == "Bad Request"){
//                 response = XMLHttpRequest.responseText;
//                 alert(response.substring(response.indexOf("<ERROR>") +7, response.indexOf("</ERROR>")) + "\n List of IDs was " + idString + "\n" + records.length + " sequences failed as a result of this and have been added to unmappable");
//                 obsoleteList = [];
//
//             }
//             else {
//                 console.log(errorThrown);
//             }
//         }
//     });
// }

/**
 * =============================================================================
 *
 *                    Drawing Taxonomy Information
 *
 * =============================================================================
 * @param node
 * @param group
 * @param options
 */

var add_taxonomy_modal_info = function (node, group, options) {

  var x = 0;
  var y = 20;

  if (node.common_rank === undefined && !node.extent) {
    group.append("text")
    .attr("id", "text-modal-tax-" + node.id)
    .attr("name", node.name)
    .attr("font-family", options.font_family)
    .attr("font-size", options.font_size)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("opacity", 1)
    .attr("transform", "translate(" + x + "," + y + ")")
    .text(function () {
      return "No taxonomic information available.";
    });
    return;
  }

  var node_info = phylo_options.tree.node_dict[node.id];
  var tax_info = node_info.taxonomy;

  var counter = 0;
  var padding = 20;
  for (var rank in tax_info) {
    var tax = tax_info[rank];
    if (node.extent || rank !== node_info.common_taxonomy.differ_rank) {
      if (!node.extent) {
        tax = Object.keys(tax_info[rank])[0];
      }
      if (tax !== "undefined" && tax !== undefined) {
        // Add taxonomy text info
        var y_text = y + counter * padding;
        group.append("text")
        .attr("id", "text-modal-tax-" + node.id + "-" + counter)
        .attr("name", node.name)
        .attr("font-family", options.font_family)
        .attr("font-size", options.font_size)
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .attr("opacity", 1)
        .attr("transform", "translate(" + x + "," + y_text + ")")
        .text(function () {
          return rank.charAt(0).toUpperCase() + rank.slice(1) + ": " + tax;
        });
        counter++;
      }
    } else {
      // Draw histogram of the different taxonomic rank
      // #extants in rank
      var y_text = y + counter * padding;
      var rank_differ = node_info.common_taxonomy.differ_rank;
      group.append("text")
      .attr("id", "text-modal-tax-" + node.id + "-" + counter)
      .attr("name", node.name)
      .attr("font-family", options.font_family)
      .attr("font-size", options.font_size)
      .attr("fill", "black")
      .attr("text-anchor", "start")
      .attr("opacity", 1)
      .attr("transform", "translate(" + x + "," + y_text + ")")
      .text(function () {
        return rank_differ.charAt(0).toUpperCase() + rank_differ.slice(1)
            + ": ";
      });
      tax = tax_info[rank_differ];
      draw_histogram_taxonomy(node, tax, group, options, 0, y_text);
      return;
    }
  }
}

var draw_histogram_taxonomy = function (node, taxonomy, group, options, x, y) {
  var num_cols = Object.keys(taxonomy).length;
  // TODO: limit to N taxonomic ranks

  var col_width = options.modal_width / num_cols;
  var rect_height = options.hist_height;

  var hist_svg = group.append("svg")
  .attr("id", "tax_hist_svg");

  var count = 0;

  for (var tax in taxonomy) {
    var height = rect_height * (taxonomy[tax]
        / phylo_options.tree.node_dict[node.id].num_extants);
    var x_t = x + count * col_width;
    var y_t = y + rect_height - height;
    var c = options.hist_colours[count % options.hist_colours.length]
    hist_svg.append("rect")
    .attr("id", "rect-tax-" + count)
    .attr("class", function () {
      return "bar2 movable";
    })
    .attr("x", x_t)
    .attr("y", y_t)
    .attr("width", col_width - 1) // -1 for white space between bars
    .attr("height", height)
    .attr("fill", c);

    // add number of extants above rectangle
    var x_t_r = x_t + col_width / 2 - 5;
    var y_t_r = y + rect_height + 2;
    var y_t_l = y_t - 5;
    hist_svg.append("text")
    .attr("id", "text-tax-num-" + count)
    .attr("font-family", options.font_family)
    .attr("font-size", 10)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("opacity", 0.7)
    .attr("transform", "translate(" + x_t_r + "," + y_t_l + ")")
    .text(function () {
      return taxonomy[tax];
    });

    // add label under rectangle
    hist_svg.append("text")
    .attr("id", "text-tax-label-" + count)
    .attr("font-family", options.font_family)
    .attr("font-size", options.font_size)
    .attr("fill", "black")
    .attr("text-anchor", "start")
    .attr("opacity", 1)
    .attr("transform", "translate(" + x_t_r + "," + y_t_r + ") rotate(90)")
    .text(function () {
      return tax;
    });

    count++;
  }
}
