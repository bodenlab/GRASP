package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.ArrayList;
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
    public void testNodeSimilaritySearcher() {
        /**
//         * Tests being able to get similar nodes.
//         */
//        // Load two recons that are subsets of each other
        int ownerId = 213;

        String sml = "sp_cured3_wguide2";
        String mid = "500_1758_dhad_29102018";
        String lrg = "40_samples_test";
        setUpEnv();
        UserObject user = new UserObject();
        user.setId(213);
////        ASRObject asrSml = setAsr(smallest);
////        ASRObject asrMid = setAsr(mid);
////        ASRObject asrLrg = setAsr(lrg);
////        UserObject user = createAndRegisterUser("testuser", "testpassword");
////
////        ReconstructionObject reconSml = saveRecons(asrSml, user);
////        ReconstructionObject reconMid = saveRecons(asrMid, user);
////        ReconstructionObject reconLrg = saveRecons(asrLrg, user);
////
////        String baseTestName = "test-test-test-";
//
        String ancs1 = "N1";
        String ancs2 = "N423";
        String ancs3 = "N560";
        treeController.getSimilarNodes(user, sml, mid, ancs1, true);
        treeController.getSimilarNodes(user, sml, mid, ancs2, true);
        treeController.getSimilarNodes(user, sml, mid, ancs3, true);


    }

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
