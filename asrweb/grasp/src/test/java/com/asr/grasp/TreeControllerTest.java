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
import static org.hamcrest.Matchers.sameInstance;

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
        assertThat(arr3.toString(), equalTo("[[\"N13_0.976\",-6]]"));
        assertThat( arr4.toString(), equalTo("[[\"N8_0.975\",-6]]"));
        userModel.deleteUser(userController.getId(user));
    }

    /**
     * This is just used to run tests locally. To be removed.
     */

    @Test
    public void testGetAllMatching() {
        /**
         * Tests being able to get similar nodes.
         */
        setUpEnv();

        String sml = TestPropertiesOverride.testFilePath + "0_10_dhad_28102018.nwk";
        String mid = TestPropertiesOverride.testFilePath + "10_20_dhad_28102018.nwk";
        String lrg = TestPropertiesOverride.testFilePath + "20_40_dhad_28102018.nwk";

        ArrayList<String> result;
        // Should print out matching nodes
        result = treeController.getSimilarNodes(sml, sml, true);

        System.out.println("------------------------------------");
        System.out.println(result.get(0) + ", " + result.get(result.size() - 1));
        System.out.println("------------------------------------");
        // ToDO: UPDATE THESE AND CONFIRM WE ARE GETTING THE RESULTS WE EXPECT
        //assertThat(result.get(0) + ", " + result.get(result.size() - 1), equalTo("N2_1.000,N2_1.000,-2.0, N0,N0,-10.0"));


        // Should print out eq. nodes
        result = treeController.getSimilarNodes(sml, mid, false);
        System.out.println("------------------------------------");
        System.out.println(result.get(0) + ", " + result.get(result.size() - 1));
        System.out.println("------------------------------------");
        //assertThat(result.get(0) + ", " + result.get(result.size() - 1), equalTo("N2_1.000,N1_1.000,-2.0, N0,N0,-10.0"));


        result = treeController.getSimilarNodes(mid, lrg, false);
        System.out.println("------------------------------------");
        System.out.println(result.get(0) + ", " + result.get(result.size() - 1));
        System.out.println("------------------------------------");
        //assertThat(result.get(0) + ", " + result.get(result.size() - 1), equalTo("N5_0.968,N20_0.959,-2.0, N0,N0,-20.0"));

        result = treeController.getSimilarNodes(sml, lrg, false);
        System.out.println("-----------------------------");
        for (String s: result) {
            System.out.println(s);
        }

    }


    /**
     * Helper method for saving things (add in to save an alignment)
     * @param ancs
     * @param ancsLabel
     */
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
