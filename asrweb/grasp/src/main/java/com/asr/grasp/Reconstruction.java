package com.asr.grasp;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity(name = "Reconstruction")
@Table(name = "reconstruction")
public class Reconstruction {

    @Id
    @GeneratedValue
    private Long id;

    @Column(name = "label")
    private String label;

    @Lob
    @Column(name = "tree")
    private String tree;

    @Lob
    @Column(name = "reconstructed_tree")
    private String reconTree;

    @Column(name = "num_threads")
    private int numThreads;

    @Lob
    @Column(name = "msa")
    private String msa;

    @Lob
    @Column(name = "sequences")
    private String sequences;

    @Lob
    @Column(name = "joint_inferences")
    private String jointInferences;

    @Lob
    @Column(name = "ancestor")
    private String ancestor;

    @Column(name = "inference_type")
    private String inferenceType;

    @Column(name = "model")
    private String model;

    @Column(name = "node")
    private String node;

    @ManyToMany(mappedBy = "reconstructions")
    private Set<User> users = new HashSet<>();

    public Long getId() { return this.id; }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return this.label;
    }

    public void setTree(String tree) {
        this.tree = tree;
    }

    public String getSequences() {
        return this.sequences;
    }

    public void setSequences(String sequences) {
        this.sequences = sequences;
    }

    public String getTree() {
        return this.tree;
    }

    public void setJointInferences(String inferences) {
        this.jointInferences = inferences;
    }

    public String getJointInferences() {
        return this.jointInferences;
    }

    public void setReconTree(String tree) {
        this.reconTree = tree;
    }

    public String getReconTree() {
        return this.reconTree;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getModel() {
        return this.model;
    }

    public void setNumThreads(int numThreads) {
        this.numThreads = numThreads;
    }

    public int getNumThreads(){
        return this.numThreads;
    }

    public void setMsa(String msa) {
        this.msa = msa;
    }

    public String getMsa(){
        return this.msa;
    }

    public void setAncestor(String ancestor) {
        this.ancestor = ancestor;
    }

    public String getAncestor(){
        return this.ancestor;
    }

    public void setInferenceType(String inferenceType) {
        this.inferenceType = inferenceType;
    }

    public String getInferenceType() {
        return this.inferenceType;
    }

    public void setNode(String node) {
        this.node = node;
    }

    public String getNode() {
        return this.node;
    }

    public void setUsers(Set<User> userset){
        this.users = userset;
    }

    public void addUser(User user) {
        if (!users.contains(user))
            users.add(user);
        if (!user.getAllReconstructions().contains(this))
            user.addReconstruction(this);
    }

    public void removeUser(User user) {
        users.remove(user);
    }

    public Set<User> getUsers() {
        return this.users;
    }

}
