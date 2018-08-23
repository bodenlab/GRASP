package com.asr.grasp;
import com.asr.grasp.controller.ASRController;
import com.asr.grasp.controller.ReconstructionController;
import com.asr.grasp.controller.UserController;
import com.asr.grasp.model.BaseModel;
import com.asr.grasp.model.ReconstructionsModel;
import com.asr.grasp.model.ShareUsersModel;
import com.asr.grasp.model.UsersModel;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import com.fasterxml.jackson.databind.ser.Serializers;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.PropertySource;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.equalTo;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ReconstructionControllerTest {

    String sessionPath = "/Users/ariane/Documents/boden/apps/" +
            ".tmp/WebSessions/grasp1534997753421/";
    String dbPassword = "none";
    String dbUrl = "jdbc:postgresql://localhost:5432/grasp";
    String dbUser = "web";
    UserController userController;
    ShareUsersModel shareUsersModel;
    ReconstructionObject recon;
    ASRObject asr;
    ASRController asrController;
    ReconstructionController reconController;
    ReconstructionsModel reconModel;
    UsersModel userModel;
    UserObject user;
    String err;

    private UserObject createAndRegisterUser(String username, String password) {
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
    private void setUpEnv() {
        userController = new UserController();
        reconController = new ReconstructionController();
        asrController = new ASRController();

        userModel = new UsersModel();
        userModel.dbPassword = dbPassword;
        userModel.dbUrl = dbUrl;
        userModel.dbUsername = dbUser;

        reconModel = new ReconstructionsModel();
        reconModel.dbPassword = dbPassword;
        reconModel.dbUrl = dbUrl;
        reconModel.dbUsername = dbUser;

        shareUsersModel = new ShareUsersModel();
        shareUsersModel.dbPassword = dbPassword;
        shareUsersModel.dbUrl = dbUrl;
        shareUsersModel.dbUsername = dbUser;

        userController.setReconModel(reconModel);
        userController.setUsersModel(userModel);

        reconController.setReconModel(reconModel);
        reconController.setUsersModel(userModel);
        reconController.setShareUsersModel(shareUsersModel);
    }

    /**
     * Helper method to create a reconstrcution.
     * Doesn't check it is correct as it assumes this will be picked up in
     * TestCreateReconstrcution
     */
    public void setAsr() {
        asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("JTT");
        asr.setLabel("Afriat-Jurnouv-test");


        asr.runForSession("/Users/ariane/Documents/boden/apps/" +
                ".tmp/WebSessions/grasp1534997753421/");
        try {
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
        }
    }


    @Test
    public void testCreateReconstruction() {
        /**
         * Tests that the ASR module is acting as expected.
         */
        setUpEnv();

        asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("joint");
        asr.setLabel("Afriat-Jurnouv-test");
        asr.setModel("JTT");

        asr.runForSession(sessionPath);

        try {
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
            assertThat(e, is(equalTo(null)));
        }

        String reconTree = "(RTXKPRP:1.4E-7,RTXKlebvar:0.00623058,(RTX_Pseudo:0.10125108,(RTX_3K2g:0.52474419,((Symbiobact:0.37069573,(PHP_Escher:0.14236022,(PHP_Yersin:0.2740626,(PHP_Photor:0.13809403,PHP_Xenorh:0.42798709)N7_59:0.07439548)N6_79:0.11321042)N5_100:0.66251453)N4_98:0.2800999,((PLLDeinoco:0.42937975,(PLLGeoKaus:0.07205125,PLLGeobThe:0.04452138)N10_99:0.28466264)N9_100:0.89834731,(((1HZY_pte:1.0E-8,PTEFlavob:0.00302678)N13_97:0.07465645,(2R1N_opd:0.00323286,PTEAgrobac:0.00332231)N14_81:0.02820201)N12_100:1.19982396,((PLLSulAcid:0.1320117,(SisPox_a:0.04040092,ssopoxmo:0.05938749)N17_100:0.15659953)N16_100:0.61438202,((PLLRhodoco:0.39323398,((PLLAhIA:0.00324601,PLLQsdA:2.3E-7)N21_100:0.19348514,(PLLBreviba:0.17059149,PLLDermaco:0.24217329)N22_68:0.09748923)N20_100:0.15423775)N19_88:0.12323455,(PLLStrepto:0.57408811,(PLLMycsubs:0.03654787,(PLLPPH:1.0E-8,(PLLMycbovi:0.0032172,PLLMycobCD:0.00324499)N26_22:2.2E-7)N25_100:0.05401624)N24_99:0.14298798)N23_94:0.09766462)N18_99:0.50935379)N15_82:0.20681095)N11_94:0.37463577)N8_95:0.33701264)N3_100:0.83757149)N2_92:0.27920519)N1_100:0.2142528)N0";
        // Check the reconstructed tree is correct
        assertThat(asr.getReconstructedNewickString(), is(equalTo
                (reconTree)));
        // Check we have the correct number of ancestors
        assertThat(asr.getNumberAncestors(), is(equalTo
                (27)));
    }

    @Test
    public void testSaveReconstruction() {
        /**
         * Tests that the ASR module is acting as expected.
         */
        setUpEnv();
        user = createAndRegisterUser("testuser", "testpassword");

        setAsr();
        // Create a reconstruction from an ASR object
        recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);

        assertThat(err, is(equalTo(null)));

        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(user));
    }
}
