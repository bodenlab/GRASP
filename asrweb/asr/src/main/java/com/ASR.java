package com;

import api.PartialOrderGraph;
import reconstruction.ASRPOG;

import javax.validation.constraints.NotNull;

/**
 * Created by marnie on 11/4/17.
 */
public class ASR {
    private ASRPOG asr;

    @NotNull
    private String label;

    @NotNull
    private String alnFilepath;

    @NotNull
    private String treeFilepath;

    private PartialOrderGraph graph;

    public ASR() {
        this.graph = new PartialOrderGraph("/Users/marnie/Documents/Repositories/Development/bnkit/bnkit/src/test/resources/testPOGraphMed.dot");
    }

    public String getLabel() {
        return this.label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getAlnFilepath() {
        return this.alnFilepath;
    }

    public void setAlnFilepath(String alnFilepath) {
        this.alnFilepath = alnFilepath;
    }

    public String getTreeFilepath() {
        return this.treeFilepath;
    }

    public void setTreeFilepath(String treeFilepath) {
        this.treeFilepath = treeFilepath;
    }
}
