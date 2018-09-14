package com.asr.grasp;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import com.asr.grasp.objects.ASRObject;
import com.asr.grasp.objects.UserObject;
import java.util.ArrayList;
import java.util.HashMap;
import json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class TaxaControllerTest extends BaseTest {
    UserObject userOwner;
    ASRObject asr;

    /**
     * Create the required objects.
     */
    public void setUpTaxaEnv() {
        userOwner = createAndRegisterUser("testuser","testpassword");
        
        asr = setAsr("Name_test_with_no_error_9");

        // Also want to delete the ID's so we can re-add them each time incase these were added
        // during user testing.
        taxaController.deleteTaxaIds(asr.getExtentNames());
    }

    /**
     * Clean up after running each test
     */
    public void tearDownTaxaEnv() {
        // Delete the user to clean up the database will automatically delete
        // any reconstructions associated with the user.
        userModel.deleteUser(userController.getId(userOwner));

        // Also want to delete the ID's so we can re-add them each time.
        taxaController.deleteTaxaIds(asr.getExtentNames());
    }

    /**
     * Tests inserting
     */
    @Test
    public void testGetTaxaIds() {
        /**
         * Tests inserting and getting the IDs from a MSA and Tree.
         */
        setUpEnv();
        // Want to create a recon that has taxonomic info
        setUpTaxaEnv();
        HashMap<String, ArrayList<String>> proteinNames = asr.getExtentNames();
        JSONObject ids = taxaController.getNonExistIdsFromProtId(proteinNames);

        // We want the correct string for when we have all the ids existing in the database.
        String allExist = "{\"uniprot_mapping\":{\"A0A1A8UQI7\":105023,\"Q97BK5\":273116,\"A7ZPW1\":331111,\"Q12181\":559292,\"A8ZWU7\":96561},\"ncbi_mapping\":{\"XP_016807466\":9598,\"XP_002815089\":9601,\"PRD21445\":6915,\"ETE67196\":8665},\"uniprot\":false,\"ncbi\":false}";
        // None exist is the string that is returned when we have no existing ids and the JS will
        // have to add them to the DB.
        String noneExist = "{\"uniprot_mapping\":{},\"ncbi_mapping\":{},\"uniprot\":[\"A0A1A8UQI7\",\"A8ZWU7\",\"A7ZPW1\",\"Q97BK5\",\"Q12181\"],\"ncbi\":[\"PRD21445\",\"XP_016807466\",\"XP_002815089\",\"ETE67196\"]}";

        // The to Save string that is returned from the front end
        String toSave = "{\"toSave\":true,\"NCBI\":[],\"UNIPROT\":[],\"ncbi\":{\"PRD21445\":\"6915\",\"XP_016807466\":\"9598\",\"XP_002815089\":\"9601\",\"ETE67196\":\"8665\"},\"uniprot\":{\"A0A1A8UQI7\":\"105023\",\"A8ZWU7\":\"96561\",\"A7ZPW1\":\"331111\",\"Q97BK5\":\"273116\",\"Q12181\":\"559292\"}}";

        // Convert this to a JSON obj
        JSONObject dataJson = new JSONObject(toSave);
        // Check if we have anything to save
        String err = null;
        if ((Boolean)dataJson.get("toSave") == true) {
            err = taxaController.insertTaxaIds(dataJson);
        }
        assertThat(err, equalTo(null));
        // Check initially we have no ids in our DB
        assertThat(ids.toString(), equalTo(noneExist));

        // Now we want to  check that the nonExistIds are empty (allExist string)
        ids = taxaController.getNonExistIdsFromProtId(proteinNames);
        assertThat(ids.toString(), equalTo(allExist));

        // Tear down the environmemnt
        tearDownTaxaEnv();
    }


    @Test
    public void testGetTaxaInfo() {
        /**
         * Tests we're able to get taxonomic information.
         *
         * Given a list, we want to return a JSON object that contains two arrays, one with
         * taxanomic information (those which contained mappings) and one which is a list of
         * the IDs that didn't contain taxonomic information.
         *      1. Gives list of ID's
         *      2. Returns JSON object with
         *              a. Object {id: taxonomic_info}
         *              b. Array {ids with no taxonomic info}
         */
        setUpEnv();
        String taxaInfo = "{\"uniprot\":\"[{\\\"id\\\":105023,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Chordata\\\",\\\"class_t\\\":\\\"Actinopteri\\\",\\\"order_t\\\":\\\"Cyprinodontiformes\\\",\\\"family_t\\\":\\\"Nothobranchiidae\\\",\\\"genus\\\":\\\"Nothobranchius\\\",\\\"species\\\":\\\"Nothobranchius furzeri\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"Teleostei\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"Metazoa\\\"}, \\n {\\\"id\\\":273116,\\\"superkingdom\\\":\\\"Archaea\\\",\\\"phylum\\\":\\\"Euryarchaeota\\\",\\\"class_t\\\":\\\"Thermoplasmata\\\",\\\"order_t\\\":\\\"Thermoplasmatales\\\",\\\"family_t\\\":\\\"Thermoplasmataceae\\\",\\\"genus\\\":\\\"Thermoplasma\\\",\\\"species\\\":\\\"Thermoplasma volcanium\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"\\\"}, \\n {\\\"id\\\":331111,\\\"superkingdom\\\":\\\"Bacteria\\\",\\\"phylum\\\":\\\"Proteobacteria\\\",\\\"class_t\\\":\\\"Gammaproteobacteria\\\",\\\"order_t\\\":\\\"Enterobacterales\\\",\\\"family_t\\\":\\\"Enterobacteriaceae\\\",\\\"genus\\\":\\\"Escherichia\\\",\\\"species\\\":\\\"Escherichia coli\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"\\\"}, \\n {\\\"id\\\":559292,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Ascomycota\\\",\\\"class_t\\\":\\\"Saccharomycetes\\\",\\\"order_t\\\":\\\"Saccharomycetales\\\",\\\"family_t\\\":\\\"Saccharomycetaceae\\\",\\\"genus\\\":\\\"Saccharomyces\\\",\\\"species\\\":\\\"Saccharomyces cerevisiae\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"Fungi\\\"}, \\n {\\\"id\\\":96561,\\\"superkingdom\\\":\\\"Bacteria\\\",\\\"phylum\\\":\\\"Proteobacteria\\\",\\\"class_t\\\":\\\"Deltaproteobacteria\\\",\\\"order_t\\\":\\\"Desulfobacterales\\\",\\\"family_t\\\":\\\"Desulfobacteraceae\\\",\\\"genus\\\":\\\"Desulfococcus\\\",\\\"species\\\":\\\"Desulfococcus oleovorans\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"\\\"}]\",\"ncbi\":\"[{\\\"id\\\":9598,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Chordata\\\",\\\"class_t\\\":\\\"Mammalia\\\",\\\"order_t\\\":\\\"Primates\\\",\\\"family_t\\\":\\\"Hominidae\\\",\\\"genus\\\":\\\"Pan\\\",\\\"species\\\":\\\"Pan troglodytes\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"Simiiformes\\\",\\\"kingdom\\\":\\\"Metazoa\\\"}, \\n {\\\"id\\\":9601,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Chordata\\\",\\\"class_t\\\":\\\"Mammalia\\\",\\\"order_t\\\":\\\"Primates\\\",\\\"family_t\\\":\\\"Hominidae\\\",\\\"genus\\\":\\\"Pongo\\\",\\\"species\\\":\\\"Pongo abelii\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"Simiiformes\\\",\\\"kingdom\\\":\\\"Metazoa\\\"}, \\n {\\\"id\\\":6915,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Arthropoda\\\",\\\"class_t\\\":\\\"Arachnida\\\",\\\"order_t\\\":\\\"Araneae\\\",\\\"family_t\\\":\\\"Nephilidae\\\",\\\"genus\\\":\\\"Nephila\\\",\\\"species\\\":\\\"Nephila clavipes\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"\\\",\\\"kingdom\\\":\\\"Metazoa\\\"}, \\n {\\\"id\\\":8665,\\\"superkingdom\\\":\\\"Eukaryota\\\",\\\"phylum\\\":\\\"Chordata\\\",\\\"class_t\\\":\\\"\\\",\\\"order_t\\\":\\\"Squamata\\\",\\\"family_t\\\":\\\"Elapidae\\\",\\\"genus\\\":\\\"Ophiophagus\\\",\\\"species\\\":\\\"Ophiophagus hannah\\\",\\\"cohort\\\":\\\"\\\",\\\"forma\\\":\\\"\\\",\\\"infraclass\\\":\\\"\\\",\\\"infraorder\\\":\\\"Serpentes\\\",\\\"kingdom\\\":\\\"Metazoa\\\"}]\"}";
        // The to Save string that is returned from the front end used to add the ids to the DB
        String toSave = "{\"toSave\":true,\"NCBI\":[],\"UNIPROT\":[],\"ncbi\":{\"PRD21445\":\"6915\",\"XP_016807466\":\"9598\",\"XP_002815089\":\"9601\",\"ETE67196\":\"8665\"},\"uniprot\":{\"A0A1A8UQI7\":\"105023\",\"A8ZWU7\":\"96561\",\"A7ZPW1\":\"331111\",\"Q97BK5\":\"273116\",\"Q12181\":\"559292\"}}";

        setUpTaxaEnv();

        // Convert this to a JSON obj
        JSONObject dataJson = new JSONObject(toSave);
        // Check if we have anything to save, ignore return as this is tested above
        if ((Boolean)dataJson.get("toSave") == true) {
            taxaController.insertTaxaIds(dataJson);
        }

        // Check when we get the ids it is correct.
        assertThat(taxaController.getTaxaInfoFromProtIds(asr.getExtentNames()).toString(), equalTo(taxaInfo));

        // tear down taxaEnv
        tearDownTaxaEnv();
    }

}
