package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.repository.ReconstructionRepository;
import com.asr.grasp.User;
import com.asr.grasp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class UserService implements IUserService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private ReconstructionRepository reconRepository;

    @Override
    public User registerNewUserAccount(User account) {
        User user = new User();
        user.setUsername(account.getUsername());
        user.setPassword(account.getPassword());
        user.setPasswordMatch(account.getPasswordMatch());

        return repository.save(user);
    }

    public List<Reconstruction> getAllReconstructions() {
        return reconRepository.findAll();
    }

    public User getUserAccount(User account) {
        return repository.findByUsername(account.getUsername());
    }

    public boolean userExist(String username) {
        User user = repository.findByUsername(username);
        return (user != null);
    }

    public User getUser(String username) {
        return repository.findByUsername(username);
    }

    public void saveUser(User account) {
        if (!repository.exists(account.getId()))
            repository.save(account);
    }

    public List<Reconstruction> getSharedReconstructions(User user) {
        List<Reconstruction> shared = new ArrayList<>();
        for (Long reconId : user.getSharedReconstructions())
            shared.add(reconRepository.getOne(reconId));
        return shared;
    }

    @Override
    public User removeReconstruction(User account, Long id) {
        User user = repository.findByUsername(account.getUsername());
        Reconstruction recon = reconRepository.getOne(id);
        user.removeReconstruction(recon);
        recon.removeUser(user);
        //reconRepository.save(recon); // TODO: test
        if (recon.getUsers().isEmpty())
            reconRepository.delete(recon);
        return repository.save(user);
    }
}
