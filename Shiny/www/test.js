console.log("Reading from test.js");

var opts = {};
console.log("Reading from test.js");

opts.el = document.getElementById('msacontainer');

opts.vis = {
    conserv: false,
    overviewbox: false,
    seqlogo: false
};
opts.conf = {
    dropImport: true
};
opts.zoomer = {
    menuFontsize: "12px",
    autoResize: true

};
console.log("Reading from test.js 1");

var m = new msa.msa(opts);
console.log("Reading from test.js 2");



m.u.file.importURL(url, renderMSA);
console.log("Reading from test.js 3");

function renderMSA() {

    var menuOpts = {};
    menuOpts.el = document.getElementById('info');
    menuOpts.msa = m;
    menuOpts.menu = "small";
    var defMenu = new msa.menu.defaultmenu(menuOpts);
    // defMenu.render();
    m.render();

}
console.log("Reading from test.js end");


