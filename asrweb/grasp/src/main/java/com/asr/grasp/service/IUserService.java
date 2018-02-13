package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.User;

import java.util.List;

public interface IUserService {
    User registerNewUserAccount(User account) ;
    List<Reconstruction> getAllReconstructions() ;
    User getUserAccount(User account) ;
    boolean userExist(String username) ;
    User removeReconstruction(User account, Long id) ;
}
