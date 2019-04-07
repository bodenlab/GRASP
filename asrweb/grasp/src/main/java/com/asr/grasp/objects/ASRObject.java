package com.asr.grasp.objects;

import com.asr.grasp.controller.ASRController;
import com.asr.grasp.utils.Defines;
import dat.EnumSeq;
import dat.Enumerable;
import java.util.HashMap;
import java.util.Map;
import json.JSONObject;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import reconstruction.ASRPOG;
import reconstruction.Inference;

/**
 * ASR API for integration in the Swing web form
 *
 * Created by marnie on 11/4/17.
 */
public class ASRObject {
    private int NUM_THREADS = 5;

    private ASRController asrController;

    private String email = "";
    private boolean save = true;

    private String dataPath = "data/app/";

    private String label = "";
    private String inferenceType = "joint";
    private String nodeLabel = null;
    private String workingNodeLabel = null;
    private String model = "JTT";

    private MultipartFile alnFile = null;
    private String alnFilepath = null;
    private MultipartFile treeFile = null;
    private String treeFilepath = null;
    private MultipartFile seqFile = null;

    private boolean performAlignment = false;

    private String data = null; // example dataset to run, if applicable
    private boolean loaded = false;

    // For saving/loading
    private String tree = null;
    private String reconstructedTree = null;
    private List<EnumSeq.Gappy<Enumerable>> extants = null;
    private String msa = null;
    private String ancestor = null;
    private Map<String, List<Inference>> jointInferences = null;

    // for logging
    private int numAlnCols = 0;
    private int numAncestors = 0;
    private int numExtantSequences = 0;
    private int numBases = 0;
    HashMap extentNames = new HashMap<>();

    private boolean finishedRecon = false;

    private boolean firstPass = true;
    private int prevProgress = 0;

    public ASRObject() {
        this.asrController = new ASRController();
    }

    /*******************************************************************************************************************
     ****** Setters and getters for ASR attributes (forms, etc, automatically call these)
     ******************************************************************************************************************/


    /**
     * To allow us to perform logic such as getting all joints from the ASRPOG joint
     * and save these to the database.
     * @return
     */
    public ASRPOG getASRPOG (int asrType) {
        if (asrType == Defines.JOINT) {
            return asrController.getJointASRPOG();
        } else if (asrType == Defines.MARGINAL) {
            return asrController.getMarginalASRPOG();
        }
        return null;
    }

    /**
     * Setters and getters to enable getting the email from the front end.
     * @return
     */
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
    public boolean getSave() { return this.save; }
    public void setSave(boolean save) { this.save = save;}


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
    public void setNodeLabel(String node) {
        this.nodeLabel = node; }
    public String getNodeLabel() {
        if (nodeLabel == null)
            nodeLabel = asrController.getRootTreeLabel();
        return this.nodeLabel;
    }
    public void setWorkingNodeLabel(String node) {
        this.workingNodeLabel = node;
    }
    public String getWorkingNodeLabel() {

        if (workingNodeLabel == null)
            workingNodeLabel = asrController.getRootTreeLabel();
        return this.workingNodeLabel; }
    public void setModel(String model) { this.model = model; }
    public String getModel() { return this.model; }


    public void setPrevProgress(int progress) { this.prevProgress = progress; }
    public int getPrevProgress() { return this.prevProgress; }
    public void setFirstPass(boolean flag) { this.firstPass = flag; }
    public boolean getFirstPass() { return this.firstPass; }
    public void setData(String data) { this.data = data; }
    public String getData() { return this.data; }
    public void setTree(String tree) { this.tree = tree; }
    public String getTree() { return this.tree; }
    public boolean getLoaded() { return this.loaded; }


    // Logging functions
    public int getNumberBases(){
        if (numBases == 0)
            numBases = asrController.getNumBases();
        return numBases;
    };
    public int getNumberAncestors() {
        if (numAncestors == 0)
            numAncestors = asrController.getNumAncestors();
        return numAncestors;
    }
    public int getNumberDeletedNodes() {
        return asrController.getNumDeletedNodes(inferenceType, workingNodeLabel);
    }

