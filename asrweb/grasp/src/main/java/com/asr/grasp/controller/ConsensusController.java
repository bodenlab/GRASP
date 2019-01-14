package com.asr.grasp.controller;

import com.asr.grasp.objects.ConsensusObject.Node;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.HashMap;
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

    int numberSeqsUnderParent;
    int bestInitialNodeId = 0;
    int bestFinalNodeId = 0;

    /**
     * Returns th number of sequences under the parent. This is used in the ocnensus function to
     * determine a sensible multiplier to weight non-bidirectional edges.
     *
     * @return
     */
    public int getNumberSeqsUnderParent() {
        return  this.numberSeqsUnderParent;
    }


    /**
     * Get the best initial node ID as was counted whilst the weight map was built up.
     * @return
     */
    public int getBestInitialNodeId() {
        return this.bestInitialNodeId;
    }

    /**
     * gets the best Final node Id, created when the weight map was built.
     * @return
     */
    public int getBestFinalNodeId() {
        return this.bestFinalNodeId;
    }

    /**
     * Aims to build a dictionary for a node that counst the sequence content of each amino acid
     * position for each position in the alignment.
     *
     * We do this as a percentage of the total number of sequences in this alignment.
     *
     * Note we are using the sequence content for the parent of the nodeLabel (as this includes
     * more of the nodes which are around it.)
     *
     * @param reconId
     * @param nodeLabel
     * @return
     */
    public HashMap<Integer, Double> getEdgeCountDict(int reconId, int userId, String nodeLabel, HashMap<Integer, Integer> initialIds, HashMap<Integer, Integer> finalIds, HashMap<Integer, Node> nodeMap) {

        // Keep track of which one is best (don't need to make a hash map here as we are only interested in the single count map
        int bestInitialId = 10000;
        int bestFinalId = 0;
        int bestInitialCount = 0;
        int bestFinalCount = 0;


        // Get the reconstructed tree from the database
        TreeObject tree = treeController.getById(reconId, userId);

        TreeNodeObject node = tree.getNodeByLabel(nodeLabel.split("_")[0]);

        // Get the parent of this node
        // TreeNodeObject nodeParent = node.getParent();
//
//        if (nodeParent == null) {
//            nodeParent = node;
//        }

        // Get all the extent ids
        ArrayList<String> extentLabels = node.getRawLeafLabels();

        numberSeqsUnderParent = extentLabels.size();

        // For each of the extentLabels we want to get their sequence
        // For the first one, we want to make a new HashMap for each position in the sequence
        HashMap<Integer, Double> weightMap = new HashMap<>();
        for (String label: extentLabels) {
            String sequence = seqController.getSeqByLabel(label, reconId, Defines.EXTANT);
            // Add a terminating character.
            boolean first = true;
            int lastIdx = 0;
            for (int i = 0; i < sequence.length(); i ++) {
                double value = 0;
                if (sequence.charAt(i) != '-') {
                    if (weightMap.get(i) != null) {
                        value = weightMap.get(i);
                    }
                    value += 1.0;
                    weightMap.put(i, value);
                    // Keep track of the last index
                    lastIdx = i;
                    if (first) {
                        Integer totalCount = initialIds.get(i);
                        if (totalCount != null) {
                            if (totalCount >= bestInitialCount) {
                                bestInitialCount++;
                            }
                            if (bestInitialId != i) {
                                bestInitialId = i;
                            }
                            initialIds.put(i, totalCount + 1);
                            first = false;
                        }
                    }

                }
            }
            Integer totalCount = finalIds.get(lastIdx);
            if (totalCount != null) {
                if (totalCount >= bestFinalCount) {
                    bestFinalCount++;
                }
                if (bestFinalId != lastIdx) {
                    bestFinalId = lastIdx;
                }
                finalIds.put(lastIdx, totalCount + 1);
            }
        }

        // Normalise it
        int size = extentLabels.size();
        for (Integer position: weightMap.keySet()) {
            double value = weightMap.get(position)/size;
            weightMap.put(position, value);
        }



        // To ensure that if we have a tie we actually choose the best one (lets for now say the
        // best one is the one which has a higher sequence content in that column (very unlikely
        // that this would be the same)
//        double bestWeightVal = 0;
//        for (Integer i: initialIds.keySet()) {
//            if (initialIds.get(i) == bestInitialCount) {
//                double weightVal = weightMap.get(i);
//                if (bestWeightVal == weightVal && i != bestInitialId) {
//                    System.out.println("WEIGHT VAL WAS EQUAL INITIAL!!!!!" + bestInitialId + ", " + i);
//                }
//                if (weightVal > bestWeightVal) {
//                    bestWeightVal = weightVal;
//                    bestInitialId = i;
//                }
//            }
//        }
//        bestWeightVal = 0;
//        ArrayList<Integer> bestIds = new ArrayList<>();
//        for (Integer i: finalIds.keySet()) {
//            if (finalIds.get(i) == bestFinalCount) {
//               bestIds.add(i);
//            }
//        }
//
//
//        for (Integer i: finalIds.keySet()) {
//            if (finalIds.get(i) == bestFinalCount) {
//                double weightVal = weightMap.get(i);
//                if (bestWeightVal == weightVal && i != bestFinalId) {
//                    System.out.println("WEIGHT VAL WAS EQUAL FINAL!!!!!" + bestFinalId + ", " + i);
//                }
//                if (weightVal > bestWeightVal) {
//                    bestWeightVal = weightVal;
//                    bestFinalId = i;
//                }
//            }
//        }
        // Set the best first and last node ID's
        for (Integer nid: initialIds.keySet()) {
            System.out.print(nid + "->" + initialIds.get(nid) + " | ");
        }

        System.out.println();
        this.bestFinalNodeId = getBestId(finalIds, nodeMap, weightMap, bestFinalCount, null); //bestFinalId;
        this.bestInitialNodeId = getBestId(initialIds, nodeMap, weightMap, bestInitialCount, 'M');

        System.out.println("Best final node: " + bestFinalNodeId);
        System.out.println("Best initial node: " + bestInitialNodeId);
        return weightMap;
    }



    public int getBestId(HashMap<Integer, Integer> ids, HashMap<Integer, Node> nodeMap,  HashMap<Integer, Double> weightMap, int bestCount, Character tagToLookFor) {
        ArrayList<Integer> bestIds = new ArrayList<>();
        for (Integer i: ids.keySet()) {
            if (ids.get(i) == bestCount) {
                bestIds.add(i);
            }
        }

        if (bestIds.size() == 0) {
            System.out.println("ERROR!");
            return ids.get(0);
        }
        if (bestIds.size() == 1) {
            return bestIds.get(0);
        }

        ArrayList<Integer> bestIdsWithMet = new ArrayList<>();
        if (tagToLookFor != null) {

            for (Integer i : bestIds) {
                if (nodeMap.get(i).getBase() == tagToLookFor) {
                    bestIdsWithMet.add(i);
                }
            }

            if (bestIdsWithMet.size() == 1) {
                return bestIdsWithMet.get(0);
            }
        }
        // If none had a met start tag we want to change it back to the original bestIds
        if (bestIdsWithMet.size() == 0) {
            bestIdsWithMet = bestIds;
        }

        double bestWeightVal = 0.0;
        int bestFinalId = 0;
        ArrayList<Integer> bestBiDir = new ArrayList<>();
        for (Integer i : bestIdsWithMet) {
            if (nodeMap.get(i).getBiDir() == true) {
                bestBiDir.add(i);
            }
        }
        if (bestBiDir.size() == 1) {
            return bestBiDir.get(0);
        }

        if (bestBiDir.size() == 0) {
            bestBiDir = bestIds;
        }
        for (Integer i: bestBiDir) {
            double weightVal = weightMap.get(i);
            if (weightVal > bestWeightVal) {
                bestWeightVal = weightVal;
                bestFinalId = i;
            }
        }
        return bestFinalId;
    }


    /**
     * Aims to build a dictionary for a node that counst the sequence content of each amino acid
     * position for each position in the alignment.
     *
     * We do this as a percentage of the total number of sequences in this alignment.
     *
     * Note we are using the sequence content for the parent of the nodeLabel (as this includes
     * more of the nodes which are around it.)
     *
     * @param reconId
     * @param nodeLabel
     * @return
     */
    public HashMap<String, Double> getEdgeCountDictOLD(int reconId, int userId, String nodeLabel) {
        // Get the reconstructed tree from the database
        TreeObject tree = treeController.getById(reconId, userId);

        TreeNodeObject node = tree.getNodeByLabel(nodeLabel.split("_")[0]);

        // Get the parent of this node
        TreeNodeObject nodeParent = node.getParent();

        if (nodeParent == null) {
            nodeParent = node;
        }

        // Get all the extent ids
        ArrayList<String> extentLabels = nodeParent.getRawLeafLabels();

        // For each of the extentLabels we want to get their sequence
        // For the first one, we want to make a new HashMap for each position in the sequence
        HashMap<String, Double> weightMap = new HashMap<>();
        int seqLen;
        for (String label: extentLabels) {
            String sequence = seqController.getSeqByLabel(label, reconId, Defines.EXTANT);
            // Add a terminating character.
            sequence += "x";
            seqLen = sequence.length();
            int from = -1;
            int to = 0;
            for (int i = 0; i < sequence.length(); i ++) {
                while (sequence.charAt(to) == '-') {
                    to++;
                    if (to >= seqLen) {
                        break;
                    }
                }

                // Here we have an edge
                double value = 0.0;
                if (weightMap.get(from + "-" + to) != null) {
                    value = weightMap.get(from + "-" + to);
                }
                value += 1.0;
                weightMap.put(from + "-" + to, value);
                i = to;
                from = to;
                to++;
            }
        }

        // Normalise it
        for (String label: weightMap.keySet()) {
            weightMap.put(label, weightMap.get(label)/extentLabels.size());
            System.out.println("WEIGHT: " + weightMap.get(label));
        }

        return weightMap;
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