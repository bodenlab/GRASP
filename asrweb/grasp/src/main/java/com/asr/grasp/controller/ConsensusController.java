package com.asr.grasp.controller;

import com.asr.grasp.model.ConsensusModel;
import com.asr.grasp.utils.Defines;
import dat.POGraph;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import reconstruction.ASRPOG;

/**
 * Class that keeps track of the consensus sequences stored in the database.
 * Currently all joint reconstructions are saved.
 * ToDo: Save marginal reconstructions
 * Note: All the queries here use the assumption that the reconstruction ID has been checked
 * for authenticity & security (i.e. user access) previously to this class.
 * --> Done using ReconController in GraspApplication.
 *
 *
 * Created by ariane on 14/10/18.
 */
public class ConsensusController {

    @Autowired
    private ConsensusModel consensusModel;

    /**
     * Inserts all the joint reconstructions into the database.
     * Returns the list of insterted node labels.
     * ToDo: Do we want to auto delete any they don't want? Currently keeping all.
     *
     * @param reconId
     * @param asrInstance
     * @return
     */
    public List<String> insertAllJointsToDb (int reconId, ASRPOG asrInstance) {
        List<String> labels = asrInstance.getAncestralSeqLabels();
        List<String> insertedLabels = new ArrayList<>();
        for (String label: labels) {
            POGraph ancestor = asrInstance.getAncestor(label);
            System.out.println("LABEL: " + label + " ");
            // Insert it into the database
            boolean inserted = consensusModel.insertIntoDb(reconId, label, ancestor.getSupportedSequence(true), Defines.JOINT);
            if (inserted) {
                insertedLabels.add(label);
            }
        }
        return insertedLabels;
    }

    /**
     * Deletes all from a database that are for a particular reconstruction.
     * @param reconId
     * @return
     */
    public String deleteAllSeqsForRecon (int reconId) {
        return consensusModel.deleteFromDb(reconId);
    }


    /**
     * Returns all the nodeLabels that have a consensus sequence that match a particular motif.
     *
     * @param reconId
     * @param motif
     * @return
     */
    public ArrayList<String> findAllWithMotif (int reconId, String motif) {
        return consensusModel.findNodesWithMotif(reconId, motif);
    }

    /**
     * Gets all the consensus sequences for a given reconstruction.
     * @param reconId
     * @param method
     * @return
     */
    public HashMap<String, String> getAllConsensus (int reconId, int method) {
        return consensusModel.getAllConsensus(reconId, method);
    }


    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setConsensusModel(ConsensusModel consensusModel) {
        this.consensusModel = consensusModel;
    }

}
