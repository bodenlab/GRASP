package com.asr.grasp.model;

import com.asr.grasp.utils.Defines;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;

/**
 * Abstraction of Postgres commands. These are called by the Users, Reconstrcution and Taxa model.
 * The base model handles generic cases of inserts, updates and deletes.
 *
 * If a method can be generalised please add it here.
 *
 * Created by ariane on 13/07/18.
 */
@Repository
public class BaseModel {

    // Connection to model
    @Value("${spring.datasource.url}")
    public String dbUrl;
    @Value("${spring.datasource.username}")
    public String dbUsername;
    @Value("${spring.datasource.password}")
    public String dbPassword;

    /**
     * Generic execute query that gets a connection to the model and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet query(String query) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            ResultSet results = statement.executeQuery();
            con.close();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }

    /**
     * Generic execute query that gets a connection to the model and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnId(String query, int id) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the
            statement.setInt(1, id);
            ResultSet results = statement.executeQuery();
            con.close();
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
    public ResultSet queryOnString(String query, String value) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setString(1, value);
            ResultSet results = statement.executeQuery();
            con.close();
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
    public int getIdOnUniqueString(String query, String id) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setString(1, id);
            ResultSet results = statement.executeQuery();
            con.close();
            return getId(results);
        } catch (Exception e) {
            System.out.println(e);
        }
        return Defines.FALSE;
    }

    /**
     * Generic execute query that performs a query on a unique string. E.g. a
     * person's username.
     *
     * @param query
     * @return
     */
    public boolean insertStrings(String query, String[] values) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            int idx = 1;
            for (String value: values) {
                statement.setString(idx, value);
                idx ++;
            }
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
    }

    /**
     * Generic execute query that gets a connection to the model and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnStringIds(String query, ArrayList<String> ids) {
        final String[] data = ids.toArray(new String[ids.size()]);
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            final java.sql.Array sqlArray = con.createArrayOf("VARCHAR(12)", data);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the array of ids
            statement.setArray(1, sqlArray);
            ResultSet results = statement.executeQuery();
            con.close();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }


    /**
     * Generic execute query that gets a connection to the model and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public ResultSet queryOnIds(String query, ArrayList<Integer> ids) {
        final Integer[] data = ids.toArray(new Integer[ids.size()]);
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            final java.sql.Array sqlArray = con.createArrayOf("integer", data);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the array of ids
            statement.setArray(1, sqlArray);
            ResultSet results = statement.executeQuery();
            con.close();
            return results;
        } catch (Exception e) {
            System.out.println(e);
        }
        return null;
    }



    /**
     * Generic execute query that gets a connection to the model and
     * returns the results set.
     *
     * @param query
     * @return
     */
    public Boolean deleteOnIds(String query, Object ids) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the array of ids
            statement.setArray(1, (Array) ids);
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
    }

    /**
     * An Update query that updates a number of values of type strings based
     * on an ID.
     *
     * @param query
     * @return
     */
    public boolean updateStringsOnId(String query, int id, String[]
            values) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Adds each String into the query
            int index = 1;
            for (String value : values) {
                statement.setString(index, value);
                index++;
            }
            // ID is in the where clause thus at the end.
            statement.setInt(index, id);
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
            return false;
        }
    }

    /**
     * An Update query that updates a string based on an ID.
     *
     * For update commands we have the ID at the end, so it should always be
     * at the last index of the query (i.e. SELECT * FROM .... WHERE ... <- ID)
     *
     * @param query
     * @return
     */
    public boolean updateStringOnId(String query, int id, String
            value) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            statement.setString(1, value);
            statement.setInt(2, id);
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
            return false;
        }
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
                                                   ArrayList<QueryEntry> values) {
        try {
            for (QueryEntry value : values) {
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
            System.err.println("Your model values were incorrectly " +
                    "formmatted");
            return null;
        }
        return statement;
    }

    /**
     * Updates values in a table based on a unique identifier which is
     * typically the ID of the record in the model.
     *
     * @param query
     * @param id
     * @param values
     * @return
     */
    public Boolean updateValuesOnId(String query, int id, ArrayList<QueryEntry>
            values) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Adds each String into the query
            statement = addValuesToStatement(statement, values);
            // Sets the ID
            statement.setInt(values.size() + 1, id);
            // Execute the query
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
    }

    /** Updates values in a table based on a unique String identifier.
     *
     * @param query
     * @param id
     * @param values
     * @return
             */
    public Boolean updateValuesOnUniqueString(String query, String id,
                                      ArrayList<QueryEntry>
            values) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Adds each String into the query
            statement = addValuesToStatement(statement, values);
            // Sets the ID
            statement.setString(values.size() + 1, id);
            // Execute the query
            statement.executeQuery();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
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
            // Check we were only returned a single result
            while (results.next()) {
                // Get the ID stored in the first column
                idList.add(results.getInt(1));
            }
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
        return idList;
    }

    /**
     * Gets a list of strings from a query.
     * Returns an empty array if nothing matched the query
     *
     * @param results
     * @return
     */
    public ArrayList<String> getStrList(ResultSet results) {
        ArrayList<String> strList = new ArrayList<>();
        try {
            while (results.next()) {
                // Get the ID stored in the first column
                strList.add(results.getString(1));
            }
        } catch (Exception e) {
            System.out.println("Unable to get a string list from results set");
            return null;
        }
        return strList;
    }

    /**
     * Gets a String/String Hash map of results from a query.
     *
     * @param results
     * @return
     */
    public HashMap<String, String> getStrStrMap(ResultSet results, int keyIdx, int valIdx) {
        HashMap<String, String> strMap = new HashMap<>();
        try {
            if (results.next()) {
                while (results.next()) {
                    // Get the ID stored in the first column
                    strMap.put(results.getString(keyIdx), results.getString(valIdx));
                }
            }
        } catch (Exception e) {
            System.out.println("Unable to get String Map from results set");
            return null;
        }
        return strMap;
    }

    /**
     * Get the id.
     * <p>
     * This also checks that only a single value user returned from the
     * model so we need to check the length of the results.
     *
     * @param results
     * @return
     */
    public int getId(ResultSet results) {
        try {
            if (results.next()) {
                // ToDo: Check we only get 1 result
                return results.getInt(1);
            }
        } catch (Exception e) {
            System.err.println(e);
        }
        return Defines.FALSE;
    }

    /**
     * Deletes a model record on ID
     *
     * @return success (> 0) or not -1
     */
    public Boolean deleteOnId(String query, int id) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the ID of the element to be deleted
            statement.setInt(1, id);
            // Deletes the record from the model
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
    }

    /**
     * Runs a delete query.
     *
     * @return success (> 0) or not -1
     */
    public Boolean deleteQuery(String query) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Deletes the record from the model
            statement.executeUpdate();
            con.close();
            return true;
        } catch (Exception e) {
            System.out.println(e);
        }
        return false;
    }


    /**
     * Gets an entry from a column for a row. The results set is currently
     * pointing to the row in question and the columnEntry is used to define
     * the type and label or the entry in that row.
     *
     */
    public Object getRowEntry(ResultSet row, ColumnEntry entry) throws
            SQLException {
        if (entry.getType() == Defines.STRING) {
            return row.getString(entry.getLabel());
        }
        if (entry.getType() == Defines.INT) {
            return row.getInt(entry.getLabel());
        }
        return null;
    }

    /**
     * Run specific query on two IDs. This usually involves both the
     * user ID and the reconstruction ID.
     *
     * @param query
     * @param reconId
     * @param userId
     * @return
     */
    public ResultSet runTwoIdQuery(String query, int reconId, int userId, int
            reconIdx, int userIdx) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the
            statement.setInt(userIdx, userId);
            statement.setInt(reconIdx, reconId);
            ResultSet results = statement.executeQuery();
            con.close();
            return results;
        } catch (Exception e) {
            System.out.println(e);
            return null;
        }
    }


    public String runTwoUpdateQuery(String query, int reconId, int userId,
                                       int reconIdx, int userIdx) {
        try {
            Connection con = DriverManager.getConnection(dbUrl, dbUsername,
                    dbPassword);
            PreparedStatement statement = con.prepareStatement(query);
            // Sets the
            statement.setInt(userIdx, userId);
            statement.setInt(reconIdx, reconId);
            statement.executeUpdate();
            con.close();
            return null;
        } catch (Exception e) {
            System.out.println(e);
            return e.getMessage();
        }
    }

    /**
     * Helper function for running the tests. As we are running it when the
     * beans are not instanciated it means we need to manually expose the
     * database. However in release we can have a properties variable that
     * prevents this (i.e. these will already be set so won't be overridden).
     */
    public void setDBConfig(String url, String password, String username) {
        if (dbPassword == null) {
            dbPassword = password;
        }
        if (dbUsername == null) {
            dbUsername = username;
        }
        if (dbUrl == null) {
            dbUrl = url;
        }
    }
}
