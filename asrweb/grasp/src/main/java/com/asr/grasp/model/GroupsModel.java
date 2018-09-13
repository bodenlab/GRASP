package com.asr.grasp.model;


/**
 * UNUSED at the moment.
 *
 * Interfaces with the groups table. However this has not been implemented yet.
 *
 * Created by ariane on 13/07/18.
 */
public class GroupsModel extends BaseModel {

    public int insert(int ownerId, String groupName) {
        String query = "INSERT INTO GROUPS(owner_id,name) VALUES(" +
                ownerId + "," + groupName + ");";
        // May need to change this to a query and then a get query
        return getId(query(query));
    }

    public int update() {
        return -1;
    }

    public int delete() {
        return -1;
    }

}
