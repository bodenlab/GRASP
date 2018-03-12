package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.User;

public interface IReconstructionService {

    User saveNewReconstruction(Reconstruction reconstruction, User account) ;
    Reconstruction getReconstruction(Long id) ;
    void saveReconstruction(Reconstruction recon) ;
}
