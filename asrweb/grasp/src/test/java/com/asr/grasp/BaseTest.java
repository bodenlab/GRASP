package com.asr.grasp;

import com.asr.grasp.controller.ASRController;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.ShareUsersModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import reconstruction.ASR;

public class BaseTest {
    /**
     * ------------------------------------------------------------------------
     *
     *       You will need to change the session variable to be a file
     *              path on your computer.
     *
     * ------------------------------------------------------------------------
     */
    // -------------------- CHANGE THIS PATH TO A PATH ON YOUR COMPUTER -------
    String sessionPath = "/Users/ariane/Documents/boden/apps/" +
            ".tmp/WebSessions/grasp1534997753421/";
    // ------------------------------------------------------------------------
    String dbPassword = "none";
    String dbUrl = "jdbc:postgresql://localhost:5432/grasp";
    String dbUser = "web";
    UserController userController;
    ShareUsersModel shareUsersModel;
    ASRController asrController;
    ReconstructionController reconController;
    ReconstructionsModel reconModel;
    UsersModel userModel;


    public UserObject createUser(String username, String password) {
        UserObject user = new UserObject();
        user.setUsername(username);
        user.setPassword(password);
        user.setPasswordMatch(password);
        return user;
    }


    public UserObject createAndRegisterUser(String username, String password) {
        UserObject user = new UserObject();
        user.setUsername(username);
        user.setPassword(password);
        user.setPasswordMatch(password);
        userController.register(user);
        return user;
    }

    /**
     * Since we are bypassing some of Springs things we need to set up the
     * test environment before we can actually run tests.
     */
    public void setUpEnv() {
        userController = new UserController();
        reconController = new ReconstructionController();
        asrController = new ASRController();

        userModel = new UsersModel();
        userModel.setDBConfig(dbUrl, dbPassword, dbUser);

        reconModel = new ReconstructionsModel();
        reconModel.setDBConfig(dbUrl, dbPassword, dbUser);

        shareUsersModel = new ShareUsersModel();
        shareUsersModel.setDBConfig(dbUrl, dbPassword, dbUser);

        userController.setReconModel(reconModel);
        userController.setUsersModel(userModel);

        reconController.setReconModel(reconModel);
        reconController.setUsersModel(userModel);
        reconController.setShareUsersModel(shareUsersModel);
    }

    /**
     * helper function for tests using a reconstruction object.
     * @param user
     * @return
     */
    public ReconstructionObject createRecon(UserObject user, ASRObject asr) {
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        return recon;
    }


    /**
     * Helper method to create a reconstrcution.
     * Doesn't check it is correct as it assumes this will be picked up in
     * TestCreateReconstrcution
     */
    public ASRObject setAsr() {
        ASRObject asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("JTT");
        asr.setLabel("Afriat-Jurnouv-test");
        asr.setWorkingNodeLabel("N0");
        asr.setNodeLabel("N0");
        asr.runForSession(sessionPath);
        try {
            asr.runReconstruction();

        } catch (Exception e) {
            // Fail on error
        }
        return asr;
    }

}
