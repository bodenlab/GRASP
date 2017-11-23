package com.asr.grasp;

import api.PartialOrderGraph;
import dat.EnumSeq;
import dat.Enumerable;
import dat.POGraph;
import json.JSONObject;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;
import org.springframework.web.multipart.MultipartFile;
import reconstruction.ASRPOG;
import vis.POAGJson;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;

/**
 * ASR API for integration in the Swing web form
 *
 * Created by marnie on 11/4/17.
 */
@Component
@SessionScope
public class ASR {
    private int NUM_THREADS = 5;

    private String sessionId = "";

    // ASR object to store joint reconstruction for showing resulting graphs of different nodes without performing the
    // reconstruction with each node view query
    private ASRPOG asrJoint = null;

    // ASR object to store marginal reconstruction of current node (if given)
    private ASRPOG asrMarginal = null;

    private String sessionDir = null;

    private String label = "";

    //@File(type="aln", message="File must be an alignment (*.aln)")
    private MultipartFile alnFile = null;

    private String alnFilepath = null;

    //@File(type="nwk", message="File must be in newick format (*.nwk)")
    private MultipartFile treeFile = null;

    private String treeFilepath = null;

    //@File(type="seq", message="File must be in fasta or clustal format (*.fa, *.fasta or *.aln)")
    private MultipartFile seqFile = null;

    private String inferenceType = "joint";

    private String nodeLabel = "root";

    private boolean performAlignment = false;

    private String model = "JTT";

    private String data = null; // example dataset to run, if applicable

    private int numAlnCols = 0;
    private int numExtantSequences = 0;

    private POGraph msaGraph = null;
    private PartialOrderGraph ancGraph = null;
    private boolean performedJoint = false;
    private boolean performedMarginal = false;
    private boolean firstPass = true;
    private int prevProgress = 0;

    public ASR() {
        this.sessionId = "grasp" + System.currentTimeMillis();
    }

    public ASR(long id) {
        this.sessionId = "grasp" + id;
    }


    /*******************************************************************************************************************
     ****** Setters and getters for ASR attributes (forms, etc, automatically call these)
     ******************************************************************************************************************/

    public String getLabel() {
        return this.label;
    }
    public void setLabel(String label) {
        this.label = label.replace(" ", "").trim();
    }
    public MultipartFile getAlnFile() { return this.alnFile; }
    public void setAlnFile(MultipartFile alnFile) {
        this.alnFile = alnFile;
    }
    public MultipartFile getTreeFile() {
        return this.treeFile;
    }
    public void setTreeFile(MultipartFile treeFile) {
        this.treeFile = treeFile;
    }
    public MultipartFile getSeqFile() {
        return this.seqFile;
    }
    public void setSeqFile(MultipartFile seqFile) {
        this.seqFile = seqFile;
    }
    public String getAlnFilepath() { return this.alnFilepath; }
    public void setAlnFilepath(String alnFilepath) { this.alnFilepath = alnFilepath; }
    public String getTreeFilepath() { return this.treeFilepath; }
    public void setTreeFilepath(String treeFilepath) { this.treeFilepath = treeFilepath; }
    public String getInferenceType() { return this.inferenceType; }
    public void setInferenceType(String infType) { this.inferenceType = infType; }
    public boolean getPerformAlignment() { return this.performAlignment; }
    public void setPerformAlignment(boolean performAlignment) { this.performAlignment = performAlignment; }
    public void setSessionDir(String dir) { this.sessionDir = dir; }
    public String getSessionDir() { return this.sessionDir; }
    public void setNodeLabel(String node) { this.nodeLabel = node; }
    public String getNodeLabel() { return this.nodeLabel; }
    public void setModel(String model) { this.model = model; }
    public String getModel() { return this.model; }


    public void setPrevProgress(int progress) { this.prevProgress = progress; }
    public int getPrevProgress() { return this.prevProgress; }
    public void setFirstPass(boolean flag) { this.firstPass = flag; }
    public boolean getFirstPass() { return this.firstPass; }
    public void setData(String data) { this.data = data; }
    public String getData() { return this.data; }
    public String getSessionId() { return this.sessionId; }

