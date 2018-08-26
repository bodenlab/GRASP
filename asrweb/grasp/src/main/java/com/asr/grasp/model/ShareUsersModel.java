package com.asr.grasp.model;

import org.springframework.stereotype.Repository;

@Repository
public class ShareUsersModel extends BaseModel {
    /**
     * ShareObject a reconstruction with a user.
     *
     * This assumes that the user and reconstruction ID exist.
     * @param reconId
     * @param userId
     * @return
     */

    public String shareWithUser(int reconId, int userId) {
        String query = "INSERT INTO share_users(r_id, u_id) VALUES(?, ?);";
        String err = runTwoUpdateQuery(query, reconId, userId, 1, 2);
        if(err != null) {
            return err;
        }
        return null;
    }

    /**
     * Remove a users' access to a reconstruction.
     * @param reconId
     * @param userId
     * @return
     */
    public String removeUsersAccess(int reconId, int userId) {
        String query = "DELETE FROM share_users WHERE r_id = ? AND u_id = ?;";
        if (runTwoUpdateQuery(query, reconId, userId, 1, 2) == null) {
            return "fail";
        }
        return null;
    }
}
