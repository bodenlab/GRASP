package com.asr.grasp.model;

import com.asr.grasp.utils.Defines;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.springframework.stereotype.Repository;

/**
 * This model is slightly different to the other models (ATM). It was developed to interface
 * with the "reconstruction" table in the database.
 *
 * The aim is to pull out the reconstructed ancestor and perform actions on it. The current example
 * is to get two reconstructed trees and given a label from one tree, find similar nodes in the
 * second tree.
 *
 * written by ariane @ 22/10/2018
 */
@Repository
public class TreeModel extends BaseModel {

    final ColumnEntry reconstructedTree = new ColumnEntry
            (11, "reconstructed_tree", Defines.STRING);

    /**
     * Gets a reconstructed tree by the reconstruction ID. A user ID is also passed so we need to
     * confirm that the user has access to this reconstruction.
     *
     * @return null if no reconstruction matches those configs
     */
    public String getById(int reconId, int userId) {
        String query = "SELECT r.reconstructed_tree FROM " +
                "web.reconstructions AS r LEFT JOIN web.share_users AS su ON " +
                "su.r_id=r.id WHERE " +
                "r.id=? AND su.u_id=?;";
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setInt(1, reconId);
            statement.setInt(2, userId);

            ResultSet rawRecons = statement.executeQuery();
            con.close();

            // If we have a match, return the reconstructed tree string.
            if (rawRecons.next()) {
                return rawRecons.getString(reconstructedTree.getLabel());
            }
            return null;
        } catch (Exception e) {
            System.out.println("Error getting the reconstructed tree: " + e.getMessage());
        }
        return null;
    }

}
