package com.asr.grasp.controller;

import com.asr.grasp.controller.User;
import com.asr.grasp.model.Reconstructions;
import com.asr.grasp.model.Users;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jca.cci.RecordTypeNotSupportedException;

import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.util.*;

public class Reconstruction {

    @Autowired // Means we only instanciate this once
    Users users;

    @Autowired
    Reconstructions reconstructions;

    private int id;

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

    public void setId(int id) {
        this.id = id;
    }

    public int getOwnerId() {return this.ownerId; }

    public void setOwnerId(int ownerId) { this.ownerId = ownerId; }

    public void setLabel(String label) {

        this.label = label;
    }

    public String getLabel() {

        return this.label;
    }

    public void setTree(String tree) {

        this.tree = tree;
    }

    public String getSequences() {

        return this.sequences;
    }

    public void setSequences(String sequences) {

        this.sequences = sequences;
    }

    public String getTree() {

        return this.tree;
    }

    public void setJointInferences(String inferences) {

        this.jointInferences = inferences;
    }

    public String getJointInferences() {

        return this.jointInferences;
    }

    public void setReconTree(String tree) {

        this.reconTree = tree;
    }

    public String getReconTree() {

        return this.reconTree;
    }

    public void setModel(String model) {

        this.model = model;
    }

    public String getModel() {

        return this.model;
    }

    public void setNumThreads(int numThreads) {

        this.numThreads = numThreads;
    }

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

    public void setInferenceType(String inferenceType) {

        this.inferenceType = inferenceType;
    }

    public String getInferenceType() {

        return this.inferenceType;
    }

    public void setNode(String node) {

        this.node = node;
    }

    public String getNode() { return this.node;}

    public String getUpdatedAt() {
        return this.updated_at;
    }

    /**
     * Save a users reconstruction to the database.
     *
     * We do a couple of checks here. We check if the reconstruction has an
     * Id. If it does we know that it is either:
     *      1. an example dataset (we don't want to save any of the default
     *      recons).
     *      2. they already have the dataset or access to this dataset - a
     *      user can't re-save a dataset (this could compromise data security).
     * @param reconstruction
     */
    public String save(Reconstruction reconstruction, User user) {

        // If the user has just created this reconstruction then the ID of
        // the reconstruction will be null
        if (reconstruction.getId() != Defines.FALSE) {
            // Try to save the reconstruction, it can potentially return an
            // error e.g. if the label already exists.
            String err = reconstructions.save(reconstruction);
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
    public String shareWithUser(Reconstruction reconstruction,
                                              String username, User
                                                      loggedInUser) {
        // Check this user has owner access to this reconsturction
        if (reconstruction.getOwnerId() != loggedInUser.getId() &&
                reconstruction.getOwnerId() != Defines.UNINIT) {
            return "recon.share.notowner";
        }

        // Get the userId of the user we want to save that reconstruction with
        int userId = users.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if the user already has access
        if (reconstructions.getUsersAccess(reconstruction
                .getId(), userId) != Defines.NO_ACCESS) {
            return "recon.share.exists";
        }
        // Share the reconstruction with the user
        return reconstructions.shareWithUser(reconstruction.id, userId);
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
    public String removeUsersAccess(int reconId, String username, User
                                          loggedInUser) {
        // Get the userId of the user we want to save that reconstruction with
        int userId = users.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        Reconstruction currRecon = loggedInUser.getcurrRecon();
        if (currRecon != null) {
            if (reconId == currRecon.getId()) {
                if (loggedInUser.getId() == currRecon.getOwnerId() &&
                        loggedInUser.getId() != Defines.UNINIT) {
                    return reconstructions.removeUsersAccess(reconId,
                            userId);
                }
                return "recon.share.notowner";
            }
        }
        // Otherwise we need to check if this user has owner access to be
        // able to delete it
        int access = reconstructions.getUsersAccess(reconId, userId);
        if (access == Defines.OWNER_ACCESS) {
            return reconstructions.removeUsersAccess(reconId,
                    userId);
        }
        return "recon.share.notowner";
    }

    /**
     * Deletes a reconstruction and all its data from the database.
     *
     * @param reconstruction
     */
    public String delete(int reconId, User loggedInUser) {
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        Reconstruction currRecon = loggedInUser.getcurrRecon();
        int userId = loggedInUser.getId();
        if (currRecon != null) {
            if (reconId == currRecon.getId()) {
                if (userId == currRecon.getOwnerId() &&
                        userId != Defines.UNINIT) {
                    return reconstructions.delete(reconId);
                }
                return "recon.share.notowner";
            }
        }
        // Otherwise we need to check if this user has owner access to be
        // able to delete it
        int access = reconstructions.getUsersAccess(reconId, userId);
        if (access == Defines.OWNER_ACCESS) {
            return reconstructions.delete(reconId);
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
        ArrayList<Integer> recons = reconstructions.findByDateOlder
                (threshold);
        // Delete all the reconstructions
        return reconstructions.deleteByIdList(recons);
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
