package com.asr.grasp.controller;

import com.asr.grasp.controller.Reconstruction;
import com.asr.grasp.model.Reconstructions;
import com.asr.grasp.model.Users;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;

import javax.persistence.*;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

public class User {

    @Autowired // Means we only instanciate this once
    Users users;

    @Autowired
    Reconstructions reconstructions;

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


    /**
     * Get the ID. If the ID hasn't been set yet we need to set it based on
     * the username.
     *
     * @return
     */
    public int getId() {
        if (id == Defines.FALSE) {
            if (username != null) {
                // Set the user ID
                setId(users.getUserId(username));
                return this.id;
            }
            return Defines.FALSE;
        }
        return id;
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
     * Gets the users password from the database
     * @return hashed password
     */
    public String getPassword() {
        return this.password;
    }

    /**
     * Sets a users password in the database.
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
     * @param email
     */
    public String getEmail() {
        return this.email;
    }

    /**
     * ToDo: Implement this.
     * @param confirmationToken
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
     * them from the database.
     *
     * @return
     */
    public HashSet<Integer> getOwnerAccessReconIds() {
        // check if we have already gotten the reconstructions
        if (this.ownerAccessReconIds != null) {
            return this.ownerAccessReconIds;
        }
        setAllReconIds();
        return this.ownerAccessReconIds;
    }

    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the database.
     *
     * @return
     */
    public HashSet<Integer> getMemberAccessReconIds() {
        // check if we have already gotten the reconstructionsMember
        if (this.memberAccessReconIds != null) {
            return this.memberAccessReconIds;
        }
        setAllReconIds();
        return this.memberAccessReconIds;
    }


    /**
     * Sets the reconstruction ID's. These are separated by access levels.
     */
    private void setAllReconIds() {
        HashMap<Integer, HashSet<Integer>> allRecons = reconstructions
                .getIdsForUser
                        (this.id);
        // Separate out the user access reconstructions and the ownerAccess
        // ones.
        this.ownerAccessReconIds = allRecons.get(Defines.OWNER_ACCESS);
        this.memberAccessReconIds = allRecons.get(Defines.MEMBER_ACCESS);
    }

    /**
    /**
     * Adds the current reconstruction to the Users List
     * @param reconId
     */
    public void addToOwnerdReconIds(int reconId) {
        if (this.ownerAccessReconIds == null) {
            setAllReconIds();
        }
        this.ownerAccessReconIds.add(reconId);
    }

    /**
     * Gets the currect reconstruction if the user is working on one.
     */
    public Reconstruction getCurrRecon() {
        return this.currRecon;
    }
}