    // Logging functions
    public int getNumberBases() { return asrJoint != null ? asrJoint.getMSAGraph().getNumNodes() : asrMarginal != null ? asrMarginal.getMSAGraph().getNumNodes() : 0; }
    public int getNumberAncestors() { return asrJoint != null ? asrJoint.getAncestralDict().size() : asrMarginal != null ? asrMarginal.getAncestralDict().size() : 0; }
    public int getNumberDeletedNodes() { return msaGraph == null || ancGraph == null ? -1 : msaGraph.getNumNodes() - ancGraph.getNodeIDs().length; };

    /*******************************************************************************************************************
     ****** ASR functional methods
     ******************************************************************************************************************/


    /**
     * Run reconstruction using uploaded files and specified options
     */
    public void runReconstruction() throws Exception {
        NUM_THREADS = getNumThreads();
        if (inferenceType.equalsIgnoreCase("marginal"))
            runReconstructionMarginal();
        else if (!performedJoint || asrJoint == null)
            runReconstructionJoint();
    }

    public int getNumberAlnCols() throws IOException {
        if (numAlnCols == 0) {
            try {
                BufferedReader aln_file = new BufferedReader(new FileReader(alnFilepath));
                String line = aln_file.readLine();
                List<EnumSeq.Gappy<Enumerable>> extantSequences;
                if (line.startsWith("CLUSTAL")) {
                    extantSequences = EnumSeq.Gappy.loadClustal(alnFilepath, Enumerable.aacid_ext);
                } else if (line.startsWith(">")) {
                    extantSequences = EnumSeq.Gappy.loadFasta(alnFilepath, Enumerable.aacid_ext, '-');
                } else {
                    throw new RuntimeException("Alignment should be in Clustal or Fasta format");
                }
                aln_file.close();
                numAlnCols = extantSequences.get(0).length();
                numExtantSequences = extantSequences.size();
            } catch (NullPointerException e) {
                return Integer.MAX_VALUE;
            }
        }
        return numAlnCols;
    }

    public int getNumberSequences() throws IOException {
        if (numExtantSequences == 0)
            getNumberAlnCols();
        return numExtantSequences;
    }

    /**
     * Run joint reconstruction using uploaded files and specified options
     */
    private void runReconstructionJoint() throws Exception {
        if (asrJoint == null)
            asrJoint = new ASRPOG(model, NUM_THREADS);
        asrJoint.runReconstruction(null, treeFilepath, alnFilepath, true, performAlignment);

        performedJoint = true;
        asrJoint.saveTree(sessionDir + label + "_recon.nwk");
    }

    /**
     * Limit the number of threads based on the number of extant sequences (ie. number of ancestral nodes)
     *
     * @return
     * @throws Exception
     */
    private int getNumThreads() throws Exception {
        if (numExtantSequences == 0)
            getNumberAlnCols();

        if (numExtantSequences < 2000)
            return NUM_THREADS;
        else if (numExtantSequences < 6000)
            return 3;
        else if (numExtantSequences < 9000)
            return 2;
        else
            return 1;
    }

    /**
     * Run marginal reconstruction using uploaded files and specified options
     */
    private void runReconstructionMarginal() throws Exception {
        if (nodeLabel != null && !nodeLabel.equalsIgnoreCase("root"))
            asrMarginal = new ASRPOG(model, NUM_THREADS, nodeLabel);
        else
            asrMarginal = new ASRPOG(model, NUM_THREADS);
        asrMarginal.runReconstruction(null, treeFilepath, alnFilepath, false, performAlignment);
        performedMarginal = true;
        asrMarginal.saveTree(sessionDir + label + "_recon.nwk");
    }

    /**
     * Get the newick string of the reconstructed tree
     * @return  newick representation of reconstructed tree
     */
    public String getReconstructedNewickString() {
        try {
            BufferedReader r = new BufferedReader(new FileReader(sessionDir + getReconstructedTreeFileName()));
            String tree = "";
            String line;
            while((line = r.readLine()) != null)
                tree += line;
            r.close();
            return tree;
        } catch (IOException e) {
            return "";
        }
    }

    /**
     * Get the filename of the reconstructed phylogenetic tree
     *
     * @return  filename
     */
    public String getReconstructedTreeFileName() {
        return label + "_recon.nwk";
    }

    /**
     * Get the number of threads used for reconstruction.
     *
     * @return number of threads
     */
    public int getNumberThreads() {
        return NUM_THREADS;
    }

