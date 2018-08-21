package com.asr.grasp.controller;

public interface Reconstruction {
    String save(UserController user) ;
    String shareWithUser(int reconId, String username, int loggedInUserId);
    String removeUsersAccess(int reconId, String username, int loggedInUserId);
    String delete(int reconId, int loggedInUserId);
    String checkObsolete() ;
}
