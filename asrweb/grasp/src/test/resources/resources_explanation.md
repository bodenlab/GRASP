# Explanation of resources

## Basic info

Sequences / alignments start with similar names if they can be used together
Final number appended to name indicates how many sequences in each file.
Files that don't run correctly through GRASP are indicated.

## Specific info

CYP2U1_10_no_spaces - Example of sequences run through PhyML (automatically changes gaps and certain characters into underscores). The Newick file contains quotation marks around each ID. 

CYP2U1_10 - Example of what sequences looks like coming direct from NCBI. Tree made with RAxML which strips content after the first space.

CYP2U1_just_IDs_10 - Example of sequences with just IDs

Edge_parsmiony_example_with_non_bi_directional_transition_10 - Example of an alignment that before A Star search would be forced into taking a non bi-directional edge along a path when a path containing only bi-directional edges existed.

Name_test_with_no_error_9 - Example to use with taxonomic annotation that will work correctly

Name_test_with_one_error_10 - Example to use with taxonomic annotation that will return one error.

Nexus_simple - Example of NEXUS format.

Nexus_with_labels_and_annotations - More detailed NEXUS format containing extra labels and GO Term annotations. In FigTree, labels can be viewed by clicking on "Branch Labels" and "Node Labels", and annotations can be viewed by clicking on "Tip Labels". Depending on what they're saved as, you might need to change the value to display in the "Display" drop down menu under each of these Label sections in FigTree.