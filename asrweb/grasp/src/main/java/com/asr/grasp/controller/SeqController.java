package com.asr.grasp.controller;

import com.asr.grasp.model.SeqModel;
import com.asr.grasp.utils.Defines;
import dat.POGraph;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import json.JSONArray;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
@Service
public class SeqController {

    @Autowired
    private SeqModel seqModel;

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
            // Insert it into the database
            boolean inserted = seqModel
                    .insertIntoDb(reconId, label, ancestor.getSupportedSequence(true), Defines.JOINT);
            if (inserted) {
                insertedLabels.add(label);
            }
        }
        return insertedLabels;
    }

    /**
     * Inserts all the extent sequences into the DB as well.
     * Returns the list of insterted node labels.
     * ToDo: Do we want to auto delete any they don't want? Currently keeping all.
     *
     * @param reconId
     * @param extantSeqs
     * @return
     */
    public List<String> insertAllExtantsToDb (int reconId, HashMap<String, String> extantSeqs) {
        List<String> insertedLabels = new ArrayList<>();
        for (String label: extantSeqs.keySet()) {
            // Insert it into the database
            boolean inserted = seqModel.insertIntoDb(reconId, label, extantSeqs.get(label), Defines.EXTANT);
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
        return seqModel.deleteFromDb(reconId);
    }


    /**
     * Returns all the nodeLabels that have a consensus sequence that match a particular motif.
     *
     * @param reconId
     * @param motif
     * @return
     */
    public ArrayList<String> findAllWithMotif (int reconId, String motif) {
        return seqModel.findNodesWithMotif(reconId, motif);
    }

    /**
     * Returns the nodes with motifs in JSON format so that these can be updated on the front end.
     * @param reconId
     * @param motif
     * @return
     */
    public JSONArray findAllWithMotifJSON (int userAccess, int reconId, String motif) {
        if (userAccess == Defines.NO_ACCESS) {
            return new JSONArray().put("NO ACCESS");
        }
        ArrayList<String> ancestorLabelsWithMotif = findAllWithMotif(reconId, motif);
        JSONArray ancestorLabelsWithMotifJSON = new JSONArray();
        for (String label: ancestorLabelsWithMotif) {
            ancestorLabelsWithMotifJSON.put(label);
        }
        return ancestorLabelsWithMotifJSON;
    }

    /**
     * Gets all the sequences for a given reconstruction.
     * @param reconId
     * @param method
     * @return
     */
    public HashMap<String, String> getAllSeqs (int reconId, int method) {
        return seqModel.getAllSeqs(reconId, method);
    }


    /**
     * Returns whether a user has saved the reconstruction in the new format or not.
     *
     * @param reconId
     * @return
     */
    public boolean hasReconsAncestorsBeenSaved (int reconId) {
        return seqModel.hasReconsAncestorsBeenSaved(reconId);
    }

    /**
     * Gets all the labels so they can be displayed for download.
     * @param reconId
     * @param method
     * @return
     */
    public ArrayList<String> getAllSeqLabels(int reconId, int method) {
       return seqModel.getAllSeqLabels(reconId, method);
    }

    /**
     * Saves an ancestor node to a file.
     * @param fileWriter
     * @param label
     * @param reconId
     * @param reconMethod
     * @throws IOException
     */
    public void saveAncestorToFile(BufferedWriter fileWriter, String label, int reconId, int reconMethod) throws IOException {

        String seq = seqModel.getSeqByLabel(label, reconId, reconMethod);
        if (seq != null) {
            fileWriter.write(">" + label);
            fileWriter.newLine();
            fileWriter.write(seq);
            fileWriter.newLine();
        }
    }


    /**
     * Gets a sequence and returns a JSON formatted version. This enables us to use it on
     * the front end.
     *
     * @param reconId
     * @param label
     * @param reconMethod
     */
    public JSONArray getSeqAsJson(int reconId, String label, int reconMethod) {
        String seq = seqModel.getSeqByLabel(label, reconId, reconMethod);
        if (seq != null) {
            JSONArray seqJSON = new JSONArray();
            for (int x = 0; x < seq.length(); x ++) {
                JSONArray position = new JSONArray();
                if (seq.charAt(x) != '-') {
                    position.put(Defines.G_LABEL, seq.charAt(x));
                    position.put(Defines.G_X, x);
                    position.put(Defines.G_ID, x);
                    position.put(Defines.G_CONSENSUS, true);
                }
            }
            return seqJSON;
        }
        return null;
    }
    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setSeqModel(SeqModel seqModel) {
        this.seqModel = seqModel;
    }

}
