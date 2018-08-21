package com.asr.grasp.controller;

import com.asr.grasp.service.ReconstructionService;
import com.asr.grasp.service.UserService;

import java.util.List;

public interface IUserService {
    UserService registerNewUserAccount(UserService account) ;
    List<ReconstructionService> getAllReconstructions() ;
    List<ReconstructionService> getSharedReconstructions(UserService account) ;
    UserService getUserAccount(UserService account) ;
    boolean userExist(String username) ;
    UserService getUser(String username, String password) ;
    UserService removeReconstruction(UserService account, Long id) ;
    UserService getUserByUsername(String username) ;
    void saveUser(UserService account) ;
}
