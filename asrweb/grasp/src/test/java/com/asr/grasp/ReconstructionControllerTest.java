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
import json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.PropertySource;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reconstruction.ASR;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.equalTo;


@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ReconstructionControllerTest extends BaseTest {


    @Test
    public void testCreateReconstruction() {
        /**
         * Tests that the ASR module is acting as expected.
         */
        setUpEnv();

        ASRObject asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("joint");
        asr.setLabel("Afriat-Jurnouv-test");
        asr.setModel("JTT");
        asr.setWorkingNodeLabel(asr.getNodeLabel());
        asr.setNodeLabel(asr.getNodeLabel());
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
        UserObject user = createAndRegisterUser("testuser", "testpassword");

        ASRObject asr = setAsr();

        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);

        assertThat(err, is(equalTo(null)));

        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(user));
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

        assertThat(asr.getWorkingNodeLabel(), not(equalTo(null)));

        return recon;

    }

    @Test
    public void testShareReconstruction() {
        /**
         * Tests sharing a reconstruction gives a user access and it gets
         * added to their memberSharedReconstructions.
         */
        setUpEnv();

        UserObject userOwner = createAndRegisterUser("testuser",
                "testpassword");

        UserObject userMember = createAndRegisterUser("testmember",
                "testpassword");

        ASRObject asr = setAsr();
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = createRecon(userOwner, asr);

        // Save to the DB
        reconController.save(userOwner, recon);

        // Now we want to share with the other user
        String err = reconController.shareWithUser(reconController.getId(recon,
                userOwner.getId()),
                userMember.getUsername(), userOwner);

        assertThat(err, is(equalTo(null)));

        // Check the user has the correct access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.MEMBER_ACCESS)));

        assertThat(reconController.getUsersAccess(recon.getId(), userOwner),
                is(equalTo(Defines.OWNER_ACCESS)));

        // Delete userMember first
        userModel.deleteUser(userController.getId(userMember));
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(userOwner));
    }

    @Test
    public void testUnShareReconstruction() {
        /**
         * Tests sharing a reconstruction gives a user access and it gets
         * added to their memberSharedReconstructions.
         */
        setUpEnv();

        UserObject userOwner = createAndRegisterUser("testuser",
                "testpassword");

        UserObject userMember = createAndRegisterUser("testmember",
                "testpassword");

        ASRObject asr = setAsr();
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = createRecon(userOwner, asr);

        // Save to the DB
        reconController.save(userOwner, recon);

        // Now we want to share with the other user
        String err = reconController.shareWithUser(reconController.getId(recon,
                userOwner.getId()),
                userMember.getUsername(), userOwner);

        // assertThat(err, is(equalTo(null)));

        // Check the user has the correct access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.MEMBER_ACCESS)));

        // Now we want to unshare the recon.
        err = reconController.removeUsersAccess(recon.getId(),userMember
                .getUsername(), userOwner);

        // Check the user has No access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.NO_ACCESS)));

        // Delete userMember first
        userModel.deleteUser(userController.getId(userMember));
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(userOwner));
    }


    @Test
    public void testDeleteReconstruction() {
        /**
         * Tests that a reconstruction can only be deleted by a user who has
         * owner access.
         */
        setUpEnv();

        UserObject userOwner = createAndRegisterUser("testuser",
                "testpassword");

        UserObject userMember = createAndRegisterUser("testmember",
                "testpassword");

        ASRObject asr = setAsr();
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = createRecon(userOwner, asr);

        // Save to the DB
        reconController.save(userOwner, recon);

        // Now we want to share with the other user
        String err = reconController.shareWithUser(reconController.getId(recon,
                userOwner.getId()),
                userMember.getUsername(), userOwner);

//        assertThat(err, is(equalTo(null)));

        // Check the user has the correct access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.MEMBER_ACCESS)));

        /**
         * Test that a user with member access can't delete a reconstruction
         */
        assertThat(reconController.delete(recon.getId(), userMember), is(equalTo
                ("recon.delete.notowner")));

        // Now we want to unshare the recon.
        err = reconController.removeUsersAccess(recon.getId(),userMember
                .getUsername(), userOwner);

        // Check the user has No access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.NO_ACCESS)));
        /**
         * Test that a user with No access can't delete a reconstruction
         */
        assertThat(reconController.delete(recon.getId(), userMember), is(equalTo
                ("recon.delete.notowner")));

        /**
         * Test that the owner can delete a reconstruction
         */
        assertThat(reconController.delete(recon.getId(), userOwner), is(equalTo
                (null)));

        // Delete userMember first
        userModel.deleteUser(userController.getId(userMember));
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(userOwner));
    }

    @Test
    public void testLoadReconstruction() {
        /**
         * Tests that a reconstruction is saved by one user and thety are
         * abel to load it. Check that another user isn't able to load it who
         * doesn't have access. Test that a user who has member access can
         * also load it.
         */
        setUpEnv();

        UserObject userOwner = createAndRegisterUser("testuser",
                "testpassword");

        UserObject userMember = createAndRegisterUser("testmember",
                "testpassword");

        ASRObject asr = setAsr();
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = createRecon(userOwner, asr);

        // Save to the DB
        reconController.save(userOwner, recon);

        // Now we want to share with the other user
        String err = reconController.shareWithUser(reconController.getId(recon,
                userOwner.getId()),
                userMember.getUsername(), userOwner);

        assertThat(err, is(equalTo(null)));

        // Check the user has the correct access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.MEMBER_ACCESS)));

        /**
         * Test that a user with member can load a reconstruction
         */
        assertThat(reconController.getById(recon.getId(), userMember), not
                (equalTo
                (null)));

        // Now we want to unshare the recon.
        err = reconController.removeUsersAccess(recon.getId(),userMember
                .getUsername(), userOwner);

        // Check the user has No access
        assertThat(reconController.getUsersAccess(recon.getId(), userMember),
                is(equalTo(Defines.NO_ACCESS)));
        /**
         * Test that a user with No access can't access a reconstruction
         */
        assertThat(reconController.getById(recon.getId(), userMember), is
                (equalTo
                        (null)));

         /**
         * Test that a user with owner access can load a reconstruction
         */
        assertThat(reconController.getById(recon.getId(), userOwner), not
                (equalTo
                        (null)));

        // Delete userMember first
        userModel.deleteUser(userController.getId(userMember));
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(userOwner));
    }

}
