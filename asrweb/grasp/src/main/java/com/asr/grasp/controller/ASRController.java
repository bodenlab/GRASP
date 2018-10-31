package com.asr.grasp.controller;

import alignment.MSA;
import api.PartialOrderGraph;
import dat.EnumSeq;
import dat.Enumerable;
import dat.POGraph;
import java.util.Map;
import json.JSONObject;
import reconstruction.ASRPOG;
import reconstruction.Inference;
import vis.POAGJson;

import java.io.IOException;
import java.util.List;

/**
 * Created by marnie
 */
public class ASRController {
    private int NUM_THREADS = 5;

    private String sessionId = "";
    private String sessionDir = null;

    // ASR object to store joint reconstruction for showing resulting graphs of different nodes without performing the
    // reconstruction with each node view query
    private ASRPOG asrJoint = null;
    private Map<String, List<Inference>>  jointInferences = null;

    // ASR object to store marginal reconstruction of current node (if given)
    private ASRPOG asrMarginal = null;

    // MSA object to perform alignment of sequences
    private MSA msa = null;

    private POGraph msaGraph = null;
    private PartialOrderGraph ancGraph = null;
    private boolean performedJoint = false;
    private boolean performedMarginal = false;

    private String rootLabel = null;

    public ASRController() {
        this.sessionId = "grasp" + System.currentTimeMillis();
    }

    /**
     * To allow us to perform logic such as getting all joints from the ASRPOG joint
     * and save these to the database.
     * @return
     */
    public ASRPOG getJointASRPOG () {
        return asrJoint;
    }

    /**
     * Similar to above, it returns the marginal reconstruction so that we can perform
     * other logic - such as motif searching - on the marginal reconstructions.
     * @return
     */
    public ASRPOG getMarginalASRPOG () {
        return asrMarginal;
    }

    /*******************************************************************************************************************
     ****** Setters and getters for ASR attributes
     ******************************************************************************************************************/

    public void setSessionDir(String dir) { this.sessionDir = dir; }
    public String getSessionDir() { return this.sessionDir; }
    public String getSessionId() { return this.sessionId; }

    /*******************************************************************************************************************
     ****** ASR functional methods
     ******************************************************************************************************************/

    public void performAlignment(String filepath) throws IOException {
        msa = new MSA(filepath);
    }


    /**
     * Return the list of joint inferences these can then be iterated through
     * @return
     */
    public Map<String, List<Inference>> getJointInferences() {
        if (asrJoint != null)
            return asrJoint.getAncestralInferences();
        return null;
    }

    public void loadParameters(String model, int numThreads, String node, List<EnumSeq.Gappy<Enumerable>> extants, String tree, String msa) {
        NUM_THREADS = numThreads;
        if (jointInferences != null) {
            asrJoint = new ASRPOG(model, NUM_THREADS, jointInferences, extants, tree);
            performedJoint = true;
        } else
            asrJoint = new ASRPOG(model, NUM_THREADS);
        asrMarginal = new ASRPOG(model, NUM_THREADS, node);
        msaGraph = new POGraph(extants);
    }

    public void setJointInferences(Map<String, List<Inference>>  inferences) {
        jointInferences = inferences;
    }

    /**
     * Run reconstruction using saved data and specified options
     */
    public void runReconstruction(String type, int numThreads, String model, String node, String tree, List<EnumSeq.Gappy<Enumerable>> seqs, String logFileName) throws InterruptedException {
        NUM_THREADS = numThreads;
        if (type.equalsIgnoreCase("marginal"))
            performedMarginal = runReconstructionMarginal(tree, seqs, model, node);
        else if (asrJoint == null || asrJoint.getAncestralInferences().isEmpty())
            performedJoint = runReconstructionJoint(tree, seqs, model, logFileName);
        if (rootLabel == null || rootLabel.equalsIgnoreCase("root"))
            if (asrJoint != null)
                rootLabel = asrJoint.getRootLabel();
            else if (asrMarginal != null)
                rootLabel = asrMarginal.getRootLabel();
            else
                rootLabel = "root";
    }

