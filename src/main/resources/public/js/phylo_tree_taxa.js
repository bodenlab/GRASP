const NCBI_VALUE = 12;
const UNIPROT_VALUE = -3;
const NCBI = "ncbi";
const UNIPROT = "uniprot";

/**
 * Stores the ID maping, it is used to collect information while the reconstruction is loading
 */
var ranks =  ["t_domain", "t_superkingdom", "t_kingdom", "t_phylum", "t_class_t", "t_order_t", "t_family", "t_genus", "t_species"];//["domain", "kingdom", "phylum", "class", "order","family", "genus", "species"]
var RANKS = ["t_domain", "t_superkingdom", "t_kingdom", "t_phylum", "t_class_t", "t_order_t", "t_family", "t_genus", "t_species"];

let idMapping = {};
// We use the to save flag to indicate whether or not we have any information to
let idMappingToSave = {toSave: true, NCBI: [], UNIPROT: []};
// Used to set the variables from the server so we can call the taxonomy on a button press
let serverVars = {};

/**
 * Called when the user presses the annoate taxonomy button.
 */
function annotateTaxonomy() {
  if (phylo_options.taxonomyOn !== true) {
    phylo_options.taxonomyOn = true;
    $('#taxonomy-info-alert').removeClass("hidden");
    queryTaxonIds(serverVars.ncbiList, serverVars.uniprotList, serverVars.ncbiMapping, serverVars.uniprotMapping);

  }
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

function chunkArray(array, chunkSize) {
  return Array.from(
      { length: Math.ceil(array.length / chunkSize) },
      (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)
  );
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
  if (idMapping === undefined) {
    idMapping = {};
  }
  if (ncbiMapping !== undefined) {
    for (const key in ncbiMapping) {
      idMapping[key] = ncbiMapping[key];
    }
  }
  if (ncbiList.length > 1) {
    try {
      const chunks = chunkArray(ncbiList, 10);
      for(const chunk of chunks) {
        requests.push(getTaxonIdFromNcbi(chunk.join(","), chunk));
      }
    } catch(error) {
      console.log(error);
    }
  }
  if (uniprotList.length > 1) {
    try {
      const chunks = chunkArray(uniprotList, 10);
      for(const chunk of chunks) {
        let uniprotNames = "";
        for (let i = 0; i < chunk.length; i++) {
          uniprotNames += "id:" + chunk[i];
          if (i < chunk.length - 1) {
            uniprotNames += "+OR+";
          }
        }
        requests.push(getTaxonIdFromUniprot(uniprotNames, chunk))
      }
    } catch(error) {
      // Catch en error here
    }

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
      if (data.error !== undefined) {
        document.getElementById("motif-warning-text").innerHTML = data.error;
        $('#taxonomy-info-alert').addClass("hidden");
        $('#motif-warning-alert').removeClass("hidden");
      }
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
function getId(node, type) {
  if (type === NCBI_VALUE) {
    return node[T_NAME].split(".")[0]
  } else if (type === UNIPROT_VALUE) {
    return node[T_NAME].split("|")[1]
  }
  // Otherwise it hasn't been specified so we need to determine it from the identifier.
  if (node[T_NAME].substr(2, 1) === "|") {
    return node[T_NAME].split("|")[1];
  }
  return node[T_NAME].split(".")[0];
}

/**
 * Adds the taxonomic info to the tree.
 */
function applyTaxonInfo(taxonInfo) {
  let extants = getExtantNodes();
  let ncbiTaxa = [];
  let uniprotTaxa = [];
  if (taxonInfo[NCBI] !== undefined) {
    ncbiTaxa = JSON.parse(taxonInfo[NCBI]);
  }
  if (taxonInfo[UNIPROT] !== undefined) {
    uniprotTaxa = JSON.parse(taxonInfo[UNIPROT]);
  }
  let allTaxa = ncbiTaxa.concat(uniprotTaxa);
  let taxaInfoDict = {};
  _.forEach(allTaxa, t => {
    if (t !== null) {
      taxaInfoDict[t.id] = t;
    }
  });

  extants.forEach(function(node) {
    let name = getId(node);
    let taxaId = parseInt(idMapping[name]);
    let taxaInfo = taxaInfoDict[taxaId];
    node[T_TAXA] = taxaInfo;
    phylo_options.tree.node_dict[node[T_ID]][T_TAXA] = taxaInfo;
  });

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



/**
 * Get the most common taxonomy labels for each ancestral node by counting all unique extant taxonomy labels
 * and ranking based on highest number.
 *
 * We want to keep track of the taxonomy that was shared between the children.
 */
var getCommonTaxon = function (node) {
  if (node[T_CHILDREN] === undefined) {
    return;
  }

  let taxonomy = {};
  for (let rank in RANKS) {
    taxonomy[RANKS[rank]] = {};
  }
  for (let n in node[T_CHILDREN]) {
    let child = node[T_CHILDREN][n];
    if (child[T_TAXA] === undefined) {
      getCommonTaxon(child);
    }

    if (child[T_TAXA] !== undefined && child[T_TAXA] != null) {
      for (let rank in RANKS) {
        let tax = taxonomy[RANKS[rank]];
        let child_labels = {};
        if (!(child[T_CHILDREN] === undefined)) {
          for (let r in child[T_TAXA][RANKS[rank]]) {
            child_labels[r] = child[T_TAXA][RANKS[rank]][r];
          }
        } else {
          child_labels[child[T_TAXA][RANKS[rank]]] = 1;
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
    var tax = taxonomy[RANKS[r]];
    var keys = Object.keys(tax);
    if (keys.length > 1) {
      for (let kIdx in keys) {
        if (keys[kIdx] != "undefined" && /\S/.test(keys[kIdx] )) {
          differ_rank = r;
          break;
        }
      }
    } else {
      if (keys[0] != "undefined" && /\S/.test(keys[0])) {
        common_tax = Object.keys(tax)[0];
        common_rank = r;
      }
    }
    if (differ_rank !== null) {
      break;
    }
  }

  var common = {};
  if (common_rank === null) {
    common.common_rank = null;
  } else {
    common.common_rank = ranks[common_rank];
  }
  common.common_taxonomy = common_tax;
  common.differ_rank = ranks[differ_rank];
  node[T_COMMON_TAXA] = common;
  node[T_TAXA] = taxonomy;

  // update node for drawing

  // ToDo: REMOVE THIS FUNCTION IT IS VERY BAD
  set_common_tax_node(node, taxonomy);
}

var set_common_tax_node = function (node, taxonomy) {
  phylo_options.tree.node_dict[node[T_ID]][T_COMMON_TAXA] =  node[T_COMMON_TAXA];
  phylo_options.tree.node_dict[node[T_ID]][T_TAXA] = taxonomy;
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

/**
 * Return the taxa information as a text for tooltip hover.
 * @param taxa
 */
function getTaxaAsText(taxa, commonTaxa, extant, name, node) {
  if (taxa === undefined) {
    return "";
  }

  /* Check if we've already calculated it. */
  if (node[T_TEXT] !== undefined) {
    return node[T_TEXT];
  }

  var ranks =  ["t_domain", "t_superkingdom", "t_kingdom", "t_phylum", "t_class_t", "t_order_t", "t_family", "t_genus", "t_species"]
  var rankDisplay =  {"t_domain": "Domain", "t_superkingdom": "Super Kingdom", "t_kingdom": "Kingdom", "t_phylum": "Phylum", "t_class_t": "Class", "t_order_t": "Order", "t_family": "Family", "t_genus": "Genus", "t_species": "Species"};

  let textDisplay = "<strong>" + name + "</strong></br>";

  let taxaArr = {};

  ranks.forEach(function(rank) {
    if (taxa[rank] !== "" && taxa[rank] !== undefined) {
      let drawnStart = false;


      if (extant) {
        if (taxa[rank] != "undefined" && /\S/.test(taxa[rank])) {
          if (rank === commonTaxa) {
            textDisplay += "<strong>"
          }
          textDisplay += rankDisplay[rank] + ': ';
          textDisplay += taxa[rank] + "</br>";
          taxaArr[rank] = [{'x': taxa[rank], 'y': 1}];
          drawnStart = true;
        }
      } else {
        // For each element in the taxa we want to display how many of each
        let count = 0; // Only want to display up to 5
        for (let tIdx in taxa[rank]) {
          let taxaValue = taxa[rank][tIdx];
          if (tIdx != "undefined" && /\S/.test(tIdx) && drawnStart == false) {
            if (rank === commonTaxa) {
              textDisplay += "<strong>"
            }
            textDisplay += rankDisplay[rank] + ': ';
            taxaArr[rank] = [];
            drawnStart = true;
          }
          if (tIdx != "undefined" && /\S/.test(tIdx)) {
            if (count < 5) {
              textDisplay += tIdx + "(" + taxaValue + ") "
            }
            taxaArr[rank].push({'x': tIdx, 'y': taxaValue});
          }
          count += 1;
          if (count == 5) {
            textDisplay += " ...";
          }
        }
        if (drawnStart) {
          textDisplay += "</br>"
        }
      }
      if (rank === commonTaxa && drawnStart) {
        textDisplay += "</strong>"
      }
    }
  });

  node[T_TAXA_ARR] = taxaArr;
  return textDisplay;
}

/**
  Returns the colour for the common taxa
 */
function getTaxaColour(d, color) {
  let colouridxs = {"t_domain": "#ca5959", "t_superkingdom":"#ffb380",
    "t_kingdom":"#d4ff80",
    "t_phylum": "#52ff86",
    "t_class_t": "#5aecff",
    "t_order_t": "#645fff",
    "t_family":"#cba5ff",
    "t_genus":"#ff9fc0",
    "t_species":"#ff6cb4"};
  let colour = colouridxs[d[T_COMMON_TAXA][T_DIFFER_RANK]];
  return colour;
}

var add_taxonomy_modal_info = function (nodeOriginal, group, options) {

  var x = 0;
  var y = 20;

  let node = phylo_options.tree.node_dict[nodeOriginal[T_ID]];

  if (node[T_TAXA] === undefined) {
    group.append("text")
    .attr("id", "text-modal-tax-" + node[T_ID])
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

  draw_histogram_taxonomy(node, group);
};

// Define the div for the tooltip
var div = d3.select("body").append("div")
.attr("class", "tooltip")
.attr("id", "tooltip-treemap")
.style("opacity", 0);

function draw_histogram_taxonomy(node, group) {
  let color = d3.scale.category20b();
  d3.selectAll("#usedTreeModal").remove();
  d3.selectAll(".modalgraphs").remove();

  // var treemap = d3.layout.treemap()
  // .padding(20)
  // .size([phylo_options.style.modal_width * 0.8, phylo_options.style.modal_height])
  // .value(function (d) {
  //   return d[T_NUM_EXTANTS];
  // });

  let text = "";
  if (node[T_TEXT] !== undefined) {
    text = node[T_TEXT];
  } else {
    if (node[T_EXTANT]) {
      text = getTaxaAsText(node[T_TAXA], "NONE", node[T_EXTANT], node[T_NAME], node);
    } else {
      text = getTaxaAsText(node[T_TAXA], node[T_COMMON_TAXA][T_DIFFER_RANK],
          node[T_EXTANT], node[T_NAME], node);
    }
  }
  // let svgGroup = group.append("g")
  // .attr("transform", "translate(50,10)");

  var rankDisplay =  {"t_domain": "Domain", "t_superkingdom": "Super Kingdom", "t_kingdom": "Kingdom", "t_phylum": "Phylum", "t_class_t": "Class", "t_order_t": "Order", "t_family": "Family", "t_genus": "Genus", "t_species": "Species"};

  document.getElementById("modal-text").innerHTML = text;
  var x = d3.scale.ordinal().rangeRoundBands([0, phylo_options.style.modal_width * 0.8], .05);

  var y = d3.scale.linear().range([(phylo_options.style.modal_height * 0.8)/6, 0]);

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom")

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left")
  .ticks(3);

  let colouridxs = {"t_domain": "#ca5959", "t_superkingdom":"#ffb380",
    "t_kingdom":"#d4ff80",
    "t_phylum": "#52ff86",
    "t_class_t": "#5aecff",
    "t_order_t": "#645fff",
    "t_family":"#cba5ff",
    "t_genus":"#77ffbe",
    "t_species":"#88cdff"};

  for (let r in rankDisplay) {

    let rank = rankDisplay[r];
    // let rank = node[T_COMMON_TAXA][T_DIFFER_RANK];
    let dataAll = node[T_TAXA_ARR][r];
    // only show top 10
    if (dataAll != undefined && dataAll.length > 1) {
      var modal_container = d3.select("#modalTree")
      .append("svg")
      .attr("class", 'modalgraphs')
      .attr("width", phylo_options.style.modal_width )
      .attr("height", phylo_options.style.height )
      .style("display", "block")
      .style("margin", "auto");
      let svgGroup = modal_container.append("g")
      .attr("transform", "translate(50,30)");

      svgGroup.append("text")
      .attr("x", (phylo_options.style.modal_width/2) - 10)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text(rank);

      dataAll.sort((a, b) => (a['y'] < b['y']) ? 1 : -1);
      let data = [];
      for (let i = 0; i < 10; i++) {
        if (i > dataAll.length) {
          break;
        }
        if (dataAll[i] !== undefined) {
          data.push(dataAll[i]);
        }
      }
      x.domain(data.map(function (d) {
        return d['x'].substring(0,8) + "...";
      }));
      y.domain([0, d3.max(data, function (d) {
        return d['y'];
      })]);

      let height = (phylo_options.style.modal_height * 0.8) / 6;
      svgGroup.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-45)");

      svgGroup.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "middle")
      .text("");

      svgGroup.selectAll("bar")
      .data(data)
      .enter().append("rect")
      .style("fill", colouridxs[r])
      .attr("x", function (d) {
        return x(d['x'].substring(0,8) + "...");
      })
      .attr("width", x.rangeBand())
      .attr("y", function (d) {
        return y(d['y']);
      })
      .attr("height", function (d) {
        return height - y(d['y']);
      })
      .on("mouseover", function (d) {
        //d3.select("#" + "taxa-text-" + d[T_ID]).style("opacity", 1);

        div.transition()
        .duration(200)
        .style("opacity", .9);

        div.html(d['x'] + "<br/>")
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", function (d) {
        div.transition()
        .duration(500)
        .style("opacity", 0);
      });
    }
  }



  //
  // var cell = svgGroup.data([node]).selectAll("g")
  // .data(treemap.nodes)
  // .enter().append("g")
  // .attr("class", "cell")
  // .attr("transform", function (d) {
  //   return "translate(" + d.x + "," + d.y + ")";
  // });
  //
  // cell.append("rect")
  // .attr("width", function (d) {
  //   return d.dx;
  // })
  // .attr("height", function (d) {
  //   return d.dy;
  // })
  // // .style("margin", "5px")
  // .attr("stroke", d => d[T_CHILDREN] ? color(d[T_TAXA][d[T_COMMON_TAXA][T_DIFFER_RANK]]) : color(d[T_TAXA]['t_order']))
  // .attr("stroke-width",  d =>d[T_CHILDREN] ? "2px": "2px")
  // .style("fill", function (d) {
  //   return d[T_CHILDREN] ? getTaxaColour(d, color) : getFillForNode(d);
  // })
  // .on("mouseover", function(d) {
  //   //d3.select("#" + "taxa-text-" + d[T_ID]).style("opacity", 1);
  //   let text = "";
  //   if (d[T_TEXT] !== undefined) {
  //     text = d[T_TEXT];
  //   } else {
  //     // Check if we've already assigned the taxanomic text to this
  //     if (d[T_EXTANT]) {
  //       text = getTaxaAsText(d[T_TAXA], "NONE", d[T_EXTANT], d[T_NAME]);
  //     } else {
  //       text = getTaxaAsText(d[T_TAXA], d[T_COMMON_TAXA][T_DIFFER_RANK],
  //           d[T_EXTANT], d[T_NAME]);
  //     }
  //     d[T_TEXT] = text;
  //   }
  //
  //   div.transition()
  //   .duration(200)
  //   .style("opacity", .9);
  //
  //   div.html(text + "<br/>")
  //   .style("left", (d3.event.pageX) + "px")
  //   .style("top", (d3.event.pageY - 28) + "px");
  // })
  // .on("mouseout", function(d) {
  //   //d3.select("#" + "taxa-text-" + d[T_ID]).style("opacity", 0);
  //   div.transition()
  //   .duration(500)
  //   .style("opacity", 0);
  // });
  //
  //
  // cell.append("text")
  // .attr("id", d => "taxa-text-" + d[T_ID])
  // .attr("x", function (d) {
  //   return d.dx / 2;
  // })
  // .attr("y", function (d) {
  //   return d.dy / 2;
  // })
  // .attr("dy", ".35em")
  // .attr("text-anchor", "middle")
  // .text(function (d) {
  //   return d[T_CHILDREN] ? "" : d.dx < 20 ? "" : d[T_TAXA]['t_species'].substr(0, 5) + "...";//[d[T_PARENT][T_COMMON_TAXA][T_DIFFER_RANK]];
  // });

}
