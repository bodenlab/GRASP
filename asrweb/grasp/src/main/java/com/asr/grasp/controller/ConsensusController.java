package com.asr.grasp.controller;

import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * This controller helps identify the consensus sequence for a particular inference.
 *
 * It uses the saved inferences and the saved extent sequences.
 *
 * Written by ariane @ 06/12/2018
 */
@Service
public class ConsensusController {

    @Autowired
    SeqController seqController;

    @Autowired
    TreeController treeController;

    /**
     * Build the mapping of the edges.
     *
     * @param reconId
     * @param userId
     * @return
     */
    public TreeObject getEdgeMapping(int reconId, int userId) {
        // Get the reconstructed tree from the database
        TreeObject tree = treeController.getById(reconId, userId);
        TreeNodeObject root = tree.getRoot();
        // Now we want to build the edge count map up recursively.
        root.buildEdgeCountMap(seqController, reconId);
        // Return the tree containing the mapping (i.e. the counts).
        return tree;
    }

    /**
     * Build the mapping of the edges.
     *
     * @param reconId
     * @param userId
     * @return
     */
    public TreeNodeObject getEdgeMappingForNode(int reconId, int userId, String nodeLabel) {
        // Get the reconstructed tree from the database
        TreeObject tree = treeController.getById(reconId, userId);
        TreeNodeObject node = null;
        try {
            node = tree.getNodeByLabel(nodeLabel.split("_")[0]);
        } catch (Exception e) {
            try {
                node = tree.getNodeByLabel(nodeLabel);
            } catch (Exception e1) {
                System.out.print(e.getStackTrace() + "" + e1.getStackTrace());
                return null;
            }
        }
        // Now we want to build the edge count map up recursively.
        node.buildEdgeCountMap(seqController, reconId);

        // Return the tree containing the mapping (i.e. the counts).
        return node;
    }


    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setSeqController(SeqController seqController) {
        this.seqController = seqController;
    }

    public void setTreeController(TreeController treeController) {
        this.treeController = treeController;
    }
}