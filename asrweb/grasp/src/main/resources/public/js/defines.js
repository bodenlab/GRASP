/**
 * A helper file that enables pre-defining set constants.
 * @type {number}
 */


/* The G prefix indictes this is GRASP specific notation - note that other
 * included libraries have similar notations (e.g. X in jquery).
 */


// GRASP DEFINES
// The three below ref the same, just used to make it easier


const G_X_LABEL = 0;
const G_LABEL = 0;
/* VALUE holds an array that contains a label in the 0tth element and then has
 * 2 values following: 1: value, 2: seq_num*/
const G_VALUE = 1;
const G_VALUE_BAR = 1;
const G_LABEL_MUTANT = 0;
const G_VALUE_MUTANT = 1;

const G_SEQ_NUM = 2;

/* ID on front end */
const G_ID = 1;
/* int X-Coord */
const G_X = 2;
const G_MUTANTS = 4;
const G_CONSENSUS = 4;
const G_SEQ = 5;
const G_GRAPH = 6;
/* int Y-Coord */
const G_Y = 8;
/* bool whether it is part of the consensus or not */

const N_MUTANT = 12; //ToDo: CHECK THIS DOESN"T CONFLICT WITH THE OTHER MUTANT
// NODE defines
const UNIQUE_ID = 16;
const N_X = 2;
const N_Y = 8;
const N_CLASS = 9;
const N_GROUP = 14;

const N_TYPE = 10;
const N_DEL_DUR_INF = 11;

const N_NUM_OUT_EDGES = 13;

const G_CHARS = 0;
const M_VALUE = 1;

const MERGED_ID = 2;



const M_CHAR = 0;
const M_POAG = 1;
const M_LABEL = 0;
const M_BAR_LABEL = 2;
const M_BAR_VALUE = 3;

// Used for the fused graph
const N_MERGED_SEQ = 15;
const N_MERGED_GRAPH = 17;
const N_VALUE_MERGED = 3;

// EDGE defines
const E_CONSENSUS = 0;
const E_RECIPROCATED = 1;
const E_FROM = 2;
const E_TO = 3;
const E_WEIGHT = 4;
const E_SINGLE = 5;

const E_ID = 6;
const E_NAME = 7;

const E_SEQS = 8;


// USED FOR EDGE COPYING
const E_Y1 = 9;
const E_Y2 = 10;
const E_X1 = 11;
const E_X2 = 12;

// For creating the positions
const T_IS_LEFT = 1;
const N_MOD = 1;
const N_DEPTH = 1;
const N_THREAD = 1;

// const B_ID = 0;
// const B_Y1 = 1;
// const B_Y2 = 2;
// const B_X1 = 3;
// const B_X2 = 4;
// const B_LABEL = 5;

const TEXT_CONTENT = 2;//textContent


//
//
// // Main Tree vars
// const T_ID = 0;
// const T_NAME = 1;
// const T_CHILDREN = 2;
// const T_X = 3;
// const T_Y = 4;
// const T_EXTANT = 5;
// const T_NUM_EXTANTS = 6;
// const T_COLLAPSED = 7;
// const T_CONTAINS_SEARCH = 8;
// const T_TERMINATED = 9;
// const T_COMMON_TAXA = 10;
// const T_COMMON_RANK = 11;
//
// // Used when making the tree
// const T_DIST_FROM_ROOT = 12;
// const T_MAX_CHILDREN = 13;
// const T_BRANCH_LEN = 14;
// const T_LEFT = 15; // Whether it is a left or right child bool
//
//
// const T_RAW_X = 16;
// const T_PARENT = 17;
// const T_IS_ROOT = 18;
//
// const T_LI = 0;
// const T_RI = 1;
// const T_MAX_OFFSET = 2;
// const T_LEFT_OFFSET = 3;
// const T_RIGHT_OFFSET = 4;
// const T_LO = 5;
// const T_RO = 6;
//
//
// const T_MOD = 19;
//
// const T_THREAD = 20;
// const T_TAXA = 21;
// const T_DIFFER_RANK = 22;
// const T_DEPTH = 23;


const TRUE = 1;
const FALSE = 0;
const INITIAL = 'o';
const FINAL = 'f';


/**
 * This is for the similar nodes.
 **/
const S_NAME = 0;
const S_SCORE = 1;


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
const T_DIFFER_RANK = 'diff_rank';
const T_DEPTH = 'depth';

// Used when making the tree
const T_DIST_FROM_ROOT = 'dist';
const T_MAX_CHILDREN = 'max_children';
const T_BRANCH_LEN = 'branch_len';
const T_LEFT = 'is_left'; // Whether it is a left or right child bool
const T_RAW_X = 'raw_x';
const T_IS_ROOT = 'is_root';
const T_COLLAPSED = 'collapsed';
const T_TERMINATED = 'terminated';
const T_CONTAINS_SEARCH = 'has_search'
// This gets removed before we save the tree to crossfilter.
const T_INFO = [T_DIST_FROM_ROOT, T_MAX_CHILDREN, T_BRANCH_LEN, T_LEFT, T_RAW_X, T_IS_ROOT];

const B_ID = 'id';
const B_Y1 = 'y1';
const B_Y2 = 'y2';
const B_X1 = 'x1';
const B_X2 = 'x2';
const B_LABEL = 'len';

const COLOUR = 'colour';