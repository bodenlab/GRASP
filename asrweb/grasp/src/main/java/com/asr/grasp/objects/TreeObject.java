package com.asr.grasp.objects;

import dat.PhyloTree;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;

/**
 * Tree Object that is used to find intersection between two reconstructed trees.
 *
 * written by ariane @ 22/10/2018
 */
public class TreeObject {

    private TreeNodeObject root;
    private ArrayList<TreeNodeObject> nodeList;
    private ArrayList<TreeNodeObject> leafNodeList;
    private ArrayList<TreeNodeObject> ancestorList;

    /* We keep track of the extents so that we can find the intersection between two trees easily */
    private ArrayList<String> extantLabelList;
    private ArrayList<String> ancestorLabelList;

    public TreeObject(String filname, boolean load) {
        this.nodeList = new ArrayList<>();
        this.leafNodeList = new ArrayList<>();
        this.extantLabelList = new ArrayList<>();
        this.ancestorLabelList = new ArrayList<>();
        this.ancestorList = new ArrayList<>();
        try {
            loadNewick(filname);
        } catch (Exception e) {
            System.out.println("" + e.getMessage());
        }
        // Setup all the distances for each of the nodes
        for (TreeNodeObject tno: nodeList) {
            tno.setDistanceFromRoot();
        }
    }

    public TreeObject(String treeAsNewick) {
        this.nodeList = new ArrayList<>();
        this.leafNodeList = new ArrayList<>();
        this.extantLabelList = new ArrayList<>();
        this.ancestorLabelList = new ArrayList<>();
        this.ancestorList = new ArrayList<>();
        parseNewick(treeAsNewick, root);
        // Setup all the distances for each of the nodes
        for (TreeNodeObject tno: nodeList) {
            tno.setDistanceFromRoot();
        }
    }

    /**
     * Gets the list of ancestors
     * @return
     */
    public ArrayList<TreeNodeObject> getAncestorList() {
        return ancestorList;
    }

    public void clearScores() {
        for (TreeNodeObject tno: nodeList) {
            tno.resetScore();
        }
    }

    /**
     * Corrects for if we have labels which do or don't have the pipe from uniprot
     * @param rawLabel
     */
    private String formatLabel(String rawLabel) {
        if (rawLabel.split("|").length > 1) {
            return rawLabel.split("|")[1];
        } else {
            if (rawLabel.split("_").length > 1) {
                return rawLabel.split("_")[0];
            } else {
                return rawLabel;
            }
        }
    }

    /**
     * Gets the list of anc
     * @return
     */
    public ArrayList<String> getAncestorLabelList() {
        return this.ancestorLabelList;
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
     * Retures the extent nodes.
     * @return
     */
    public ArrayList<TreeNodeObject> getLeafNodeList() {
        return leafNodeList;
    }

    /**
     * Returns a list of extent labels.
     * @return
     */
    public ArrayList<String> getExtantLabelList() {
        return this.extantLabelList;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                    The methods below are for parsing the Newick string
     *
     * ---------------------------------------------------------------------------------------------
     */

    /**
     * Factory method to create a tree instance from a Newick formatted file.
     * @param filename name of file
     * @return instance of tree
     */
    public void loadNewick(String filename) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(filename));
        StringBuilder sb = new StringBuilder();
        String line = null;
        while ((line = reader.readLine()) != null)
            sb.append(line.trim());

        root = parseNewick(sb.toString(), root); //null parent for root
        reader.close();
    }



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
        root = parseNewick(newickStr, parent, new ArrayList<>(), 0, 0);
        return root;
    }

    /**
     * Helper function to parse a leaf (extent sequence) in a Newick file.
     *
     * @param str           The Newick String
     * @param parent        Parent Node
     * @return
     */
    private TreeNodeObject parseLeafNewick(String str, TreeNodeObject parent, int nextId) {
        TreeNodeObject node;
        String label;
        int splitIdx = str.indexOf(':'); // check if a distance is specified
        if (splitIdx == -1) {// no distance
            node = new TreeNodeObject(str, parent, null, nextId, true);
            nextId ++;
        } else { // there's a distance
            label = str.substring(0, splitIdx).trim();
            try {
                double dist = Double.parseDouble(str.substring(splitIdx + 1, str.length()));
                if (dist == 0.0) {
                    dist = 0.00001;
                    System.err.println("Distance value: 0.0 parsed in tree file. Representing distance as " + Double.toString(dist));
                }
                node = new TreeNodeObject(label, parent, dist, nextId,  true);
                nextId ++;
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
        leafNodeList.add(node);
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
    private TreeNodeObject parseInternalNewick(String embed, String tail, TreeNodeObject parent, ArrayList<Integer> nodeIds, int count, int nextId) {
        String label;
        TreeNodeObject node;
        int splitIdx = tail.indexOf(':'); // check if a distance is specified
        if (splitIdx == -1) { // no distance
            if(!tail.isEmpty() && tail.substring(0, tail.length() - 1) != null && !tail.substring(0, tail.length() - 1).isEmpty()) {
                label = tail.substring(splitIdx + 1, tail.length()).replace(";", "");
                node = new TreeNodeObject(label, parent, null, nextId, false);
                nextId ++;
            } else {
                node = new TreeNodeObject("N" + count, parent, null, nextId, false);
                nextId ++;
            }
        } else { // there's a distance
            if(tail.substring(0, splitIdx) != null && !tail.substring(0, splitIdx).isEmpty()) {
                label = tail.substring(0, splitIdx);
            } else {
                label = "N" + count;
            }
            try {
                double dist = Double.parseDouble(tail.substring(splitIdx + 1, tail.length()).replace(";", ""));
                if (dist == 0.0) {
                    dist = 0.00001;
                    System.err.println("Distance value: 0.0 parsed in tree file. Representing distance as " + Double.toString(dist));
                }
                node = new TreeNodeObject(label, parent, dist, count, false);
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
            node.addChild(parseNewick(toProcess, node, nodeIds, count, nextId));
            nextId ++;
            if (comma + 1 > embed.length()) {
                break;
            }
            embed = embed.substring(comma + 1);
            comma = getComma(embed);
        }
        // So we can iterate through all the ancestors
        ancestorLabelList.add(node.getLabel());
        ancestorList.add(node);
        return node;
    }

    /**
     * Utility method for recursively parse an embedded string on the Newick format.
     * MB-Fix: fixed a bug that meant that labels were missing the last character.
     * (Only last node or any node if distance is not given.)
     * @param parent the parent of the current node
     * @return the root node of tree
     */
    private TreeNodeObject parseNewick(String str, TreeNodeObject parent, ArrayList<Integer> nodeIds, int count, int nextId) {
        TreeNodeObject node = null;
        str = str.replace("\t","");
        int startIdx = str.indexOf('('); // start parenthesis
        int endIdx = str.lastIndexOf(')'); // end parenthesis
        if (startIdx == -1 && endIdx == -1) { // we are at leaf (no parentheses)
            node = parseLeafNewick(str, parent, nextId);
            nextId ++;
        } else if (startIdx >= 0 && endIdx >= 0) { // balanced parentheses
            String embed = str.substring(startIdx + 1, endIdx);
            String tail = str.substring(endIdx + 1, str.length());
            node = parseInternalNewick(embed, tail, parent, nodeIds, count, nextId);
            nextId ++;
        }
        if (!nodeList.contains(node)) {
            nodeList.add(node);
        }
        return node;
    }
}
