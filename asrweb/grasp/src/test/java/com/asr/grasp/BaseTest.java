package com.asr.grasp;

import com.asr.grasp.controller.ASRController;
import com.asr.grasp.controller.ConsensusController;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.TaxaController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.model.ConsensusModel;
import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.ShareUsersModel;
import com.asr.grasp.model.TaxaModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;

public class BaseTest {
    /**
     * ------------------------------------------------------------------------
     *
     *       You will need to change the session variable to be a file
     *              path on your computer. An example is in the
     *              TestPropertiesExample
     *              .java file. You'll need to copy this to a
     *              TestPropertiesOverride.java file and add in your session path.
     *
     * ------------------------------------------------------------------------
     */
    // -------------------- CHANGE THIS PATH TO A PATH ON YOUR COMPUTER -------
    String sessionPath = TestPropertiesOverride.sessionPath;
    // ------------------------------------------------------------------------
    String dbPassword = "none";
    String dbUrl = "jdbc:postgresql://localhost:5432/grasp";
    String dbUser = "web";
    UserController userController;
    ASRController asrController;
    ReconstructionController reconController;
    TaxaController taxaController;
    ReconstructionsModel reconModel;
    UsersModel userModel;
    TaxaModel taxaModel;
    ConsensusController consensusController;
    ConsensusModel consensusModel;

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
        taxaController = new TaxaController();

        userModel = new UsersModel();
        userModel.setDBConfig(dbUrl, dbPassword, dbUser);

        reconModel = new ReconstructionsModel();
        reconModel.setDBConfig(dbUrl, dbPassword, dbUser);

        taxaModel = new TaxaModel();
        taxaModel.setDBConfig(dbUrl, dbPassword, dbUser);

        userController.setReconModel(reconModel);
        userController.setUsersModel(userModel);

        reconController.setReconModel(reconModel);
        reconController.setUsersModel(userModel);

        taxaController.setTaxaModel(taxaModel);
        consensusController = new ConsensusController();

        consensusModel = new ConsensusModel();
        consensusModel.setDBConfig(dbUrl, dbPassword, dbUser);
        consensusController.setConsensusModel(consensusModel);
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
     * TestCreateReconstrcuion
     * @return
     */
    public ASRObject setAsr(String data) {
        ASRObject asr = new ASRObject();
        asr.setDataPath("data/test/");
        asr.setData(data);
        asr.setInferenceType("JTT");
        asr.setLabel("test-test-test");
        asr.setWorkingNodeLabel("N0");
        asr.setNodeLabel("N0");
        asr.runForSession(sessionPath);
        try {
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
            System.out.println(e);
        }
        return asr;
    }

}
