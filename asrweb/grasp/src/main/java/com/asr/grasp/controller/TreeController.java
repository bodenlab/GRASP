package com.asr.grasp.controller;

import com.asr.grasp.model.TreeModel;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
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
     * Returns a list of node IDs that give similar
     * @param treeMinimal
     * @param treeMaximal
     * @param ancestorMinimalLabel
     * @return
     */
    public ArrayList<String> getSimilarNodes(TreeObject treeMinimal, TreeObject treeMaximal, String ancestorMinimalLabel) {

        /**
         * ToDo
         */

        return null;
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
        if (node.getChildren() == null) {
            return node;
        }
        for (TreeNodeObject child: node.getChildren()) {
            TreeNodeObject tmp = updateNode(extentList, child);
            if (tmp.isExtent()) {
                if (!extentList.contains(child)) {
                    extentChildren.add(child);
                }
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
    public int scoreNodes(ArrayList<TreeNodeObject> extentList, TreeNodeObject node) {
        if (node.getChildren() == null) {
            return Defines.EXTANT;
        }
        for (TreeNodeObject child: node.getChildren()) {
            int tmp = scoreNodes(extentList, child);
            if (tmp == Defines.EXTANT) {
                if (!extentList.contains(child)) {
                    // Add a negative score for a mismatch
                    node.addToScore(-1);
                } else {
                    // Add a positive score for a match
                    node.addToScore(1);
                }
            } else {
                // Add the childs' score to the parent.
                node.addToScore(child.getScore());
            }
        }
        orderedNodes.add(node);
        return Defines.ANCESTOR;
    }
}
