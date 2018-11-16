package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.ArrayList;
import json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class TreeControllerTest extends BaseTest {

    public ReconstructionObject saveRecons(ASRObject asr, UserObject user) {
        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);
        return recon;
    }

    @Test
    public void testNodeSimilarity() {
        setUpEnv();

        String sml = "0_10_dhad_28102018";
        String mid = "10_20_dhad_28102018";
        String lrg = "20_40_dhad_28102018";
        ASRObject asrSml = setAsr(sml);
        ASRObject asrMid = setAsr(mid);
        ASRObject asrLrg = setAsr(lrg);
        UserObject user = createAndRegisterUser("testuser", "testpassword");

        ReconstructionObject reconSml = saveRecons(asrSml, user);
        ReconstructionObject reconMid = saveRecons(asrMid, user);
        ReconstructionObject reconLrg = saveRecons(asrLrg, user);

        String baseTestName = "test-test-test-";

        int numNodes = 1;
        String rootNodeLabel = "N0";
        String anotherLabel = "N4";
        JSONArray arr1 = treeController.getSimilarNodes(user, baseTestName + sml, baseTestName + mid, rootNodeLabel, numNodes);
        JSONArray arr2 = treeController.getSimilarNodes(user, baseTestName + mid, baseTestName + lrg, rootNodeLabel, numNodes);
        JSONArray arr3 = treeController.getSimilarNodes(user, baseTestName + sml, baseTestName + mid, anotherLabel, numNodes);
        JSONArray arr4 = treeController.getSimilarNodes(user, baseTestName + sml,baseTestName + lrg, anotherLabel, numNodes);

        /**
         * Check that the first two give us node 0 (as this is the node it has to be)
         */
        assertThat(arr1.toString(), equalTo("[[\"N0\",-10]]"));
        assertThat(arr2.toString(), equalTo("[[\"N0\",-20]]"));

        /**
         * Check that we get the correct results for N4 - we expect N4 also in the second recon
         * but N13 in the third.
         */
        assertThat(arr3.toString(), equalTo("[[\"N4_0.990\",-4]]"));
        assertThat( arr4.toString(), equalTo("[[\"N16_1.000\",-2]]"));
        userModel.deleteUser(userController.getId(user));
    }

    /**
     * This is just used to run tests locally. To be removed.
     */
//
//    @Test
//    public void testNodeSimilaritySearcher() {
//        /**
//         * Tests being able to get similar nodes.
//         */
//        // Load two recons that are subsets of each other
//        int ownerId = 213;
//
//        String sml = "taketimeemailtest";
//        String mid = "500_1758_dhad_01112018";
//        String lrg = "40_samples_test";
//        setUpEnv();
//        UserObject user = new UserObject();
//        user.setId(213);
//
//        String ancs1 = "N1";
//        String ancs2 = "N423";
//        String ancs3 = "N560";
//
//        treeController.getSimilarNodes(user, sml, mid, "N0", 2);
//        treeController.getSimilarNodes(user, sml, mid, ancs1, 2);
//        treeController.getSimilarNodes(user, sml, mid, ancs2, 2);
//        treeController.getSimilarNodes(user, sml, mid, ancs3, 2);
//    }


    public void save(ArrayList<String> ancs, String ancsLabel) {
        try {
            BufferedWriter bw = new BufferedWriter(new FileWriter(
                    "/Users/ariane/Documents/boden/apps/ASR/asrweb/grasp/test_output/" + ancsLabel + "_ancs.fa",
                    false));
            // First want to save the original
            seqController.saveAncestorToFile(bw, ancsLabel, 575, Defines.JOINT, "_original:sp_cured3_wguide2");
            for (String nodeLabel : ancs) {
                seqController.saveAncestorToFile(bw, nodeLabel.split("@")[0], 570, Defines.JOINT, nodeLabel.split("@")[1]);
            }
            bw.close();
        } catch (Exception e) {
            System.out.println("coultn't write:" + e.getMessage());
        }
    }
}
