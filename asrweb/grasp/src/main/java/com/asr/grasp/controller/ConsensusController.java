package com.asr.grasp.controller;

import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.TreeObject;
import com.asr.grasp.utils.Defines;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashMap;
import javax.persistence.criteria.CriteriaBuilder.In;
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

    private HashMap<Integer, Integer> numSeqsStarted;

    private HashMap<Integer, Integer> countMap;

    HashMap<Integer, Double> cdfMap;

    /**
     * Helper to access private var.
     * @return
     */
    public HashMap<Integer, Integer> getNumSeqsStarted() {
        return numSeqsStarted;
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
    public HashMap<String, Double> getEdgeCountDict(int reconId, int userId, String nodeLabel) {
        BufferedWriter bw = getBuff(reconId + "_" + nodeLabel);
        // Get the reconstructed tree from the database
        TreeObject tree = treeController.getById(reconId, userId);

        TreeNodeObject node = tree.getNodeByLabel(nodeLabel.split("_")[0]);

        // Get the parent of this node
        TreeNodeObject nodeParent = node.getParent();

        if (nodeParent == null) {
            nodeParent = node;
        }

        // Keep track of the number of sequences that have started for a particular node
        numSeqsStarted = new HashMap<>();
        countMap = new HashMap<>();

        // Get all the extent ids
        ArrayList<String> extentLabels = nodeParent.getRawLeafLabels();

        // For each of the extentLabels we want to get their sequence
        // For the first one, we want to make a new HashMap for each position in the sequence
        HashMap<String, Double> weightMap = new HashMap<>();
        int seqLen = 0;
        double maxVal = 0;
        int maxCount = 0;
        Integer count;
        for (String label: extentLabels) {
            boolean first = true;
            String sequence = seqController.getSeqByLabel(label, reconId, Defines.EXTANT);
            // Add a terminating character.
            sequence += "x";
            seqLen = sequence.length();
            int from = -1;
            int to = 0;
            int start = 0;
            int end = 0;
            for (int i = 0; i < sequence.length(); i ++) {
                while (sequence.charAt(to) == '-') {
                    to++;
                    if (to >= seqLen) {
                        break;
                    }
                }

                count = countMap.get(to);
                if (count == null) {
                    countMap.put(to, 1);
                } else {
                    count ++;
                    if (count >= maxCount) {
                        maxCount = count;
                    }
                    countMap.put(to, count);
                }

                end = from;
                // Here we have an edge
                double value = 0.0;
                if (weightMap.get(from + "-" + to) != null) {
                    value = weightMap.get(from + "-" + to);
                }
                // CHeck if this is the start of this sequence
                if (first) {
                    start = to;
                    first = false;
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
            count = countMap.get(end);
            if (count == null) {
                countMap.put(end, 1);
            } else {
                count ++;
                if (count >= maxCount) {
                    maxCount = count;
                }
                countMap.put(end, count);
            }
            // Keep track of the last from
            // For each position in the seq map started dict add in 1 for each value from start - end
            System.out.println("START: " + start + " END: " + end);
            for (int i = start; i < end; i ++) {
                Integer numSeqs = numSeqsStarted.get(i);
                if (numSeqs == null) {
                    numSeqsStarted.put(i, 1);
                } else {
                    numSeqs ++;
                    numSeqsStarted.put(i, numSeqs);
                }
            }
        }

        // Normalise it
        for (String label: weightMap.keySet()) {
            weightMap.put(label, weightMap.get(label) / maxVal);
        }

        try {
            bw.write("");
        } catch (Exception e) {

        }

        buildCdfFromCountMap(maxCount, bw, seqLen);

        return weightMap;
    }


    public HashMap<Integer, Double> getCdfMap() {
        return cdfMap;
    }

    public HashMap<Integer, Double> buildCdfFromCountMap(int maxCount, BufferedWriter bw, int maxSeqLen) {
        cdfMap = new HashMap<>();
        double maxCdfVal = 0.0;
        double previousCount = 0.0;
        double thisCount = 0.0;
        for (int i = 0; i < maxSeqLen; i ++) {
            // if we don't have any content at all, then it is the worst possible
            Integer count = countMap.get(i);
            if (count == null) {
                thisCount = 0.0;
            } else {
                thisCount = (count/(maxCount + 0.0));
            }
            previousCount += thisCount;
            writeLine(bw, i, previousCount);

            cdfMap.put(i, previousCount);

        }

        previousCount = 0;
        thisCount = 0.0;
        // Itterate backwards so we get the backwards distribution
        for (int i = maxSeqLen - 1; i >= 0; i --) {
            // if we don't have any content at all, then it is the worst possible
            Integer count = countMap.get(i);
            if (count == null) {
                thisCount = 0.0;
            } else {
                thisCount = (count/(maxCount + 0.0));
            }
            // Also get what was previously in the cdf map

            previousCount += thisCount;

            double prevVal = cdfMap.get(i);
            if ((previousCount + prevVal) > maxCdfVal) {
                maxCdfVal = previousCount + prevVal;
            }
            writeLine(bw, i, previousCount);
            cdfMap.put(i, previousCount + prevVal);
        }

        // Print out the count map so we can see it
        for (int i = 0; i < cdfMap.size(); i ++) {
            double cdfVal = cdfMap.get(i);
            // Normalise to 1
            double tmpVal = (cdfVal/maxCdfVal);
            //tmpVal = 1/tmpVal;
            //writeLine(bw, i, tmpVal);
            cdfMap.put(i, tmpVal);
        }
        try {
            bw.close();
        } catch (Exception e) {
            System.out.println("Couldn't close ");
        }
        return cdfMap;
    }

    public void writeLine(BufferedWriter bw, int position, Double value) {
        try {
            bw.write(position + ", " + value.toString() + "\n");
            System.out.println(position + ", " + value.toString());
        } catch (Exception e) {
            System.out.println("Couldn't write: " + value);
        }
    }


    public BufferedWriter getBuff(String label) {
        try {
            BufferedWriter bw = new BufferedWriter(new FileWriter(
                    "/home/dev/test_output/test_cdf " + label + ".csv",
                    false));
            // First want to save the original
            return bw;
        } catch (Exception e) {
            System.out.println("coultn't open:" + e.getMessage());
        }
        return null;
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