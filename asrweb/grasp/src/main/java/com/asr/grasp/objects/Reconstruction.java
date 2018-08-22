package com.asr.grasp.objects;

import com.asr.grasp.utils.Defines;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;

public class Reconstruction {
    private int id = Defines.UNINIT;

    private int ownerId = Defines.UNINIT;

    private String label;

    private String tree;

    private String reconTree;

    private int numThreads;

    private String msa;

    private String sequences;

    private String jointInferences;

    private String ancestor;

    private String inferenceType;

    private String model;

    private String node;

    private String updated_at;

    public int getId() {
        return this.id;
    }

    public void setId(int id) { this.id = id; }

    public int getOwnerId() {return this.ownerId; }

    public void setOwnerId(int ownerId) { this.ownerId = ownerId; }

    public void setLabel(String label) { this.label = label; }

    public String getLabel() { return this.label; }

    public void setTree(String tree) { this.tree = tree; }

    public String getSequences() { return this.sequences; }

    public void setSequences(String sequences) { this.sequences = sequences; }

    public String getTree() { return this.tree; }

    public String getJointInferences() { return this.jointInferences; }

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

    public String getUpdatedAt() { return this.updated_at; }

    public void setInferenceType(String inferenceType) {

        this.inferenceType = inferenceType;

    }

    public void setJointInferences(String inferences) {

        this.jointInferences = inferences;

    }

    public String getInferenceType() {

        return this.inferenceType;
    }

}
