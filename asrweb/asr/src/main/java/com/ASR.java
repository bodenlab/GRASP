package com;

import api.PartialOrderGraph;
import com.asr.validator.File;
import json.JSONObject;
import org.hibernate.validator.constraints.NotEmpty;
import org.springframework.web.multipart.MultipartFile;
import reconstruction.ASRPOG;
import vis.POAGJson;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;

/**
 * ASR API for integration in the Swing web form
 *
 * Created by marnie on 11/4/17.
 */
public class ASR {
    // TODO:
    private ASRPOG asrJoint;
    private ASRPOG asrMarginal;

    private ASRPOG asr;
    private String sessionDir;

    @NotEmpty(message="Please specify a label for your reconstruction")
    private String label;

    @File(type="aln", message="File must be an alignment (*.aln)")
    private MultipartFile alnFile;

    private String alnFilepath;

    @File(type="nwk", message="File must be in newick format (*.nwk)")
    private MultipartFile treeFile;

    private String treeFilepath;

    //@File(type="seq", message="File must be in fasta or clustal format (*.fa, *.fasta or *.aln)")
    private MultipartFile seqFile = null;

    private String inferenceType = "joint";

    private String nodeLabel = null;

    private boolean performAlignment = false;

    public ASR() {}

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
    public void setMarginalNodeLabel(String node) { this.nodeLabel = node; }
    public String getMarginalNodeLabel() { return this.nodeLabel; }

    /*******************************************************************************************************************
     ****** ASR functional methods
     ******************************************************************************************************************/

    /**
     * Run reconstruction using uploaded files and specified options
     */
    public void runReconstruction() throws Exception {
        System.out.println(nodeLabel);
        if (inferenceType.equalsIgnoreCase("joint"))
            asr = new ASRPOG(alnFilepath, treeFilepath, true,true);
        else if (nodeLabel != null)
            asr = new ASRPOG(null, treeFilepath, alnFilepath, nodeLabel, true);
        else
            asr = new ASRPOG(alnFilepath, treeFilepath, false, true);
        asr.saveTree(sessionDir + label + "_recon.nwk");
    }

    /**
     * Get the newick string of the reconstructed tree
     * @return  newick representation of reconstructed tree
     */
    public String getReconstructedNewickString() {
        try {
            BufferedReader r = new BufferedReader(new FileReader(sessionDir + label + "_recon.nwk"));
            String tree = "";
            String line;
            while((line = r.readLine()) != null)
                tree += line;
            r.close();
            System.out.println(tree);
            return tree;
        } catch (IOException e) {
            return "";
        }
    }

    /**
     * Get the JSON representation of the sequence alignment graph
     * @return  graph JSON object
     */
    public JSONObject getMSAGraphJSON() {
        PartialOrderGraph msa = asr.getMSAGraph();
        System.out.println(msa.toString());
        POAGJson json = new POAGJson(msa);
        return json.toJSON();
    }

    /**
     * Get tje JSON representation of the inferred graph at the given tree node
     *
     * @param nodeLabel label of tree node to get graph representation of
     * @return  graph JSON object
     */
    public JSONObject getAncestralGraphJSON(String nodeLabel) {
        PartialOrderGraph graph = asr.getGraph(nodeLabel);
        System.out.println(graph.toString());
        POAGJson json = new POAGJson(graph);
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
        System.out.printf(metadataInferred.toString(), metadataMSA.toString());
        // Add metadata information (for example titles, could be anything)
        metadataInferred.put("title", "Inferred");
        metadataMSA.put("title", "MSA");

        // Add the metadata to their respective graphs
        graphInferred.put("metadata", metadataInferred);
        graphMSA.put("metadata", metadataMSA);

        // Add the metadata to an array
        JSONObject combinedPoags = new JSONObject();
        combinedPoags.put("inferred", graphInferred);
        combinedPoags.put("msa", graphMSA);

        // Return a string representation of this
        return combinedPoags.toString();
    }
}
