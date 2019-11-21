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

        console.log('poplop');
        console.log(commaSepList);


        // If user hasn't entered any node IDs to download, let them know
        if (!commaSepList){

            window.alert("Please enter a list of node IDs you wish to download");
            return;

        }




        downloadGet('/download-ancs', commaSepList);
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