package com.notes.repository;

import com.notes.entity.Board;
import com.notes.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    
    List<Board> findByUserOrderByCreatedAtAsc(User user);
    
    long countByUser(User user);
    
    boolean existsByNameAndUser(String name, User user);
}
