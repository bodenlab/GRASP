package com.asr.grasp.objects;

import com.asr.grasp.controller.SeqController;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.HashSet;

/**
 * This is a class that is aimed to be used internally. The TreeNodeObject class was created to
 * be able to find "similar" ancestral nodes between two trees.
 * It's use case may be extended.
 *
 * written by ariane @ 22/10/2018
 */
public class TreeNodeObject {


    // The below is just for the consensus creation
    private int[] seqCountList;
    int numSeqsUnderNode = 0;
    // End

    private ArrayList<TreeNodeObject> children;
    private ArrayList<TreeNodeObject> leaves; // ToDo: review do we need this?
    private ArrayList<String> leafLabels;
    private ArrayList<String> rawLeafLabels;

    // Helper hashset to allow us to compare nodes, use an ID so that this makes it faster
    private HashSet<String> intersectIds;


    private String label;
    private double score;
    private Double distance;
    private double distanceFromRoot = 0.0;
    private TreeNodeObject parent;
    private String originalLabel;

    // Temporary helpers to get stats for the results
    private String includedLeavesFromOrig = "";
    private String unincludedLeavesFromOrig = "";
    private int otherExtentCount = 0;
    private int noIncCnt = 0;
    private int incCnt = 0;

    // Used to uniquely identify a node, used during the mapping process.
    private int id;
    private boolean inIntersection = false;

