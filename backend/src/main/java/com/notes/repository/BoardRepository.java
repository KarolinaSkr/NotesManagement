package com.notes.repository;

import com.notes.entity.Board;
import com.notes.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    
    List<Board> findByUserOrderByCreatedAtAsc(User user);
    
    long countByUser(User user);
    
    boolean existsByNameAndUser(String name, User user);
    
    Optional<Board> findByNameAndUser(String name, User user);
    
    @Transactional
    void deleteAllByUser(User user);
}
