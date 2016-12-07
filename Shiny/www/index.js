window.onload = function() {

  readSingleFile();


    function readSingleFile() {
      // var filepath = "/Users/gabe/Dropbox/Code/R\ Workspace/ASR\ Latest/asrN2.dot";
      var filepath = "http://www.gabefoley.com/asr" + e.name + ".dot";

      var file = filepath.target.files[0];
      if (!file) {
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        var contents = e.target.result;
        displayGraph(contents);
      };
      reader.readAsText(file);
    }

    function displayContents(contents) {
      var element = document.getElementById('file-content');
      element.innerHTML = contents;
    }

    document.getElementById('file-input')
      .addEventListener('change', readSingleFile, false);


      function displayGraph(contents){
        console.log(contents);
        var g = graphlibDot.read(contents);
        console.log("G IS " + g);

      // Render the graphlib object using d3.
      g.nodes().forEach(function(v) {
          var node = g.node(v);
          node.style= "fill:" + node.fillcolor;
          node.shape = "circle";
      });

      var renderer = dagreD3.render();
      d3.select("svg g").call(renderer, g);

      // Optional - resize the SVG element based on the contents.
      var svg = document.querySelector('#graphContainer');
      var bbox = svg.getBBox();
      svg.style.width = bbox.width + 40.0 + "px";
      svg.style.height = bbox.height + 40.0 + "px";

    }
  }