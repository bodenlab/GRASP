package com.asr.grasp.service;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.ShareUsersModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.util.*;

public class ReconstructionService {

    // Means we only instanciate this once
    @Autowired
    UsersModel usersModel;

    @Autowired
    ReconstructionsModel reconModel;

    @Autowired
    ShareUsersModel shareUsersModel;

    private int id = Defines.UNINIT;

    private int ownerId = Defines.UNINIT;

    private String label;

    private String tree;

    private String reconTree;

    private int numThreads;

    private String msa;

    private String sequences;

    private String jointInferences;

    private String ancestor;

    private String inferenceType;

    private String model;

    private String node;

    private String updated_at;

    public int getId() {
        return this.id;
    }

    public void setId(int id) { this.id = id; }

    public int getOwnerId() {return this.ownerId; }

    public void setOwnerId(int ownerId) { this.ownerId = ownerId; }

    public void setLabel(String label) { this.label = label; }

    public String getLabel() { return this.label; }

    public void setTree(String tree) { this.tree = tree; }

    public String getSequences() { return this.sequences; }

    public void setSequences(String sequences) { this.sequences = sequences; }

    public String getTree() { return this.tree; }

    public String getJointInferences() { return this.jointInferences; }

    public void setReconTree(String tree) { this.reconTree = tree; }

    public String getReconTree() { return this.reconTree; }

    public void setModel(String model) { this.model = model; }

    public String getModel() { return this.model; }

    public void setNumThreads(int numThreads) { this.numThreads = numThreads; }

    public int getNumThreads() {
        return this.numThreads;
    }

    public void setMsa(String msa) {
        this.msa = msa;
    }

    public String getMsa() {
        return this.msa;
    }

    public void setAncestor(String ancestor) {
        this.ancestor = ancestor;
    }

    public String getAncestor() {
        return this.ancestor;
    }

    public void setNode(String node) { this.node = node; }

    public String getNode() { return this.node;}

    public String getUpdatedAt() { return this.updated_at; }

    public void setInferenceType(String inferenceType) {

        this.inferenceType = inferenceType;

    }

    public void setJointInferences(String inferences) {

        this.jointInferences = inferences;

    }

    public String getInferenceType() {

        return this.inferenceType;
    }

    /**
     * Save a users reconstruction to the model.
     *
     * We do a couple of checks here. We check if the reconstruction has an
     * Id. If it does we know that it is either:
     *      1. an example dataset (we don't want to save any of the default
     *      recons).
     *      2. they already have the dataset or access to this dataset - a
     *      user can't re-save a dataset (this could compromise data security).
     * @param reconstruction
     */
    public String save(ReconstructionService reconstruction, UserService user) {

        // If the user has just created this reconstruction then the ID of
        // the reconstruction will be null
        if (reconstruction.getId() != Defines.FALSE) {
            // Try to save the reconstruction, it can potentially return an
            // error e.g. if the label already exists.
            String err = reconModel.save(reconstruction);
            if (err != null) {
                user.addToOwnerdReconIds(reconstruction.getId());
            }
            return err;
        } else {
            return "recon.nosave.exists";
        }
    }

    /**
     * Share the reconstruction with a user by their username.
     *
     * Checks that the user who is sharing it has access.
     * @param reconstruction
     * @param username
     * @return
     */
    public String shareWithUser(ReconstructionService reconstruction,
                                String username, UserService
                                        loggedInUser) {
        // Check this user has owner access to this reconsturction
        if (reconstruction.getOwnerId() != loggedInUser.getId() &&
                reconstruction.getOwnerId() != Defines.UNINIT) {
            return "recon.share.notowner";
        }

        // Get the userId of the user we want to save that reconstruction with
        int userId = usersModel.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if the user already has access
        if (reconModel.getUsersAccess(reconstruction
                .getId(), userId) != Defines.NO_ACCESS) {
            return "recon.share.exists";
        }
        // Share the reconstruction with the user
        return shareUsersModel.shareWithUser(reconstruction.getId(), userId);
    }

    /**
     * Remove a users membership access to that reconstruction.
     *
     * Must be performed by the owner of the reconstruction.
     *
     * @param reconstruction
     * @param username
     * @param loggedInUser
     * @return
     */
    public String removeUsersAccess(int reconId, String username, UserService
            loggedInUser) {
        // Get the userId of the user we want to save that reconstruction with
        int userId = usersModel.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        ReconstructionService currRecon = loggedInUser.getCurrRecon();
        if (currRecon != null) {
            if (reconId == currRecon.getId()) {
                if (loggedInUser.getId() == currRecon.getOwnerId() &&
                        loggedInUser.getId() != Defines.UNINIT) {
                    return shareUsersModel.removeUsersAccess(reconId,
                            userId);
                }
                return "recon.share.notowner";
            }
        }
        // Otherwise we need to check if this user has owner access to be
        // able to delete it
        int access = reconModel.getUsersAccess(reconId, userId);
        if (access == Defines.OWNER_ACCESS) {
            return shareUsersModel.removeUsersAccess(reconId,
                    userId);
        }
        return "recon.share.notowner";
    }

    /**
     * Deletes a reconstruction and all its data from the model.
     *
     * @param reconstruction
     */
    public String delete(int reconId, UserService loggedInUser) {
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        ReconstructionService currRecon = loggedInUser.getCurrRecon();
        int userId = loggedInUser.getId();
        if (currRecon != null) {
            if (reconId == currRecon.getId()) {
                if (userId == currRecon.getOwnerId() &&
                        userId != Defines.UNINIT) {
                    return reconModel.delete(reconId);
                }
                return "recon.share.notowner";
            }
        }
        // Otherwise we need to check if this user has owner access to be
        // able to delete it
        int access = reconModel.getUsersAccess(reconId, userId);
        if (access == Defines.OWNER_ACCESS) {
            return reconModel.delete(reconId);
        }
        return "recon.share.notowner";
    }

    /**
     * Find reconstructions that are older than a given number of days.
     * Threshold has been set to 30 days.
     */
    public String checkObseleteReconstructions() {
        // find reconstructions older than the threshold and remove from repository
        Long threshold = subtractTimeFrame();
        ArrayList<Integer> recons = reconModel.findByDateOlder
                (threshold);
        // Delete all the reconstructions
        return reconModel.deleteByIdList(recons);
    }

    /**
     * Gets the datestamp a month ago.
     * @return
     */
    private Long subtractTimeFrame(){
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();
        if (month < Defines.NUM_MONTHS_OLD) {
            int years = (int)Math.ceil(Defines.NUM_MONTHS_OLD/12.0);
            year -= years;
            month = 12 - Math.abs(Defines.NUM_MONTHS_OLD - month);
        } else {
            month -= Defines.NUM_MONTHS_OLD;
        }
        LocalDate threshold = LocalDate.of(year, month, now.getDayOfMonth());
        Long time = threshold.getLong(ChronoField.YEAR)*1000 + threshold.getLong(ChronoField.DAY_OF_YEAR);

        return time;
    }
}
