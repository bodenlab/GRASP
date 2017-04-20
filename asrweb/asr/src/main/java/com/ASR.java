package com;

import api.PartialOrderGraph;
import com.asr.validator.File;
import org.hibernate.validator.constraints.NotEmpty;
import org.springframework.web.multipart.MultipartFile;
import reconstruction.ASRPOG;

import java.io.IOException;

/**
 * Created by marnie on 11/4/17.
 */
public class ASR {
    private ASRPOG asr;
    private String sessionDir;

    @NotEmpty(message="Please specify a label for your reconstruction")
    private String label;

    @File(type="aln", message="File must be an alignment (*.aln)")
    private MultipartFile alnFilepath;

    @File(type="nwk", message="File must be in newick format (*.nwk)")
    private MultipartFile treeFilepath;

    private String inferenceType;

    private String marginalNode = null;

    private PartialOrderGraph graph;

    public ASR() {
        this.graph = new PartialOrderGraph("/Users/marnie/Documents/Repositories/Development/bnkit/bnkit/src/test/resources/testPOGraphMed.dot");
    }

    /*******************************************************************************************************************
     ****** Setters and getters for ASR attributes (forms, etc, automatically call these)
     ******************************************************************************************************************/

    public String getLabel() {
        return this.label;
    }
    public void setLabel(String label) {
        this.label = label;
    }
    public MultipartFile getAlnFilepath() { return this.alnFilepath; }
    public void setAlnFilepath(MultipartFile alnFilepath) {
        this.alnFilepath = alnFilepath;
    }
    public MultipartFile getTreeFilepath() {
        return this.treeFilepath;
    }
    public void setTreeFilepath(MultipartFile treeFilepath) {
        this.treeFilepath = treeFilepath;
    }
    public String getInferenceType() { return this.inferenceType; }
    public void setInferenceType(String infType) { this.inferenceType = infType; }
    public void setSessionDir(String dir) { this.sessionDir = dir; }
    public String getSessionDir() { return this.sessionDir; }

    /*******************************************************************************************************************
     ****** ASR functional methods
     ******************************************************************************************************************/

    /**
     * Run reconstruction using uploaded files and specified options
     */
    public void runReconstruction() throws IOException {
        asr = new ASRPOG(sessionDir + alnFilepath.getOriginalFilename(), sessionDir + treeFilepath.getOriginalFilename(),
                inferenceType.equalsIgnoreCase("joint"), true);
        asr.saveTree(sessionDir + label + "recon.nwk");
    }
}
