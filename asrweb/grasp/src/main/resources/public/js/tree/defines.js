/**
 * A helper file that enables pre-defining set constants.
 * @type {string}
 */

// Main Tree vars
const T_ID = 'id';
const T_NAME = 'name';
const T_CHILDREN = 'children';
const T_PARENT = 'parent';
const T_X = 'x';
const T_Y = 'y';
const T_EXTANT = 'extant';
const T_NUM_EXTANTS = 'n_extants';
const T_COMMON_TAXA = 'common_taxa';
const T_COMMON_RANK = 'common_rank';
const T_TAXA = 'taxa';
const T_DIFFER_RANK = 'differ_rank';
const T_DEPTH = 'depth';
const T_IS_SET = 'is_set';
// Used when making the tree
const T_DIST_FROM_ROOT = 'dist';
const T_MAX_CHILDREN = 'max_children';
const T_BRANCH_LEN = 'branch_len';
const T_LEFT = 'is_left'; // Whether it is a left or right child bool
const T_RAW_X = 'raw_x';
const T_IS_ROOT = 'is_root';

// This gets removed before we save the tree to crossfilter.
const T_INFO = [T_DIST_FROM_ROOT, T_MAX_CHILDREN, T_BRANCH_LEN, T_LEFT, T_RAW_X, T_IS_ROOT];

const B_ID = 'id';
const B_Y1 = 'y1';
const B_Y2 = 'y2';
const B_X1 = 'x1';
const B_X2 = 'x2';
const B_LABEL = 'len';

const COLOUR = 'colour';

var ranks =  ["t_domain", "t_superkingdom", "t_kingdom", "t_phylum", "t_class_t", "t_order_t", "t_family", "t_genus", "t_species"]
;//["domain", "kingdom", "phylum", "class", "order","family", "genus", "species"]
var RANKS = ["t_domain", "t_superkingdom", "t_kingdom", "t_phylum", "t_class_t", "t_order_t", "t_family", "t_genus", "t_species"]
