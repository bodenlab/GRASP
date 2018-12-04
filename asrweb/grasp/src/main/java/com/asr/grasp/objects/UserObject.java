package com.asr.grasp.objects;

import com.asr.grasp.utils.Defines;

import java.util.ArrayList;
import java.util.HashMap;

/**
 * The user object is used to pass information between the front end interface and
 * the Java code. This enables us to save and register new users.
 *
 * Created by marnie on 11/04/17.
 */
public class UserObject {
    private int id = Defines.UNINIT; // Ensure we don't use an uninitialised
    // variable.

    private String username;

    private String password;

    private String email;

    private String confirmationToken;

    private String passwordMatch;

    private ArrayList<GeneralObject> ownerAccessReconIds = new ArrayList<>(); // was created by this user.

    private ArrayList<GeneralObject> memberAccessReconIds = new ArrayList<>(); // Didn't create the reconstruction

    private ArrayList<GeneralObject> runningRecons = new ArrayList<>(); // Currently running reconstructions

    private ReconstructionObject currRecon; // Store only the users current reconstruction.

    public int getId() {
        return this.id;
    }

    public void setId(int id) {
        this.id = id;
    }

    /**
     * Gets the username of the user.
     * @return username
     */
    public String getUsername() {
        return username;
    }

    /**
     * Sets the username. This is must be unique.
     * @param username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * Gets the users password from the model
     * @return hashed password
     */
    public String getPassword() {
        return this.password;
    }

    /**
     * Sets a users password in the model.
     * The password has already been hashed.
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * Sets the secondary password. This is only used in the registration of
     * a new user. Once it has been validated that the two passwords are the
     * same this is no longer stored.
     * @param password
     */
    public void setPasswordMatch(String password) {
        this.passwordMatch = password;
    }

    /**
     * ToDo: Check that the email is correctly formatted.
     * @param email
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * ToDo: Implement this.
     * @param confirmationToken
     */
    public void setConfirmationToken(String confirmationToken) {
        this.confirmationToken = confirmationToken;
    }

    /**
     *
     * @param
     */
    public String getEmail() {
        return this.email;
    }

    /**
     * ToDo: Implement this.
     * @param
     */
    public String getConfirmationToken() {
        return this.confirmationToken;
    }

    /**
     * Gets the temporary password match. This is taken from the users form.
     * @return hashed password
     */
    public String getPasswordMatch() {
        return this.passwordMatch;
    }

    /**
     * Gets a list of the users currently running reconstructions.
     *
     * ToDo: Update the above to have a progress of each reconstruction.
     * @return
     */
    public ArrayList<GeneralObject> getRunningRecons() {
        if (runningRecons != null) {
            return runningRecons;
        }
        // Otherwise return an empty list
        return new ArrayList<>();
    }

    public void addToRunningRecons(ReconstructionObject recon) {
        // Check if the currently running reonstructions has been initialised yet
        if (runningRecons == null) {
            runningRecons = new ArrayList<>();
        }
        GeneralObject reconForUser = new GeneralObject(Defines.UNINIT, recon.getLabel(), "", "");
        // Check if this reconstruction has an error
        if (recon.getError() != null) {
            reconForUser.setError(recon.getError());
        }

        runningRecons.add(reconForUser);
    }



    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public ArrayList<GeneralObject> getOwnerAccessReconIds() {
        return this.ownerAccessReconIds;
    }

    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public ArrayList<GeneralObject> getMemberAccessReconIds() {
        return this.memberAccessReconIds;
    }


    /**
     * Sets the reconstruction ID's. These are separated by access levels.
     */
    public void setAllReconIds(HashMap<Integer, ArrayList<GeneralObject>>
                                       allRecons) {
        if (allRecons == null) {
            this.ownerAccessReconIds = new ArrayList<>();
            this.memberAccessReconIds = new ArrayList<>();
        } else {
            this.ownerAccessReconIds = allRecons.get(Defines.OWNER_ACCESS);
            this.memberAccessReconIds = allRecons.get(Defines.MEMBER_ACCESS);
        }
    }

    /**
     /**
     * Adds the current reconstruction to the Users List.
     *
     * This is done when the user chooses to save the reconstruction. Called
     * from the ReconstructionController.
     *
     * @param reconId
     */
    public void addToOwnerdReconIds(int reconId, String reconLabel, String size,
     String updatedAt) {
        this.ownerAccessReconIds.add(new GeneralObject(reconId, reconLabel,
                size, updatedAt));
    }

    /**
     * Gets the currect reconstruction if the user is working on one.
     */
    public ReconstructionObject getCurrRecon() {
        return this.currRecon;
    }

    /**
     * Sets the currect reconstruction if the user is working on one.
     */
    public void setCurrRecon(ReconstructionObject reconstruction) {
        this.currRecon = reconstruction;
    }
}
