/**
 * The file that facilitates downloading any of the data from GRASP.
 **/

let downloadData = function (btnId) {
    if (btnId === 'download-joint') {
        downloadGet('/download-ancs', 'joint');
    } else if (btnId === 'download-tree') {
        downloadGet('/download-tree');
    } else if (btnId === 'download-marginal') {
        downloadGet('/download-ancs', 'marginal');
    } else if (btnId === 'download-select-joint') {
        let commaSepList = document.getElementById("download-select-joint-list").value.replace(/\s/g, '');

        // If user hasn't entered any node IDs to download, let them know
        if (!commaSepList){
            window.alert("Please enter a list of node IDs you wish to download");
            return;

        }
        downloadGet('/download-ancs', commaSepList);
    } else if (btnId === 'download-marg-dist') {
      downloadMarginalTsv();
    }
};

let downloadGet = function (url, dataPost) {
    document.getElementById("download-error-div").style.display = "none";
    // Open the modal modal from https://codepen.io/luv2code/pen/evaBXm
    $("#loadMe").modal({
        backdrop: "static", //remove ability to close modal with click
        show: true //Display loader!
    });

    let req = {
        url: url,
        type: 'GET',
        contentType: "application/json",
        dataType: 'json',
        success: function (data) {
            if (data.error !== undefined) {
                $("#loadMe").modal("hide");
                window.alert(data.error);
            } else {
                // Now we want to download the data as a file.
                let filename = data.filename;
                let fileType = data.filetype;
                let fileContent = data.filecontent;
                $("#loadMe").modal("hide");
                if (fileContent === "") {
                    if (dataPost === "marginal") {
                        let err = "No marginal reconstructions have been saved, please save some marginal reconstructions and try again.";

                        window.alert(err);
                    } else {
                        let err = "Looks like you need to save your reconstruction, click the save button in the top left corner. Also make sure you have inferred a joint reconstruction";

                        window.alert(err);
                        return;
                    }
                } else {
                    download(fileContent, filename, fileType);
                    document.getElementById("download-error-div").style.display = "none";
                }

            }
        }, error: function (err) {
            $("#loadMe").modal("hide");
            window.alert("Error downloading, check if you have popups blocked.");
        }
    };
    if (dataPost !== undefined) {
        req.data = dataPost;
        req.type = "POST";
    }

    $.ajax(req)

};

/**
 * Here we want to allow the user to download the marginal reconstruction of the
 * node that they have in the visualisation. If there are no nodes in the vis,
 * we display an error saying to please choose a marginal node.
 *
 * The tsv file is as follows:
 * node ID A	C	D	E	F	G	H	I	K	L	M	N	P	Q	R	S	T	V	W	Y
 * 1
 * 2
 * 3 ... etc
 */
let downloadMarginalTsv = function () {
    let headerLine = ['A','C','D','E','F','G','H','I','K','L','M','N','P','Q',
      'R','S','T','V','W','Y'];
    let headerDict = {};
    // Create a dictionary of the header information so that if we are missing
    // amino acids we can fill it in with 0
    let tsvFileStr = "node-id\t";
    for (let h in headerLine) {
        headerDict[headerLine[h]] = h;
        tsvFileStr += headerLine[h] + '\t'
    }
    tsvFileStr += '\n'
    // Check if we have a marginal ancestor in our history
      for (let p in poags.single.names) {
        let poag_name = poags.single.names[p];
        let nodes = poags.single.nodes[poag_name];
        if (p !== 'MSA') {
          // Now we want to find out if we have an inferred marginal or joint
          if (poags.single.raw.inferred.metadata.type === 'marginal') {
            for (let n in nodes) {
              tsvFileStr += n + '\t';
              let tsvLst = [];
                for (let h in headerLine) {
                    tsvLst.push('0');
                }
                for (let h in nodes[n][G_GRAPH]) {
                    // Set the correct position to have the values
                    tsvLst[headerDict[nodes[n][G_GRAPH][h][0]]] = nodes[n][G_GRAPH][h][1]
                }
                tsvFileStr += tsvLst.join('\t') + '\n'
            }
            // Now we want it to automatically download
            let link = document.createElement("a");
            let utc = new Date().toJSON().slice(0,10).replace(/-/g,'-');
            // ToDo: Add in the recon name it would be nicer.
            link.download =  poag_name + '_' + utc + '.tsv';
            link.href = "data:text/tab-separated-values," + encodeURIComponent(tsvFileStr);
            link.click();
          } else {
              // i.e. the current is a joint.
            console.log("Error no marginal recon.");
            document.getElementById("error-modal-text").innerHTML = "Error: "
                + "You didn't have a marginal reconstruction selected. "
                + "Please choose 'View marginal reconstruction ' from one of "
                + " the nodes in the tree. When this is in your viewer below you"
                + " can then download the TSV of the marginal distribution for "
                + "that  reconstructed node.";
            $('#error-modal').on('shown.bs.modal', function () {
              $('#error-modal').trigger('focus')
            });
          }
        }

    } 

};