    /**
     * Save MSA graph
     *
     * @param filepath  filepath of where to save graph
     */
    public void saveMSA(String filepath) {
        if (inferenceType.equalsIgnoreCase("joint") && performedJoint)
            asrJoint.saveMSAGraph(filepath);
        else if (performedMarginal)
            asrMarginal.saveMSAGraph(filepath);
    }

    public void saveMSAAln(String filepath) throws IOException {
        if (performedJoint)
            asrJoint.saveALN(filepath + "_MSA", "clustal");
        else if (performedMarginal)
            asrMarginal.saveALN(filepath + "_MSA", "clustal");
    }

    /**
     * Save ancestor graph
     *
     * @param label     label of ancestor
     * @param filepath  filepath of where to save graph
     * @param joint     flag: true, get from joint recon, false, get from marginal
     */
    public void saveAncestorGraph(String label, String filepath, boolean joint) {
        if (joint && inferenceType.equalsIgnoreCase("joint") && performedJoint)
            asrJoint.saveGraph(filepath + "joint_", label);
        else if (!joint && performedMarginal)
            asrMarginal.saveGraph(filepath + "marginal_", label);
    }

    /**
     * Save graphs of all ancestors (joint)
     *
     * @param filepath  filepath of where to save ancestor graphs
     */
    public void saveAncestors(String filepath) {
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
            asrMarginal.saveSupportedAncestors(filepath);
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
                asrJoint.saveSupportedAncestors(filepath);
            else
                asrJoint.saveSupportedAncestor(filepath, label);
    }

    public int getReconCurrentNodeId() {
        try {
            if (inferenceType.equalsIgnoreCase("joint") && asrJoint != null)
                return asrJoint.getGraphReconNodeId();
            else if (asrMarginal != null)
                return asrMarginal.getGraphReconNodeId();
            return -1;
        } catch (NullPointerException e) {
            // objects are still being parse
            return 0;
        }
    }

    /**
     * Get the JSON representation of the sequence alignment graph
     * @return  graph JSON object
     */
    public JSONObject getMSAGraphJSON() {
        if (performedJoint && inferenceType.equalsIgnoreCase("joint"))
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
     * @param reconType reconstruction type to query ("joint" or "marginal")
     * @param nodeLabel label of tree node to get graph representation of
     * @return  graph JSON object
     */
    public JSONObject getAncestralGraphJSON(String reconType, String nodeLabel) {
        if (performedJoint && reconType.equalsIgnoreCase("joint"))
            ancGraph = asrJoint.getGraph(nodeLabel);
        else if (performedMarginal)
            ancGraph = asrMarginal.getGraph(nodeLabel);
        else
            return null;
        POAGJson json = new POAGJson(ancGraph);
        // make sure node IDs line up with the correct positioning in the MSA graph
        return json.toJSON();
    }

    /**
     * Formats the MSA and inferred objects into JSON representation of two graphs, used for javascript visualisation.
     * This format is sent through to the website for visualisation.
     *
     * @param graphMSA          JSON object of MSA graph
     * @param graphInferred     JSON object of inferred graph
     * @return                  String of JSON
     */
    public String catGraphJSONBuilder(JSONObject graphMSA, JSONObject graphInferred) {
        // Create metadata objects to add to the POAGS
        JSONObject metadataInferred = new JSONObject();
        JSONObject metadataMSA = new JSONObject();

        // Add metadata information (for example titles, could be anything)
        metadataInferred.put("title", "Inferred");
        metadataMSA.put("title", "MSA");

        // What type of reconstruction it is, if it is a marginal reconstruction
        // pie charts will be drawn if it is a joint reconstruction then only the inferred node will be drawn
        metadataInferred.put("type", inferenceType);
        metadataMSA.put("type", "marginal");

        // Add the metadata to their respective graphs
        graphInferred.put("metadata", metadataInferred);
        graphMSA.put("metadata", metadataMSA);

        // Add the metadata to an array
        JSONObject combinedPoags = new JSONObject();
        // Where the graph is put in relation to each other
        combinedPoags.put("top", graphMSA);
        combinedPoags.put("bottom", graphInferred);

        // Return a string representation of this
        return combinedPoags.toString();
    }
}
