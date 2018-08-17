package com.asr.grasp.db;

import com.asr.grasp.db.DbValue;
import org.springframework.beans.factory.annotation.Value;
import org.thymeleaf.expression.Strings;

import javax.persistence.criteria.CriteriaBuilder;
import java.sql.*;
import java.util.ArrayList;
import java.util.Map;

public class Base {

    // Connection to database
    @Value("${spring.datasource.url}")
    String url;
    @Value("${spring.datasource.username}")
    String username;
    @Value("${spring.datasource.password}")
    String password;

    public Base() {

    }

    /**
     * Generic execute query that gets a connection to the database and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet query(String query) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * Generic execute query that gets a connection to the database and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnId(String query, int id) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the
            statement.setInt(1, id);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * Generic execute query that performs a query on a unique string. E.g. a
     * person's username.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnString(String query, String id) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the
            statement.setString(1, id);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }


    /**
     * Generic execute query that gets a connection to the database and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnIds(String query, ArrayList<Integer> ids) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the array of ids
            statement.setArray(1, (Array) ids);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * An Update query that updates a number of values of type strings based
     * on an ID.
     *
     * @param query
     * @return
     */
    public ResultSet updateStringsOnId(String query, int id, String[]
            values) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Adds each String into the query
            int index = 1;
            for (String value : values) {
                statement.setString(index, value);
                index++;
            }
            // ID is in the where clause thus at the endgit
            statement.setInt(index, id);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * An Update query that updates a string based on an ID.
     * These
     *
     * @param query
     * @return
     */
    public ResultSet updateStringOnId(String query, int id, String
            value) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the ID
            statement.setInt(1, id);
            statement.setString(2, value);
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * Helper function that adds values to a statement. These are given as an
     * array of DbValues, which just have:
     * index (where in the SQL statement they belong
     * value (what is being inserted)
     * type (String or int at the moment)
     *
     * @param statement
     * @param values
     * @return
     */
    private PreparedStatement addValuesToStatement(PreparedStatement
                                                           statement,
                                                   ArrayList<DbValue> values) {
        try {
            for (DbValue value : values) {
                switch (value.type) {
                    case 1: // int
                        statement.setInt(value.index, (Integer) value.value);
                        break;
                    case 2: // String
                        statement.setString(value.index, (String) value.value);
                        break;
                    // no default case as we don't want to handle anything
                    // that isn't a sting or int atm.
                }
            }
        } catch (Exception e) {
            System.err.println("Your database values were incorrectly " +
                    "formmatted");
            return null;
        }
        return statement;
    }

    /**
     * Updates values in a table based on a unique identifier which is
     * typically the ID of the record in the database.
     *
     * @param query
     * @param id
     * @param values
     * @return
     */
    public ResultSet updateValuesOnId(String query, int id, ArrayList<DbValue>
            values) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the ID
            statement.setInt(1, id);
            // Adds each String into the query
            statement = addValuesToStatement(statement, values);
            // Execute the query
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /** Updates values in a table based on a unique String identifier.
     *
     * @param query
     * @param id
     * @param values
     * @return
             */
    public ResultSet updateValuesOnUniqueString(String query, String id,
                                      ArrayList<DbValue>
            values) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the ID
            statement.setString(1, id);
            // Adds each String into the query
            statement = addValuesToStatement(statement, values);
            // Execute the query
            ResultSet results = statement.executeQuery();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * Get a list of ids that corrospond to the query.
     * <p>
     * Returns an empty array if nothing matched the query
     *
     * @param results
     * @return
     */
    public ArrayList<Integer> getIdList(ResultSet results) {
        ArrayList<Integer> idList = new ArrayList<>();
        try {
            if (results.next()) {
                // Check we were only returned a single result
                if (results.getInt("RECORDCOUNT") != 1) {
                    return null;
                }
                while (results.next()) {
                    // Get the ID stored in the first column
                    idList.add(results.getInt(1));
                }
            }
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
        return idList;
    }

    /**
     * Get the id.
     * <p>
     * This also checks that only a single value user returned from the
     * database so we need to check the length of the results.
     *
     * @param results
     * @return
     */
    public int getId(ResultSet results) {
        try {
            if (results.next()) {
                // Check we were only returned a single result
                if (results.getInt("RECORDCOUNT") != = 1) {
                    return -1;
                }
                // Get the ID stored in the first column
                return results.getInt(1);
            }
        } catch (Exception e) {
            System.err.println(e);
        }
        return -1;
    }

    /**
     * Deletes a database record on ID
     *
     * @return success (> 0) or not -1
     */
    public int deleteOnId(String query, int id) {
        try {
            Connection con = DriverManager.getConnection(url, username,
                    password);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the ID of the element to be deleted
            statement.setInt(1, id);
            // Deletes the record from the database
            statement.executeQuery();
            return 1;
        } catch (Exception e) {
            System.out.println(e);
        }
        return -1;
    }
}
