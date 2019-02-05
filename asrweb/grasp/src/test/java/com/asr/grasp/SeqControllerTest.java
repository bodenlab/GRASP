package com.asr.grasp;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;

import api.PartialOrderGraph;
import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.ConsensusObject;
import com.asr.grasp.objects.ReconstructionObject;
import com.asr.grasp.objects.TreeNodeObject;
import com.asr.grasp.objects.UserObject;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import java.util.HashMap;
import json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import reconstruction.ASRPOG;
import vis.POAGJson;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class SeqControllerTest extends BaseTest {


    @Test
    public void testGetASR () {
        /**
         * Tests that we get the ASR object correctly from BN kit.
         */
        setUpEnv();
        ASRObject asr = setAsr("tawfik");

        // Check the node number is correct and the marginal wasn't done.
        assertThat(377, equalTo(asr.getASRPOG(Defines.JOINT).getGraphReconNodeId()));
        assertThat(asr.getASRPOG(Defines.MARGINAL), equalTo(null));

    }


    @Test
    public void testSaveExtants () {
        /**
         * Tests that we get the ASR object correctly from BN kit.
         */
        setUpEnv();
        ASRObject asr = setAsr("tawfik");
        UserObject user = createAndRegisterUser("testuser", "testpassword");
        HashMap<String, String> seqs = asr.getSequencesAsNamedMap();

        for (String seqName: seqs.keySet()) {
            System.out.println(seqName + ": " + seqs.get(seqName));
        }

        // Create a reconstruction from an ASR object
        ReconstructionObject recon = reconController.createFromASR(asr);

        // Set the user to own the reconstruction
        recon.setOwnerId(userController.getId(user));

        // Test we can save the recon to the database
        String err = reconController.save(user, recon);

        // Test saving these into the database
        // Check saving it to the DB
        System.out.println(seqController.insertAllExtantsToDb(recon.getId(), seqs, true));

        // Now test getting the sequences from the database
        HashMap<String, String> seqMap = seqController.getAllSeqs(recon.getId(), Defines.EXTANT);

        // Check they saved
        assertThat(seqMap.get("PHP_Yersin"), equalTo("-----------MINPNGYTYAHEHLHIDLS-----------GFKNNLDCRLD-------------------QYPPICDEMRELVSKGVANIVEVTNRYMGRNPQFLLNLMRDS-GINVIASTGYYTDSFYPPMVRES-----------TVQQLAQTMIDEIELGIDGTELKAGVIAEIGTSEGVVTADEAKVFHAAALAHHATGLAISTHTSFS-TMGLEQIALLE-QHGVPLNRVVIGHCD-LKEQPDLILRMIDKGVYVQFDTI-----GKNS---------YFPDERRVAMLVMLAERGLLDKVMLSMDITRRSH----------LKTNGGSGFSYLVDTFIPLLLAAGLSQDHVEMMLRHNPNKFFSTQGK--"));

        assertThat(seqMap.get("PTEFlavob"), equalTo("DRINTVRG-PITISEAGFTLTHEHICGSSA-----------GFLRAWPEFFG---------------SRKALAEKAVRGLRRARAAGVRTIVDVSTFDIGRDVSLLAEVSRAA-DVHIVAATGLW-F-DPPLSMRLR-----------SVEELTQFFLREIQYGIKDTGIRAGII-KVATTG-KATPFQELVLKAAARASLATGVPVTTHTAASQRDGEQQAAIFE-SEGLSPSRVCIGHSD-DTDDLSYLTALAARGYLIGLDHIPHSAIGLEDNASASALLGIRSWQTRALLIKALIDQGYMKQILVSNDWLFGFSSYVTNIMDVMDRVNPD-GMAFIPLRVIPFLREKGVPQETLAGITVTNPARFLSPTLRAS"));

        assertThat(seqMap.size(), equalTo(29));

        userModel.deleteUser(userController.getId(user));
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

        seqController.insertAllExtantsToDb(recon.getId(), asr.getSequencesAsNamedMap(), true);

        // Check saving it to the DB
        System.out.println(seqController.insertAllJointsToDb(recon.getId(), joint, true, user.getId()));

        // Check these were saved in the DB
        HashMap<String, String> seqMap = seqController.getAllSeqs(recon.getId(), Defines.JOINT);

        System.out.println(seqMap.get("N22_68"));
        assertThat(seqMap.get("N22_68"), equalTo("SQVQTVTG-PIDVEQLGKTLVHEHVFVLGE-----------EFRQNYQAEWD----------------EEERIADAVEKLTELKSLGIDTIVDPTVIGLGRYIPRIQRIAEQV-DLNIVVATGIYTYNEVPFQFHYSGPGL----LFDGPEPMVEMFVKDIEDGIAGTGVRAGFL-KCAIEEQGLTPGVERVMRAVAQAHVRTGAPITVHTHAHSESGLEAQRVLA-EEGADLTKVVIGHSG-DSTDLDYLCELADAGSYLGMDRF-----GLDV---------LLPFEERVDTVAELCRRGYADRMVLAHDASCFID---WFPPEARAAAVPNWNYRHISEDVLPALRERGVTEEQIQTMLVDNPRRYFGS-----"));
        //"SQVQTVTG-PIDVEQLGKTLVHEHVFVLGE-----------EFRQNYQAEWD----------------EEERIADAVEKLTELKSLGIDTIVDPTVIGLGRYIPRIQRIAEQV-DLNIVVATGIYTYNEVPFQFHYSGPGL----LFDGPEPMVEMFVKDIEDGIAGTGVRAGFL-KCAIEEQGLTPGVERVMRAVAQAHVRTGAPITVHTHAHSESGLEAQRVLA-EEGADLTKVVIGHSG-DSTDLDYLCELADAGSYLGMDRF-----GLDV---------LLPFEERVDTVAELCRRGYADRMVLAHDASCFID---WFPPEARAAAVPNWNYRHISEDVLPALRERGVTEEQIQTMLVDNPRRYFGS-----"));
        System.out.println(seqMap.get("N22_68"));
        // old
        assertThat(seqMap.get("N4_98"), equalTo("ARIMTVLG-PISAEELGHTLMHEHLFIDLS-----------GFKKDLDTALD-------------------ELDLACEEVKHLKARGGRTIVEVTCRGMGRDPQFLREVARET-GLNVVAATGFYQEAYHPPYVAER-----------SVEELAELLIRDIEEGIDGTDVKAGIIAEIGTSKGKITPDEEKVFRAAALAHKRTGLPISTHTSLG-TMGLEQLDLLE-EHGVDPARVVIGHMD-LTDDLDNHLALADRGAYVAFDTI-----GKDS---------YPPDEERVRLITALIERGLADRVMLSMDVTRRSH----------LKANGGYGYSYLFDHFIPALRAAGVSEAELEQMLVDNPRRFFS------"));
        //"ARIMTVLG-PISAEELGHTLMHEHLFIDLS-----------GFKKDLDTALD-------------------ELDLACEEVKHLKARGGRTIVEVTCRGMGRDPQFLREVARET-GLNVVAATGFYQEAYHPPYVAER-----------SVEELAELLIRDIEEGIDGTDVKAGIIAEIGTSKGKITPDEEKVFRAAALAHKRTGLPISTHTSLG-TMGLEQLDLLE-EHGVDPARVVIGHMD-LTDDLDNHLALADRGAYVAFDTI-----GKDS---------YPPDEERVRLITALIERGLADRVMLSMDVTRRSH----------LKANGGYGYSYLFDHFIPALRAAGVSEAELEQMLVDNPRRFFSAGGQAP"));
        System.out.println(seqMap.get("N4_98"));
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user and any consensus sequences.
        userModel.deleteUser(userController.getId(user));
    }



    @Test
    public void testDeleteAllJoints () {
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
        seqController.insertAllExtantsToDb(recon.getId(), asr.getSequencesAsNamedMap(), true);

        seqController.insertAllJointsToDb(recon.getId(), joint, false, user.getId());
        HashMap<String, String> seqs = seqController.getAllSeqs(recon.getId(), Defines.ALL);

        // Confirm we have matches
        assertThat(seqs.size(), equalTo(27));

        // Test deleting them
        seqController.deleteAllSeqsForRecon(recon.getId());

        // Check that none of them exist any more
        seqs = seqController.getAllSeqs(recon.getId(), Defines.ALL);
        assertThat(seqs.size(), equalTo(0));

        userModel.deleteUser(userController.getId(user));

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
        seqController.insertAllExtantsToDb(recon.getId(), asr.getSequencesAsNamedMap(), true);

        seqController.insertAllJointsToDb(recon.getId(), joint, true, user.getId());

        // Check these were saved in the DB
        HashMap<String, String> seqMap = seqController.getAllSeqs(recon.getId(), Defines.JOINT);

        String motif1 = "%YPPD%";

        String motif2 = "%GFLR%";

        ArrayList<String> motif1Match = seqController.findAllWithMotif(recon.getId(), motif1);

        assertThat(motif1Match.contains("N4_98"), equalTo(true));
        assertThat(motif1Match.contains("N13_97"), equalTo(false));

        ArrayList<String> motif2Match = seqController.findAllWithMotif(recon.getId(), motif2);

        assertThat(motif1Match.size(), equalTo(2));

        assertThat(motif2Match.size(), equalTo(7));

        assertThat(motif2Match.contains("N4_98"), equalTo(false));
        assertThat(motif2Match.contains("N13_97"), equalTo(true));

        userModel.deleteUser(userController.getId(user));

    }

    @Test
    public void testEdgeCounts () {
        setUpEnv();
        ASRObject asr = setAsr("10");
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
        seqController.insertAllExtantsToDb(recon.getId(), asr.getSequencesAsNamedMap(), true);

        /**
         * Test that the counts are correct
         */
        String label = "N1";
        PartialOrderGraph ancestor = joint.getGraph(label);
        // Insert it into the database
        // What we want to do here is perform two inserts -> one for the sequence so we can do
        // motif searching
        POAGJson ancsJson = new POAGJson(ancestor, true);
        String ancsStr = ancsJson.toJSON().toString();
        TreeNodeObject node = consensusController.getEdgeMappingForNode(recon.getId(), user.getId(), label);
        ConsensusObject c = new ConsensusObject(node.getSeqCountList(), node.getNumSeqsUnderNode());
        c.setJsonObject(new JSONObject(ancsStr));
        // ToDO:
        String supportedSeq = c.getSupportedSequence(true);
        System.out.println(supportedSeq);
        double[] weightArr = c.getWeightArray();
        // Check that they are as we would expect
        assertThat(weightArr[0], equalTo(1.0));
        assertThat(weightArr[1], equalTo(0.8));
        assertThat(weightArr[2], equalTo(0.8));
        assertThat(weightArr[3], equalTo(0.0));
        assertThat(weightArr[4], equalTo(0.0));
        assertThat(weightArr[5], equalTo(0.0));
        assertThat(weightArr[6], equalTo(1.0));


        assertThat("MGG---D", equalTo(supportedSeq));

        label = "N3";
        ancestor = joint.getGraph(label);
        // Insert it into the database
        // What we want to do here is perform two inserts -> one for the sequence so we can do
        // motif searching
        ancsJson = new POAGJson(ancestor, true);
        ancsStr = ancsJson.toJSON().toString();
        node = consensusController.getEdgeMappingForNode(recon.getId(), user.getId(), label);
        c = new ConsensusObject(node.getSeqCountList(), node.getNumSeqsUnderNode());
        c.setJsonObject(new JSONObject(ancsStr));

        weightArr = c.getWeightArray();
        // ToDO:
        supportedSeq = c.getSupportedSequence(true);
        // Check that they are as we would expect
        assertThat(weightArr[0], equalTo(1.0));
        assertThat(weightArr[1], equalTo(0.6666666666666666));
        assertThat(weightArr[2], equalTo(0.6666666666666666));
        assertThat(weightArr[3], equalTo(0.0));
        assertThat(weightArr[4], equalTo(0.0));
        assertThat(weightArr[5], equalTo(0.0));
        assertThat(weightArr[6], equalTo(1.0));

        supportedSeq = c.getSupportedSequence(true);
        System.out.println(supportedSeq);
        assertThat("MGG---D", equalTo(supportedSeq));

        userModel.deleteUser(userController.getId(user));
    }

}
