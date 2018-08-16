package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.User;

import java.util.List;

public interface IUserService {
    User registerNewUserAccount(User account) ;
    List<Reconstruction> getAllReconstructions() ;
    List<Reconstruction> getSharedReconstructions(User account) ;
    User getUserAccount(User account) ;
    boolean userExist(String username) ;
    User getUser(String username, String password) ;
    User removeReconstruction(User account, Long id) ;
    User getUserByUsername(String username) ;
    void saveUser(User account) ;
}
