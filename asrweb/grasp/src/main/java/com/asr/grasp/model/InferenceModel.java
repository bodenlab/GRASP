package com.asr.grasp.model;

import com.asr.grasp.utils.Defines;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import json.JSONArray;
import org.springframework.stereotype.Repository;
import reconstruction.Inference;

/**
 * This is a helper model that stores the inferences in a separate table.
 * As the inferences are very large they can't be stored as a JSON representation.
 *
 * Thus this reduces the load on the server.
 *
 * Written by ariane @ 30/10/2018
 */
@Repository
public class InferenceModel extends BaseModel {

    // Second level variables in the inference object
    private static final int ID = 0;
    public static final int TRANSITIONS = 2;
    public static final int BASE = 1;

    /**
     * Tells us where we can expect each value for the results from the
     * model.
     */
    final ColumnEntry idEntry = new ColumnEntry(1, "id", Defines.INT);
    final ColumnEntry rIdEntry = new ColumnEntry(2, "r_id", Defines
            .INT);
    final ColumnEntry nodeLabel = new ColumnEntry(3, "node_label", Defines
            .INT);
    final ColumnEntry infEntry = new ColumnEntry(4, "inference", Defines
            .STRING);

    /**
     * Saves a consensus sequence
     * @param reconId
     * @return
     */
//    public boolean insertListIntoDb (int reconId, Map<String, List<Inference>> inferences) {
//        String query = "INSERT INTO web.inferences(r_id, node_label, inference) VALUES(?,?,?);";
//
//        try {
//            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
//                    dbPassword);
//            con.setAutoCommit(false);
//            PreparedStatement statement = con.prepareStatement(query);
//            for (String nodeLabel: inferences.keySet()) {
//                for (Inference inf: inferences.get(nodeLabel)) {
//                    statement.setInt(1, reconId);
//                    statement.setString(2, nodeLabel);
//                    statement.setString(3, inf.getAsJSON().toString());
//                    statement.addBatch();
//                }
//            }
//            int[] count = statement.executeBatch();
//            con.commit();
//            con.close();
//            return true;
//        } catch (Exception e) {
//            System.out.println("UNABLE TO INSTERT: " + nodeLabel + e.getMessage());
//            return false;
//        }
//    }

    /**
     * Saves a consensus sequence
     * @param reconId
     * @param nodeLabel
     * @param inference
     * @return
     */
    public boolean insertIntoDb (int reconId, String nodeLabel, String inference) {
        String query = "INSERT INTO web.inferences(r_id, node_label, inference) VALUES(?,?,?);";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            statement.setString(3, inference);
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println("UNABLE TO INSTERT: " + nodeLabel + e.getMessage());
            return false;
        }
    }

    /**
     * Creates an inference from the JSON String
     * @param infJSON
     * @return
     */
    public Inference convertJSONToInference(JSONArray infJSON) {
        List<Integer> transitions = new ArrayList<>();
        JSONArray jTransitions = infJSON.getJSONArray(TRANSITIONS);
        for (int j = 0; j < jTransitions.length(); j++)
            transitions.add(jTransitions.getInt(j));

        Character base = (char)infJSON.getInt(BASE);
        return new Inference(infJSON.getInt(ID), base, transitions);

    }

    /**
     * Function that gets the inferences for a given reconstruction
     *
     * @param reconId
     * @return
     */
    public String getInferenceForLabel(int reconId, String nodeLabel) {
        String query = "SELECT inference FROM web.inferences WHERE r_id=? AND node_label=?;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            con.close();
            if (results != null) {
                while (results.next()) {
                    /**
                     * We need to make an inference out of each of the Strings we got back
                     */
                    return results.getString(1);
                }
            }
        } catch (Exception e) {
            System.out.println("Unable get inference mapping.");
        }
        return null;
    }

    /**
     * Function that gets the inferences for a given reconstruction
     *
     * @param reconId
     * @return
     */
    public Map<String, List<Inference>> getInferences(int reconId) {
        String query = "SELECT node_label, inference FROM web.inferences WHERE r_id=?;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            con.close();
            if (results != null) {
                /**
                 * We need to make an inference out of each of the Strings we got back
                 */
                Map<String, List<Inference>> inferences = new HashMap<>();

                while (results.next()) {
                    // Get the ID stored in the first column
                    String inference = results.getString(2);
                    String nodeLabel = results.getString(1);
                    JSONArray infJSON = new JSONArray(inference);
                    List<Inference> thisInf = inferences.get(nodeLabel);
                    if (thisInf == null) {
                        thisInf = new ArrayList<>();
                    }
                    thisInf.add(convertJSONToInference((JSONArray)infJSON));
                    inferences.put(nodeLabel, thisInf);
                }
                return inferences;
            }
        } catch (Exception e) {
            System.out.println("Unable create inference mapping.");
        }
        return null;
    }

}