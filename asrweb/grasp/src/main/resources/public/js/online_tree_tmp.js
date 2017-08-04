!function t(e,n,r){function i(o,l){if(!n[o]){if(!e[o]){var c="function"==typeof require&&require;if(!l&&c)return c(o,!0);if(a)return a(o,!0);throw new Error("Cannot find module '"+o+"'")}var s=n[o]={exports:{}};e[o][0].call(s.exports,function(t){var n=e[o][1][t];return i(n?n:t)},s,s.exports,t,e,n,r)}return n[o].exports}for(var a="function"==typeof require&&require,o=0;o<r.length;o++)i(r[o]);return i}({1:[function(t,e,n){"undefined"==typeof tnt&&(e.exports=tnt={}),tnt.tree=t("./index.js"),tnt.tree.node=t("tnt.tree.node"),tnt.tree.parse_newick=t("tnt.newick").parse_newick,tnt.tree.parse_nhx=t("tnt.newick").parse_nhx},{"./index.js":2,"tnt.newick":8,"tnt.tree.node":10}],2:[function(t,e,n){e.exports=tree=t("./src/index.js");var r=t("biojs-events");r.mixin(tree)},{"./src/index.js":18,"biojs-events":5}],3:[function(t,e,n){!function(){function t(){return{keys:Object.keys||function(t){if("object"!=typeof t&&"function"!=typeof t||null===t)throw new TypeError("keys() called on a non-object");var e,n=[];for(e in t)t.hasOwnProperty(e)&&(n[n.length]=e);return n},uniqueId:function(t){var e=++c+"";return t?t+e:e},has:function(t,e){return o.call(t,e)},each:function(t,e,n){if(null!=t)if(a&&t.forEach===a)t.forEach(e,n);else if(t.length===+t.length)for(var r=0,i=t.length;r<i;r++)e.call(n,t[r],r,t);else for(var o in t)this.has(t,o)&&e.call(n,t[o],o,t)},once:function(t){var e,n=!1;return function(){return n?e:(n=!0,e=t.apply(this,arguments),t=null,e)}}}}var r,i=this,a=Array.prototype.forEach,o=Object.prototype.hasOwnProperty,l=Array.prototype.slice,c=0,s=t();r={on:function(t,e,n){if(!d(this,"on",t,[e,n])||!e)return this;this._events||(this._events={});var r=this._events[t]||(this._events[t]=[]);return r.push({callback:e,context:n,ctx:n||this}),this},once:function(t,e,n){if(!d(this,"once",t,[e,n])||!e)return this;var r=this,i=s.once(function(){r.off(t,i),e.apply(this,arguments)});return i._callback=e,this.on(t,i,n)},off:function(t,e,n){var r,i,a,o,l,c,u,f;if(!this._events||!d(this,"off",t,[e,n]))return this;if(!t&&!e&&!n)return this._events={},this;for(o=t?[t]:s.keys(this._events),l=0,c=o.length;l<c;l++)if(t=o[l],a=this._events[t]){if(this._events[t]=r=[],e||n)for(u=0,f=a.length;u<f;u++)i=a[u],(e&&e!==i.callback&&e!==i.callback._callback||n&&n!==i.context)&&r.push(i);r.length||delete this._events[t]}return this},trigger:function(t){if(!this._events)return this;var e=l.call(arguments,1);if(!d(this,"trigger",t,e))return this;var n=this._events[t],r=this._events.all;return n&&f(n,e),r&&f(r,arguments),this},stopListening:function(t,e,n){var r=this._listeners;if(!r)return this;var i=!e&&!n;"object"==typeof e&&(n=this),t&&((r={})[t._listenerId]=t);for(var a in r)r[a].off(e,n,this),i&&delete this._listeners[a];return this}};var u=/\s+/,d=function(t,e,n,r){if(!n)return!0;if("object"==typeof n){for(var i in n)t[e].apply(t,[i,n[i]].concat(r));return!1}if(u.test(n)){for(var a=n.split(u),o=0,l=a.length;o<l;o++)t[e].apply(t,[a[o]].concat(r));return!1}return!0},f=function(t,e){var n,r=-1,i=t.length,a=e[0],o=e[1],l=e[2];switch(e.length){case 0:for(;++r<i;)(n=t[r]).callback.call(n.ctx);return;case 1:for(;++r<i;)(n=t[r]).callback.call(n.ctx,a);return;case 2:for(;++r<i;)(n=t[r]).callback.call(n.ctx,a,o);return;case 3:for(;++r<i;)(n=t[r]).callback.call(n.ctx,a,o,l);return;default:for(;++r<i;)(n=t[r]).callback.apply(n.ctx,e)}},h={listenTo:"on",listenToOnce:"once"};s.each(h,function(t,e){r[e]=function(e,n,r){var i=this._listeners||(this._listeners={}),a=e._listenerId||(e._listenerId=s.uniqueId("l"));return i[a]=e,"object"==typeof n&&(r=this),e[t](n,r,this),this}}),r.bind=r.on,r.unbind=r.off,r.mixin=function(t){var e=["on","once","off","trigger","stopListening","listenTo","listenToOnce","bind","unbind"];return s.each(e,function(e){t[e]=this[e]},this),t},"undefined"!=typeof n?("undefined"!=typeof e&&e.exports&&(n=e.exports=r),n.BackboneEvents=r):"function"==typeof define&&"object"==typeof define.amd?define(function(){return r}):i.BackboneEvents=r}(this)},{}],4:[function(t,e,n){e.exports=t("./backbone-events-standalone")},{"./backbone-events-standalone":3}],5:[function(t,e,n){var r=t("backbone-events-standalone");r.onAll=function(t,e){return this.on("all",t,e),this},r.oldMixin=r.mixin,r.mixin=function(t){r.oldMixin(t);for(var e=["onAll"],n=0;n<e.length;n++){var i=e[n];t[i]=this[i]}return t},e.exports=r},{"backbone-events-standalone":4}],6:[function(t,e,n){e.exports=t("./src/api.js")},{"./src/api.js":7}],7:[function(t,e,n){var r=function(t){var e=function(){var t=[];return t.add_batch=function(e){t.unshift(e)},t.update=function(e,n){for(var r=0;r<t.length;r++)for(var i in t[r])if(i===e)return t[r][i]=n,!0;return!1},t.add=function(e,n){if(t.update(e,n));else{var r={};r[e]=n,t.add_batch(r)}},t.get=function(e){for(var n=0;n<t.length;n++)for(var r in t[n])if(r===e)return t[n][r]},t},n=e(),r=function(){};r.check=function(e,n,i){if(!(e instanceof Array))return"function"==typeof e?e.check(n,i):t[e].check(n,i),r;for(var a=0;a<e.length;a++)r.check(e[a],n,i)},r.transform=function(e,n){if(!(e instanceof Array))return"function"==typeof e?e.transform(n):t[e].transform(n),r;for(var i=0;i<e.length;i++)r.transform(e[i],n)};var i=function(e,r){var i=[],a=[],o=r.on_getter||function(){return n.get(e)},l=r.on_setter||function(t){for(var r=0;r<a.length;r++)t=a[r](t);for(var o=0;o<i.length;o++)if(!i[o].check(t)){var l=i[o].msg||"Value "+t+" doesn't seem to be valid for this method";throw l}n.add(e,t)},c=function(e){return arguments.length?(l(e),t):o()};c.check=function(t,e){return arguments.length?(i.push({check:t,msg:e}),this):i},c.transform=function(t){return arguments.length?(a.push(t),this):a},t[e]=c},a=function(t,e){if("object"==typeof t){n.add_batch(t);for(var r in t)i(r,e)}else n.add(t,e.default_value),i(t,e)};return r.getset=function(t,e){return a(t,{default_value:e}),r},r.get=function(t,e){var n=function(){throw"Method defined only as a getter (you are trying to use it as a setter"};return a(t,{default_value:e,on_setter:n}),r},r.set=function(t,e){var n=function(){throw"Method defined only as a setter (you are trying to use it as a getter"};return a(t,{default_value:e,on_getter:n}),r},r.method=function(e,n){if("object"==typeof e)for(var i in e)t[i]=e[i];else t[e]=n;return r},r};e.exports=n=r},{}],8:[function(t,e,n){e.exports=t("./src/newick.js")},{"./src/newick.js":9}],9:[function(t,e,n){e.exports={parse_newick:function(t){for(var e,n=[],r={},i=t.split(/\s*(;|\(|\)|,|:)\s*/),a=0;a<i.length;a++){var o=i[a];switch(o){case"(":e={},r.children=[e],n.push(r),r=e;break;case",":e={},n[n.length-1].children.push(e),r=e;break;case")":r=n.pop();break;case":":break;default:var l=i[a-1];")"==l||"("==l||","==l?r.name=o:":"==l&&(r.branch_length=parseFloat(o))}}return r},parse_nhx:function(t){for(var e,n=[],r={},i=t.split(/\s*(;|\(|\)|\[|\]|,|:|=)\s*/),a=0;a<i.length;a++){var o=i[a];switch(o){case"(":e={},r.children=[e],n.push(r),r=e;break;case",":e={},n[n.length-1].children.push(e),r=e;break;case")":r=n.pop();break;case":":break;default:var l=i[a-1];if(")"==l||"("==l||","==l)r.name=o;else if(":"==l){isNaN(o)||(r.branch_length=parseFloat(o))}else if("="==l){var c=i[a-2];switch(c){case"D":r.duplication=o;break;case"G":r.gene_id=o;break;case"T":r.taxon_id=o;break;default:r[i[a-2]]=o}}else;}}return r}}},{}],10:[function(t,e,n){var r=t("./src/node.js");e.exports=n=r},{"./src/node.js":11}],11:[function(t,e,n){var r=t("tnt.api"),i=t("tnt.utils").iterator,a=function(t){"use strict";var e=function(){},n=r(e),o=function(t,e){if(e(t),void 0!==t.children)for(var n=0;n<t.children.length;n++)o(t.children[n],e)},l=function(){var e=i(1);o(t,function(t){void 0===t._id&&(t._id=e())})},c=function(t){if(void 0!==t&&void 0!==t.children)for(var e=0;e<t.children.length;e++)t.children[e]._parent=t,c(t.children[e])},s=function(t){o(t,function(t){var e;if(void 0===t._parent)t._root_dist=0;else{var e=0;t.branch_length&&(e=t.branch_length),t._root_dist=e+t._parent._root_dist}})};e.data=function(n){return arguments.length?(t=n,l(),c(t),s(t),e):t},e.data(t),n.method("find_all",function(t,n){var r=[];return e.apply(function(e){t(e)&&r.push(e)}),r}),n.method("find_node",function(n,r){if(n(e))return e;if(void 0!==t.children)for(var i=0;i<t.children.length;i++){var o=a(t.children[i]).find_node(n,r);if(o)return o}if(r&&void 0!==t._children)for(var l=0;l<t._children.length;l++){a(t._children[l]).find_node(n,r);var o=a(t._children[l]).find_node(n,r);if(o)return o}}),n.method("find_node_by_name",function(t,n){return e.find_node(function(e){return e.node_name()===t},n)}),n.method("toggle",function(){if(t)if(t.children){var n=0;e.apply(function(t){t.n_hidden()||0;n+=(t.n_hidden()||0)+1}),e.n_hidden(n-1),t._children=t.children,t.children=void 0}else e.n_hidden(0),t.children=t._children,t._children=void 0;return this}),n.method("is_collapsed",function(){return void 0!==t._children&&void 0===t.children});var u=function(t,e){if(t=t.data(),e=e.data(),void 0===t._parent)return!1;for(t=t._parent;;){if(void 0===t)return!1;if(t===e)return!0;t=t._parent}};n.method("lca",function(t){if(1===t.length)return t[0];for(var e=t[0],n=1;n<t.length;n++)e=d(e,t[n]);return e});var d=function(t,e){return t.data()===e.data()?t:u(t,e)?e:d(t,e.parent())};n.method("n_hidden",function(t){return arguments.length?(e.property("_hidden",t),e):e.property("_hidden")}),n.method("get_all_nodes",function(t){var n=[];return e.apply(function(t){n.push(t)},t),n}),n.method("get_all_leaves",function(t){var n=[];return e.apply(function(e){e.is_leaf(t)&&n.push(e)},t),n}),n.method("upstream",function(t){t(e);var n=e.parent();void 0!==n&&n.upstream(t)}),n.method("subtree",function(e,n){void 0===n&&(n=!1);for(var r={},i=0;i<e.length;i++){var o=e[i];void 0!==o&&o.upstream(function(t){var e=t.id();void 0===r[e]&&(r[e]=0),r[e]++})}var l=function(t){var e=0;if(void 0===t.children)return!1;for(var n=0;n<t.children.length;n++){var i=t.children[n]._id;r[i]>0&&e++}return 1===e},c={};return f(t,c,0,function(t){var e=t._id,i=r[e];return i>0&&!(l(t)&&!n)}),a(c.children[0])});var f=function(t,e,n,r){if(void 0!==t)if(r(t)){var i=h(t,n);if(void 0===e.children&&(e.children=[]),e.children.push(i),void 0===t.children)return;for(var a=0;a<t.children.length;a++)f(t.children[a],i,0,r)}else{if(void 0===t.children)return;n+=t.branch_length||0;for(var a=0;a<t.children.length;a++)f(t.children[a],e,n,r)}},h=function(t,e){var n={};for(var r in t)"children"!==r&&"_children"!==r&&"_parent"!==r&&"depth"!==r&&t.hasOwnProperty(r)&&(n[r]=t[r]);return void 0!==n.branch_length&&void 0!==e&&(n.branch_length+=e),n};return n.method("present",function(t){var n=!1;return e.apply(function(e){t(e)===!0&&(n=!0)}),n}),n.method("sort",function(e){if(void 0!==t.children){for(var n=[],r=0;r<t.children.length;r++)n.push(a(t.children[r]));n.sort(e),t.children=[];for(var r=0;r<n.length;r++)t.children.push(n[r].data());for(var r=0;r<t.children.length;r++)a(t.children[r]).sort(e)}}),n.method("flatten",function(t){if(e.is_leaf())return e;var n,r=e.data(),i=h(r);t?(n=e.get_all_nodes(),n.shift()):n=e.get_all_leaves(),i.children=[];for(var o=0;o<n.length;o++)delete n[o].children,i.children.push(h(n[o].data()));return a(i)}),n.method("apply",function(n,r){if(void 0===r&&(r=!1),n(e),void 0!==t.children)for(var i=0;i<t.children.length;i++){var o=a(t.children[i]);o.apply(n,r)}if(void 0!==t._children&&r)for(var l=0;l<t._children.length;l++){var o=a(t._children[l]);o.apply(n,r)}}),n.method("property",function(n,r){return 1===arguments.length?"function"==typeof n?n(t):t[n]:("function"==typeof n&&n(t,r),t[n]=r,e)}),n.method("is_leaf",function(e){return e?void 0===t.children&&void 0===t._children:void 0===t.children}),n.method("id",function(){return e.property("_id")}),n.method("node_name",function(){return e.property("name")}),n.method("branch_length",function(){return e.property("branch_length")}),n.method("root_dist",function(){return e.property("_root_dist")}),n.method("children",function(e){var n=[];if(t.children)for(var r=0;r<t.children.length;r++)n.push(a(t.children[r]));if(t._children&&e)for(var i=0;i<t._children.length;i++)n.push(a(t._children[i]));if(0!==n.length)return n}),n.method("parent",function(){if(void 0!==t._parent)return a(t._parent)}),e};e.exports=n=a},{"tnt.api":6,"tnt.utils":12}],12:[function(t,e,n){e.exports=t("./src/index.js")},{"./src/index.js":13}],13:[function(t,e,n){var r=t("./utils.js");r.reduce=t("./reduce.js"),r.png=t("./png.js"),e.exports=n=r},{"./png.js":14,"./reduce.js":15,"./utils.js":16}],14:[function(t,e,n){var r=function(){var t,e='<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',n=1,r=function(){},i=function(i){i=i.node();var a=function(t){var e=d3.select(i).selectAll("image"),n=e[0].length;0===n&&t(),e.each(function(){var e=d3.select(this),r=new Image;r.onload=function(){var i=document.createElement("canvas"),a=i.getContext("2d");i.width=r.width,i.height=r.height,a.drawImage(r,0,0);var o=i.toDataURL("image/png");e.attr("href",o),n--,0===n&&t()},r.src=e.attr("href")})},o=function(t,e){for(var n=t.children||t.childNodes;n.length>0;){var r=n[0];1===r.nodeType&&e.appendChild(r)}return e},l=function(e){for(var n="",r=document.styleSheets,i=0;i<r.length;i++){var a=r[i].href||"";if(t){for(var o=!0,l=0;l<t.length;l++)if(a.indexOf(t[l])>-1){o=!1;break}if(o)continue}for(var c=r[i].cssRules||[],s=0;s<c.length;s++){var u=c[s];if("undefined"!=typeof u.style){var d=e.querySelectorAll(u.selectorText);d.length>0&&(n+=u.selectorText+" { "+u.style.cssText+" }\n")}}}var f=e.querySelector("defs")||document.createElement("defs"),h=document.createElement("style");return h.setAttribute("type","text/css"),h.innerHTML="<![CDATA[\n"+n+"\n]]>",f.appendChild(h),f};a(function(){var t=document.createElement("div"),a=i.cloneNode(!0),c=parseInt(a.getAttribute("width")),s=parseInt(a.getAttribute("height"));a.setAttribute("version","1.1"),a.setAttribute("xmlns","http://www.w3.org/2000/svg"),a.setAttribute("xmlns:xlink","http://www.w3.org/1999/xlink"),a.setAttribute("width",c*n),a.setAttribute("height",s*n);var u=document.createElement("g");u.setAttribute("transform","scale("+n+")"),a.appendChild(o(a,u)),t.appendChild(a),a.insertBefore(l(a),a.firstChild);var d=e+t.innerHTML;d=d.replace("none","block");var f=new Image;f.src="data:image/svg+xml;base64,"+window.btoa(unescape(encodeURIComponent(d))),f.onload=function(){var t=document.createElement("canvas");t.width=f.width,t.height=f.height;var e=t.getContext("2d");e.drawImage(f,0,0);var n=t.toDataURL("image/png");r(n)}})};return i.scale_factor=function(t){return arguments.length?(n=t,this):n},i.callback=function(t){return arguments.length?(r=t,this):r},i.stylesheets=function(e){return arguments.length?(t=e,this):t},i},i=function(){var t="image.png",e={limit:1/0,onError:function(){console.log("image too large")}},n=r().callback(function(n){var r=document.createElement("a");r.download=t,r.href=n,document.body.appendChild(r),r.href.length>e.limit?(r.parentNode.removeChild(r),e.onError()):r.click()});return n.filename=function(e){return arguments.length?(t=e,n):t},n.limit=function(t){return arguments.length?(e=t,this):e},n};e.exports=n=i},{}],15:[function(t,e,n){var r=function(){var t=5,e="val",n=function(t,e){return t<e?e-t<=.2*e:t-e<=.2*t},r=function(t){return t},i=function(t){if(!t.length)return t;var e=l(t),n=r(e);return n},a=function(t,n){if(n.sort(function(t,n){return t[e]-n[e]}),n.length%2)t[e]=n[~~(n.length/2)][e];else{var r=~~(n.length/2)-1;t[e]=(n[r][e]+n[r+1][e])/2}return t},o=function(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e},l=function(e){if(0===t)return e;for(var n=[],r=0;r<e.length;r++){var i=r<t?0:r-t,l=r>e.length-t?e.length:r+t;n[r]=a(o(e[r]),e.slice(i,l+1))}return n};return i.reducer=function(t){return arguments.length?(r=t,i):r},i.redundant=function(t){return arguments.length?(n=t,i):n},i.value=function(t){return arguments.length?(e=t,i):e},i.smooth=function(e){return arguments.length?(t=e,i):t},i},i=function(){var t=r().value("start"),e="end",n=function(n,r){return{object:{start:n.object[t.value()],end:r[e]},value:r[e]}};return t.reducer(function(r){for(var i=t.value(),a=t.redundant(),o=[],l={object:r[0],value:r[0][e]},c=1;c<r.length;c++)a(r[c][i],l.value)?l=n(l,r[c]):(o.push(l.object),l.object=r[c],l.value=r[c].end);return o.push(l.object),o}),r.join=function(e){return arguments.length?(n=e,t):n},r.value2=function(n){return arguments.length?(e=n,t):e},t},a=function(){var t=r();return t.reducer(function(e){for(var n=t.redundant(),r=t.value(),i=[],a=e[0],o=1;o<e.length-1;o++)n(e[o][r],a[r])||(i.push(a),a=e[o]);return i.push(a),i.push(e[e.length-1]),i}),t};e.exports=r,e.exports.line=a,e.exports.block=i},{}],16:[function(t,e,n){e.exports={iterator:function(t){var e=t||0,n=function(){return e++};return n},script_path:function(t){var e=t.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),n=new RegExp(e+"$"),r=new RegExp("(.*)"+e+"$"),i=document.getElementsByTagName("script"),a="";if(void 0!==i)for(var o in i)if(i[o].src&&i[o].src.match(n))return i[o].src.replace(r,"$1");return a},defer_cancel:function(t,e){var n,r=function(){var r=Array.prototype.slice.call(arguments),i=this;clearTimeout(n),n=setTimeout(function(){t.apply(i,r)},e)};return r}}},{}],17:[function(t,e,n){var r=t("tnt.api"),i={};i.diagonal=function(){var t=function(e){var r=e.source,i=e.target,a=((r.x+i.x)/2,(r.y+i.y)/2,[r,{x:i.x,y:r.y},i]);return a=a.map(t.projection()),t.path()(a,n.call(this,a))},e=(r(t).getset("projection").getset("path"),function(t,e){var n,r=2*Math.PI,i=r/4,a=t[0]>=0?t[1]>=0?1:2:t[1]>=0?4:3,o=Math.abs(Math.asin(t[1]/e));switch(a){case 1:n=i-o;break;case 2:n=i+o;break;case 3:n=2*i+i-o;break;case 4:n=3*i+o}return n}),n=function(t){var n=t[0],r=t[1],i=(t[2],Math.sqrt(n[0]*n[0]+n[1]*n[1])),a=e(n,i),o=e(r,i),l=Math.abs(o-a)>Math.PI?o<=a:o>a;return{radius:i,clockwise:l}};return t},i.diagonal.vertical=function(t){var e=function(t,e){var n=t[0],r=t[1],i=t[2],a=2e3*(r[1]-n[1]);return"M"+n+" A"+[a,a]+" 0 0,0 "+r+"M"+r+"L"+i},n=function(t){return[t.y,t.x]};return i.diagonal().path(e).projection(n)},i.diagonal.radial=function(){var t=function(t,e){var n=t[0],r=t[1],i=t[2],a=e.radius,o=e.clockwise;return o?"M"+n+" A"+[a,a]+" 0 0,0 "+r+"M"+r+"L"+i:"M"+r+" A"+[a,a]+" 0 0,0 "+n+"M"+r+"L"+i},e=function(t){var e=t.y,n=(t.x-90)/180*Math.PI;return[e*Math.cos(n),e*Math.sin(n)]};return i.diagonal().path(t).projection(e)},e.exports=n=i.diagonal},{"tnt.api":6}],18:[function(t,e,n){var r=t("./tree.js");r.label=t("./label.js"),r.diagonal=t("./diagonal.js"),r.layout=t("./layout.js"),r.node_display=t("./node_display.js"),e.exports=n=r},{"./diagonal.js":17,"./label.js":19,"./layout.js":20,"./node_display.js":21,"./tree.js":22}],19:[function(t,e,n){var r=t("tnt.api"),i={};i.label=function(){"use strict";var t=d3.dispatch("click","dblclick","mouseover","mouseout"),e=function(n,r,i){if("function"!=typeof n)throw n;e.display().call(this,n,r).attr("class","tnt_tree_label").attr("transform",function(t){var a=e.transform()(n,r);return"translate ("+(a.translate[0]+i)+" "+a.translate[1]+")rotate("+a.rotate+")"}).on("click",function(){t.click.call(this,n)}).on("dblclick",function(){t.dblclick.call(this,n)}).on("mouseover",function(){t.mouseover.call(this,n)}).on("mouseout",function(){t.mouseout.call(this,n)})};r(e).getset("width",function(){throw"Need a width callback"}).getset("height",function(){throw"Need a height callback"}).getset("display",function(){throw"Need a display callback"}).getset("transform",function(){throw"Need a transform callback"});return d3.rebind(e,t,"on")},i.label.text=function(){var t=i.label();r(t).getset("fontsize",10).getset("fontweight","normal").getset("color","#000").getset("text",function(t){return t.data().name});return t.display(function(e,n){var r=d3.select(this).append("text").attr("text-anchor",function(t){return"radial"===n?t.x%360<180?"start":"end":"start"}).text(function(){return t.text()(e)}).style("font-size",function(){return d3.functor(t.fontsize())(e)+"px"}).style("font-weight",function(){return d3.functor(t.fontweight())(e)}).style("fill",d3.functor(t.color())(e));return r}),t.transform(function(e,n){var r=e.data(),i={translate:[5,5],rotate:0};return"radial"===n&&(i.translate[1]=i.translate[1]-(r.x%360<180?0:t.fontsize()),i.rotate=r.x%360<180?0:180),i}),t.width(function(e){var n=d3.select("body").append("svg").attr("height",0).style("visibility","hidden"),r=n.append("text").style("font-size",d3.functor(t.fontsize())(e)+"px").text(t.text()(e)),i=r.node().getBBox().width;return n.remove(),i}),t.height(function(e){return d3.functor(t.fontsize())(e)}),t},i.label.svg=function(){var t=i.label();r(t).getset("element",function(t){return t.data().element});return t.display(function(e,n){var r=t.element()(e);return this.appendChild(r.node()),r}),t.transform(function(e,n){var r=e.data(),i={translate:[10,-t.height()()/2],rotate:0};return"radial"===n&&(i.translate[0]=i.translate[0]+(r.x%360<180?0:t.width()()),i.translate[1]=i.translate[1]+(r.x%360<180?0:t.height()()),i.rotate=r.x%360<180?0:180),i}),t},i.label.img=function(){var t=i.label();r(t).getset("src",function(){});return t.display(function(e,n){if(t.src()(e)){var r=d3.select(this).append("image").attr("width",t.width()()).attr("height",t.height()()).attr("xlink:href",t.src()(e));return r}return d3.select(this).append("text").text("")}),t.transform(function(e,n){var r=e.data(),i={translate:[10,-t.height()()/2],rotate:0};return"radial"===n&&(i.translate[0]=i.translate[0]+(r.x%360<180?0:t.width()()),i.translate[1]=i.translate[1]+(r.x%360<180?0:t.height()()),i.rotate=r.x%360<180?0:180),i}),t},i.label.composite=function(){var t=[],e=function(e,n,r){for(var i=0,a=0;a<t.length;a++){var o=t[a];!function(t){o.transform(function(e,n){var r=o._super_.transform()(e,n),i={translate:[t+r.translate[0],r.translate[1]],rotate:r.rotate};return i})}(i),i+=10,i+=o.width()(e),o.call(this,e,n,r)}},n=r(e);return n.method("add_label",function(n,i){return n._super_={},r(n._super_).get("transform",n.transform()),t.push(n),e}),n.method("width",function(){return function(e){for(var n=0,r=0;r<t.length;r++)n+=parseInt(t[r].width()(e)),n+=parseInt(t[r]._super_.transform()(e).translate[0]);return n}}),n.method("height",function(){return function(e){for(var n=0,r=0;r<t.length;r++){var i=t[r].height()(e);i>n&&(n=i)}return n}}),e},e.exports=n=i.label},{"tnt.api":6}],20:[function(t,e,n){var r=t("tnt.api"),i=t("./diagonal.js"),a={};a.layout=function(){var t=function(){},e=d3.layout.cluster().sort(null).value(function(t){return t.length}).separation(function(){return 1}),n=r(t).getset("scale",!0).getset("max_leaf_label_width",0).method("cluster",e).method("yscale",function(){throw"yscale is not defined in the base object"}).method("adjust_cluster_size",function(){throw"adjust_cluster_size is not defined in the base object"}).method("width",function(){throw"width is not defined in the base object"}).method("height",function(){throw"height is not defined in the base object"});return n.method("scale_branch_lengths",function(e){if(t.scale()!==!1){var n=e.nodes,r=e.tree,i=n.map(function(t){return t._root_dist}),a=t.yscale(i);r.apply(function(t){t.property("y",a(t.root_dist()))})}}),t},a.layout.vertical=function(){var t=a.layout();t.type="vertical";var e=r(t).getset("width",360).get("translate_vis",[20,20]).method("diagonal",i.vertical).method("transform_node",function(t){return"translate("+t.y+","+t.x+")"});return e.method("height",function(t){return t.n_leaves*t.label_height}),e.method("yscale",function(e){return d3.scale.linear().domain([0,d3.max(e)]).range([0,t.width()-20-t.max_leaf_label_width()])}),e.method("adjust_cluster_size",function(e){var n=t.height(e),r=t.width()-t.max_leaf_label_width()-t.translate_vis()[0]-e.label_padding;return t.cluster.size([n,r]),t}),t},a.layout.radial=function(){var t=a.layout();t.type="radial";var e=360,n=e/2,o={width:360},l=r(t).getset(o).getset("translate_vis",[n,n]).method("transform_node",function(t){return"rotate("+(t.x-90)+")translate("+t.y+")"}).method("diagonal",i.radial).method("height",function(){return o.width});return t.width.transform(function(e){return n=e/2,t.cluster.size([360,n]),t.translate_vis([n,n]),e}),l.method("yscale",function(t){return d3.scale.linear().domain([0,d3.max(t)]).range([0,n])}),l.method("adjust_cluster_size",function(e){return n=t.width()/2-t.max_leaf_label_width()-20,t.cluster.size([360,n]),t}),t},e.exports=n=a.layout},{"./diagonal.js":17,"tnt.api":6}],21:[function(t,e,n){var r=t("tnt.api"),i={};i.node_display=function(){"use strict";var t=function(e){var n,r=d3.select(this).select(".tnt_tree_node_proxy");n=null===r[0][0]?d3.select(this).append("rect").attr("class","tnt_tree_node_proxy"):r,t.display().call(this,e);var i=d3.functor(t.size())(e);n.attr("x",-i).attr("y",-i).attr("width",2*i).attr("height",2*i)},e=r(t).getset("size",4.4).getset("fill","black").getset("stroke","black").getset("stroke_width","1px").getset("display",function(){throw"display is not defined in the base object"});return e.method("reset",function(){d3.select(this).selectAll("*:not(.tnt_tree_node_proxy)").remove()}),t},i.node_display.circle=function(){var t=i.node_display();return t.display(function(e){d3.select(this).append("circle").attr("r",function(n){return d3.functor(t.size())(e)}).attr("fill",function(n){return d3.functor(t.fill())(e)}).attr("stroke",function(n){return d3.functor(t.stroke())(e)}).attr("stroke-width",function(n){return d3.functor(t.stroke_width())(e)}).attr("class","tnt_node_display_elem")}),t},i.node_display.square=function(){var t=i.node_display();return t.display(function(e){var n=d3.functor(t.size())(e);d3.select(this).append("rect").attr("x",function(t){return-n}).attr("y",function(t){return-n}).attr("width",function(t){return 2*n}).attr("height",function(t){return 2*n}).attr("fill",function(n){return d3.functor(t.fill())(e)}).attr("stroke",function(n){return d3.functor(t.stroke())(e)}).attr("stroke-width",function(n){return d3.functor(t.stroke_width())(e)}).attr("class","tnt_node_display_elem")}),t},i.node_display.triangle=function(){var t=i.node_display();return t.display(function(e){var n=d3.functor(t.size())(e);d3.select(this).append("polygon").attr("points",-n+",0 "+n+","+-n+" "+n+","+n).attr("fill",function(n){return d3.functor(t.fill())(e)}).attr("stroke",function(n){return d3.functor(t.stroke())(e)}).attr("stroke-width",function(n){return d3.functor(t.stroke_width())(e)}).attr("class","tnt_node_display_elem")}),t},e.exports=n=i.node_display},{"tnt.api":6}],22:[function(t,e,n){var r=t("tnt.api"),i=t("tnt.tree.node"),a=function(){"use strict";var t,e,n,o,l,c=d3.dispatch("click","dblclick","mouseover","mouseout","load"),s={duration:500,node_display:a.node_display.circle(),label:a.label.text(),layout:a.layout.vertical(),branch_color:"black",id:function(t){return t._id}},u="cubic-in-out",d={tree:void 0,data:void 0,nodes:void 0,links:void 0},f={tree:void 0,data:void 0,nodes:void 0,links:void 0},h=function(r){t=d3.select(r).attr("id");var d=d3.select(r).append("div").style("width",s.layout.width()+"px").attr("class","tnt_groupDiv"),p=s.layout.cluster,_=f.tree.get_all_leaves().length,g=function(t){for(var e=0,n=t.get_all_leaves(),r=0;r<n.length;r++){var i=s.label.width()(n[r])+d3.functor(s.node_display.size())(n[r]);i>e&&(e=i)}return e},m=function(t){for(var e=0,n=t.get_all_leaves(),r=0;r<n.length;r++){var i=2*d3.functor(s.node_display.size())(n[r]),a=d3.functor(s.label.height())(n[r]);e=d3.max([e,i,a])}return e},y=g(f.tree);s.layout.max_leaf_label_width(y);var b=m(f.tree),x={n_leaves:_,label_height:b,label_padding:15};s.layout.adjust_cluster_size(x);var k=s.layout.diagonal(),w=s.layout.transform_node;e=d.append("svg").attr("width",s.layout.width()).attr("height",s.layout.height(x)+30).attr("fill","none"),n=e.append("g").attr("id","tnt_st_"+t).attr("transform","translate("+s.layout.translate_vis()[0]+","+s.layout.translate_vis()[1]+")"),f.nodes=p.nodes(f.data),s.layout.scale_branch_lengths(f),f.links=p.links(f.nodes),o=n.append("g").attr("class","links"),l=n.append("g").attr("class","nodes");var j=o.selectAll("path.tnt_tree_link").data(f.links,function(t){return s.id(t.target)});j.enter().append("path").attr("class","tnt_tree_link").attr("id",function(e){return"tnt_tree_link_"+t+"_"+s.id(e.target)}).style("stroke",function(t){return d3.functor(s.branch_color)(i(t.source),i(t.target))}).attr("d",k);var A=l.selectAll("g.tnt_tree_node").data(f.nodes,function(t){return s.id(t)}),z=A.enter().append("g").attr("class",function(t){return t.children?0===t.depth?"root tnt_tree_node":"inner tnt_tree_node":"leaf tnt_tree_node"}).attr("id",function(e){return"tnt_tree_node_"+t+"_"+e._id}).attr("transform",w);z.each(function(t){s.node_display.call(this,i(t))}),z.each(function(t){s.label.call(this,i(t),s.layout.type,d3.functor(s.node_display.size())(i(t)))}),z.on("click",function(t){var e=i(t);a.trigger("node:click",e),c.click.call(this,e)}),z.on("dblclick",function(t){var e=i(t);a.trigger("node:dblclick",e),c.dblclick.call(this,e)}),z.on("mouseover",function(t){var e=i(t);a.trigger("node:hover",i(t)),c.mouseover.call(this,e)}),z.on("mouseout",function(t){var e=i(t);a.trigger("node:mouseout",i(t)),c.mouseout.call(this,e)}),c.load(),v.method("update",function(){d.style("width",s.layout.width()+"px"),e.attr("width",s.layout.width());var r=s.layout.cluster,v=s.layout.diagonal(),p=s.layout.transform_node,_=g(f.tree);s.layout.max_leaf_label_width(_);var y=m(f.tree),b=f.tree.get_all_leaves().length,x={n_leaves:b,label_height:y,label_padding:15};s.layout.adjust_cluster_size(x),e.transition().duration(s.duration).ease(u).attr("height",s.layout.height(x)+30),n.transition().duration(s.duration).attr("transform","translate("+s.layout.translate_vis()[0]+","+s.layout.translate_vis()[1]+")"),f.nodes=r.nodes(f.data),s.layout.scale_branch_lengths(f),f.links=r.links(f.nodes);var k=o.selectAll("path.tnt_tree_link").data(f.links,function(t){return s.id(t.target)}),w=l.selectAll("g.tnt_tree_node").data(f.nodes,function(t){return s.id(t)});k.exit().remove();k.enter().append("path").attr("class","tnt_tree_link").attr("id",function(e){return"tnt_tree_link_"+t+"_"+s.id(e.target)}).attr("stroke",function(t){return d3.functor(s.branch_color)(i(t.source),i(t.target))}).attr("d",v),k.transition().ease(u).duration(s.duration).attr("d",v);var j=w.enter().append("g").attr("class",function(t){return t.children?0===t.depth?"root tnt_tree_node":"inner tnt_tree_node":"leaf tnt_tree_node"}).attr("id",function(e){return"tnt_tree_node_"+t+"_"+e._id}).attr("transform",p);w.exit().remove(),j.on("click",function(t){var e=i(t);a.trigger("node:click",e),c.click.call(this,e)}),j.on("dblclick",function(t){var e=i(t);a.trigger("node:dblclick",e),c.dblclick.call(this,e)}),j.on("mouseover",function(t){var e=i(t);a.trigger("node:hover",i(t)),c.mouseover.call(this,e)}),j.on("mouseout",function(t){var e=i(t);a.trigger("node:mouseout",i(t)),c.mouseout.call(this,e)}),h.update_nodes(),w.transition().ease(u).duration(s.duration).attr("transform",p)}),v.method("update_nodes",function(){var t=l.selectAll("g.tnt_tree_node");t.each(function(){s.node_display.reset.call(this)}),t.each(function(t){s.node_display.call(this,i(t))}),t.each(function(t){s.label.call(this,i(t),s.layout.type,d3.functor(s.node_display.size())(i(t)))})})},v=r(h).getset(s);return v.method("scale_bar",function(t,e){if(h.layout().scale()){e||(e="pixel");var n;return o.selectAll("path").each(function(r){if(!n){var i=this.getAttribute("d"),a=i.split(/[MLA]/),o=a.pop(),l=a.pop(),c=l.split(","),s=o.split(","),u=s[0]-c[0],d=s[1]-c[1],f=Math.sqrt(u*u+d*d),h=r.source,v=r.target,p=v._root_dist-h._root_dist;p&&("pixel"===e?n=p/f*t:"tree"===e&&(n=f/p*t))}}),n}}),v.method("data",function(t){if(!arguments.length)return d.data;d.data=t,f.data=t;var e=i(d.data);return h.root(e),d.tree=e,f.tree=d.tree,a.trigger("data:hasChanged",d.data),this}),v.method("root",function(){return f.tree}),d3.rebind(h,c,"on")};e.exports=n=a},{"tnt.api":6,"tnt.tree.node":10}]},{},[1]);