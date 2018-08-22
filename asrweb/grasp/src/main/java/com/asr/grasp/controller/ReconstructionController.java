package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.ShareUsersModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.Reconstruction;
import com.asr.grasp.objects.User;
import com.asr.grasp.utils.Defines;
import json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.context.annotation.SessionScope;
import com.asr.grasp.ASR;

import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.util.*;
import java.util.zip.DeflaterOutputStream;

@Service
public class ReconstructionController {

    /**
     * The reconstruction controller controls the users actions with the
     * reconstruction.
     *
     * Also it stores the current reconstruction fields.
     *
     * Only one reconstruction can be in memory at a time this will reduce
     * overheads.
     */

    // Means we only instanciate this once
    @Autowired
    UsersModel usersModel;

    @Autowired
    ReconstructionsModel reconModel;

    @Autowired
    ShareUsersModel shareUsersModel;


    public Reconstruction getById(int reconId, User user) {
        // Check we can get the reconsrtcution
        Reconstruction reconstruction = reconModel.getById(reconId, user
                .getId());
        // If we have an error return the error
        if (reconstruction != null) {
            return null;
        }
        return reconstruction;
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
     * @param user
     */
    public String save(User user, Reconstruction recon) {

        // If the user has just created this reconstruction then the ID of
        // the reconstruction will be null
        if (recon.getId() != Defines.FALSE) {
            // Try to save the reconstruction, it can potentially return an
            // error e.g. if the label already exists.
            String err = reconModel.save(recon);
            if (err != null) {
                user.addToOwnerdReconIds(recon.getId());
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
     * @param reconId
     * @param username
     * @return
     */
    public String shareWithUser(int reconId, String username, User
                                        loggedInUser) {

        // Check the logged in user is allowed to share this
        if (getUsersAccess(reconId, loggedInUser) != Defines
                .OWNER_ACCESS) {
            return "recon.share.notowner";
        }
        // Get the userId of the user we want to save that reconstruction with
        int userId = usersModel.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if the user already has access that we're trying to share with
        if (reconModel.getUsersAccess(reconId, userId) != Defines.NO_ACCESS) {
            return "recon.share.exists";
        }
        // Share the reconstruction with the user
        return shareUsersModel.shareWithUser(reconId, userId);
    }

    /**
     * Remove a users membership access to that reconstruction.
     *
     * Must be performed by the owner of the reconstruction.
     *
     * @param reconId
     * @param username
     * @param loggedInUser
     * @return
     */
    public String removeUsersAccess(int reconId, String username, User
            loggedInUser) {
        // Get the userId of the user we want to save that reconstruction with
        int userId = usersModel.getUserId(username);
        if (userId == Defines.FALSE) {
            return "user.username.nonexist";
        }
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        int access = getUsersAccess(reconId, loggedInUser);
        if (access == Defines.OWNER_ACCESS) {
            return shareUsersModel.removeUsersAccess(reconId,
                    userId);
        }
        return "recon.share.notowner";
    }

    private int getUsersAccess(int reconId, User user) {
        // Check if this is the currect reonstruction. If it is we can just
        // get the owner ID from currentRecon
        Reconstruction currRecon = user.getCurrRecon();
        int userId = user.getId();
        if (reconId == currRecon.getId() && reconId != Defines.UNINIT) {
             if (userId == currRecon.getOwnerId() &&
                 userId != Defines.UNINIT) {
                return Defines.OWNER_ACCESS;
             }
             return Defines.MEMBER_ACCESS;
        }
        // Otherwise we need to check if this user has owner access from the DB.
        return reconModel.getUsersAccess(reconId, userId);
    }
    /**
     * Deletes a reconstruction and all its data from the model.
     *
     * @param reconId
     */
    public String delete(int reconId, User loggedInUser) {
        // Otherwise we need to check if this user has owner access to be
        // able to delete it
        int access = getUsersAccess(reconId, loggedInUser);

        if (access == Defines.OWNER_ACCESS) {
            return reconModel.delete(reconId);
        }
        return "recon.delete.notowner";
    }

    /**
     * Find reconstructions that are older than a given number of days.
     * Threshold has been set to 30 days.
     */
    public String checkObsolete() {
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
     *//**/
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

    /**
     * Creates the reconstrcution object using the values returned from BNkit.
     * @param asrRecon
     * @return
     */
    public Reconstruction createFromASR(ASR asrRecon) {
        Reconstruction recon = new Reconstruction();
        recon.setLabel(asrRecon.getLabel());
        // Need to check if it is null otherwise will throw an error
        recon.setAncestor(asrRecon.getAncestor());
        recon.setInferenceType(asrRecon.getInferenceType());
        recon.setJointInferences(asrRecon.getJointInferences());
        recon.setModel(asrRecon.getModel());
        recon.setMsa(asrRecon.getMSA());
        recon.setNode(asrRecon.getNodeLabel());
        recon.setSequences(asrRecon.getSequences());
        recon.setNumThreads(asrRecon.getNumberThreads());
        recon.setTree(asrRecon.getTree());
        recon.setReconTree(asrRecon.getReconstructedNewickString());
        return recon;
    }
}
