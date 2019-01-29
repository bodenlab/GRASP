package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.TreeModel;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.PriorityQueue;
import json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * The tree controller handles the higher level functions to do with logic associated with the
 * reconstructed tree. For example comparing two trees and finding the intersecting ancestors.
 *
 * written by ariane @ 22/10/2018
 */
@Service
public class TreeController {

    @Autowired
    TreeModel treeModel;

    @Autowired
    ReconstructionsModel reconModel;

    @Autowired
    SeqController seqController;

    @Autowired
    ReconstructionController reconController;

    private PriorityQueue<TreeNodeObject> orderedNodes;

    private double origDistToRoot = 0;

    private boolean breakout = false;

    private boolean forceUnknown = false;

    private TreeNodeObject bestNode = null;

    /**
     * Gets a reconstructed tree string via it's reconstruction and userId.
     *
     * @param reconId
     * @param userId
     * @return
     */
    public String getReconTreeById(int reconId, int userId) {
        return treeModel.getById(reconId, userId);
    }

    /**
     * Gets a Tree via it's reconstruction and userId.
     *
     * @param reconId
     * @param userId
     * @return
     */
    public TreeObject getById(int reconId, int userId) {
        String treeAsNewick = treeModel.getById(reconId, userId);
        // Parse the tree
        if (treeAsNewick != null) {
            return new TreeObject(treeAsNewick);
        }
        return null;
    }


    /**
     * This method takes two file paths and finds the similar nodes between the two.
     *
     * It prints it out to the console.
     *
     * ToDo: Allow users to download a CSV File.
     *
     * @param reconKnownAncsFilePath
     * @param reconUnknownAncsFilePath
     * @param sameTree
     */
     public ArrayList<String> getSimilarNodes(String reconKnownAncsFilePath, String reconUnknownAncsFilePath, boolean sameTree) {
         // Otherwise get the trees
         TreeObject treeKnownAncs = new TreeObject(reconKnownAncsFilePath, true);
         TreeObject treeUnknownAncs = new TreeObject(reconUnknownAncsFilePath, true);
         System.out.println(reconKnownAncsFilePath + "," + reconUnknownAncsFilePath + ",Score");

         // Setup the ordered nodes
         return runSimilarNodesEfficient(treeKnownAncs, treeUnknownAncs, sameTree);
     }

    /**
     * Gets similar nodes in a second reconstructed tree based on the nodes in the initial tree.
     *
     * @param user
     * @param reconKnownAncsLabel
     * @param reconUnknownAncsLabel
     * @param ancsestorLabel
     * @return
     */
    public ArrayList<String> getSimilarNodesTmp(UserObject user, String reconKnownAncsLabel,
            String reconUnknownAncsLabel, String ancsestorLabel, int numSimilarNodes) {
        int reconKnownAncsId = reconModel.getIdByLabel(reconKnownAncsLabel, user.getId());
        int reconUnknownAncsId = reconModel.getIdByLabel(reconUnknownAncsLabel, user.getId());


        // If either of the labels are incorrect then return
        if (reconKnownAncsId == Defines.FALSE || reconUnknownAncsId == Defines.FALSE) {
            return null;
        }

        // Otherwise get the trees
        TreeObject treeKnownAncs = getById(reconKnownAncsId, user.getId());
        TreeObject treeUnknownAncs = getById(reconUnknownAncsId, user.getId());

        // If either of the trees weren't able to be parsed return
        if (treeKnownAncs == null || treeUnknownAncs == null) {
            return null;
        }

        // Setup the ordered nodes
        orderedNodes = new PriorityQueue<>(10, new TreeNodeComparator());

        getSimilarNodes(treeKnownAncs, treeUnknownAncs, ancsestorLabel);

        ArrayList<String> retNodes = new ArrayList<>();

        /**
         * Convert the nodes to a JSON representation so we can view these on the front end.
         */
        for (int i = 0; i < numSimilarNodes; i ++) {
            TreeNodeObject n = orderedNodes.poll();
            retNodes.add(n.getOriginalLabel());
            System.out.println("NODE: " + n.getLabel() + ", score: " + n.getScore() + ", dist: " + n.getDistanceToRoot());// + " orig-dist: " + node.getDistanceToRoot());
        }

        return retNodes;
    }

