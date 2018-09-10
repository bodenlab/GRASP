package com.asr.grasp.controller;

import com.asr.grasp.model.TaxaModel;
import java.util.HashMap;
import json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;

@Service
public class TaxaController {

    @Autowired
    TaxaModel taxaModel;

    /**
     * Gets the NCBI taxanomic information for a list of protein identifiers.
     * The identifiers can be either:
     *      1. NCBI
     *      2. PDB
     *      3. UNIPROT
     * @param ids
     * @return
     */
    public JSONObject getTaxaInfoFromProtIds(HashMap<String, ArrayList<String>> ids) {
        JSONObject taxaInfo = new JSONObject();
        for (String key: ids.keySet()) {
            taxaInfo.put(key, taxaModel.getTaxaInfoFromProtId(ids.get(key), key));
        }
        return taxaInfo;
    }

    /**
     * Gets the NCBI taxanomic IDs for a list of protein identifiers.
     * The identifiers can be either:
     *      1. NCBI
     *      2. PDB
     *      3. UNIPROT
     * @param ids
     * @return
     */
    public JSONObject getNonExistIdsFromProtId(HashMap<String, ArrayList<String>> ids) {
        JSONObject taxaInfo = new JSONObject();
        for (String key: ids.keySet()) {
            ArrayList<String> ret = taxaModel.getNonExistIdsFromProtId(ids.get(key), key);
            ArrayList<String> n = new ArrayList<>(ids.get(key));
            n.remove(ret);
            //ids.get(key).removeAll(taxaModel.getNonExistIdsFromProtId(ids.get(key), key));
            taxaInfo.put(key, n);
        }
        return taxaInfo;
    }

    /**
     * Gets the taxonomic information for a list of the taxonomic identifiers.
     * @param ids
     * @return
     */
    public String getTaxaInfo(ArrayList<Integer> ids) {
        return taxaModel.getTaxa(ids);
    }

    /**
     * Inserts
     * @param ids
     * @return
     */
    public String insertTaxaIds(JSONObject ids) {
        for (String type: Defines.SUPPORTED_PROT) {
            String err = taxaModel.insertTaxaIdToProtId((JSONObject)ids.get(type), type);
            if (err != null) {
                return err;
            }
        }
        return null;
    }

    /**
     * ------------------------------------------------------------------------
     *          The following are to set the test env.
     * ------------------------------------------------------------------------
     */
    public void setTaxaModel(TaxaModel taxaModel) {
        this.taxaModel = taxaModel;
    }
}
