package com.asr.grasp.repository;

import com.asr.grasp.Reconstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository()
public interface ReconstructionRepository extends JpaRepository<Reconstruction, Long> {

}
