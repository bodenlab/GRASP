package com.asr.grasp.objects;

import com.asr.grasp.utils.Defines;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import reconstruction.Inference;


/**
 * The reconstruction object is used to pass information between the front end interface and
 * the Java code. For Spring each form is required to be translated into an Object. This is
 * used when a user is creating a new reconstruction.
 *
 * Created by marnie 11/4/17.
 */
public class ReconstructionObject {
    private int id = Defines.UNINIT;

    private int ownerId = Defines.UNINIT;

    private String error = "";

    private String label = null;

    private String tree;

    private String reconTree;

    private int numThreads;

    private String msa;

    private String sequences;

    private Map<String, List<Inference>> jointInferences;

    private String ancestor;

    private String inferenceType;

    private String model;

    private String node;

    public int getId() {
        return this.id;
    }

    public void setId(int id) { this.id = id; }

    public int getOwnerId() {return this.ownerId; }

    public void setOwnerId(int ownerId) { this.ownerId = ownerId; }

    public void setLabel(String label) { this.label = label; }

    public String getLabel() { return this.label; }

    public void setTree(String tree) { this.tree = tree; }

    public String getSequences() {
        return this.sequences; }

    public void setSequences(String sequences) { this.sequences = sequences; }

    public String getTree() { return this.tree; }

    public Map<String, List<Inference>> getJointInferences() {
        return this.jointInferences;
    }

    public void setReconTree(String tree) { this.reconTree = tree; }

    public String getReconTree() { return this.reconTree; }

    public void setModel(String model) { this.model = model; }

    public String getModel() { return this.model; }

    public void setNumThreads(int numThreads) { this.numThreads = numThreads; }

    public int getNumThreads() {
        return this.numThreads;
    }

    public void setMsa(String msa) {
        this.msa = msa;
    }

    public String getMsa() {
        return this.msa;
    }

    public void setAncestor(String ancestor) {
        this.ancestor = ancestor;
    }

    public String getAncestor() {
        return this.ancestor;
    }

    public void setNode(String node) { this.node = node; }

    public String getNode() { return this.node;}

    public void setInferenceType(String inferenceType) {
        this.inferenceType = inferenceType;
    }

    public void setJointInferences(Map<String, List<Inference>> inferences) {
        this.jointInferences = inferences;
    }

    public String getInferenceType() {
        return this.inferenceType;
    }

    public String getError() {
        if (error != null && error.length() > 1) {
            return this.error;
        }
        return null;
    }

    public void setError(String error) { this.error = error; }

    public void clearLargeStrings() {
        this.msa = null;
        this.reconTree = null;
        this.sequences = null;
        this.ancestor = null;
        this.tree = null;
    }
}
