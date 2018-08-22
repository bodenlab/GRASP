package com.asr.grasp.objects;

import com.asr.grasp.utils.Defines;

import java.util.HashMap;
import java.util.HashSet;

public class User {
    private int id = Defines.FALSE; // Ensure we don't use an uninitialised
    // variable.

    private String username;

    private String password;

    private String email;

    private String confirmationToken;

    private String passwordMatch;

    private HashSet<Integer> ownerAccessReconIds; // was created by this user.

    private HashSet<Integer> memberAccessReconIds; // Didn't create the
    // reconstruction

    private Reconstruction currRecon; // Store only the users current
    // reconstruction.

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
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public HashSet<Integer> getOwnerAccessReconIds() {
        return this.ownerAccessReconIds;
    }

    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public HashSet<Integer> getMemberAccessReconIds() {
        return this.memberAccessReconIds;
    }


    /**
     * Sets the reconstruction ID's. These are separated by access levels.
     */
    public void setAllReconIds(HashMap<Integer, HashSet<Integer>> allRecons) {
        this.ownerAccessReconIds = allRecons.get(Defines.OWNER_ACCESS);
        this.memberAccessReconIds = allRecons.get(Defines.MEMBER_ACCESS);
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
    public void addToOwnerdReconIds(int reconId) {
        this.ownerAccessReconIds.add(reconId);
    }

    /**
     * Gets the currect reconstruction if the user is working on one.
     */
    public Reconstruction getCurrRecon() {
        return this.currRecon;
    }

    /**
     * Sets the currect reconstruction if the user is working on one.
     */
    public void setCurrRecon(Reconstruction reconstruction) {
        this.currRecon = reconstruction;
    }
}
