package com.notes.service;

import com.notes.entity.Board;
import com.notes.entity.Note;
import com.notes.entity.User;
import com.notes.repository.BoardRepository;
import com.notes.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BoardService {
    
    private static final int MAX_BOARDS_PER_USER = 20;
    
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;
    
    @Autowired
    public BoardService(BoardRepository boardRepository, NoteRepository noteRepository) {
        this.boardRepository = boardRepository;
        this.noteRepository = noteRepository;
    }
    
    public List<Board> getAllBoardsByUser(User user) {
        return boardRepository.findByUserOrderByCreatedAtAsc(user);
    }
    
    public Optional<Board> getBoardById(Long id) {
        return boardRepository.findById(id);
    }
    
    public Optional<Board> getBoardById(Long id, User user) {
        return boardRepository.findById(id)
                .filter(board -> board.getUser().getId().equals(user.getId()));
    }
    
    @Transactional
    public Board createBoard(Board board, User user) throws IllegalStateException {
        // Check if user has reached the maximum number of boards
        long boardCount = boardRepository.countByUser(user);
        if (boardCount >= MAX_BOARDS_PER_USER) {
            throw new IllegalStateException("Maximum number of boards (20) reached for this user");
        }
        
        board.setUser(user);
        return boardRepository.save(board);
    }
    
    @Transactional
    public Board updateBoard(Long id, String newName, User user) {
        Optional<Board> optionalBoard = boardRepository.findById(id);
        if (optionalBoard.isPresent()) {
            Board board = optionalBoard.get();
            // Check if the board belongs to the user
            if (!board.getUser().getId().equals(user.getId())) {
                return null; // Not authorized to update this board
            }
            board.setName(newName);
            return boardRepository.save(board);
        }
        return null;
    }
    
    @Transactional
    public boolean deleteBoard(Long id, User user) {
        Optional<Board> optionalBoard = boardRepository.findById(id);
        if (optionalBoard.isPresent()) {
            Board board = optionalBoard.get();
            // Check if the board belongs to the user
            if (!board.getUser().getId().equals(user.getId())) {
                return false; // Not authorized to delete this board
            }
            
            // Delete all notes associated with this board first
            List<Note> notes = board.getNotes();
            if (notes != null && !notes.isEmpty()) {
                noteRepository.deleteAll(notes);
            }
            
            boardRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public long countBoardsByUser(User user) {
        return boardRepository.countByUser(user);
    }
}
