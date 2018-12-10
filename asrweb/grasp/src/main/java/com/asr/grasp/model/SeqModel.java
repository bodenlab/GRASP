package com.asr.grasp.model;

import api.PartialOrderGraph;
import com.asr.grasp.utils.Defines;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import reconstruction.ASRPOG;
import vis.POAGJson;

@Repository
public class SeqModel extends BaseModel {

    /**
     * Tells us where we can expect each value for the results from the model.
     */
    final ColumnEntry idEntry = new ColumnEntry(1, "id", Defines.INT);
    final ColumnEntry rIdEntry = new ColumnEntry(2, "r_id", Defines
            .INT);
    final ColumnEntry nodeLabel = new ColumnEntry(3, "node_label", Defines
            .INT);
    final ColumnEntry seqEntry = new ColumnEntry(4, "seq", Defines
            .STRING);
    // Tells us whether it was a joint or marginal reconstruction or an extent
    final ColumnEntry seqType = new ColumnEntry(5, "s_type", Defines
            .INT);

    public List<String> insertAllJointsToDb(int reconId, ASRPOG asrInstance, boolean gappy) {
        List<String> labels = asrInstance.getAncestralSeqLabels();
        List<String> insertedLabels = new ArrayList<>();
        String queryInf = "INSERT INTO web.inferences(r_id, node_label, inference) VALUES(?,?,?);";
        String querySeq = "INSERT INTO web.sequences(r_id, node_label, " +
                "seq, s_type) VALUES(?,?,?,?);";
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statementInf = con.prepareStatement(queryInf);
            PreparedStatement statementSeq = con.prepareStatement(querySeq);
            con.setAutoCommit(false);
            for (String label : labels) {
                long startTime = System.nanoTime();
                PartialOrderGraph ancestor = asrInstance.getGraph(label);
                // Insert it into the database
                // What we want to do here is perform two inserts -> one for the sequence so we can do
                // motif searching
                System.out.println( "Time to get ancs:" + ((System.nanoTime() - startTime) / 1000000000.0));
                startTime = System.nanoTime();
                POAGJson ancsJson = new POAGJson(ancestor, gappy);
                String ancsStr = ancsJson.toJSON().toString();
                System.out.println(
                        "Time to make poagjson:" + ((System.nanoTime() - startTime)
                                / 1000000000.0));
                startTime = System.nanoTime();
                // Add the
                statementInf.setInt(1, reconId);
                statementInf.setString(2, label);
                statementInf.setString(3, ancsStr);
                statementInf.addBatch();

                String seq = ancsJson.getConsensusSeq();
                statementSeq.setInt(1, reconId);
                statementSeq.setString(2, label);
                if (!gappy) {
                    statementSeq.setString(3, seq.replaceAll("-", ""));
                } else {
                    statementSeq.setString(3, seq);
                }
                statementSeq.setInt(4, Defines.JOINT);
                statementSeq.addBatch();

                System.out.println("Time to make insert twice:" + ((System.nanoTime() - startTime)
                        / 1000000000.0));

                System.out.print(label + ", ");
            }
            // Execute the statements
            statementInf.execute();
            statementSeq.execute();
            con.commit();
            System.out.println("\n Finished Inserting Joint recons.");
        } catch (Exception e) {
            System.out.println(e.getMessage());
            insertedLabels = null;
        }
        closeCon(con);
        return insertedLabels;
    }

    /**
     * Saves a consensus sequence
     */
    public boolean insertIntoDb(int reconId, String nodeLabel, String seq, int method,
            boolean gappy) {
        String query = "INSERT INTO web.sequences(r_id, node_label, " +
                "seq, s_type) VALUES(?,?,?,?);";
        Connection con = null;
        boolean result = false;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            if (!gappy) {
                statement.setString(3, seq.replaceAll("-", ""));
            } else {
                statement.setString(3, seq);
            }
            statement.setInt(4, method);
            statement.executeUpdate();
            result = true;
        } catch (Exception e) {
            System.out.println("UNABLE TO INSTERT: " + nodeLabel + e.getMessage());
        }
        closeCon(con);
        return result;
    }

    /**
     * Function that gets all extent sequences for a given reconstruction.
     */
    public HashMap<String, String> getAllExtents(int reconId) {
        String query = "SELECT node_label, seq FROM web.sequences WHERE r_id=? AND s_type=?;";
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setInt(2, Defines.EXTANT);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            closeCon(con);
            if (results != null) {
                while (results.next()) {
                    /* The node label is in position 1 which we want to be the key and the
                     * sequence is in position 2 of the query above which we want to be the value */
                    return getStrStrMap(results, 1, 2);
                }
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map, issue with Statment in getAllExtents");
        }
        closeCon(con);
        return null;
    }

    /**
     * Function that gets all consensus sequences for a given reconstruction and method. Method can
     * either be Joint, Marginal or All.
     */
    public ArrayList<String> getAllSeqLabels(int reconId, int method) {
        String query;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            // If they haven't defined a method then we want to return both joint and marginal
            if (method == Defines.ALL) {
                query = "SELECT node_label FROM web.sequences WHERE r_id=? AND s_type!=?;";
                method = Defines.EXTANT;
            } else if (method == Defines.JOINT || method == Defines.MARGINAL
                    || method == Defines.EXTANT) {
                query = "SELECT node_label FROM web.sequences WHERE r_id=? AND s_type=?;";
            } else {
                return null;
            }
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setInt(2, method);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            closeCon(con);
            if (results != null) {
                /* The node label is in position 1 which we want to be the key and the
                 * sequence is in position 2 of the query above which we want to be the value */
                return getStrList(results);
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map, issue with Statment in getAllConsensus");
        }
        closeCon(con);
        return null;
    }

    /**
     * Function that gets all consensus sequences for a given reconstruction and method. Method can
     * either be Joint, Marginal or All.
     */
    public HashMap<String, String> getAllSeqs(int reconId, int method) {
        String query;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            // If they haven't defined a method then we want to return both joint and marginal
            if (method == Defines.ALL) {
                query = "SELECT node_label, seq FROM web.sequences WHERE r_id=? AND s_type!=?;";
                method = Defines.EXTANT;
            } else if (method == Defines.JOINT || method == Defines.MARGINAL
                    || method == Defines.EXTANT) {
                query = "SELECT node_label, seq FROM web.sequences WHERE r_id=? AND s_type=?;";
            } else {
                return null;
            }
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setInt(2, method);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            closeCon(con);
            if (results != null) {
                /* The node label is in position 1 which we want to be the key and the
                 * sequence is in position 2 of the query above which we want to be the value */
                return getStrStrMap(results, 1, 2);
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map, issue with Statment in getAllConsensus");
        }
        closeCon(con);
        return null;
    }

    /**
     * Function that gets all consensus sequences for a given reconstruction and method. Method can
     * either be Joint, Marginal or All.
     */
    public String getSeqByLabel(String label, int reconId, int method) {
        String query;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement;
            // If they haven't defined a method then we want to return both joint and marginal
            if (method == Defines.ALL) {
                query = "SELECT seq FROM web.sequences WHERE r_id=? AND node_label=? AND s_type!=?;";
                method = Defines.EXTANT;
            } else if (method == Defines.JOINT || method == Defines.MARGINAL
                    || method == Defines.EXTANT) {
                query = "SELECT seq FROM web.sequences WHERE r_id=? AND node_label=? AND s_type=?;";
            } else {
                return null;
            }
            statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, label);
            statement.setInt(3, method);
            // Run the query and return a HashMap with nodeLabels as keys and String as values
            ResultSet results = statement.executeQuery();
            closeCon(con);
            if (results != null) {
                /* The node label is in position 1 which we want to be the key and the
                 * sequence is in position 2 of the query above which we want to be the value */
                return getStrList(results).get(0);
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map, issue with Statment in getAllConsensus");
        }
        closeCon(con);
        return null;
    }


    /**
     * Update a sequence in the Database. This is used if our method of finding the consensus
     * has been updated.
     *
     * @param reconId
     * @param seq
     * @param gappy
     * @param method
     * @return
     */
    public boolean updateConsensusSeq(int reconId, String seq, String nodeLabel, boolean gappy, int method) {
        String query = "UPDATE web.sequences SET seq=? WHERE r_id=? AND node_label=? AND s_type=?;";
        boolean result = false;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(2, reconId);
            statement.setString(1, nodeLabel);
            if (!gappy) {
                statement.setString(3, seq.replaceAll("-", ""));
            } else {
                statement.setString(3, seq);
            }
            statement.setInt(4, method);
            statement.executeUpdate();
            result = true;
        } catch (Exception e) {
            System.out.println("UNABLE TO UPDATE THE CONSENSUS SEQ: " + nodeLabel + e.getMessage());
        }
        closeCon(con);
        return result;
    }

    /**
     * Deletes a consensus sequence based on the node label and the reconstruction id. ToDo: NOT
     * USED.
     */
    public boolean deleteFromDb(int reconId, String nodeLabel) {
        String query = "DELETE FROM web.sequences WHERE r_id=? AND nodeLabel=?;";
        boolean result = false;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, nodeLabel);
            statement.executeUpdate();
            result = true;
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        closeCon(con);
        return result;
    }


    /**
     * Deletes all consensus sequences from the database based on a reconstruction id.
     */
    public String deleteFromDb(int rId) {
        String query = "DELETE from web.sequences WHERE r_id=?;";
        if (deleteOnId(query, rId) == false) {
            return "fail";
        }
        return null;
    }

    /**
     * Deletes all consensus sequences from the database that haven't been touched in 30days.
     *
     * ToDo:
     */
    public void deleteFromDbOnDate() {
        String query = "";//DELETE from web.consensus WHERE ??;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.executeUpdate();
            con.close();
        } catch (Exception e) {
        }
    }


    /**
     * Finds the node labels from a reconstruction that have a particular motif.
     *
     * The similar to postgres flag allows you do add in regex's, for example:
     * '%M-*TP%' will look for all sequences that have a M, any number of gaps followed by TP.
     */
    public ArrayList<String> findNodesWithMotif(int reconId, String motif) {
        String query = "SELECT node_label FROM web.sequences WHERE r_id=? AND seq SIMILAR TO ?;";
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setString(2, motif);
            ResultSet results = statement.executeQuery();
            closeCon(con);
            if (results == null) {
                return null;
            }
            return getStrList(results);
        } catch (Exception e) {
            closeCon(con);
            System.out.println("Unable to get matches for motifs: " + motif);
            return null;
        }
    }


    /**
     * Saves a consensus sequence
     */
    public boolean insertListIntoDb(int reconId, HashMap<String, String> sequences, boolean gappy) {
        String query = "INSERT INTO web.sequences(r_id, node_label, seq, s_type) VALUES(?,?,?,?);";
        boolean result = false;
        Connection con = null;
        try {
            con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            con.setAutoCommit(false);
            PreparedStatement statement = con.prepareStatement(query);
            for (String label : sequences.keySet()) {
                statement.setInt(1, reconId);
                statement.setString(2, label);
                if (!gappy) {
                    statement.setString(3, sequences.get(label).replaceAll("-", ""));
                } else {
                    statement.setString(3, sequences.get(label));
                }
                statement.setInt(4, Defines.EXTANT);
                statement.addBatch();
            }
            int[] count = statement.executeBatch();
            con.commit();
            result = true;
        } catch (Exception e) {
            System.out.println("UNABLE TO INSTERT: " + nodeLabel + e.getMessage());
        }
        closeCon(con);
        return result;
    }

    /**
     * Method to check if the user has performed a new reconstruction - as such - have they had all
     * their consensus seqs saved.
     */
    public boolean hasReconsAncestorsBeenSaved(int reconId) {
        String query = "SELECT id FROM web.sequences WHERE r_id=? LIMIT 1;";
        return getId(queryOnId(query, reconId)) != Defines.FALSE;
    }


}

