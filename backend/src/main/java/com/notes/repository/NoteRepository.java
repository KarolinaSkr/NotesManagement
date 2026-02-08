package com.notes.repository;

import com.notes.entity.Board;
import com.notes.entity.Note;
import com.notes.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByTagsContaining(String tag);

    List<Note> findByUser(User user);

    List<Note> findByUserId(Long userId);

    List<Note> findByBoardAndUser(Board board, User user);

    @Transactional
    void deleteAllByUser(User user);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM note_tags WHERE note_id = :noteId", nativeQuery = true)
    void deleteTagsByNoteId(@Param("noteId") Long noteId);
}
