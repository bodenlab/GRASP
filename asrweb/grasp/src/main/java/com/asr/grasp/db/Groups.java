package com.asr.grasp.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class Groups extends Base {

    Groups () {

    }

    public int insert(int ownerId, String groupName) {
        String query = "INSERT INTO GROUPS(owner_id,name) VALUES(" +
                ownerId + "," + groupName + ");";
        // May need to change this to a query and then a get query
        return getId(execQuery(query));
    }

    public int update() {
        return -1;
    }

    public int delete() {
        return -1;
    }

}
