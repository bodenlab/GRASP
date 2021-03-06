package com.asr.grasp.controller;

import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.EmailObject;
import com.asr.grasp.objects.GeneralObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.mail.internet.AddressException;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * Level of abstraction which is called from the main grasp app.
 *
 * This controls the high level interface to provide the user User functions such as logging in
 * and registering.
 *
 * ToDo: Add in update/reset password
 *
 * Created by ariane on 13/07/18.
 */
@Service
public class UserController {

    // Means we only instanciate this once
    @Autowired
    UsersModel usersModel;

    @Autowired
    ReconstructionsModel reconModel;

    @Autowired
    EmailController emailController;

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


        // Set the user's ID
        getId(user);
        if (user.getId() != Defines.UNINIT){
            // Set the user's email
            user.setEmail(getEmail(user));
        }
        return err;
    }

    /**
     * Allow the user to reset their password.
     * @param user
     * @return
     */
    public String setPassword(UserObject user) {
        if (!user.getPassword().equals(user.getPasswordMatch())) {
            return "user.password.diff";
        }
        if (user.getPassword().length() < 8 || user.getPassword().length() > 32) {
            return "user.password.size";
        }
        // Otherwise we set the userid
        getId(user);
        String err = usersModel.resetPassword(user.getId(), user.getPassword());
        user.setPasswordMatch(null);
        user.setPassword(null);
        user.setId(Defines.UNINIT);

        return err;
    }

    /**
     * Get the ID. If the ID hasn't been set yet we need to set it based on
     * the username.
     *
     * @return
     */
    public int getId(UserObject user) {
        if (user.getId() == Defines.UNINIT) {
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
     * generates a random confirmation token.
     * @return
     */
    public String getAConfirmationToken() {
        return usersModel.generateId().toString();
    }

    /**
     * Registers the user.
     */
    public String register(UserObject user, String confirmationToken) {
        user.setConfirmationToken(confirmationToken);

        // Register the user
        String err = usersModel.registerUser(user.getUsername(), user.getEmail(), user.getConfirmationToken());

        if (err != null) {
            return err;
        }

        return null;
    }

    /**
     *
     * @param user
     * @return
     */
    public String getEmail(UserObject user) {
        return usersModel.getUsersEmail(user.getId());
    }

    /**
     * Sends an email to a user with a confirmation token, resets their password to be that token.
     *
     * @param user
     */
    public String sendForgotPasswordEmail(UserObject user) throws AddressException {
        // First we need to set the users ID
        getId(user);
        user.setConfirmationToken(usersModel.generateId().toString());
        String err = usersModel.resetPassword(user.getId(), user.getConfirmationToken());
        if (err != null) {
            return err;
        }
        try {
            EmailObject email = new EmailObject(user.getUsername(), getEmail(user),
                    Defines.FORGOT_PASSWORD);
            email.setContent("http://grasp.scmb.uq.edu.au/reset-password-confirmation",
                    user.getConfirmationToken());
            String emailSent = emailController.sendEmail(email);
            user.setConfirmationToken(null);
            // Reset the ID to be undefined (it will get reset when they log back in)
            user.setId(Defines.UNINIT);
            return emailSent;
        } catch (Exception e) {
            // This means the email failed we want to notify the user
            return "Sending email failed. Please contact the administrators or make sure your email is correct.";
        }
    }


    /**
     * Send a registration email with the users confirmation token.
     *
     * @param user
     */
    public String sendRegistrationEmail(UserObject user) throws AddressException {
        EmailObject email = new EmailObject(user.getUsername(), user.getEmail(), Defines.REGISTRATION);
        email.setContent("http://grasp.scmb.uq.edu.au/confirm-registration", user.getConfirmationToken());
        String emailSent = emailController.sendEmail(email);
        user.setConfirmationToken(null);
        // Check if we were actually able to send the registration email.
        // If we weren't we need to not add the user
        return emailSent;
    }

    /**
     * Registers the user.
     */
    public String confirmRegistration(UserObject user) {
        // Register the user
        String err = usersModel.loginUser(user.getUsername(), user.getConfirmationToken());

        if (err != null) {
            // We remove the password and confirmation token
            user.setPassword(null);
            user.setConfirmationToken(null);
            return err;
        }

        // Set the user's ID
        getId(user);

        return null;
    }


    /**
     * Registers the user.
     */
    public String registerForTest(UserObject user) {
        // Register the user
        String err = usersModel.registerUser(user.getUsername(), user.getPassword(), null);
        // We remove the password
        user.setPassword(null);
        user.setPasswordMatch(null);

        if (err != null) {
            return err;
        }

        // Set the user's ID
        getId(user);

        return null;
    }

    /**
     * Deletes the user.
     */

    public void deleteUser(UserObject user){

        // We request the User ID from the unique username rather than use the ID directly, because if there is a
        // failure in the registration process we won't have access to the generated ID yet

        usersModel.deleteUser(usersModel.getUserId(user.getUsername()));
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

    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setUsersModel(UsersModel usersModel) {
        this.usersModel = usersModel;
    }

    public void setReconModel(ReconstructionsModel reconModel) {
        this.reconModel = reconModel;
    }

}
