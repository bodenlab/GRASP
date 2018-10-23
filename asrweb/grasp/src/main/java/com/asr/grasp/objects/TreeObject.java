package com.asr.grasp.objects;

import java.util.ArrayList;

/**
 * Tree Object that is used to find intersection between two reconstructed trees.
 *
 * written by ariane @ 22/10/2018
 */
public class TreeObject {

    private TreeNodeObject root;
    private ArrayList<TreeNodeObject> nodeList;

    /* We keep track of the extents so that we can find the intersection between two trees easily */
    private ArrayList<String> extantLabelList;

    public TreeObject(String treeAsNewick) {
        this.nodeList = new ArrayList<>();
        parseNewick(treeAsNewick, root);
    }

    /**
     * Gets the root of the tree, this is used to iterate and determine which of the
     * nodes fall under the tree.
     * @return
     */
    public TreeNodeObject getRoot() {
        return root;
    }

    /**
     * Gets a treeNodeObject via it's label.
     * Used to determine which nodes are the children of a given node.
     *
     * @param label
     * @return
     */
    public TreeNodeObject getNodeByLabel(String label) {
        for (TreeNodeObject node: nodeList) {
            if (node.getLabel().equals(label)) {
                return node;
            }
        }
        return null;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                    The methods below are for parsing the Newick string
     *
     * ---------------------------------------------------------------------------------------------
     */

    /**
     * Find index of first comma at the current level (non-embedded commas are ignored) or end of string.
     * @param str a Newick string
     * @return index of the first comma or end-of-string
     */
    private static int getComma(String str) {
        if (str.length() == 0)
            return -1;
        int mylevel = 0;
        char[] chararr = str.toCharArray();
        for (int i = 0; i < chararr.length; i ++) {
            if (chararr[i] == '(') mylevel += 1;
            else if (chararr[i] == ')') mylevel -= 1;
            else if (chararr[i] == ',' && mylevel == 0) return i;
        }
        return str.length();
    }

    /**
     * Utility method to parse an embedded string on the Newick format.
     * @param parent the parent of the current node
     * @return the root node of tree
     */
    private TreeNodeObject parseNewick(String newickStr, TreeNodeObject parent) {
        root = parseNewick(newickStr, parent, new ArrayList<>(), 0);
        return root;
    }

    /**
     * Helper function to parse a leaf (extent sequence) in a Newick file.
     *
     * @param str           The Newick String
     * @param parent        Parent Node
     * @return
     */
    private TreeNodeObject parseLeafNewick(String str, TreeNodeObject parent) {
        TreeNodeObject node;
        String label;
        int splitIdx = str.indexOf(':'); // check if a distance is specified
        if (splitIdx == -1) {// no distance
            node = new TreeNodeObject(str, parent, null);
        } else { // there's a distance
            label = str.substring(0, splitIdx).trim();
            try {
                double dist = Double.parseDouble(str.substring(splitIdx + 1, str.length()));
                if (dist == 0.0) {
                    dist = 0.00001;
                    System.err.println("Distance value: 0.0 parsed in tree file. Representing distance as " + Double.toString(dist));
                }
                node = new TreeNodeObject(label, parent, dist);
                if (root == null) {
                    root = node;
                }
            }
            catch (NumberFormatException ex) {
                throw new RuntimeException("Error: A distance value in your Newick file couldn't be parsed as a number  \n \nThe value was - "  + str.substring(splitIdx + 1, str.length()));
            }
        }
        // Add this to our list of extant sequences.
        extantLabelList.add(node.getLabel());
        return node;
    }


    /**
     * Helper function to parse an internal node (i.e. the template for an ancestor) in the
     * Newick file.
     *
     * @param embed         Part of Newick String containing the ancestoral node
     * @param tail          End of the String
     * @param parent        Parent of the Node
     * @param nodeIds       List of traversed NodeIds
     * @param count         Number of nodeIds visited
     * @return
     */
    private TreeNodeObject parseInternalNewick(String embed, String tail, TreeNodeObject parent, ArrayList<Integer> nodeIds, int count) {
        String label;
        TreeNodeObject node;
        int splitIdx = tail.indexOf(':'); // check if a distance is specified
        if (splitIdx == -1) { // no distance
            if(!tail.isEmpty() && tail.substring(0, tail.length() - 1) != null && !tail.substring(0, tail.length() - 1).isEmpty()) {
                label = tail.substring(splitIdx + 1, tail.length()).replace(";", "");
                node = new TreeNodeObject("N" + count + "_" + label, parent, null);
            } else {
                node = new TreeNodeObject("N" + count, parent, null);
            }
        } else { // there's a distance
            if(tail.substring(0, splitIdx) != null && !tail.substring(0, splitIdx).isEmpty()) {
                label = "N" + count + "_" + tail.substring(0, splitIdx);
            } else {
                label = "N" + count;
            }
            try {
                double dist = Double.parseDouble(tail.substring(splitIdx + 1, tail.length()).replace(";", ""));
                if (dist == 0.0) {
                    dist = 0.00001;
                    System.err.println("Distance value: 0.0 parsed in tree file. Representing distance as " + Double.toString(dist));
                }
                node = new TreeNodeObject(label, parent, dist);
                if (root == null) {
                    root = node;
                }
            }
            catch (NumberFormatException ex) {
                throw new RuntimeException("Error: A distance value in your Newick file couldn't be parsed as a number  \n \nThe value was - "  + tail.substring(splitIdx + 1, tail.length()).replace(";", ""));
            }
        }
        nodeIds.add(count);
        // find where the commas are, and create children of node
        int comma = getComma(embed);
        String toProcess;
        while (comma != -1) {
            toProcess = embed.substring(0, comma);
            //GOING TO HAVE TO PASS PARENT NODE WITH RECURSION TO RECORD IT
            // get unique ID to pass through
            while (nodeIds.contains(count)) {
                count++;
            }
            node.addChild(parseNewick(toProcess, node, nodeIds, count));
            if (comma + 1 > embed.length()) {
                break;
            }
            embed = embed.substring(comma + 1);
            comma = getComma(embed);
        }
        return node;
    }

    /**
     * Utility method for recursively parse an embedded string on the Newick format.
     * MB-Fix: fixed a bug that meant that labels were missing the last character.
     * (Only last node or any node if distance is not given.)
     * @param parent the parent of the current node
     * @return the root node of tree
     */
    private TreeNodeObject parseNewick(String str, TreeNodeObject parent, ArrayList<Integer> nodeIds, int count) {
        TreeNodeObject node = null;
        str = str.replace("\t","");
        int startIdx = str.indexOf('('); // start parenthesis
        int endIdx = str.lastIndexOf(')'); // end parenthesis
        if (startIdx == -1 && endIdx == -1) { // we are at leaf (no parentheses)
            node = parseLeafNewick(str, parent);
        } else if (startIdx >= 0 && endIdx >= 0) { // balanced parentheses
            String embed = str.substring(startIdx + 1, endIdx);
            String tail = str.substring(endIdx + 1, str.length());
            node = parseInternalNewick(embed, tail, parent, nodeIds, count);
        }
        if (!nodeList.contains(node)) {
            nodeList.add(node);
        }
        return node;
    }
}
