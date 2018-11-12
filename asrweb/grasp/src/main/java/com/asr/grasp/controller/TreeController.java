package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.TreeModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.PriorityQueue;
import json.JSONArray;
import json.JSONObject;
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
            if (user.getUsername().equals("ariane8")) {
                node.put(2, "saveCSV");
                node.put(3, n.getLeafCount());
                node.put(4, n.getDistanceToRoot());
                node.put(5, treeKnownAncs.getNodeByLabel(ancsestorLabel).getDistanceToRoot());
                node.put(6, n.getIncCnt());
                node.put(7, n.getNoIncCnt());
                node.put(8, n.getInc());
                node.put(9, n.getNoInc());
                node.put(10, n.getExtC());
            }
            retNodes.put(node);

            System.out.println("NODE: " + n.getLabel() + ", score: " + n.getScore() + ", dist: " + n.getDistanceToRoot());// + " orig-dist: " + node.getDistanceToRoot());
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

        ArrayList<TreeNodeObject> intersection = getIntersection(treeKnownAncs, treeUnknownAncs);

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
    public ArrayList<TreeNodeObject> getIntersection(TreeObject treeKnownAncs, TreeObject treeUnknownAncs) {
        // iterate through the smaller one
        ArrayList<String> knownExtentLabelList = treeKnownAncs.getExtantLabelList();
        ArrayList<String> unknownExtentLabelList = treeUnknownAncs.getExtantLabelList();
        if (knownExtentLabelList.size() > unknownExtentLabelList.size()) {
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
                extentIntersection.add(tree.getNodeByLabel(extent));
            }
        }
        return extentIntersection;
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
                System.out.println("NOT INC:" + tno.getLabel());
            } else {
                node.addExt();
            }
        }
        node.addToScore(score);
        orderedNodes.add(node);

        return score;
    }


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
