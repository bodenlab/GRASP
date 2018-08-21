package com.asr.grasp.model;

public class GroupsModel extends BaseModel {

    GroupsModel() {

    }

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
