package com.asr.grasp;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;

import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import json.JSONArray;
import json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = {GraspConfig.class})
public class TaxaControllerTest extends BaseTest {

    /**
     * Helper method to facilitate creating JSON objects.
     */
    public JSONObject createInserObj() {
        JSONObject insertObj = new JSONObject();
        JSONObject uniprot = new JSONObject();
        JSONObject ncbi = new JSONObject();

        uniprot.put("uniprot", 559292);
        ncbi.put("ncbi", 55922);
        insertObj.put(Defines.NCBI, ncbi);
        insertObj.put(Defines.UNIPROT, uniprot);
        return insertObj;
    }

    /**
     * Helper method to create a JSON array of Ids
     */
    public ArrayList<Integer> createIdArray() {
        ArrayList<Integer> ids = new ArrayList<>();

        ids.add(559292);
        ids.add(55922);

        return ids;
    }

    /**
     * Helper method to facilitate creating JSON objects.
     */
    public void deleteObj() {

    }

    @Test
    public void testInsertTaxa() {
        /**
         * Tests we can insert taxonomic information into the database.
         *
         * We want to be able to do this using a JSON object from the front end that we got
         * from NCBI or Uniprot.
         */
        setUpEnv();
        JSONObject insertObj = createInserObj();
        String err = taxaController.insertTaxaIds(insertObj);

        // Confirm we have no errors
        assertThat(err, is(equalTo(null)));

        // Clean up the environment
        deleteObj();
    }

    @Test
    public void testGetTaxa() {
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
        ArrayList<Integer> ids = createIdArray();
        JSONObject retVal = taxaController.getTaxaInfo(ids);
        System.out.println(retVal.toString());
    }

}