    /**
     * Run joint reconstruction using saved data and specified options
     */
    private boolean runReconstructionJoint(String treeNwk, List<EnumSeq.Gappy<Enumerable>> seqs, String model, String logFileName) throws InterruptedException {
        if (asrJoint == null)
            asrJoint = new ASRPOG(model, NUM_THREADS);
        if (asrJoint.getAncestralInferences() == null || asrJoint.getAncestralInferences().isEmpty())
            asrJoint.runReconstruction(treeNwk, seqs, true, (msa == null ? null : msa.getMSAGraph()), logFileName);
        return true;
    }


//    public void runReconstruction(String treeNewick, List<Gappy<Enumerable>> sequences, boolean jointInference, POGraph msa) throws InterruptedException {


        /**
         * Run marginal reconstruction using saved data and specified options
         */
    private boolean runReconstructionMarginal(String treeNwk, List<EnumSeq.Gappy<Enumerable>> seqs, String model, String nodeLabel) throws InterruptedException {
        if (nodeLabel != null && !nodeLabel.equalsIgnoreCase("root"))
            asrMarginal = new ASRPOG(model, NUM_THREADS, nodeLabel);
        else
            asrMarginal = new ASRPOG(model, NUM_THREADS);
        asrMarginal.runReconstruction(treeNwk, seqs, false, msa == null ? null : msa.getMSAGraph());
        return true;
    }

    /**
     * Save MSA graph
     *
     * @param filepath  filepath of where to save graph
     */
    public void saveMSA(String filepath) {
        if (asrJoint != null)
            asrJoint.saveMSAGraph(filepath);
        else if (asrMarginal != null)
            asrMarginal.saveMSAGraph(filepath);
    }

    public void saveMSAAln(String filepath) throws IOException {
        if (performedJoint)
            asrJoint.saveALN(filepath + "_MSA", "clustal");
        else if (performedMarginal)
            asrMarginal.saveALN(filepath + "_MSA", "clustal");
    }

    public void saveTree(String filepath) throws IOException {
        if (performedJoint)
            asrJoint.saveTree(filepath);
        else if (performedMarginal)
            asrMarginal.saveTree(filepath);
    }

    /**
     * Save ancestor graph
     *
     * @param label     label of ancestor
     * @param filepath  filepath of where to save graph
     * @param joint     flag: true, get from joint recon, false, get from marginal
     */
    public void saveAncestorGraph(String label, String filepath, boolean joint) {
        if (joint && performedJoint)
            asrJoint.saveGraph(filepath + "joint_", label);
        else if (!joint && performedMarginal)
            asrMarginal.saveGraph(filepath + "marginal_", label);
    }

    /**
     * Save graphs of all ancestors (joint)
     *
     * @param filepath  filepath of where to save ancestor graphs
     */
    public void saveAllAncestors(String filepath) {
        if (performedJoint)
            asrJoint.saveGraph(filepath + "joint_");
    }

    /**
     * Save consensus sequence of marginal node
     *
     * @param filepath  filepath of where to save consensus sequence
     * @throws IOException
     */
    public void saveConsensusMarginal(String filepath) throws IOException {
        if (performedMarginal)
            asrMarginal.saveSupportedAncestors(filepath, false);
    }

    /**
     * Save marginal distribution matrix of marginal node
     *
     * @param filepath  filepath of where to save distribution
     * @param node      node label or MSA for sequence alignment
     * @throws IOException
     */
    public void saveMarginalDistribution(String filepath, String node) throws IOException {
        if (performedMarginal && !node.equalsIgnoreCase("msa"))
            asrMarginal.saveDistrib(filepath + "/" + node);
        else if (performedJoint && node.equalsIgnoreCase("msa"))
            asrJoint.saveMSADistrib(filepath + "/" );
    }

