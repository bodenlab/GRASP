package com.asr.grasp.objects;

import java.util.ArrayList;

/**
 * This is a class that is aimed to be used internally. The TreeNodeObject class was created to
 * be able to find "similar" ancestral nodes between two trees.
 * It's use case may be extended.
 *
 * written by ariane @ 22/10/2018
 */
public class TreeNodeObject {

    private ArrayList<TreeNodeObject> children;
    private ArrayList<TreeNodeObject> leaves;
    private String label;
    private double score;
    private Double distance;
    private double distanceFromRoot = 0.0;
    private TreeNodeObject parent;

    public TreeNodeObject(String label, TreeNodeObject parent, Double distance) {
        this.children = new ArrayList<>();
        this.leaves = new ArrayList<>();
        this.label = label;
        this.score = 0;
        this.distance = distance;
        if (distance == null) {
            this.distance = 0.0;
        }
        this.parent = parent;
    }

    public double getDistanceToRoot() {
        if (distanceFromRoot != 0) {
            return distanceFromRoot + distance;
        }
        if (parent != null) {
            distanceFromRoot += parent.getDistanceToRoot();
        }
        return distanceFromRoot + distance;
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
