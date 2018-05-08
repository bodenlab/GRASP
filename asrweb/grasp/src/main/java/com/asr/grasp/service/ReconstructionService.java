package com.asr.grasp.service;

import com.asr.grasp.Reconstruction;
import com.asr.grasp.User;
import com.asr.grasp.repository.ReconstructionRepository;
import com.asr.grasp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.LocalDate;
import java.time.temporal.ChronoField;
import java.util.Iterator;
import java.util.List;

@Service
@Transactional
public class ReconstructionService implements IReconstructionService {

    final private int NUM_MONTHS_OLD = 6; // threshold for deleting reconstructions

    @Autowired
    private UserRepository repository;

    @Autowired
    private ReconstructionRepository reconRepository;

    @Override
    public User saveNewReconstruction(Reconstruction reconstruction, User account) {
        Reconstruction recon = reconstruction.getId() == null ? null : reconRepository.getOne(reconstruction.getId());
        Long time = LocalDate.now().getLong(ChronoField.YEAR)*1000 + LocalDate.now().getLong(ChronoField.DAY_OF_YEAR);
        if (recon != null) {
            recon.setMsa(reconstruction.getMsa());
            recon.setLabel(reconstruction.getLabel());
            recon.setNumThreads(reconstruction.getNumThreads());
            recon.setInferenceType(reconstruction.getInferenceType());
            recon.setModel(reconstruction.getModel());
            recon.setNode(reconstruction.getNode());
            recon.setTree(reconstruction.getTree());
            recon.setAncestor(reconstruction.getAncestor());
            recon.setDate(time);
            reconRepository.save(recon);
        } else {
            recon = reconstruction;
            recon.setDate(time);
        }

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

    @Override
    public void updateReconstruction(Reconstruction recon) {
        Long time = LocalDate.now().getLong(ChronoField.YEAR)*1000 + LocalDate.now().getLong(ChronoField.DAY_OF_YEAR);
        recon.setDate(time);
        saveReconstruction(recon);
    }

    @Override
    public void removeReconstruction(Reconstruction recon) {
        for (User user : repository.findAll()) {
            if (user.getSharedReconstructions().contains(recon.getId()))
                user.removeSharedReconstruction(recon);
            if (user.getAllReconstructions().contains(recon))
                user.removeReconstruction(recon);
        }

        reconRepository.delete(recon);
    }

    @Override
    public void checkObseleteReconstructions() {
        // find reconstructions saved prior to date addition; assign today's date
        for (Reconstruction r : reconRepository.findByDateNull())
            r.setDate(LocalDate.now().getLong(ChronoField.YEAR)*1000 + LocalDate.now().getLong(ChronoField.DAY_OF_YEAR));

        // find reconstructions older than the threshold and remove from repository
        Long threshold = subtractTimeFrame();
        List<Reconstruction> recons = reconRepository.findByDateOlder(threshold);
        Iterator<Reconstruction> itr = recons.iterator();
        while (itr.hasNext())
            removeReconstruction(itr.next());
    }

    private Long subtractTimeFrame(){
        LocalDate now = LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();
        if (month < NUM_MONTHS_OLD) {
            int years = (int)Math.ceil(NUM_MONTHS_OLD/12.0);
            year -= years;
            month = 12 - Math.abs(NUM_MONTHS_OLD - month);
        } else {
            month -= NUM_MONTHS_OLD;
        }
        LocalDate threshold = LocalDate.of(year, month, now.getDayOfMonth());
        Long time = threshold.getLong(ChronoField.YEAR)*1000 + threshold.getLong(ChronoField.DAY_OF_YEAR);

        return time;
    }
}
