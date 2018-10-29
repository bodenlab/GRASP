package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.TreeModel;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.PriorityQueue;
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

    private PriorityQueue<TreeNodeObject> orderedNodes;

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
     * @param userId
     * @param reconKnownAncsLabel
     * @param reconUnknownAncsLabel
     * @param ancsestorLabel
     * @return
     */
    public ArrayList<String> getSimilarNodes(int userId, String reconKnownAncsLabel, String reconUnknownAncsLabel, String ancsestorLabel) {
        int reconKnownAncsId = reconModel.getIdByLabel(reconKnownAncsLabel, userId);
        int reconUnknownAncsId = reconModel.getIdByLabel(reconUnknownAncsLabel, userId);

        // If either of the labels are incorrect then return
        if (reconKnownAncsId == Defines.FALSE || reconUnknownAncsId == Defines.FALSE) {
            return null;
        }


        // Otherwise get the trees
        TreeObject treeKnownAncs = getById(reconKnownAncsId, userId);
        TreeObject treeUnknownAncs = getById(reconUnknownAncsId, userId);

        // If either of the trees weren't able to be parsed return
        if (treeKnownAncs == null || treeUnknownAncs == null) {
            return null;
        }

        // Setup the ordered nodes
        orderedNodes = new PriorityQueue<>(10, new TreeNodeComparator());

        return getSimilarNodes(treeKnownAncs, treeUnknownAncs, ancsestorLabel);
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
        ArrayList<TreeNodeObject> intersection = getIntersection(treeKnownAncs, treeUnknownAncs);
        // Prune each tree to only contain the intersection
        updateNode(intersection, treeKnownAncs.getRoot());
        updateNode(intersection, treeUnknownAncs.getRoot());

        // Now that we have the intersection we want to get the leaf nodes in the known ancestor
        // that lie under the node of interest - these must also be in the intersection obj
        TreeNodeObject node = treeKnownAncs.getNodeByLabel(ancsestorLabel);
        ArrayList<TreeNodeObject> leaves = node.getLeaves();
        ArrayList<TreeNodeObject> sharedLeaves;
        // Get the intersection of the leaves and the intersection
        if (leaves.size() > intersection.size()) {
            sharedLeaves = getIntersection(intersection, leaves);
        } else {
            sharedLeaves = getIntersection(leaves, intersection);
        }
        System.out.println(node.getDistanceToRoot());
        scoreNodes(sharedLeaves, treeUnknownAncs.getRoot(), node.getDistanceToRoot());

        for (TreeNodeObject l: sharedLeaves) {
            System.out.println("LEAF: " + l.getLabel());
        }
        ArrayList<String> topNodes = new ArrayList<>();
        for (int i = 0; i < orderedNodes.size(); i ++) {
            TreeNodeObject n = orderedNodes.poll();
            topNodes.add(n.getLabel());
            System.out.println("NODE: " + n.getLabel() + ", score: " + n.getScore() + ", dist: " + n.getDistanceToRoot() + " orig-dist: " + node.getDistanceToRoot());
        }
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
     * Helper to iterate through the smaller list.
     * @param smallList
     * @param largeList
     * @return
     */
    public ArrayList<TreeNodeObject> getIntersection(ArrayList<TreeNodeObject> smallList, ArrayList<TreeNodeObject> largeList) {
        ArrayList<TreeNodeObject> extentIntersection = new ArrayList<>();

        for (TreeNodeObject extent: smallList) {
            if (largeList.contains(extent)) {
                extentIntersection.add(extent);
            }
        }
        return extentIntersection;
    }

    /**
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
     * Computes scores for node based on how many of the extents were included
     * in the children for a particular node.
     * @param extentList
     * @param node
     */
    public double scoreNodes(ArrayList<TreeNodeObject> extentList, TreeNodeObject node, Double distance) {
        if (node.isExtent()) {
            if (!extentList.contains(node)) {
                // Add a negative score for a mismatch
                node.addToScore(10);
                return 10;// + Math.abs(distance - node.getDistanceToRoot());
            } else {
                // Add a positive score for a match
                node.addToScore(-10);// + Math.abs(distance - node.getDistanceToRoot()));
                return -10;// + Math.abs(distance - node.getDistanceToRoot());
            }
        }
        for (TreeNodeObject child: node.getChildren()) {
            node.addToScore(scoreNodes(extentList, child, distance));
        }
        orderedNodes.add(node);
        return node.getScore();
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
            if (x.getDistanceToRoot() < y.getDistanceToRoot())
            {
                return -1;
            }
            if (x.getDistanceToRoot() > y.getDistanceToRoot())
            {
                return 1;
            }
            return 0;
        }
    }

    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setTreeModel(TreeModel treeModel) {
        this.treeModel = treeModel;
    }

    public void setReconModel(ReconstructionsModel reconModel) {
        this.reconModel = reconModel;
    }
}
