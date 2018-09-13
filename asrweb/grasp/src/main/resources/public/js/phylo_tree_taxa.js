const NCBI_VALUE = 12;
const UNIPROT_VALUE = -3;
const NCBI = "ncbi";
const UNIPROT = "uniprot";

/**
 * Stores the ID maping, it is used to collect information while the reconstruction is loading
 */
let idMapping = {};
// We use the to save flag to indicate whether or not we have any information to
let idMappingToSave = {toSave: true, NCBI: [], UNIPROT: []};
// Used to set the variables from the server so we can call the taxonomy on a button press
let serverVars = {};

/**
 * Called when the user presses the annoate taxonomy button.
 */
function annotateTaxonomy() {
  $('#taxonomy-info-alert').removeClass("hidden");
  queryTaxonIds(serverVars.ncbiList, serverVars.uniprotList, serverVars.ncbiMapping, serverVars.uniprotMapping);
}

/**
 * Used to store the variables from the server so we don't need to re-query these
 * after the tree has been set up and the user wants to annotate the taxonomy.
 * @param ncbiList
 * @param uniprotList
 * @param ncbiMapping
 * @param uniprotMapping
 */
function setUpTaxonomy(ncbiList, uniprotList, ncbiMapping, uniprotMapping) {
  serverVars = {
    ncbiList: ncbiList,
    uniprotList: uniprotList,
    ncbiMapping: ncbiMapping,
    uniprotMapping: uniprotMapping
  };
}

/**
 * Here we search for the taxonomic Ids of ids we don't know.
 *
 * We also store the ID's that we do know.
 *
 * @param ncbiList        A list of unknown ncbi ids
 * @param uniprotList     A list of unknown uniprot ids
 * @param ncbiMapping     If there are stored id mappings we return these
 * @param uniprotMapping  If there are stored uniprot mappings these are returned
 * @returns {PromiseLike<T> | Promise<T> | *}
 */
function queryTaxonIds(ncbiList, uniprotList, ncbiMapping, uniprotMapping) {
  let requests = [];
  idMapping = uniprotMapping;
  for (const key in ncbiMapping) {
    uniprotMapping[key] = ncbiMapping[key];
  }
  if (ncbiList.length > 1) {
    requests.push(getTaxonIdFromNcbi(ncbiList.join(","), ncbiList));
  }
  if (uniprotList.length > 1) {
    let uniprotNames = "";
    for (let i = 0; i < uniprotList.length; i++) {
      uniprotNames += "id:" + uniprotList[i];
      if (i < uniprotList.length - 1) {
        uniprotNames += "+OR+";
      }
    }
    requests.push(getTaxonIdFromUniprot(uniprotNames, uniprotList))
  }
  /**
   * When we get the results back we want to post them to the server and that
   * way we can easily access these multiple times rather than having to
   * re-download the taxon information each time.
   */

  if (requests.length > 1) {
    return $.when.apply(undefined, requests).then(function () {
      runTaxaAjax();
    });
  } else {
    //  Set that we don't want to save any ids
    idMappingToSave.toSave = false;
    runTaxaAjax();
  }
}

/**
 * Get the taxonomic info from the server.
 */
function runTaxaAjax() {
  $.ajax({
    url: "/taxa",
    type: "POST",
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify(idMappingToSave),
    success: function (data) {
      applyTaxonInfo(data);
    }, error: function (err) {
      $('#taxonomy-info-alert').addClass("hidden");
      $('#taxonomy-failed-alert').removeClass("hidden");
    }
  })
}
/**
 * Helper function to get NCBI or uniprot ID. Modularises it out so it can change.
 */
function getId(extentId, type) {
  if (type == NCBI_VALUE) {
    return phylo_options.tree.extants[extentId].name.split("|")[0].split(".")[0]
  } else if (type == UNIPROT_VALUE) {
    return phylo_options.tree.extants[extentId].name.split("|")[1]
  }
  // Otherwise it hasn't been specified so we need to determine it from the identifier.
  if (phylo_options.tree.extants[extentId].name.substr(2, 1) == "|") {
    console.log(phylo_options.tree.extants[extentId].name.split("|")[1]);
    return phylo_options.tree.extants[extentId].name.split("|")[1];
  }
  return phylo_options.tree.extants[extentId].name.split("|")[0].split(".")[0];
}

