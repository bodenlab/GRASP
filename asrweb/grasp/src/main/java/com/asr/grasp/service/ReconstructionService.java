package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.repository.ReconstructionRepository;
import com.asr.grasp.User;
import com.asr.grasp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;

@Service
@Transactional
public class ReconstructionService implements IReconstructionService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private ReconstructionRepository reconRepository;

    @Override
    public User saveNewReconstruction(Reconstruction reconstruction, User account) {
        Reconstruction recon = reconstruction.getId() == null ? null : reconRepository.getOne(reconstruction.getId());
        if (recon != null) {
            recon.setMsa(reconstruction.getMsa());
            recon.setLabel(reconstruction.getLabel());
            recon.setNumThreads(reconstruction.getNumThreads());
            recon.setInferenceType(reconstruction.getInferenceType());
            recon.setModel(reconstruction.getModel());
            recon.setNode(reconstruction.getNode());
            recon.setTree(reconstruction.getTree());
            recon.setAncestor(reconstruction.getAncestor());
            reconRepository.save(recon);
        } else
            recon = reconstruction;

        User user = repository.findByUsername(account.getUsername());
        recon.addUser(user);
        user.addReconstruction(recon);

        reconRepository.save(recon);
        return repository.save(user);
    }

    @Override
    public Reconstruction getReconstruction(Long id) {
        return reconRepository.getOne(id);
    }

    @Override
    public void saveReconstruction(Reconstruction recon) {
        if (!reconRepository.exists(recon.getId()))
            reconRepository.save(recon);
    }
}
