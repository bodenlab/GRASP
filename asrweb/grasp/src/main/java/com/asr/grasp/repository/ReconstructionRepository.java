package com.asr.grasp.repository;

import com.asr.grasp.Reconstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository()
public interface ReconstructionRepository extends JpaRepository<Reconstruction, Long> {
    @Query("FROM Reconstruction r where r.date < :date")
    List<Reconstruction> findByDateOlder(@Param("date") Long date) ;

    @Query("FROM Reconstruction r where r.date is null")
    List<Reconstruction> findByDateNull() ;

}
