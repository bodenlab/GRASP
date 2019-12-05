package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import static org.hamcrest.MatcherAssert.assertThat;
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
        String filename = "tawfik";

        ASRObject asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("joint");
        asr.setLabel("Afriat-Jurnouv-test");
        asr.setModel("JTT");
        asr.setWorkingNodeLabel(asr.getNodeLabel());
        asr.setNodeLabel(asr.getNodeLabel());

        try {
            asr.loadExtants(dataPath + filename + ".aln");
            asr.loadTree(dataPath + filename + ".nwk");
            asr.runReconstruction();
        } catch (Exception e) {
            // Fail on error
            assertThat(e, is(equalTo(null)));
        }

//        String reconTree = "(RTXKPRP:1.4E-7,RTXKlebvar:0.00623058,(RTX_Pseudo:0.10125108,(RTX_3K2g:0.52474419,((Symbiobact:0.37069573,(PHP_Escher:0.14236022,(PHP_Yersin:0.2740626,(PHP_Photor:0.13809403,PHP_Xenorh:0.42798709)N7_59:0.07439548)N6_79:0.11321042)N5_100:0.66251453)N4_98:0.2800999,((PLLDeinoco:0.42937975,(PLLGeoKaus:0.07205125,PLLGeobThe:0.04452138)N10_99:0.28466264)N9_100:0.89834731,(((1HZY_pte:1.0E-8,PTEFlavob:0.00302678)N13_97:0.07465645,(2R1N_opd:0.00323286,PTEAgrobac:0.00332231)N14_81:0.02820201)N12_100:1.19982396,((PLLSulAcid:0.1320117,(SisPox_a:0.04040092,ssopoxmo:0.05938749)N17_100:0.15659953)N16_100:0.61438202,((PLLRhodoco:0.39323398,((PLLAhIA:0.00324601,PLLQsdA:2.3E-7)N21_100:0.19348514,(PLLBreviba:0.17059149,PLLDermaco:0.24217329)N22_68:0.09748923)N20_100:0.15423775)N19_88:0.12323455,(PLLStrepto:0.57408811,(PLLMycsubs:0.03654787,(PLLPPH:1.0E-8,(PLLMycbovi:0.0032172,PLLMycobCD:0.00324499)N26_22:2.2E-7)N25_100:0.05401624)N24_99:0.14298798)N23_94:0.09766462)N18_99:0.50935379)N15_82:0.20681095)N11_94:0.37463577)N8_95:0.33701264)N3_100:0.83757149)N2_92:0.27920519)N1_100:0.2142528)N0";
        // Check the reconstructed tree is correct

        String reconTree = "((((((1HZY_pte:9.99999993922529E-9,PTEFlavob:0.0030267799999998957)N5:0.07465644999999999,(2R1N_opd:0.003232859999999782,PTEAgrobac:0.0033223100000001615)N6:0.02820201000000022)N4:1.1998239600000002,((PLLSulAcid:0.13201170000000007,(SisPox_a:0.04040092000000017,ssopoxmo:0.05938749000000021)N9:0.15659952999999982)N8:0.6143820199999999,((PLLRhodoco:0.39323397999999976,((PLLAhIA:0.0032460099999997993,PLLQsdA:2.299999999344493E-7)N13:0.19348513999999994,(PLLBreviba:0.17059149000000007,PLLDermaco:0.2421732900000002)N14:0.09748922999999987)N12:0.15423775000000006)N11:0.12323454999999983,(PLLStrepto:0.5740881099999999,(PLLMycsubs:0.03654787000000015,(PLLPPH:9.99999993922529E-9,(PLLMycbovi:0.00321719999999992,PLLMycobCD:0.003244989999999781)N18:2.1999999999522402E-7)N17:0.05401624000000016)N16:0.14298798000000001)N15:0.0976646200000002)N10:0.50935379)N7:0.20681094999999994)N3:0.3746357699999998,(PLLDeinoco:0.42937974999999984,(PLLGeoKaus:0.0720512499999999,PLLGeobThe:0.044521379999999944)N20:0.2846626400000001)N19:0.8983473100000001)N2:0.3370126400000002,(Symbiobact:0.37069573,(PHP_Escher:0.14236022000000004,(PHP_Yersin:0.27406260000000016,(PHP_Photor:0.13809402999999998,PHP_Xenorh:0.4279870899999998)N24:0.07439548000000018)N23:0.11321042000000014)N22:0.6625145300000002)N21:0.2800999000000002)N1:0.41878574499999976,(RTX_3K2g:0.5247441900000003,(RTX_Pseudo:0.10125107999999994,(RTXKPRP:1.4000000003733248E-7,RTXKlebvar:0.006230579999999986)N27:0.21425280000000013)N26:0.2792051899999999)N25:0.418785745)N0";
        assertThat(asr.getReconstructedNewickString(), is(equalTo
                (reconTree)));
        // Check we have the correct number of ancestors
        assertThat(asr.getNumberAncestors(), is(equalTo
                (28)));
    }

    @Test
    public void testCreateMarginal() {
        /**
         * Tests that the ASR module is acting as expected.
         */
        setUpEnv();
        String filename = "tawfik";

        ASRObject asr = new ASRObject();
        asr.setData("tawfik");
        asr.setInferenceType("marginal");
        asr.setLabel("Afriat-Jurnouv-test");
        asr.setModel("JTT");
        asr.setWorkingNodeLabel(asr.getNodeLabel());
        asr.setNodeLabel(asr.getNodeLabel());

        try {
            asr.loadExtants(dataPath + filename + ".aln");
            asr.loadTree(dataPath + filename + ".nwk");
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
                (1)));
        assertThat(asr.getInferenceType(), is(equalTo("marginal")));

    }

    @Test
    public void testSaveReconstruction() {
        /**
         * Tests that the ASR module is acting as expected.
         */
        setUpEnv();
        UserObject user = createAndRegisterUser("testuser", "testpassword");

        ASRObject asr = setAsr("tawfik");

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

        ASRObject asr = setAsr("tawfik");

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

        ASRObject asr = setAsr("tawfik");

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

        ASRObject asr = setAsr("tawfik");

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
         * Test that a user with member access can't delete a reconstruction
         */
        assertThat(reconController.delete(recon.getId(), userMember), is(equalTo
                ("You can only delete this reconstruction if you are the owner.")));

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
                ("You can only delete this reconstruction if you are the owner.")));

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

        ASRObject asr = setAsr("tawfik");
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