    /**
     * The method is as follows:
     *
     *      1. Find the extent sequences that exist in both trees.
     *      2. For each node in the UNKNOWN and KNOWN tree, we build a hashset of those extents
     *      3. For each node in the KNOWN tree, we find the matching node in the UNKNOWN tree
     *          Done with the following method
     *          a. Start at a TreeNode that has at least one of the Intersections Extents
     *          b. Determine the score for each parent going up the tree based on the intersetion
     *              of each of the intersection HashSets
     *          c. Break once all the extent's in the known node (that are included in the other)
     *              are in the UNKNOWN node. The best node MUST exist under this one.
     * @param treeKnownAncs
     * @param treeUnknownAncs
     * @return
     */
    public ArrayList<String> runSimilarNodesEfficient(TreeObject treeKnownAncs, TreeObject treeUnknownAncs, boolean sameTree) {
        // Get the intersection of leaves. This will be used to confirm that at each node we are
        // correctly counting nodes that appear in both trees.
        // Force it to use the Id's of the unknown tree
        ArrayList<TreeNodeObject> intersection = getIntersection(treeKnownAncs, treeUnknownAncs, true);

        int id = 0;
        for (TreeNodeObject tno: intersection) {
            tno.setId(id);
            id ++;
        }

        // For the known tree we want to build up a hashset using the new Id notation
        // This will also allow us to only get the nodes contained in the intersection
        treeKnownAncs.getRoot().buildIntersectionLabelMapping(intersection);
        treeUnknownAncs.getRoot().buildIntersectionLabelMapping(intersection);
        // For each node in the known tree we now want to get the best node
        ArrayList<TreeNodeObject> nodes = treeKnownAncs.getAncestorList();

        // Return a .ist of lines that can easily be printed to a file.
        ArrayList<String> listOfLines = new ArrayList<>();
        for (TreeNodeObject tno: nodes) {
            scoreNodesEfficient(tno.getIntersectIds(), treeUnknownAncs.getRoot());
            String result = "";
            if (sameTree) {
                if (!tno.getLabel().equals(bestNode.getLabel())) {
                    result = "NODE: " + tno.getLabel() + " UNMATCHED:" + bestNode.getLabel()
                                    + ", score: "
                                    + bestNode
                                    .getScore();
                } else {
                    result = tno.getLabel() + "," + bestNode.getLabel() + "," + bestNode.getScore();
                }
            } else {
                result =
                        tno.getLabel() + "," + bestNode.getLabel() + "," + bestNode.getScore();
            }
            listOfLines.add(result);
            System.out.println(result);
            treeUnknownAncs.clearScores();
            treeKnownAncs.clearScores();
        }

        return listOfLines;
    }



