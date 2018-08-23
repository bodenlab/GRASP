package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.GeneralObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;

@Service
public class UserController {

    // Means we only instanciate this once
    @Autowired
    UsersModel usersModel;

    @Autowired
    ReconstructionsModel reconModel;


    /**
     * Checks if we can Login the current user.
     *
     * @param user
     * @return String if error with the error message otherwise returns a
     * null value.
     */
    public String loginUser(UserObject user) {
        String err = usersModel.loginUser(user.getUsername(), user.getPassword());
        // We want to set the users password (and password Match to be null
        user.setPassword(null);
        user.setPasswordMatch(null);

        return err;
    }

    /**
     * Get the ID. If the ID hasn't been set yet we need to set it based on
     * the username.
     *
     * @return
     */
    public int getId(UserObject user) {
        if (user.getId() == Defines.FALSE) {
            if (user.getUsername() != null) {
                // Set the user ID
                user.setId(usersModel.getUserId(user.getUsername()));
                return user.getId();
            }
            return Defines.FALSE;
        }
        return user.getId();
    }

    /**
     * Registers the user.
     */
    public String register(UserObject user) {
        // Register the user
        String err = usersModel.registerUser(user.getUsername(), user.getPassword());
        // We remove the password
        user.setPassword(null);
        user.setPasswordMatch(null);

        if (err != null) {
            return err;
        }
        // Otherwise we want to update the users ID.
        user.setId(usersModel.getUserId(user.getUsername()));

        return null;
    }


    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public ArrayList<GeneralObject> getOwnerAccessReconIds(UserObject user) {
        // check if we have already gotten the reconstructions
        if (user.getOwnerAccessReconIds() != null && user
                .getOwnerAccessReconIds().size() > 1) {
            return user.getOwnerAccessReconIds();
        }
        // Set all the reconstruction Ids for this user.
        setAllReconIds(user);
        return user.getOwnerAccessReconIds();
    }

    /**
     * If we don't already have the reconstructions in memory, we need to get
     * them from the model.
     *
     * @return
     */
    public ArrayList<GeneralObject> getMemberAccessReconIds(UserObject user) {
        // check if we have already gotten the reconstructionsMember
        if (user.getMemberAccessReconIds() != null && user
                .getMemberAccessReconIds().size() > 1) {
            return user.getMemberAccessReconIds();
        }
        // Otherwise we need to set the reconstruction IDs for this user
        setAllReconIds(user);
        return user.getMemberAccessReconIds();
    }


    /**
     * Sets the reconstruction ID's. These are separated by access levels.
     */
    private void setAllReconIds(UserObject user) {
        HashMap<Integer, ArrayList<GeneralObject>> allRecons = reconModel
                .getReconsForUser
                        (user.getId());
        // Set the users reconstrcutions there they will be divided by access
        user.setAllReconIds(allRecons);
    }

    /**
     * Gets the currect reconstruction if the user is working on one.
     */
    public void setCurrRecon(ReconstructionObject recon, UserObject user) {
        user.setCurrRecon(recon);
    }
}
