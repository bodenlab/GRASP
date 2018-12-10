package com.asr.grasp.controller;

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
    public HashMap<String, Double> getEdgeCountDict(int reconId, int userId, String nodeLabel) {
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
        boolean first = true;
        HashMap<String, Double> weightMap = new HashMap<>();
        int seqLen;
        double maxVal = 0;
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
                value += 1.0/seqLen;
                weightMap.put(from + "-" + to, value);
                i = to;
                from = to;
                to++;
                if (value > maxVal) {
                    maxVal = value;
                }
            }
        }

        // Normalise it
        for (String label: weightMap.keySet()) {
            weightMap.put(label, weightMap.get(label)/maxVal);
        }

        return weightMap;
    }
}