    /**
     * Gets similar nodes in a second reconstructed tree based on the nodes in the initial tree.
     *
     * @param user
     * @param reconKnownAncsLabel
     * @param reconUnknownAncsLabel
     * @param ancsestorLabel
     * @return
     */
    public JSONArray getSimilarNodes(UserObject user, String reconKnownAncsLabel, String reconUnknownAncsLabel, String ancsestorLabel, int numSimilarNodes) {
        int reconKnownAncsId = reconModel.getIdByLabel(reconKnownAncsLabel, user.getId());
        int reconUnknownAncsId = reconModel.getIdByLabel(reconUnknownAncsLabel, user.getId());


        // If either of the labels are incorrect then return
        if (reconKnownAncsId == Defines.FALSE || reconUnknownAncsId == Defines.FALSE) {
            return null;
        }

        // Otherwise get the trees
        TreeObject treeKnownAncs = getById(reconKnownAncsId, user.getId());
        TreeObject treeUnknownAncs = getById(reconUnknownAncsId, user.getId());

        // If either of the trees weren't able to be parsed return
        if (treeKnownAncs == null || treeUnknownAncs == null) {
            return null;
        }

        // Setup the ordered nodes
        orderedNodes = new PriorityQueue<>(10, new TreeNodeComparator());

        getSimilarNodes(treeKnownAncs, treeUnknownAncs, ancsestorLabel);

        JSONArray retNodes = new JSONArray();

        /**
         * Convert the nodes to a JSON representation so we can view these on the front end.
         */
        for (int i = 0; i < numSimilarNodes; i ++) {
            TreeNodeObject n = orderedNodes.poll();
            JSONArray node = new JSONArray();
            node.put(Defines.S_NAME, n.getOriginalLabel());
            node.put(Defines.S_SCORE, n.getScore());
            // ToDo: Remove and move to allow users to download in the download section
            // ToDo: Only keeping in interim
//            if (user.getUsername().equals("ariane2")) {
//                node.put(2, "saveCSV");
//                node.put(3, n.getLeafCount());
//                node.put(4, n.getDistanceToRoot());
//                node.put(5, treeKnownAncs.getNodeByLabel(ancsestorLabel).getDistanceToRoot());
//                node.put(6, n.getIncCnt());
//                node.put(7, n.getNoIncCnt());
//                node.put(8, n.getInc());
//                node.put(9, n.getNoInc());
//                node.put(10, n.getExtC());
//            }
            retNodes.put(node);

            System.out.println("NODE: " + n.getLabel() + ", score: " + n.getScore() + ", dist: " + n.getDistanceToRoot());// + " orig-dist: " + node.getDistanceToRoot());
        }

        return retNodes;
    }

    /**
     * Gets all the matching nodes (1:1) for two given trees.
     *
     * @param user
     * @param reconKnownAncsLabel
     * @param reconUnknownAncsLabel
     * @return
     */
    public JSONArray getAllSimilarNodes(UserObject user, String reconKnownAncsLabel, String reconUnknownAncsLabel) {
        int reconKnownAncsId = reconModel.getIdByLabel(reconKnownAncsLabel, user.getId());
        int reconUnknownAncsId = reconModel.getIdByLabel(reconUnknownAncsLabel, user.getId());


        // If either of the labels are incorrect then return
        if (reconKnownAncsId == Defines.FALSE || reconUnknownAncsId == Defines.FALSE) {
            return null;
        }

        // Otherwise get the trees
        TreeObject treeKnownAncs = getById(reconKnownAncsId, user.getId());
        TreeObject treeUnknownAncs = getById(reconUnknownAncsId, user.getId());

        // If either of the trees weren't able to be parsed return
        if (treeKnownAncs == null || treeUnknownAncs == null) {
            return null;
        }

        // Get the node list which we will iterate through
        JSONArray retNodes = new JSONArray();
        JSONArray jsonN = new JSONArray();
        jsonN.put("save-all");

        ArrayList<String> ancestors = treeKnownAncs.getAncestorLabelList();
        jsonN.put(reconKnownAncsLabel);
        jsonN.put(reconUnknownAncsLabel);

        jsonN.put("score");
        jsonN.put("extent-count");
        jsonN.put("original-dist-to-root");
        jsonN.put("corrosponding-dist-to-root");
        retNodes.put(jsonN);

        for (String ancsestorLabel: ancestors) {
            // Setup the ordered nodes

            orderedNodes = new PriorityQueue<>(10, new TreeNodeComparator());
            ArrayList<TreeNodeObject> intersection = getIntersection(treeKnownAncs,
                    treeUnknownAncs, forceUnknown);

            treeKnownAncs.clearScores();
            treeUnknownAncs.clearScores();
            // Now that we have the intersection we want to get the leaf nodes in the known ancestor
            // that lie under the node of interest - these must also be in the intersection obj
            TreeNodeObject node = treeKnownAncs.getNodeByLabel(ancsestorLabel);
            origDistToRoot = node.getDistanceToRoot();

            ArrayList<String> leaves = node.getLeafLabels();
            ArrayList<String> sharedLeaves;

            // Get the intersection of the leaves and the intersection - first convert the intersection
            // to Strings
            ArrayList<String> intersectionLabels = new ArrayList<>();

            for (TreeNodeObject tn : intersection) {
                intersectionLabels.add(tn.getLabel());
            }

            // This just is a slight optimisation to allow us to only look through the smaller set
            if (leaves.size() > intersection.size()) {
                sharedLeaves = getIntersectionOfStrings(intersectionLabels, leaves);
            } else {
                sharedLeaves = getIntersectionOfStrings(leaves, intersectionLabels);
            }

            // Also want to pass the leaves that aren't in the tree
            intersectionLabels.removeAll(sharedLeaves);

            scoreNodes(sharedLeaves, intersectionLabels, treeUnknownAncs.getRoot(), node.getDistanceToRoot());

            /**
             * If you want to save all of them uncomment the while loop
             */
//            while (orderedNodes.size() > 1) {
                TreeNodeObject n = orderedNodes.poll();
                JSONArray jsonNode = new JSONArray();
                jsonNode.put(node.getOriginalLabel());
                jsonNode.put(n.getOriginalLabel());
                jsonNode.put(n.getScore());
                jsonNode.put(n.getExtC());
                jsonNode.put(origDistToRoot);
                jsonNode.put(n.getDistanceToRoot());
                retNodes.put(jsonNode);

                if (!ancsestorLabel.equals(n.getLabel())) {
                    System.out.println(
                            "NODE: " + ancsestorLabel + " UNMATCHED:" + n.getLabel() + ", score: "
                                    + bestNode
                                    .getScore());
                }
//                System.out.println(node.getOriginalLabel() + " : " + n.getOriginalLabel() + ", " + n.getScore() + ", "  + n.getExtC() + ", " + n.getDistanceToRoot() + " vs " + origDistToRoot );
//            }
        }

        return retNodes;
    }