    public TreeNodeObject(String label, TreeNodeObject parent, Double distance, int id, boolean extent) {
        this.children = new ArrayList<>();
        this.leaves = new ArrayList<>();
        this.leafLabels = new ArrayList<>();
        this.rawLeafLabels = new ArrayList<>();
        this.intersectIds = new HashSet<>();
        this.originalLabel = label;
        this.id = id;
        // Here we need to format the label as depending on the tool even similar trees could
        // have extra information tagged on.
        formatLabel(label, extent);
        this.score = 0;
        this.distance = distance;
        if (distance == null) {
            this.distance = 0.0;
        }
        this.parent = parent;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                      The below is used for the consensus generation
     *
     * ---------------------------------------------------------------------------------------------
     */

    public int getNumSeqsUnderNode() {
        return this.getLeafCount();
    }

    public boolean buildEdgeCountMap(SeqController seqController, int reconId) {
        // Check if this is a leaf
        if (this.label.equals("N4")) {
            int o = 1;
        }
        if (this.seqCountList != null && this.seqCountList.length > 1) {
            return true;
        }

        //
        if (isExtent()) {
            String sequence = seqController.getSeqByLabel(originalLabel, reconId, Defines.EXTANT);
            seqCountList = new int[sequence.length()];
            numSeqsUnderNode = 1;
            for (int i = 0; i < sequence.length(); i ++) {
                if (sequence.charAt(i) != '-') {
                    seqCountList[i] = 1;
                } else {
                    seqCountList[i] = 0;
                }
            }
        }

        // Go through each of the children
        // If it's the first child just set this count list to be that one.
        boolean first = true;
        for (TreeNodeObject tno: getChildren()) {
            int [] countList = tno.getSeqCountList();

            if (countList == null || countList.length < 1) {

                tno.buildEdgeCountMap(seqController, reconId);
                countList = tno.getSeqCountList();
            }
            if (first) {
                this.seqCountList = new int[countList.length];
                for (int i = 0; i < countList.length; i++) {
                    this.seqCountList[i] = 0;
                }
                first = false;
            }
            // Add that count to this one.
            for (int i = 0; i < countList.length; i ++) {
                this.seqCountList[i] += countList[i];
            }
            numSeqsUnderNode += tno.getNumSeqsUnderNode();
            System.out.println(tno.label + " " + tno.numSeqsUnderNode +  " " + tno.seqCountList[0]);
        }

        return false;
    }

    public int[] getSeqCountList() {
        return seqCountList;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                      End consensus generation code
     *
     * ---------------------------------------------------------------------------------------------
     */

    /**
     * Quick method to set that this is a node we need to include in the counting.
     */
    public void setInIntersection() {
        inIntersection = true;
    }

    /**
     * Tells us whether we need to look at this node.
     * @return
     */
    public boolean isInIntersection() {
        return inIntersection;
    }


    /**
     * Set the ID of the treeNodeObject.
     *
     * @param id
     */
    public void setId(int id) {
        this.id = id;
    }

    /**
     * Gets the ID of the node.
     * @return
     */
    public int getId() {
        return id;
    }

    /**
     * Gets the intersection ID's
     * @return
     */
    public HashSet<String> getIntersectIds() {
        return this.intersectIds;
    }


    /**
     * Make a mapping of the intersection and the labels contained in this node.
     *
     * Here we want to use the placement as an ID. This will be consistent acrocss all mappings.
     *
     * Note: we do this with the extentIntersection containing the nodes from the UNKNOWN tree,
     * this allows us to map the ID's back easily.
     *
     * @param extentIntersection
     */
    public boolean buildIntersectionLabelMapping(ArrayList<TreeNodeObject> extentIntersection) {
        // Check if this is a leaf
        if (isExtent()) {
            for (TreeNodeObject tno: extentIntersection) {
                if (tno.getLabel().equals(this.getLabel())) {
                    inIntersection = true;
                    intersectIds.add(tno.getLabel());
                    return true;
                }
            }
            addExt();
            return false;
        }

        // Go through each of the children
        for (TreeNodeObject tno: getChildren()) {
            tno.buildIntersectionLabelMapping(extentIntersection);
            intersectIds.addAll(tno.getIntersectIds());
        }
        otherExtentCount = leafLabels.size() - intersectIds.size();
        return false;
    }


    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                                ToDo:  Delete the below
     *
     * ---------------------------------------------------------------------------------------------
     */


    public void resetScore() {
        this.score = 0.0;
        this.otherExtentCount = 0;
        this.incCnt = 0;
        this.noIncCnt = 0;
    }

    public void addChildsExt(TreeNodeObject child) {
        otherExtentCount += child.getExtC();
    }

    public void addExt() {
        otherExtentCount += 1;
    }

    public int getIncCnt() {
        return  incCnt;
    }
    public int getNoIncCnt() {
        return  noIncCnt;
    }
    public int getExtC() {
        return  otherExtentCount;
    }

    public void addToNoInc(String label) {
        noIncCnt ++;
        this.unincludedLeavesFromOrig += "|" + label;
    }

    public String getNoInc() {
        return unincludedLeavesFromOrig;
    }


    public void addToInc(String label) {
        incCnt ++;
        this.includedLeavesFromOrig += "|" + label;
    }

    public String getInc() {
        return includedLeavesFromOrig;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                                ToDo:  End Delete
     *
     * ---------------------------------------------------------------------------------------------
     */

    /**
     * Get the unformatted label.
     * @return
     */
    public String getOriginalLabel() {
        return this.originalLabel;
    }

    /**
     * Corrects for if we have labels which do or don't have the pipe from uniprot
     * @param rawLabel
     */
    private void formatLabel(String rawLabel, boolean extent) {
        boolean isNumber = false;
        try {
            double num = Double.parseDouble(rawLabel);
            isNumber = true;
        } catch (Exception e) {
            isNumber = false;
        }
        if (rawLabel.split("\\|").length > 1) {
            String[] splitOnPipe = rawLabel.split("\\|");
            if (splitOnPipe[0].length() == 2) {
                this.label = splitOnPipe[1];
            } else {
                this.label = splitOnPipe[0];
            }
        } else if (rawLabel.split("_").length > 1) {
            this.label = rawLabel.split("_")[0];
        } else if (extent || rawLabel.equals("N0") || !isNumber) {
            this.label = rawLabel;
        } else {
            this.label = "N" + this.id + "_" + rawLabel;
        }
    }

    public double setDistanceFromRoot() {
        if (distanceFromRoot != 0) {
            return distanceFromRoot;
        }
        if (parent != null) {
            distanceFromRoot = this.distance + parent.getDistanceToRoot();
            return distanceFromRoot;
        } else {
            return this.distance;
        }
    }
    /**
     * Gets the distance to the root from a node - includes own distance.
     * @return
     */
    public double getDistanceToRoot() {
        return distanceFromRoot;
    }

    /**
     * Gets the distance value - note this is 1000 * larger so we can use an
     * integer in the comparator.
     * @return
     */
    public double getDistance() {
        return distance;
    }

    /**
     * Adds a value to a score. This is either:
     *      +1 to indicate a match
     *      -1 to indicate a mismatch i.e. a child wasn't beneath the parent (this node) that
     *      should've been or visa versa.
     * @param value
     */
   public void addToScore(double value) {
        this.score += value;
   }

    /**
     * Gets the score of equality to another node. This is used to determine how "similar" two
     * ancestral positions are in different trees. i.e. we have constructed an ancestor and
     * want to find the congruent ancestor in a larger tree.
     * @return
     */
    public double getScore() {
        return this.score;
    }

    /**
     * Gets the children of the node.
     * Used to iterate to the extents then back propagate the scores updward.
     * @return
     */
    public ArrayList<TreeNodeObject> getChildren() {
        return this.children;
    }

    /**
     * Returns the leafs under a particular node. This allows us to
     * determine similarity between nodes.
     * @return
     */
    public ArrayList<TreeNodeObject> getLeaves() {
        if (leaves.size() > 0) {
            return leaves;
        }
        getLeaves(this);
        return leaves;
    }


    /**
     * Returns the leafs under a particular node. This allows us to
     * determine similarity between nodes.
     * @return
     */
    public ArrayList<String> getLeafLabels() {
        if (leafLabels.size() > 0) {
            return leafLabels;
        }
        getLeafLabels(this);
        return leafLabels;
    }


    /**
     * Returns the leafs under a particular node. This allows us to
     * determine similarity between nodes.
     * @return
     */
    public ArrayList<String> getRawLeafLabels() {
        if (rawLeafLabels.size() > 0) {
            return rawLeafLabels;
        }
        getLeafLabels(this);
        return rawLeafLabels;
    }


    /**
     * Returns the leafs under a particular node. This allows us to
     * determine similarity between nodes.
     * @return
     */
    public int getLeafCount() {
        if (leaves.size() > 0) {
            return leaves.size();
        }
        getLeaves(this);
        return leaves.size();
    }


    /**
     * Recursively adds the leaves.
     * @param node
     */
    public void getLeaves(TreeNodeObject node) {
        for (TreeNodeObject child: node.getChildren()) {
            if (child.isExtent()) {
                leaves.add(child);
            } else {
                getLeaves(child);
            }
        }
    }


    /**
     * Recursively adds the leaves - only saves the labels.
     * @param node
     */
    public void getLeafLabels(TreeNodeObject node) {
        for (TreeNodeObject child: node.getChildren()) {
            if (child.isExtent()) {
                leafLabels.add(child.getLabel());
                rawLeafLabels.add(child.getOriginalLabel());
            } else {
                getLeafLabels(child);
            }
        }
    }

    /**
     * Gets the parent of a particular node.
     * @return
     */
    public TreeNodeObject getParent() {
        return parent;
    }

    /**
     * Returns the id of the node.
     * @return
     */
    public String getLabel() {
        return this.label;
    }

    /**
     * Helper function to determine whether or not this node is an extent node.
     *
     * @return
     */
    public boolean isExtent() {
        return this.children.size() == 0;
    }


    /**
     * Adds a child as we are iterating through the Newick or JSON string.
     * @param child
     */
    public void addChild(TreeNodeObject child) {
        this.children.add(child);
    }

    /**
     * Ensure the equals method is only on the label.
     * @param obj
     * @return
     */
    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }

        if (!TreeNodeObject.class.isAssignableFrom(obj.getClass())) {
            return false;
        }

        final TreeNodeObject other = (TreeNodeObject) obj;
        if ((this.getLabel() == null) ? (other.getLabel() != null) : !this.getLabel().equals(other.getLabel())) {
            return false;
        }

        return true;
    }

}
