package com.asr.grasp;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.HashMap;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reconstruction.ASRPOG;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class ConsensusControllerTest extends BaseTest {


    @Test
    public void testGetASR () {
        /**
         * Tests that we get the ASR object correctly from BN kit.
         */
        setUpEnv();
        ASRObject asr = setAsr("tawfik");
        System.out.println("JOINT:   " + asr.getASRPOG(Defines.JOINT).getGraphReconNodeId());
        System.out.println("MARGINAL:   " + asr.getASRPOG(Defines.MARGINAL));

        // Check the node number is correct and the marginal wasn't done.
        assertThat(377, equalTo(asr.getASRPOG(Defines.JOINT).getGraphReconNodeId()));
        assertThat(asr.getASRPOG(Defines.MARGINAL), equalTo(null));

    }

    @Test
    public void testSaveAllJoints () {
        /**
         * Tests saving all the joint consensus sequences.
         */
        setUpEnv();
        ASRObject asr = setAsr("tawfik");
        UserObject user = createAndRegisterUser("testuser", "testpassword");

        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);

        assertThat(err, is(equalTo(null)));

        ASRPOG joint = asr.getASRPOG(Defines.JOINT);

        // Check saving it to the DB
        System.out.println(consensusController.insertAllJointsToDb(recon.getId(), joint));

        // Check these were saved in the DB
        HashMap<String, String> seqMap = consensusController.getAllConsensus(recon.getId(), Defines.JOINT);

        assertThat(seqMap.get("N22_68"), equalTo("SQVQTVTG-PIDVEQLGKTLVHEHVFVLGE-----------EFRQNYQAEWD----------------EEERIADAVEKLTELKSLGIDTIVDPTVIGLGRYIPRIQRIAEQV-DLNIVVATGIYTYNEVPFQFHYSGPGL----LFDGPEPMVEMFVKDIEDGIAGTGVRAGFL-KCAIEEQGLTPGVERVMRAVAQAHVRTGAPITVHTHAHSESGLEAQRVLA-EEGADLTKVVIGHSG-DSTDLDYLCELADAGSYLGMDRF-----GLDV---------LLPFEERVDTVAELCRRGYADRMVLAHDASCFID---WFPPEARAAAVPNWNYRHISEDVLPALRERGVTEEQIQTMLVDNPRRYFGS-----"));

        assertThat(seqMap.get("N4_98"), equalTo("ARIMTVLG-PISAEELGHTLMHEHLFIDLS-----------GFKKDLDTALD-------------------ELDLACEEVKHLKARGGRTIVEVTCRGMGRDPQFLREVARET-GLNVVAATGFYQEAYHPPYVAER-----------SVEELAELLIRDIEEGIDGTDVKAGIIAEIGTSKGKITPDEEKVFRAAALAHKRTGLPISTHTSLG-TMGLEQLDLLE-EHGVDPARVVIGHMD-LTDDLDNHLALADRGAYVAFDTI-----GKDS---------YPPDEERVRLITALIERGLADRVMLSMDVTRRSH----------LKANGGYGYSYLFDHFIPALRAAGVSEAELEQMLVDNPRRFFSAGGQAP"));

        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user and any consensus sequences.
        userModel.deleteUser(userController.getId(user));
    }

    @Test
    public void testDeleteAllJoints () {

    }


    @Test
    public void motifSearching () {
        /**
         * Tests saving all the joint consensus sequences.
         */
        setUpEnv();
        ASRObject asr = setAsr("tawfik");
        UserObject user = createAndRegisterUser("testuser", "testpassword");

        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);

        assertThat(err, is(equalTo(null)));

        ASRPOG joint = asr.getASRPOG(Defines.JOINT);

        // Check saving it to the DB
        System.out.println(consensusController.insertAllJointsToDb(recon.getId(), joint));

        // Check these were saved in the DB
        HashMap<String, String> seqMap = consensusController.getAllConsensus(recon.getId(), Defines.JOINT);

        assertThat(seqMap.get("N22_68"), equalTo("SQVQTVTG-PIDVEQLGKTLVHEHVFVLGE-----------EFRQNYQAEWD----------------EEERIADAVEKLTELKSLGIDTIVDPTVIGLGRYIPRIQRIAEQV-DLNIVVATGIYTYNEVPFQFHYSGPGL----LFDGPEPMVEMFVKDIEDGIAGTGVRAGFL-KCAIEEQGLTPGVERVMRAVAQAHVRTGAPITVHTHAHSESGLEAQRVLA-EEGADLTKVVIGHSG-DSTDLDYLCELADAGSYLGMDRF-----GLDV---------LLPFEERVDTVAELCRRGYADRMVLAHDASCFID---WFPPEARAAAVPNWNYRHISEDVLPALRERGVTEEQIQTMLVDNPRRYFGS-----"));

        assertThat(seqMap.get("N4_98"), equalTo("ARIMTVLG-PISAEELGHTLMHEHLFIDLS-----------GFKKDLDTALD-------------------ELDLACEEVKHLKARGGRTIVEVTCRGMGRDPQFLREVARET-GLNVVAATGFYQEAYHPPYVAER-----------SVEELAELLIRDIEEGIDGTDVKAGIIAEIGTSKGKITPDEEKVFRAAALAHKRTGLPISTHTSLG-TMGLEQLDLLE-EHGVDPARVVIGHMD-LTDDLDNHLALADRGAYVAFDTI-----GKDS---------YPPDEERVRLITALIERGLADRVMLSMDVTRRSH----------LKANGGYGYSYLFDHFIPALRAAGVSEAELEQMLVDNPRRFFSAGGQAP"));

        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user and any consensus sequences.
        String motif1 = "YPPD";

        String motif2 = "GFLR";
        ArrayList<String> motif1Match = consensusController.findAllWithMotif(recon.getId(), motif1);
        for (String nodeLabel: motif1Match) {
            System.out.println(nodeLabel);
        }
        System.out.println(motif1Match.size());

        ArrayList<String> motif2Match = consensusController.findAllWithMotif(recon.getId(), motif2);
        for (String nodeLabel: motif2Match) {
            System.out.println(nodeLabel);
        }
        System.out.println(motif1Match.size());

        userModel.deleteUser(userController.getId(user));

    }


}
