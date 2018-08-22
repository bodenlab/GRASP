package com.asr.grasp.model;


import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;
import org.springframework.web.context.annotation.SessionScope;

@Repository
public class ShareUsersModel extends BaseModel {
    /**
     * Share a reconstruction with a user.
     *
     * This assumes that the user and reconstruction ID exist.
     * @param reconId
     * @param userId
     * @return
     */

    public String shareWithUser(int reconId, int userId) {
        String query = "INSERT INTO share_users(r_id, u_id) VALUES(?, ?);";
        if(runTwoIdQuery(query, reconId, userId, 1, 2) == null) {
            return "fail";
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
        if (runTwoIdQuery(query, reconId, userId, 1, 2) == null) {
            return "fail";
        }
        return null;
    }
}
