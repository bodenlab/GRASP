package com.asr.grasp;

import com.asr.grasp.controller.ASRController;
import com.asr.grasp.controller.ConsensusController;
import com.asr.grasp.controller.SeqController;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.TaxaController;
import com.asr.grasp.controller.TreeController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.model.InferenceModel;
import com.asr.grasp.model.SeqModel;
import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.TaxaModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.model.TreeModel;
import com.asr.grasp.utils.Defines;
import reconstruction.ConsensusObject;

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
    // ---------- CHANGE THIS PATH TO A PATH ON YOUR COMPUTER where the data is for GRASP ------
    String dataPath = TestPropertiesOverride.testFilePath;
    // ------------------------------------------------------------------------
    String dbPassword = "strongpassword";
    String dbUrl = "jdbc:postgresql://localhost:5432/grasp_db";
    String dbUser = "web_user";
    UserController userController;
    ASRController asrController;
    ReconstructionController reconController;
    TaxaController taxaController;
    ReconstructionsModel reconModel;
    UsersModel userModel;
    TaxaModel taxaModel;
    SeqController seqController;
    SeqModel seqModel;
    TreeController treeController;
    TreeModel treeModel;
    InferenceModel infModel;
    ConsensusController consensusController;
    ConsensusObject consensusObject;

    public UserObject createUser(String username, String password) {
        /**
         * Check if the user exists, if they do, delete them
         */

        UserObject user = new UserObject();
        user.setUsername(username);
        user.setPassword(password);
        user.setEmail("temp");
        user.setPasswordMatch(password);
        int id = userController.getId(user);
        // if they have remove them and re-add them
        if (id > 0) {
            userModel.deleteUser(userController.getId(user));
            user.setId(Defines.UNINIT);
        }
        return user;
    }


    public UserObject createAndRegisterUser(String username, String password) {
        UserObject user = new UserObject();
        user.setUsername(username);
        user.setPassword(password);
        user.setPasswordMatch(password);
        user.setConfirmationToken(password);
        user.setEmail(username);

        // Check if the user has already been registered
        int id = userController.getId(user);
        // if they have remove them and re-add them
        if (id > 0) {
            userModel.deleteUser(userController.getId(user));
            user.setId(Defines.UNINIT);
        }
        // Method to make it easier to register for the test
        userController.register(user, password);
        id = userController.getId(user);
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
        treeController = new TreeController();
        consensusController = new ConsensusController();

        userModel = new UsersModel();
        userModel.setDBConfig(dbUrl, dbPassword, dbUser);

        infModel = new InferenceModel();
        infModel.setDBConfig(dbUrl, dbPassword, dbUser);

        reconModel = new ReconstructionsModel();
        reconModel.setDBConfig(dbUrl, dbPassword, dbUser);
        reconModel.setInfModel(infModel);

        taxaModel = new TaxaModel();
        taxaModel.setDBConfig(dbUrl, dbPassword, dbUser);

        userController.setReconModel(reconModel);
        userController.setUsersModel(userModel);

        reconController.setReconModel(reconModel);
        reconController.setUsersModel(userModel);

        taxaController.setTaxaModel(taxaModel);
        seqController = new SeqController();

        seqModel = new SeqModel();
        seqModel.setDBConfig(dbUrl, dbPassword, dbUser);
        seqController.setSeqModel(seqModel);
        seqController.setInfModel(infModel);
        seqController.setConsensusController(consensusController);
        seqController.setReconstructionsModel(reconModel);

        treeModel = new TreeModel();
        treeModel.setDBConfig(dbUrl, dbPassword, dbUser);
        treeController.setTreeModel(treeModel);
        treeController.setReconModel(reconModel);
        treeController.setReconController(reconController);
        treeController.setSeqController(seqController);

        consensusController.setSeqController(seqController);
        consensusController.setTreeController(treeController);

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
        String filename = data;
        ASRObject asr = new ASRObject();
        asr.setDataPath("data/test/");
        asr.setData(data);
        asr.setInferenceType("JTT");
        asr.setLabel("test-test-test-" + data);
        asr.setWorkingNodeLabel("N0");
        asr.setNodeLabel("N0");
        try {
            asr.loadExtants(dataPath + filename + ".aln");
            asr.loadTree(dataPath + filename + ".nwk");
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
            System.out.println(e);
        }
        return asr;
    }



}
