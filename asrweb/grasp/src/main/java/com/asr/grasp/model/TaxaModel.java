package com.asr.grasp.model;

import com.asr.grasp.utils.Defines;
import java.util.ArrayList;
import json.JSONObject;
import org.springframework.stereotype.Repository;

import java.sql.*;

@Repository
public class TaxaModel extends BaseModel {

    /**
     * Gets the taxonomic information for protein ID's via their NCBI taxonomoic identifier
     */
    public String getTaxa(ArrayList<Integer> ids) {
        ResultSet results = query("SELECT JSON_AGG(taxa) FROM util.taxa WHERE id IN (" + buildStrFromArr(ids) + ");");
        System.out.println("SELECT JSON_AGG(taxa) FROM util.taxa WHERE id IN (" + buildStrFromArr(ids) + ");");
        try {
            if (results.next()) {
                String res = results.getString(1);
                System.out.println(res);
                return res;
            }
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
        return null;
    }


    /**
     * Private helper function to build an array from IDs.
     */
    private String buildStrFromArr(ArrayList vals) {
        String valStr = "";
        for (int i = 0; i < vals.size(); i++) {
            if (i != 0) {
                valStr += "',";
            }
            valStr += "'" + vals.get(i);
            if (i == vals.size() - 1) {
                valStr += "'";
            }
        }
        return valStr;
    }

    /**
     * Gets the taxanomic IDs from a protein identifier.
     */
    public ArrayList<String> getNonExistIdsFromProtId(ArrayList<String> ids, String type) {
        if (type == Defines.UNIPROT) {
            return getStrList(
                    query("SELECT id FROM util.uniprot2taxa WHERE id IN (" + buildStrFromArr(ids)
                            + ");"));
        } else if (type == Defines.PDB) {
            return getStrList(
                    query("SELECT id FROM util.pdb2taxa WHERE id IN (" + buildStrFromArr(ids)
                            + ");"));
        } else if (type == Defines.NCBI) {
            return getStrList(
                    query("SELECT id FROM util.ncbi2taxa WHERE id IN (" + buildStrFromArr(ids)
                            + ");"));
        }
        return null;
    }

    /**
     * Gets the taxanomic IDs from a protein identifier.
     */
    public JSONObject getTaxaInfoFromProtId(ArrayList<String> ids, String type) {
        if (type == Defines.UNIPROT) {
            return getTaxaIds(
                    "SELECT JSON_AGG(t) FROM util.uniprot2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE p.id IN ("
                            + buildStrFromArr(ids) + ");");
        } else if (type == Defines.PDB) {
            return getTaxaIds(
                    "SELECT JSON_AGG(t) FROM util.pdb2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE p.id IN ("
                            + buildStrFromArr(ids) + ");");
        } else if (type == Defines.NCBI) {
            return getTaxaIds(
                    "SELECT JSON_AGG(t) FROM util.ncbi2taxa AS p LEFT JOIN util.taxa AS t ON t.id=p.taxa_id WHERE p.id IN ("
                            + buildStrFromArr(ids) + ");");
        }
        return null;
    }


    /**
     * Inserts taxonomic information into the database.
     *
     * It needs to direct this base on the type
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
     * Gets the taxonomic information for protein ID's via their NCBI, UniProt or PDB identifier.
     */
    public JSONObject getTaxaIds(String query) {
        ResultSet results = query(query);
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
     */
    public String insertTaxaIds(JSONObject ids, String query) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);

            for (String key : ids.keySet()) {
                statement.setString(1, key);            // Protein ids are strings
                statement.setInt(2, Integer.parseInt(ids.get(key).toString())); // NCBI ids are ints
                statement.executeUpdate();
            }
        } catch (Exception e) {
            System.err.println(e.getMessage());
            return "Unable to process all inserts.";
        }
        return null;
    }
}
