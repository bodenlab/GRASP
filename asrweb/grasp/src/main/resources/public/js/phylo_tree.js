/**
 * New version of the Phylo tree for GRASP
 * @ariane.mora 29/06/2017
 */



var phylo_options = {
    total_depth: 0,
    total_branch_length: 0,
    all_nodes: new Array(),
    width: 3000,
    height: 600,
    // Options for style
    radius: 50,
    fill: "blue",
    stroke: "grey",
    stroke_width: "3px",
    opacity: 0.8
}

/**
 * Creates the SVG element
 *
 */
var setup_svg = function (phylo_options, tree_div) {
    var svg = d3.select(tree_div)
        .append("svg")
        .attr("width", phylo_options.width)
        .attr("height", phylo_options.height * 2)
        .call(d3.behavior.zoom().on("zoom", function () {
            svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
        }));
    
    var group = svg.append("g")
        .attr("width", phylo_options.width)
        .attr("height", phylo_options.height * 2);    
    
    phylo_options.svg = svg;
    phylo_options.group = group;
    return phylo_options;
}


/**
 * Draws the nodes for the phylo tree.
 */
var draw_phylo_nodes = function (phylo_options) {
    var group = phylo_options.group;
    for (var n in phylo_options.all_nodes) {
        var node = phylo_options.all_nodes[n];
        group.append("circle")
            .attr("id", node.name)
            .attr("cx", node.x)
            .attr("cy", node.y)
            .attr("r", phylo_options.radius)
            .attr("fill", phylo_options.fill)
            .attr("stroke", phylo_options.stroke)
            .attr("opacity", phylo_options.opacity)
            .attr("stroke_width", phylo_options.stroke_width);

    }    
}



/**
 * Sets up the tree and calls the other functions
 */
var setup_phylo_tree = function (tree_div, tree_string) {
    var tree_json = parse_newick(tree_string);
    phylo_options.total_branch_length = tree_json.branch_length;
    tree_json.x = phylo_options.width /2;
    tree_json.y = 50;
    assign_depths(phylo_options.total_depth, tree_json);
    var nodes = phylo_options.all_nodes;
    phylo_options = setup_svg(phylo_options, tree_div);
    draw_phylo_nodes(phylo_options);
}



/**
 * Helper that makes a cut down node.
 */
var make_child = function(node, left, depth) {

    var child = {};
    child.left = left;
    child.depth = depth;
    child.name = node.name;
    child.branch_length = node.branch_length;
    child.y = node.y;
    child.x = node.x;

    return child;
}

/**
 * Assign depths to tree. Goes through the nested JSON object
 * and adds as nodes, assigning a depth so that the y value
 * can be calculated.
 */
var assign_depths = function (depth, node) {
    var new_depth = depth + 1;

    if (node.children == undefined) {
        return;
    }
    // Calculate the branch length of the nodes by finding what % of the total branch lenth
    // each child has and multiply by the height of the svg.
    node.children[0].y = node.y + phylo_options.height * (node.children[0].branch_length/phylo_options.total_branch_length);
    node.children[1].y = node.y + phylo_options.height * (node.children[1].branch_length/phylo_options.total_branch_length);
    // Left
    node.children[0].x = node.x - (phylo_options.width / (Math.pow(2, new_depth + 1)));
    // Right
    node.children[1].x = node.x + (phylo_options.width / (Math.pow(2, new_depth + 1)));
    
    // Make the children nodes and add them to the node list
    phylo_options.all_nodes.push(make_child(node.children[0], true, new_depth));
    phylo_options.all_nodes.push(make_child(node.children[1], false, new_depth));

    return assign_depths(new_depth, node.children[0]) ||
                assign_depths(new_depth, node.children[1]);
}

/**
 * Parsing the newick format of a tree to JSON.
 * From:
 *      https://github.com/daviddao/biojs-io-newick
 *      under: Apache2 license
 */
var parse_newick = function (s) {
	var ancestors = [];
	var tree = {};
	var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
	for (var i=0; i<tokens.length; i++) {
		var token = tokens[i];
		switch (token) {
			case '(': // new children
				var subtree = {};
				tree.children = [subtree];
				ancestors.push(tree);
				tree = subtree;
				break;
			case ',': // another branch
				var subtree = {};
				ancestors[ancestors.length-1].children.push(subtree);
				tree = subtree;
				break;
			case ')': // optional name next
				tree = ancestors.pop();
				break;
			case ':': // optional length next
				break;
			default:
				var x = tokens[i-1];
				if (x == ')' || x == '(' || x == ',') {
					tree.name = token;
				} else if (x == ':') {
					tree.branch_length = parseFloat(token);
				}
		}
	}
	return tree;
};
