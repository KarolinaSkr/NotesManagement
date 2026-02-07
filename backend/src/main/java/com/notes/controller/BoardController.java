package com.notes.controller;

import com.notes.entity.Board;
import com.notes.entity.User;
import com.notes.service.BoardService;
import com.notes.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/boards")
@CrossOrigin(origins = {"http://localhost:4200", "http://frontend:80"})
public class BoardController {
    
    private final BoardService boardService;
    private final UserRepository userRepository;
    
    @Autowired
    public BoardController(BoardService boardService, UserRepository userRepository) {
        this.boardService = boardService;
        this.userRepository = userRepository;
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("No authenticated user found");
    }
    
    @GetMapping
    public ResponseEntity<List<Board>> getAllBoards() {
        User currentUser = getCurrentUser();
        List<Board> boards = boardService.getAllBoardsByUser(currentUser);
        return new ResponseEntity<>(boards, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoardById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        return boardService.getBoardById(id, currentUser)
                .map(board -> new ResponseEntity<>(board, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<?> createBoard(@RequestBody Map<String, String> request) {
        User currentUser = getCurrentUser();
        String name = request.get("name");
        if (name == null || name.trim().isEmpty()) {
            return new ResponseEntity<>("Board name is required", HttpStatus.BAD_REQUEST);
        }
        
        Board board = new Board();
        board.setName(name.trim());
        
        try {
            Board createdBoard = boardService.createBoard(board, currentUser);
            return new ResponseEntity<>(createdBoard, HttpStatus.CREATED);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.FORBIDDEN);
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User currentUser = getCurrentUser();
        String newName = request.get("name");
        if (newName == null || newName.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        Board updatedBoard = boardService.updateBoard(id, newName.trim(), currentUser);
        if (updatedBoard != null) {
            return new ResponseEntity<>(updatedBoard, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        boolean deleted = boardService.deleteBoard(id, currentUser);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getBoardCount() {
        User currentUser = getCurrentUser();
        long count = boardService.countBoardsByUser(currentUser);
        return new ResponseEntity<>(count, HttpStatus.OK);
    }
}