    /**
     * Returns a list of node IDs that give similar
     * @param treeKnownAncs
     * @param treeUnknownAncs
     * @param ancsestorLabel
     * @return
     */
    public ArrayList<String> getSimilarNodes(TreeObject treeKnownAncs, TreeObject treeUnknownAncs, String ancsestorLabel) {
        /**
         * First we want to upadate each node of the tree to only include the intersection of
         * both trees in terms of ancestor labels.
         */

        // Set up the original root node distance
        origDistToRoot = treeKnownAncs.getNodeByLabel(ancsestorLabel).getDistanceToRoot();

        ArrayList<TreeNodeObject> intersection = getIntersection(treeKnownAncs, treeUnknownAncs, forceUnknown);

        // Now that we have the intersection we want to get the leaf nodes in the known ancestor
        // that lie under the node of interest - these must also be in the intersection obj
        TreeNodeObject node = treeKnownAncs.getNodeByLabel(ancsestorLabel);
        ArrayList<String> leaves = node.getLeafLabels();
        ArrayList<String> sharedLeaves;

        // Get the intersection of the leaves and the intersection - first convert the intersection
        // to Strings
        ArrayList<String> intersectionLabels = new ArrayList<>();

        for (TreeNodeObject tn: intersection) {
            intersectionLabels.add(tn.getLabel());
        }

        // This just is a slight optimisation to allow us to only look through the smaller set
        if (leaves.size() > intersection.size()) {
            sharedLeaves = getIntersectionOfStrings(intersectionLabels, leaves);
        } else {
            sharedLeaves = getIntersectionOfStrings(leaves, intersectionLabels);
        }

        // Also want to pass the leaves that aren't in the tree
        intersectionLabels.removeAll(sharedLeaves);
        scoreNodes(sharedLeaves, intersectionLabels, treeUnknownAncs.getRoot(), node.getDistanceToRoot());

        return null;
    }

