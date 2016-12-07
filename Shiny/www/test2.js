var opts = {
    el: document.getElementById("yourDiv"),
    vis: {
      conserv: false,
      overviewbox: false
    },
    // smaller menu for JSBin
    menu: "small",
    bootstrapMenu: true
};

var m = new msa.msa(opts);
m.u.file.importURL("http://rostlab.org/~goldberg/jalv_example.clustal", function(){
  m.render();
});