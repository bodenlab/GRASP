package com.asr.grasp.controller;

import api.PartialOrderGraph;
import com.asr.grasp.model.InferenceModel;
import com.asr.grasp.model.SeqModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ConsensusObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.utils.Defines;
import dat.POGraph;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import json.JSONArray;
import json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reconstruction.ASRPOG;
import vis.POAGJson;


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
    private InferenceModel infModel;

    @Autowired
    private SeqModel seqModel;


    private String logFileName;


    @Autowired
    private  ConsensusController consensusController;

    /**
     * Helper function that prints the memory usage to a file
     */
    private long[] printStats(FileWriter fr, String label, double time, long prevTotal, long prevFree) {
        Runtime rt = Runtime.getRuntime();
        long total = rt.totalMemory();
        long free = rt.freeMemory();
        long used = total - free;
        if (prevTotal != 0) {
            try {
                fr.write(label + ",consensus," + time +
                        "," + total +
                        "," + used +
                        "," + free + "\n");
                System.out.println(label + " saved");
            } catch (Exception e) {
                System.out.println(label + "," + time +
                        "," + total +
                        "," + used +
                        "," + free + "\n");
            }
        }
        long[] vals = {total, free};
        return vals;
    }

    /**
     * Helper function to allow us to insert an updated inference into the database.
     * @param reconId
     * @param label
     * @param ancsStr
     */
    public void updateDBInference(int reconId, String label, String ancsStr) {
        boolean updated = infModel.updateInference(reconId, label, ancsStr);
        // Check whether this was updated sucessfully.
    }


    /**
     * Update the sequence in the database.
     *
     * @param reconId
     * @param label
     * @param seq
     * @param gappy
     */
    public void updateDBSequence(int reconId, String label, String seq, boolean gappy) {
        boolean updated = seqModel.updateConsensusSeq(reconId, label, seq, gappy, Defines.JOINT);
        // Do something here and choose whether this has been updated correctly.
    }

    /**
     * Inserts all the joint reconstructions into the database.
     * Returns the list of insterted node labels.
     * ToDo: Do we want to auto delete any they don't want? Currently keeping all.
     *
     * @param reconId
     * @param asrInstance
     * @return
     */
    public List<String> insertSpecificJointsToDB(int reconId, ASRPOG asrInstance, boolean gappy, ArrayList<String> toSave, int userId) {
        List<String> insertedLabels = new ArrayList<>();

        for (String label: toSave) {
            System.out.println("Running " + label);
            PartialOrderGraph ancestor = asrInstance.getGraph(label);
            // Insert it into the database
            // What we want to do here is perform two inserts -> one for the sequence so we can do
            // motif searching
            POAGJson ancsJson = new POAGJson(ancestor, gappy);
            String ancsStr = ancsJson.toJSON().toString();

            boolean inserted = infModel.insertIntoDb(reconId, label, ancsStr);
            if (!inserted) {
                return null;
            }
            ConsensusObject c = new ConsensusObject(new JSONObject(ancsStr));
            HashMap<Integer, Double> weightmap = consensusController.getEdgeCountDict(reconId, userId, label, c.getPossibleInitialIds(), c.getPossibleFinalIds(), c.getInitialAndFinalNodeMap());
            c.setParams(weightmap, consensusController.getNumberSeqsUnderParent(), consensusController.getBestInitialNodeId(), consensusController.getBestFinalNodeId());
            // HERE WE NEED TO UPDATE TH UID THIS SHOULDN"T BE USED ATM
            // ToDo: Here is where we can alter the consensus sequence.

            String supportedSeq = c.getSupportedSequence(true);
            System.out.println(supportedSeq);

            String infUpdated = c.getAsJson().toString();
            updateDBInference(reconId, label, infUpdated);
            // Also want to update the Joint sequence
            inserted = seqModel.insertIntoDb(reconId, label, supportedSeq, Defines.JOINT,
                            gappy);
        }
        System.out.println("\n Finished Inserting Joint recons.");
        return insertedLabels;
    }

    /**
     * Inserts all the joint reconstructions into the database.
     * Returns the list of insterted node labels.
     * ToDo: Do we want to auto delete any they don't want? Currently keeping all.
     *
     * @param reconId
     * @param asrInstance
     * @return
     */
    public List<String> insertAllJointsToDb (int reconId, ASRPOG asrInstance, boolean gappy, int userId) {
        List<String> insertedLabels = new ArrayList<>();
        List<String> labels = asrInstance.getAncestralSeqLabels();
        for (String label: labels) {
            System.out.println("Running " +  label );
            PartialOrderGraph ancestor = asrInstance.getGraph(label);
            // Insert it into the database
            // What we want to do here is perform two inserts -> one for the sequence so we can do
            // motif searching
            POAGJson ancsJson = new POAGJson(ancestor, gappy);
            String ancsStr = ancsJson.toJSON().toString();

            // ToDo: remove once the speedy method has been implemented
            boolean inserted = updateForNewConsensusTmp(ancsStr, reconId, userId, label, gappy);

            if (!inserted) {
                return null;
            }
             /*
                 Old METHOD: UNCOMMENT ONCE UPDATED:

                boolean inserted = infModel.insertIntoDb(reconId, label, ancsStr);
                if (! inserted) {
                    return null;
                }
                inserted = seqModel.insertIntoDb(reconId, label, ancsJson.getConsensusSeq(), Defines.JOINT, gappy);
            */
        }
        System.out.println("\n Finished Inserting Joint recons.");
        return insertedLabels;
    }


    /**
     * A temporary method to allow us to use an alternate consensus method generation technique.
     * @param reconstructedAnsc
     * @param reconId
     * @param uid
     * @param nodeName
     * @param gappy
     */
    public boolean updateForNewConsensusTmp(String reconstructedAnsc, int reconId, int uid, String nodeName, boolean gappy) {
        ConsensusObject c = new ConsensusObject(new JSONObject(reconstructedAnsc));
        HashMap<Integer, Double> weightmap = consensusController.getEdgeCountDict(reconId, uid, nodeName, c.getPossibleInitialIds(), c.getPossibleFinalIds(), c.getInitialAndFinalNodeMap());
        c.setParams(weightmap, consensusController.getNumberSeqsUnderParent(), consensusController.getBestInitialNodeId(), consensusController.getBestFinalNodeId());

        System.out.println("LOOKING AT: " + nodeName);
        String supportedSeq = c.getSupportedSequence(true);
        System.out.println(supportedSeq);

        String infUpdated = c.getAsJson().toString();
        boolean inserted = infModel.insertIntoDb(reconId, nodeName, infUpdated);
        if (!inserted) {
            return false;
        }
        // Also want to update the Joint sequence
        inserted = seqModel.insertIntoDb(reconId, nodeName, supportedSeq, Defines.JOINT, gappy);
        return inserted;
    }


    /**
     * Insert a single joint instance into the database.
     *
     * @param reconId
     * @param label
     * @param asrInstance
     * @return
     */
    public String insertJointToDb(int reconId, String label, ASRPOG asrInstance, boolean gappy) {
        List<String> labels = asrInstance.getAncestralSeqLabels();
        POGraph ancestor = asrInstance.getAncestor(label);
        // Insert it into the database
        String insertedAncs = ancestor.getSupportedSequence(gappy);
        boolean inserted = seqModel.insertIntoDb(reconId, label, insertedAncs, Defines.JOINT, gappy);
        if (inserted) {
            return insertedAncs;
        }
        return null;
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
    public String insertAllExtantsToDb (int reconId, HashMap<String, String> extantSeqs, boolean gappy) {
        if (! seqModel.insertListIntoDb(reconId, extantSeqs, gappy)) {
            return "unable to insert all extents.";
        }
        return null;
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
     *
     * @return
     */
    public HashMap<String, ArrayList<String>> getSeqLabelAsNamedMap(int reconId) {
        ArrayList<String> seqLabels = getAllSeqLabels(reconId, Defines.EXTANT);
        HashMap<String, ArrayList<String>> extentNames = new HashMap<>();
        ArrayList<String> extentNamesUniprot = new ArrayList<>();
        ArrayList<String> extentNamesNcbi = new ArrayList<>();

        for (String name : seqLabels) {
            // Uniprot names can be identified by the | character in position 2. https://www.uniprot.org/help/fasta-headers
            if (name.substring(2, 3).equals("|")) {
                String[] id = name.split("\\|");
                String idN = id[1];
                extentNamesUniprot.add(idN);
            } else {
                // Otherwise assume it is a NCBI id TODO: Have a check that it is NCBI format
                String[] id = name.split("\\.");
                String idN = id[0];
                // Add it to both uniprot and ncbi
                // extentNamesUniprot.add(idN);
                extentNamesNcbi.add(idN);
            }
        }
        extentNames.put(Defines.UNIPROT, extentNamesUniprot);
        extentNames.put(Defines.NCBI, extentNamesNcbi);
        return extentNames;
    }

    /**
     * Gets a sequence by it's label.
     *
     * @param label
     * @param reconId
     * @param reconMethod
     * @return
     */
    public String getSeqByLabel(String label, int reconId, int reconMethod) {
        return seqModel.getSeqByLabel(label, reconId, reconMethod);
    }

    /**
     * Saves an ancestor node to a file.
     * @param fileWriter
     * @param label
     * @param reconId
     * @param reconMethod
     * @throws IOException
     */
    public void saveAncestorToFile(BufferedWriter fileWriter, String label, int reconId, int reconMethod, String extraLabelInfo) throws IOException {

        String seq = seqModel.getSeqByLabel(label, reconId, reconMethod);
        if (seq != null) {
            fileWriter.write(">" + label + extraLabelInfo);
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
     */
    public String getInfAsJson(int reconId, String label) {
        return infModel.getInferenceForLabel(reconId, label);
    }

    /**
     * Here we also want to use the inference to determine which is the number of sequences that
     * flow through that particular position.
     */
    public void updateConsusensForNodes(ReconstructionObject recon, ArrayList<String> labels, ASRObject asrInstance) {
        JSONObject inferences = new JSONObject();
        inferences.put("meta", new JSONObject().put("type", true));
        JSONArray nodes = new JSONArray();
        nodes.put(0, "meta");
        for (String label: labels) {
            String jsonArr = infModel.getInferenceForLabel(recon.getId(), label);
            nodes.put(new JSONObject(jsonArr));
        }
        asrInstance.loadSequences(recon.getSequences());
        inferences.put("inferences", nodes);
       	ASRPOG asr = new ASRPOG(asrInstance.getModel(), asrInstance.getNumberThreads(), inferences, asrInstance.getSeqsAsEnum(), asrInstance.getTree());
        insertSpecificJointsToDB(recon.getId(), asr, true, labels, 000000);

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
                    seqJSON.put(position);
                }
            }
            return seqJSON;
        }
        return null;
    }

    private int getHammingDistance(String seq1, String seq2) {
        if (seq1.length() != seq2.length())
            return -1;

        int counter = 0;
        for (int i = 0; i < seq1.length(); i++) {
            if (seq1.charAt(i) != seq2.charAt(i)) {
                counter++;
            }
        }
        return counter;
    }

    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setSeqModel(SeqModel seqModel) {
        this.seqModel = seqModel;
    }

    public void setInfModel(InferenceModel infModel) {
        this.infModel = infModel;
    }

    public void setConsensusController(ConsensusController consensusController) {
        this.consensusController = consensusController;
    }
}