    /**
     * Gets the intersection of two tree objects. Returns the nodes they have in common.
     *
     * @param treeKnownAncs
     * @param treeUnknownAncs
     * @return
     */
    public ArrayList<TreeNodeObject> getIntersection(TreeObject treeKnownAncs, TreeObject treeUnknownAncs, boolean forceUnknown) {
        // iterate through the smaller one
        ArrayList<String> knownExtentLabelList = treeKnownAncs.getExtantLabelList();
        ArrayList<String> unknownExtentLabelList = treeUnknownAncs.getExtantLabelList();
        if (forceUnknown || knownExtentLabelList.size() > unknownExtentLabelList.size()) {
            return getIntersection(unknownExtentLabelList, knownExtentLabelList, treeUnknownAncs);
        } else {
            return getIntersection(knownExtentLabelList, unknownExtentLabelList, treeKnownAncs);
        }
    }

    /**
     * Helper to iterate through the smaller list.
     * @param smallList
     * @param largeList
     * @return
     */
    public ArrayList<String> getIntersectionOfStrings(ArrayList<String> smallList, ArrayList<String> largeList) {
        ArrayList<String> extentIntersection = new ArrayList<>();

        for (String extent: smallList) {
            if (largeList.contains(extent)) {
                extentIntersection.add(extent);
            }
        }
        return extentIntersection;
    }

    /**
     * Helper to iterate through the smaller list.
     * @param smallList
     * @param largeList
     * @param tree
     * @return
     */
    public ArrayList<TreeNodeObject> getIntersection(ArrayList<String> smallList, ArrayList<String> largeList, TreeObject tree) {
        ArrayList<TreeNodeObject> extentIntersection = new ArrayList<>();

        for (String extent: smallList) {
            if (largeList.contains(extent)) {
                TreeNodeObject tno =  tree.getNodeByLabel(extent);
                tno.setInIntersection();
                extentIntersection.add(tno);
            }
        }
        return extentIntersection;
    }


    /**
     * Computes scores for node based on how many of the extents were included
     * in the children for a particular node.
     *
     * Includes a breakout
     * @param node
     */
    public double scoreNodesEfficient(HashSet<String> extentIdMap, TreeNodeObject node) {
        if (breakout) {
            return 0.0;
        }
        double value = 1;

        double score = 0.0;
        if (node.isExtent()) {
            if (!node.isInIntersection()) {
                return 0.0;
            }
            if (extentIdMap.contains(node.getLabel())) {
                return -value;
            } else {
                // Add a positive score for a match
                return value;
            }
        }
        for (TreeNodeObject child: node.getChildren()) {
            // Get the leaf nodes under each of the nodes and add these
            score += scoreNodesEfficient(extentIdMap, child);
            if (breakout) {
                return 0.0;
            }
        }

        node.addToScore(score);
        if (bestNode == null) {
            bestNode = node;
        } else if (node.getScore() < bestNode.getScore()) {
            bestNode = node;
        } else if (node.getScore() == bestNode.getScore()) {
            if (node.getExtC() < bestNode.getExtC()) {
                //System.out.println("UPDATED:" + node.getLabel() + " from " + bestNode.getLabel());
                bestNode = node;
            }
            // lastly if they == the same choose the one with the most similar distance to root
//            if (node.getExtC() == bestNode.getExtC()) {
//                double distBest =  java.lang.Math.abs(bestNode.getDistanceToRoot() -
//            }
        }
        //System.out.println(node.getLabel() + " " + score);
        return node.getScore();
    }