    /*******************************************************************************************************************
     ****** ASR functional methods
     ******************************************************************************************************************/


    public void loadParameters() {
        asrController.loadParameters(model, NUM_THREADS, nodeLabel, extants, tree, msa);
        loaded = true;
    }

    /**
     * Run reconstruction using uploaded files and specified options
     */
    public void runReconstruction() throws IOException, InterruptedException {
        NUM_THREADS = getNumThreads();
        if (numAlnCols == 0)
            numAlnCols = getNumberAlnCols();
        if (extants == null)
            loadExtants();
        if (tree == null)
            loadTree();
        if (performAlignment && extants == null)
            asrController.performAlignment(alnFilepath);
        asrController.runReconstruction(inferenceType, NUM_THREADS, model, nodeLabel, tree, extants, label);
        if (reconstructedTree == null)
            reconstructedTree = asrController.getReconstructedNewick();
    }

    public void loadExtants() throws IOException {
        if (extants != null || alnFilepath == null)
            return;
        BufferedReader aln_file = new BufferedReader(new FileReader(alnFilepath));
        String line = aln_file.readLine();
        if (line.startsWith("CLUSTAL"))
            extants = EnumSeq.Gappy.loadClustal(alnFilepath, Enumerable.aacid_ext);
        else if (line.startsWith(">"))
            extants = EnumSeq.Gappy.loadFasta(alnFilepath, Enumerable.aacid_ext, '-');
        else
            throw new RuntimeException("Alignment should be in Clustal or Fasta format");
        aln_file.close();
        numAlnCols = extants.get(0).length();
        numExtantSequences = extants.size();
    }

    private void loadTree() throws IOException {
        if (tree != null || treeFilepath == null)
            return;
        BufferedReader tree_file = new BufferedReader(new FileReader(treeFilepath));
        String line = tree_file.readLine();
        tree = line;
        while ((line = tree_file.readLine()) != null)
            tree += line;
        tree_file.close();

    }

    /**
     * Public method that allows us to get the extent names to and search for these while we're
     * performing the ASR.
     * @return
     */
    public HashMap<String, ArrayList<String>> getExtentNames() {
        if (extants == null) {
            try {
                loadExtants();
            } catch (Exception e) {
                System.err.println(e);
                return null;
            }
        }
        if (!extentNames.isEmpty()) {
            return extentNames;
        }
        ArrayList<String> extentNamesUniprot = new ArrayList<>();
        ArrayList<String> extentNamesNcbi = new ArrayList<>();
        for (EnumSeq.Gappy<Enumerable> extent: extants) {
            String name = extent.getName();
            // Uniprot names can be identified by the | character in position 2. https://www.uniprot.org/help/fasta-headers
            if (name.substring(2, 3).equals("|")) {
                String[] id = name.split("\\|");
                String idN = id[1];
                extentNamesUniprot.add(idN);
            } else {
                // Otherwise assume it is a NCBI id TODO: Have a check that it is NCBI format
                String[] id = name.split("\\.");
                String idN = id[0];
                extentNamesNcbi.add(idN);
            }
        }
        extentNames.put(Defines.UNIPROT, extentNamesUniprot);
        extentNames.put(Defines.NCBI, extentNamesNcbi);
        return extentNames;
    }

    public int getNumberAlnCols() throws IOException {
        if (numAlnCols == 0 && extants == null)
            loadExtants();
        return numAlnCols;
    }


    public int getNumberSequences() throws IOException {
        if (numExtantSequences == 0)
            getNumberAlnCols();
        return numExtantSequences;
    }

    public boolean performedRecon() {
        return asrController.performedRecon();
    }


    public void setMSA(String msa){
        this.msa = msa;
    }

    public String getMSA() { return this.msa; }

    public JSONObject getMSAGraph() {
        return new JSONObject(msa);
    }

    public void setAncestor(String ancestor){
        this.ancestor = ancestor;
    }

    public String getAncestor() { return this.ancestor; }

    public JSONObject getAncestorGraph() {
        return new JSONObject(ancestor);
    }

