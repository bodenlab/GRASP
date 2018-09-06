package com.asr.grasp.model;
import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import json.JSONArray;
import json.JSONObject;
import org.springframework.stereotype.Repository;

import java.sql.*;

@Repository
public class TaxaModel extends BaseModel {

    public JSONObject queryWithJson(String query, JSONArray ids) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the array of ids
            statement.setArray(1, (Array) ids);
            ResultSet results = statement.executeQuery();
            return new JSONObject(results.getString(1));
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
    }
    /**
     * Gets the taxonomic information for protein ID's via their NCBI
     * taxonomoic identifier
     *
     * @param ids
     * @return
     */
    public JSONObject getTaxa(ArrayList<Integer> ids) {
        ResultSet results = queryOnIds("SELECT JSON_AGG(util.taxa) FROM util.taxa WHERE id IN (?);", ids);
        try {
            return new JSONObject(results.getString(1));
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
    }

    /**
     * Gets the taxanomic IDs from a protein identifier.
     * @param ids
     * @param type
     * @return
     */
    public JSONObject getTaxaIdsFromProtId(ArrayList<String> ids, String type) {
        if (type == Defines.UNIPROT) {
            return getTaxaIds(ids, "SELECT JSON_AGG(util.uniprot2taxa) FROM util.uniprot2taxa WHERE id IN (?);");
        } else if (type == Defines.PDB) {
            return getTaxaIds(ids, "SELECT JSON_AGG(util.pdb2taxa) FROM util.pdb2taxa WHERE id IN (?);");
        } else if (type == Defines.NCBI) {
            return getTaxaIds(ids, "SELECT JSON_AGG(util.ncbi2taxa) FROM util.ncbi2taxa WHERE id IN (?);");
        }
        return null;
    }

    /**
     * Gets the taxanomic IDs from a protein identifier.
     * @param ids
     * @param type
     * @return
     */
    public JSONObject getTaxaInfoFromProtId(ArrayList<String> ids, String type) {
        if (type == Defines.UNIPROT) {
            return getTaxaIds(ids, "SELECT JSON_AGG(t) FROM util.uniprot2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE id IN (?);");
        } else if (type == Defines.PDB) {
            return getTaxaIds(ids, "SELECT JSON_AGG(t) FROM util.pdb2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE id IN (?);");
        } else if (type == Defines.NCBI) {
            return getTaxaIds(ids, "SELECT JSON_AGG(t) FROM util.ncbi2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE id IN (?);");
        }
        return null;
    }



    /**
     * Inserts taxonomic information into the database.
     *
     * It needs to direct this base on the type
     * @param ids
     * @param type
     * @return
     */
    public String insertTaxaIdToProtId(JSONObject ids, String type) {
        if (type == Defines.UNIPROT) {
            return insertTaxaIds(ids, "INSERT INTO util.uniprot2taxa(id, taxa_id) VALUES(?, ?);");
        } else if (type == Defines.PDB) {
            return insertTaxaIds(ids, "INSERT INTO util.pdb2taxa(id, taxa_id) VALUES(?, ?);");
        } else if (type == Defines.NCBI) {
            return insertTaxaIds(ids, "INSERT INTO util.ncbi2taxa(id, taxa_id) VALUES(?, ?);");
        }
        return null;
    }

    /**
     * Gets the taxonomic information for protein ID's via their NCBI, UniProt or PDB
     * identifier.
     *
     * @param ids
     * @return
     */
    public JSONObject getTaxaIds(ArrayList<String> ids, String query) {
        ResultSet results = queryOnStringIds(query, ids);
        try {
            return new JSONObject(results.getString(1));
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
    }


    /**
     * Insert a JSON list of protein IDs -> NCBI taxonomic IDs into the database.
     *
     * Returns null if no error otherwise the error message.
     * @param ids
     * @param query
     * @return
     */
    public String insertTaxaIds(JSONObject ids, String query) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);

            for(String key : ids.keySet()) {
                statement.setString(1, key);            // Protein ids are strings
                statement.setInt(2, (int) ids.get(key)); // NCBI ids are ints
                statement.executeUpdate();
            }
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return "Unable to process all inserts.";
        }
        return null;
    }
}