    /**
     * Save consensus sequence of marginal node
     *
     * @param filepath  filepath of where to save consensus sequence
     * @throws IOException
     */
    public void saveConsensusJoint(String filepath, String label) throws IOException {
        if (performedJoint)
            if (label == null)
                asrJoint.saveSupportedAncestors(filepath, true);
            else
                asrJoint.saveSupportedAncestor(filepath, label, false);
    }

    public void saveConsensusJoint(String filepath, String[] labels) throws IOException {
        if (performedJoint)
            asrJoint.saveSupportedAncestors(filepath, labels, true);
    }

    public int getReconCurrentNodeId(String type) {
        try {
            if (type.equalsIgnoreCase("joint") && asrJoint != null)
                return asrJoint.getGraphReconNodeId();
            else if (asrMarginal != null)
                return asrMarginal.getGraphReconNodeId();
            return -1;
        } catch (NullPointerException e) {
            // controller are still being parsed
            return 0;
        }
    }

    public String getRootTreeLabel() {
        return rootLabel;
    }

    /**
     * Get the JSON representation of the sequence alignment graph
     * @return  graph JSON object
     */
    public JSONObject getMSAGraphJSON(String type) {
        if (msaGraph == null)
            if (performedJoint && type.equalsIgnoreCase("joint"))
                msaGraph = asrJoint.getMSAGraph();
            else if (performedMarginal)
                msaGraph = asrMarginal.getMSAGraph();
            else
                return null;
        POAGJson json = new POAGJson(new PartialOrderGraph(msaGraph));
        return json.toJSON();
    }

    /**
     * Get tje JSON representation of the inferred graph at the given tree node
     *
     * @param type reconstruction type to query ("joint" or "marginal")
     * @param nodeLabel label of tree node to get graph representation of
     * @return  graph JSON object
     */
    public JSONObject getAncestralGraphJSON(String type, String nodeLabel) {
        if (nodeLabel == null)
            nodeLabel = rootLabel;
        if (performedJoint && type.equalsIgnoreCase("joint"))
            ancGraph = asrJoint.getGraph(nodeLabel);
        else if (performedMarginal)
            ancGraph = asrMarginal.getGraph(nodeLabel);
        else
            return null;
        POAGJson json = new POAGJson(ancGraph);
        // make sure node IDs line up with the correct positioning in the MSA graph
        return json.toJSON();
    }

    public boolean performedRecon() {
        return performedMarginal || performedJoint;
    }

    public String getReconstructedNewick() {
        if (asrJoint != null)
            return asrJoint.getReconstructedNewick();
        if (asrMarginal != null)
            return asrMarginal.getReconstructedNewick();
        return null;
    }

    public int getNumBases() {
        if (msaGraph != null)
            return msaGraph.getNumNodes();
        if (asrJoint != null && asrJoint.getMSAGraph() != null)
            return asrJoint.getMSAGraph().getNumNodes();
        if (asrMarginal != null && asrMarginal.getMSAGraph() != null)
            return asrMarginal.getMSAGraph().getNumNodes();
        return 0;
    }

    public int getNumAncestors() {
        if (asrJoint != null)
            return asrJoint.getAncestralInferences().size();
        if (asrMarginal != null && asrMarginal.getAncestralDict() != null)
            return asrMarginal.getAncestralDict().size();
        return 0;
    }

    public int getNumDeletedNodes(String infType, String node) {
        if (node == null)
            node = rootLabel;
        POGraph msa = msaGraph;
        if (msa == null)
            if (asrJoint != null)
                msa = asrJoint.getMSAGraph();
            else if (asrMarginal != null)
                msa = asrMarginal.getMSAGraph();
        if (asrJoint != null && infType.equalsIgnoreCase("joint"))
            return msa.getNumNodes() - asrJoint.getGraph(node).getNodeIDs().length;
        if (asrMarginal != null && infType.equalsIgnoreCase("marginal"))
            return msa.getNumNodes() - asrMarginal.getGraph(node).getNodeIDs().length;
        return -1;
    }



}