    /**
     * Limit the number of threads based on the number of extant sequences (ie. number of ancestral nodes)
     *
     * @return
     * @throws Exception
     */
    private int getNumThreads() throws IOException {
        if (extants == null)
            loadExtants();
        if (numExtantSequences == 0)
            numExtantSequences = extants.size();
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
     * Get the newick string of the reconstructed tree
     * @return  newick representation of reconstructed tree
     */
    public String getReconstructedNewickString() {
        if (reconstructedTree == null)
            reconstructedTree = asrController.getReconstructedNewick();
        return reconstructedTree;
    }

    public Map<String, List<Inference>> getJointInferences() {
        if (jointInferences == null)
            jointInferences = asrController.getJointInferences();
        return jointInferences;
    }

    public void setJointInferences(Map<String, List<Inference>>  inference) {
        jointInferences = inference;
        if (inference != null)
            asrController.setJointInferences(inference);
    }

    public void setReconstructedTree(String tree) {
        this.reconstructedTree = tree;
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
        asrController.saveMSA(filepath);
    }

    public void saveMSAAln(String filepath) throws IOException {
        asrController.saveMSAAln(filepath);
    }

    public String getSequences() {
        String sequences = "";
        for (EnumSeq seq : extants)
            sequences += seq.getName() + ":" + seq.toString() + ",";
        return sequences;
    }

    /**
     * Gets all the extant sequences with their labels. This is used so we can save them to
     * the database - used for motif searching etc.
     *
     * @return
     */
    public HashMap<String, String> getSequencesAsNamedMap () {
        HashMap<String, String> sequences = new HashMap<>();
        for (EnumSeq seq : extants)
            sequences.put(seq.getName(), seq.toString());
        return sequences;
    }


    public void loadSequences(String sequences) {
        extants = new ArrayList<>();
        for (String s : sequences.split("[,]"))
            if (s != "") {
                EnumSeq.Gappy<Enumerable> seq = new EnumSeq.Gappy<>(Enumerable.aacid_ext);
                seq.setName(s.split("[:]")[0]);
                //seq.setInfo(s.split("[:]")[1]);
                String seqString = s.split("[:]")[1];
                Character[] arr = new Character[seqString.length()];
                for (int i = 0; i < seqString.length(); i++)
                    arr[i] = seqString.toCharArray()[i];
                seq.set(arr);
                extants.add(seq);
            }
    }

    /**
     * Save ancestor graph
     *
     * @param label     label of ancestor
     * @param filepath  filepath of where to save graph
     * @param joint     flag: true, get from joint recon, false, get from marginal
     */
    public void saveAncestorGraph(String label, String filepath, boolean joint) {
        asrController.saveAncestorGraph(label, filepath, joint);
    }

    public void saveTree(String filepath) throws IOException {
        asrController.saveTree(filepath);
    }

    /**
     * Save graphs of all ancestors (joint)
     *
     * @param filepath  filepath of where to save ancestor graphs
     */
    public void saveAncestors(String filepath) {
        asrController.saveAllAncestors(filepath);
    }

    public void saveAncestors(String filepath, String[] labels) {
        for (String a : labels)
            asrController.saveAncestorGraph(a, filepath, true);
    }

    /**
     * Save consensus sequence of marginal node
     *
     * @param filepath  filepath of where to save consensus sequence
     * @throws IOException
     */
    public void saveConsensusMarginal(String filepath) throws IOException {
        asrController.saveConsensusMarginal(filepath);
    }

    /**
     * Save marginal distribution matrix of marginal node
     *
     * @param filepath  filepath of where to save distribution
     * @param node      node label or MSA for sequence alignment
     * @throws IOException
     */
    public void saveMarginalDistribution(String filepath, String node) throws IOException {
        asrController.saveMarginalDistribution(filepath, node);

    }

    /**
     * Save consensus sequence of marginal node
     *
     * @param filepath  filepath of where to save consensus sequence
     * @throws IOException
     */
    public void saveConsensusJoint(String filepath, String label) throws IOException {
        asrController.saveConsensusJoint(filepath, label);
    }

    public void saveConsensusJoint(String filepath, String[] labels) throws IOException {
        asrController.saveConsensusJoint(filepath, labels);
    }

    public int getReconCurrentNodeId() {
        return asrController.getReconCurrentNodeId(inferenceType);
    }

    /**
     * Get the JSON representation of the sequence alignment graph
     * @return  graph JSON object
     */
    public JSONObject getMSAGraphJSON() {
        return asrController.getMSAGraphJSON(inferenceType);
    }

    /**
     * Get tje JSON representation of the inferred graph at the given tree node
     *
     * @param nodeLabel label of tree node to get graph representation of
     * @return  graph JSON object
     */
    public JSONObject getAncestralGraphJSON(String nodeLabel) {
        return asrController.getAncestralGraphJSON(inferenceType, nodeLabel);
    }

    public void setSessionDir(String path) {
        asrController.setSessionDir(path);
    }

    public String getSessionDir(){
        return asrController.getSessionDir();
    }

    public String getSessionId(){
        return asrController.getSessionId();
    }

    /**
     * Formats the MSA and inferred controller into JSON representation of two graphs, used for javascript visualisation.
     * This format is sent through to the website for visualisation.
     *
     * @param graphMSA          JSON object of MSA graph
     * @param graphInferred     JSON object of inferred graph
     * @return                  String of JSON
     */
    public String catGraphJSONBuilder(JSONObject graphMSA, JSONObject graphInferred) {
        // Create metadata controller to add to the POAGS
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

    /**
     * -------------------------------------------------------------------------
     *          User Interaction Methods
     * -------------------------------------------------------------------------
     */
    /**
     * Runs an ASR on a Session, the user has uploaded files or chosen one of
     * the example datasets.
     *
     * @param sessionPath
     * @return
     */
    public Exception runForSession(String sessionPath) {
        try {
            File sessionDir = new File(sessionPath + getSessionId());
            if (!sessionDir.exists())
                sessionDir.mkdir();

            setSessionDir(sessionDir.getAbsolutePath() + "/");

            if (seqFile != null || alnFile != null) {
                // aligning input data before performing reconstruction
                if (seqFile != null) {
                    seqFile.transferTo(new File(sessionDir +
                            seqFile.getOriginalFilename()));
                    setAlnFilepath(sessionDir + seqFile
                            .getOriginalFilename());
                    setPerformAlignment(true);
                }
                // performing reconstruction on already aligned data
                if (alnFile != null) {
                    alnFile.transferTo(new File(sessionDir + alnFile
                            .getOriginalFilename()));
                    setAlnFilepath(sessionDir + alnFile
                            .getOriginalFilename());
                }
                getTreeFile().transferTo(new File(sessionDir + treeFile
                        .getOriginalFilename()));
                setTreeFilepath(sessionDir + treeFile.getOriginalFilename());
            } else {
                // performing reconstruction on test data

                File alnFile = new File(Thread.currentThread()
                        .getContextClassLoader().getResource(dataPath + data + ".aln")
                        .toURI());
                setAlnFilepath(sessionDir + data + ".aln");
                Files.copy(alnFile.toPath(), (new File(alnFilepath)).toPath(),
                        StandardCopyOption.REPLACE_EXISTING);
                File treeFile = new File(Thread.currentThread()
                        .getContextClassLoader().getResource(dataPath + data + ".nwk")
                        .toURI());
                setTreeFilepath(sessionDir + data + ".nwk");
                Files.copy(treeFile.toPath(), (new File(treeFilepath)).toPath(),
                        StandardCopyOption.REPLACE_EXISTING);
            }
            // Return that it was a success
            return null;
        } catch (Exception e) {
            System.err.println(e);
            return e;
        }
    }


    public List<EnumSeq.Gappy<Enumerable>> getSeqsAsEnum() {
        return this.extants;
    }

    /**
     * ---------------------------------------------------------------------------------------------
     *
     *                          Methods for test env
     *
     * ---------------------------------------------------------------------------------------------
     */

    public void setDataPath(String dataPath) {
        this.dataPath = dataPath;
    }
}
