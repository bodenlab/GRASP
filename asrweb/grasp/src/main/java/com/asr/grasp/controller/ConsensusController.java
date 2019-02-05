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
        TreeNodeObject node = tree.getNodeByLabel(nodeLabel.split("_")[0]);
        // Now we want to build the edge count map up recursively.
        node.buildEdgeCountMap(seqController, reconId);

        // Return the tree containing the mapping (i.e. the counts).
        return node;
    }
//
//    /**
//     * Aims to build a dictionary for a node that counst the sequence content of each amino acid
//     * position for each position in the alignment.
//     *
//     * We do this as a percentage of the total number of sequences in this alignment.
//     *
//     * Note we are using the sequence content for the parent of the nodeLabel (as this includes
//     * more of the nodes which are around it.)
//     *
//     * @param reconId
//     * @param nodeLabel
//     * @return
//     */
//    public HashMap<Integer, Double> getEdgeCountDictForObject(int reconId, int userId, String nodeLabel, HashMap<Integer, Integer> initialIds, HashMap<Integer, Integer> finalIds, HashMap<Integer, Node> nodeMap) {
//
//        // Keep track of which one is best (don't need to make a hash map here as we are only interested in the single count map
//        int bestInitialId = 10000;
//        int bestFinalId = 0;
//        int bestInitialCount = 0;
//        int bestFinalCount = 0;
//
//
//        // Get the reconstructed tree from the database
//        TreeObject tree = treeController.getById(reconId, userId);
//
//        TreeNodeObject node = tree.getNodeByLabel(nodeLabel.split("_")[0]);
//
//        // Get all the extent ids
//        ArrayList<String> extentLabels = node.getRawLeafLabels();
//
//        // For each of the extentLabels we want to get their sequence
//        // For the first one, we want to make a new HashMap for each position in the sequence
//        int[] countArray;
//        int cnt = 0;
//        for (String label: extentLabels) {
//            String sequence = seqController.getSeqByLabel(label, reconId, Defines.EXTANT);
//            if (cnt == 0) {
//                countArray = new int[sequence.length()];
//            }
//            // Add a terminating character.
//            boolean first = true;
//            int lastIdx = 0;
//            if (cnt % 100 == 0) {
//                System.out.println("PROCESSED: " + cnt);
//            }
//            for (int i = 0; i < sequence.length(); i ++) {
//                double value = 0;
//                if (sequence.charAt(i) != '-') {
//                    if (weightMap.get(i) != null) {
//                        value = weightMap.get(i);
//                    }
//                    value += 1.0;
//                    weightMap.put(i, value);
//                    // Keep track of the last index
//                    lastIdx = i;
//                    if (first) {
//                        Integer totalCount = initialIds.get(i);
//                        if (totalCount != null) {
//                            if (totalCount >= bestInitialCount) {
//                                bestInitialCount++;
//                            }
//                            if (bestInitialId != i) {
//                                bestInitialId = i;
//                            }
//                            initialIds.put(i, totalCount + 1);
//
//                        }
//                        first = false;
//                    }
//
//                }
//            }
//            Integer totalCount = finalIds.get(lastIdx);
//            if (totalCount != null) {
//                if (totalCount >= bestFinalCount) {
//                    bestFinalCount++;
//                }
//                if (bestFinalId != lastIdx) {
//                    bestFinalId = lastIdx;
//                }
//                finalIds.put(lastIdx, totalCount + 1);
//            }
//            cnt ++;
//        }
//
//        // Normalise it
//        int size = extentLabels.size();
//        for (Integer position: weightMap.keySet()) {
//            double value = weightMap.get(position)/size;
//            weightMap.put(position, value);
//        }
//
//
//        // Print for debugging
//        for (Integer nid: initialIds.keySet()) {
//            System.out.print(nid + "->" + initialIds.get(nid) + " | ");
//        }
//
////        System.out.println();
//        this.bestFinalNodeId = getBestId(finalIds, nodeMap, weightMap, bestFinalCount, null); //bestFinalId;
//        this.bestInitialNodeId = getBestId(initialIds, nodeMap, weightMap, bestInitialCount, 'M');
//
//        System.out.println("Best final node: " + bestFinalNodeId);
//        System.out.println("Best initial node: " + bestInitialNodeId);
//        return weightMap;
//    }

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