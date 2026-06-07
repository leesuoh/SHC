package com.shc.api.repository;

import com.shc.api.entity.Mechanic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MechanicRepository extends JpaRepository<Mechanic, Integer> {
    Optional<Mechanic> findByNameAndIsActiveTrue(String name);
    List<Mechanic> findAllByIsActiveTrue();
}
