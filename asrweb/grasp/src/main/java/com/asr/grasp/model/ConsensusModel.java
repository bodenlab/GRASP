package com.asr.grasp.model;

import com.asr.grasp.utils.Defines;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import org.springframework.stereotype.Repository;

@Repository
public class ConsensusModel extends BaseModel {
    /**
     * Tells us where we can expect each value for the results from the
     * model.
     */
    final ColumnEntry idEntry = new ColumnEntry(1, "id", Defines.INT);
    final ColumnEntry rIdEntry = new ColumnEntry(2, "r_id", Defines
            .INT);
    final ColumnEntry nodeLabel = new ColumnEntry(3, "node_label", Defines
            .INT);
    final ColumnEntry seqEntry = new ColumnEntry(4, "seq", Defines
            .STRING);
    // Tells us whether it was a joint or marginal reconstruction
    final ColumnEntry method = new ColumnEntry(5, "r_method", Defines
            .INT);


    /**
     * Saves a consensus sequency
     * @param reconId
     * @param nodeLabel
     * @param seq
     * @return
     */
    public boolean insertIntoDb (int reconId, String nodeLabel, String seq, int method) {
        String query = "INSERT INTO web.consensus(r_id, node_label, " +
                "seq, r_method) VALUES(?,?,?,?);";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            statement.setString(3, seq);
            statement.setInt(4, method);
            statement.executeUpdate();
            return true;
        } catch (Exception e) {
            System.out.println("UNABLE TO INSTERT: " + nodeLabel + e.getMessage());
            return false;
        }
    }


    /**
     * Function that gets all consensus sequences for a given reconstruction and
     * method. Method can either be Joint, Marginal or All.
     *
     * @param reconId
     * @param method
     * @return
     */
    public HashMap<String, String> getAllConsensus (int reconId, int method) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            // If they haven't defined a method then we want to return both joint and marginal
            if (method == Defines.ALL) {
                String query = "SELECT node_label, seq FROM web.consensus WHERE r_id=?;";
                statement = con.prepareStatement(query);
                statement.setInt(1, reconId);
            } else if (method == Defines.JOINT || method == Defines.MARGINAL) {
                String query = "SELECT node_label, seq FROM web.consensus WHERE r_id=? AND r_method=?;";
                statement = con.prepareStatement(query);
                statement.setInt(1, reconId);
                statement.setInt(2, method);
            } else {
                return null;
            }
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            if (results != null) {
                /* The node label is in position 1 which we want to be the key and the
                 * sequence is in position 2 of the query above which we want to be the value */
                return getStrStrMap(results, 1, 2);
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map, issue with Statment in getAllConsensus");
        }
        return null;
    }

    /**
     * Deletes a consensus sequence based on the node label and the reconstruction
     * id.
     * ToDo: NOT USED.
     * @param reconId
     * @return
     */
    public boolean deleteFromDb (int reconId, String nodeLabel) {
        String query = "DELETE from web.consensus WHERE r_id=? AND nodeLabel=?;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            statement.executeUpdate();
            return true;
        } catch (Exception e) {
            return false;
        }
    }


    /**
     * Deletes all consensus sequences from the database based on
     * a reconstruction id.
     * @param rId
     * @return
     */
    public String deleteFromDb (int rId) {
        String query = "DELETE from web.consensus WHERE r_id=?;";
        if (deleteOnId(query, rId) == false) {
            return "fail";
        }
        return null;
    }

    /**
     * Deletes all consensus sequences from the database that haven't been touched
     * in 30days.
     *
     * ToDo:
     * @return
     */
    public void deleteFromDbOnDate () {
        String query = "";//DELETE from web.consensus WHERE ??;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.executeUpdate();
        } catch (Exception e) {
        }
    }


    /**
     * Finds the node labels from a reconstruction that have a particular
     * motif.
     * @param reconId
     * @param motif
     * @return
     */
    public ArrayList<String> findNodesWithMotif (int reconId, String motif) {
        motif = "%" + motif + "%"; // Add in the wild cards
        String query = "SELECT node_label FROM web.consensus WHERE r_id=? AND seq LIKE ?;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, motif);
            ResultSet results = statement.executeQuery();
            if (results == null) {
                return null;
            }
            return getStrList(results);
        } catch (Exception e) {
            System.out.println("Unable to get matches for motifs: " + motif);
            return null;
        }
    }

    /**
     * Method to check if the user has performed a new reconstruction - as such - have
     * they had all their consensus seqs saved.
     *
     * @param reconId
     * @return
     */
    public boolean hasReconsAncestorsBeenSaved (int reconId) {
        String query = "SELECT id FROM web.consensus WHERE r_id=? LIMIT 1;";
        return getId(queryOnId(query, reconId)) != Defines.FALSE;
    }
}