/**
 * Adds the taxonomic info to the tree.
 */
function applyTaxonInfo(taxonInfo) {
  let ncbiTaxa = JSON.parse(taxonInfo[NCBI]);
  let uniprotTaxa = JSON.parse(taxonInfo[UNIPROT]);
  let allTaxa = ncbiTaxa.concat(uniprotTaxa);
  let taxaInfoDict = {};
  _.forEach(allTaxa, t => {taxaInfoDict[t.id] = t});
  for (let i in phylo_options.tree.extants) {
    let name = getId(i);
    let taxaId = parseInt(idMapping[name]);
    let taxaInfo = taxaInfoDict[taxaId];
    phylo_options.tree.extants[i].taxonomy = taxaInfo;
  }
  getCommonTaxon(phylo_options.tree.root);
  $('#taxonomy-info-alert').addClass("hidden");
  refresh_tree();
}

/**
 * Gets the taxonomic IDS from NCBI.
 */
function getTaxonIdFromNcbi(extentNames, extentList) {
  let url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=protein&id="
      + extentNames + "&retmode=xml&rettype=docsum";
  idMappingToSave[NCBI] = {};
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
              idMapping[extentList[i]] = thisNode.textContent;
              idMappingToSave[NCBI][extentList[i]] = thisNode.textContent;
              thisNode = node.iterateNext();
            }
          } catch (e) {
            // If the ID isn't supported then we don't want to keep searching for
            // the same ID. This means that we add in a dummy ID to keep track of
            // this and store it in the DB.
            idMapping[extentList[i]] = null;
            idMappingToSave[NCBI][extentList[i]] = -1;
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
function getTaxonIdFromUniprot(extantNames, extentList) {

  let url = "https://www.uniprot.org/uniprot/?query=" + extantNames
      + "&format=tab&columns=id,entry%20name,protein%20names,organism,organism%20id,lineage-id(all),reviewed";
  let speciesDict = {}
  idMappingToSave[UNIPROT] = {};
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
          // If the ID isn't supported then we don't want to keep searching for
          // the same ID. This means that we add in a dummy ID to keep track of
          // this and store it in the DB.
          if (speciesDict[extentList[i]] == undefined) {
            idMapping[extentList[i]] = null;
            idMappingToSave[UNIPROT][extentList[i]] = -1;
          } else {
            idMappingToSave[UNIPROT][extentList[i]] = speciesDict[extentList[i]];
            idMapping[extentList[i]] = speciesDict[extentList[i]];
          }
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
        $('#taxonomy-info-alert').addClass("hidden");
        $('#taxonomy-failed-alert').removeClass("hidden");
      }
    }
  });
}


var add_warning = function (list, type, msg) {

  let list_string = "";

  for (let i = 0; i < list.length; i++) {
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
var getCommonTaxon = function (node) {
  if (node.children == undefined) {
    return;
  }
  // var ranks = ["superdomain", "domain", "subdomain", "superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class", "subbclass", "superorder", "order", "suborder", "superfamily", "family", "subfamily", "supergenus", "genus", "subgenus", "superspecies", "species", "subspecies"]
  var ranks = ["domain", "superkingdom", "kingdom", "phylum", "class_t", "order_t", "family_t", "genus", "species"]

  var taxonomy = {};
  for (var rank in ranks) {
    taxonomy[ranks[rank]] = {};
  }
  for (var n in node.children) {
    var child = node.children[n];
    if (child.taxonomy == undefined) {
      getCommonTaxon(child);
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
          return rank.charAt(0).toUpperCase() + rank.slice(1).split("_")[0] + ": " + tax;
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
        return rank_differ.charAt(0).toUpperCase() + rank_differ.slice(1).split("_")[0]
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