    /**
     * Computes scores for node based on how many of the extents were included
     * in the children for a particular node.
     * @param extentList
     * @param node
     */
    public double scoreNodes(ArrayList<String> extentList, ArrayList<String> extentNotIncludedList, TreeNodeObject node, Double distance) {
        int value = 1;
        if (node.isExtent()) {
            if (!node.isInIntersection()) {
                return  0.0;
            }
            if (!extentList.contains(node.getLabel())) {
                // Add a negative score for a mismatch
                node.addToScore(value + ((extentList.size() - 1) * value));
                return value;
            } else if (extentNotIncludedList.contains(node.getLabel())) {
                // Add a positive score for a match
                node.addToScore(-value + ((extentList.size() - 1) * value));
                return -value;
            } else {
                // Add nothing to the score
                return 0;
            }
        }
        for (TreeNodeObject child: node.getChildren()) {
            // Get the leaf nodes under each of the nodes and add these
            scoreNodes(extentList, extentNotIncludedList, child, distance);
        }

        ArrayList<TreeNodeObject> leaves = node.getLeaves();
        int score = 0;
        for (TreeNodeObject tno: leaves) {
            if (extentList.contains(tno.getLabel())) {
                score -= value;
                node.addToInc(tno.getLabel());
            } else if (extentNotIncludedList.contains(tno.getLabel())) {
                score += value;
                node.addToNoInc(tno.getLabel());
            } else {
                node.addExt();
            }
        }

        node.addToScore(score);
        orderedNodes.add(node);
        return score;
    }


    /**
     * ToDo: Check the priority Queue works as expected.
     */
    public class TreeNodeComparator implements Comparator<TreeNodeObject>
    {
        @Override
        public int compare(TreeNodeObject x, TreeNodeObject y)
        {
            if (x.getScore() < y.getScore())
            {
                return -1;
            }
            if (x.getScore() > y.getScore())
            {
                return 1;
            }
            // ToDo: confirm we want the node with the least number of external extents
            if (x.getExtC() < y.getExtC())
            {
                return -1;
            }
            if (x.getExtC() > y.getExtC())
            {
                return 1;
            }

            // The following is surpassed by the function above.

            // If both have the same score we want to return the distance difference
            // ToDo: check if this is correct
            if (Math.abs(origDistToRoot - x.getDistanceToRoot()) < (Math.abs(origDistToRoot - y.getDistanceToRoot())))
            {
                return -1;
            }
            if (Math.abs(origDistToRoot - x.getDistanceToRoot()) > (Math.abs(origDistToRoot - y.getDistanceToRoot())))
            {
                return 1;
            }
            return 0;
        }
    }


    /**
     * Save a tree to a file. Used for the downloads.
     *
     * @param filepath
     * @throws IOException
     */
    public void saveTree(String filepath, String tree) throws IOException {
        Writer writer = new PrintWriter(filepath, "UTF-8");
        writer.write(tree);
        writer.write(";\n");
        writer.close();
    }


    /**
     * ---------------------------------------------------------------------------------------------
     *              Unused function. Was initially used to remove the redundant paths.
     * ---------------------------------------------------------------------------------------------
     * The aim of this function is to update the tree to only contain the nodes that
     * were included in the original tree.
     * @param extentList
     * @param node
     * @return
     */
    public TreeNodeObject updateNode(ArrayList<TreeNodeObject> extentList, TreeNodeObject node) {
        ArrayList<TreeNodeObject> extentChildren = new ArrayList<>();
        if (node.isExtent()) {
            if (extentList.contains(node)) {
                return node;
            } else {
                return null;
            }
        }
        for (TreeNodeObject child: node.getChildren()) {
            TreeNodeObject childNode = updateNode(extentList, child);
            if (childNode != null) {
                extentChildren.add(child);
            }
        }
        // If we have 0 children we need to remove this node as it is redundant
        if (extentChildren.size() < 1) {
            return null;
        }
        // If we have 1 child we set the parent to be that child
        if (extentChildren.size() == 1) {
            return extentChildren.get(0);
        }
        // Otherwise we leave it as it is valid.
        return node;
    }


    /**
     * ---------------------------------------------------------------------------------------------
     *          The following are to set the test env.
     * ---------------------------------------------------------------------------------------------
     */
    public void setTreeModel(TreeModel treeModel) {
        this.treeModel = treeModel;
    }

    public void setReconModel(ReconstructionsModel reconModel) {
        this.reconModel = reconModel;
    }

    public void setSeqController(SeqController seqController) {
        this.seqController = seqController;
    }

    public void setReconController(ReconstructionController reconController) {
        this.reconController = reconController;
    }
}
