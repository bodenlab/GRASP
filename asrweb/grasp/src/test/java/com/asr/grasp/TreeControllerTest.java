package com.asr.grasp;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
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
         * Tests being able to get similar nodes.
         */
        // Load two recons that are subsets of each other
        int ownerId = 213;

        String sml = "10_samples_test";
        String mid = "20_samples_test";
        String lrg = "40_samples_test";
        setUpEnv();
//        ASRObject asrSml = setAsr(smallest);
//        ASRObject asrMid = setAsr(mid);
//        ASRObject asrLrg = setAsr(lrg);
//        UserObject user = createAndRegisterUser("testuser", "testpassword");
//
//        ReconstructionObject reconSml = saveRecons(asrSml, user);
//        ReconstructionObject reconMid = saveRecons(asrMid, user);
//        ReconstructionObject reconLrg = saveRecons(asrLrg, user);
//
//        String baseTestName = "test-test-test-";

        String ancs1 = "N1_N1_0.924";
        String ansc2 = "tr|A0A0D1F6V2|A0A0D1F6V2_VIBPH ilvD";

        treeController.getSimilarNodes(213, sml, mid, ancs1);

    }
}
