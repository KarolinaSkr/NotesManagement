package com.notes.controller;

import com.notes.entity.Board;
import com.notes.entity.Note;
import com.notes.entity.User;
import com.notes.service.BoardService;
import com.notes.service.NoteService;
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
import java.util.Optional;


@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = {"http://localhost:4200", "http://frontend:80"})
public class NoteController {
    
    private final NoteService noteService;
    private final BoardService boardService;
    private final UserRepository userRepository;
    
    @Autowired
    public NoteController(NoteService noteService, BoardService boardService, UserRepository userRepository) {
        this.noteService = noteService;
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
    public ResponseEntity<List<Note>> getAllNotes(@RequestParam(required = false) Long boardId) {
        User currentUser = getCurrentUser();
        List<Note> notes;
        
        if (boardId != null) {
            // Verify the board belongs to the current user
            Optional<Board> board = boardService.getBoardById(boardId, currentUser);
            if (board.isPresent()) {
                notes = noteService.getAllNotesByBoardAndUser(board.get(), currentUser);
            } else {
                return new ResponseEntity<>(HttpStatus.FORBIDDEN);
            }
        } else {
            notes = noteService.getAllNotesByUser(currentUser);
        }
        
        return new ResponseEntity<>(notes, HttpStatus.OK);
    }


    
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id) {
        return noteService.getNoteById(id)
                .map(note -> new ResponseEntity<>(note, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Map<String, Object> request) {
        User currentUser = getCurrentUser();
        
        // Extract boardId from request
        Object boardIdObj = request.get("boardId");
        if (boardIdObj == null) {
            return new ResponseEntity<>("boardId is required", HttpStatus.BAD_REQUEST);
        }
        
        Long boardId;
        if (boardIdObj instanceof Integer) {
            boardId = ((Integer) boardIdObj).longValue();
        } else if (boardIdObj instanceof Long) {
            boardId = (Long) boardIdObj;
        } else {
            return new ResponseEntity<>("Invalid boardId format", HttpStatus.BAD_REQUEST);
        }
        
        // Verify the board belongs to the current user
        Optional<Board> board = boardService.getBoardById(boardId, currentUser);
        if (!board.isPresent()) {
            return new ResponseEntity<>("Board not found or access denied", HttpStatus.FORBIDDEN);
        }
        
        // Create note from request data
        Note note = new Note();
        note.setTitle((String) request.getOrDefault("title", ""));
        note.setContent((String) request.getOrDefault("content", ""));
        note.setColor((String) request.getOrDefault("color", "#fef3c7"));
        
        Object posX = request.get("positionX");
        Object posY = request.get("positionY");
        Object width = request.get("width");
        Object height = request.get("height");
        
        if (posX instanceof Number) {
            note.setPositionX(((Number) posX).doubleValue());
        } else {
            note.setPositionX(100.0);
        }
        
        if (posY instanceof Number) {
            note.setPositionY(((Number) posY).doubleValue());
        } else {
            note.setPositionY(100.0);
        }
        
        if (width instanceof Number) {
            note.setWidth(((Number) width).doubleValue());
        }
        
        if (height instanceof Number) {
            note.setHeight(((Number) height).doubleValue());
        }
        
        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) request.get("tags");
        if (tags != null) {
            note.setTags(tags);
        }
        
        note.setUser(currentUser);
        note.setBoard(board.get());
        
        Note createdNote = noteService.createNote(note);
        return new ResponseEntity<>(createdNote, HttpStatus.CREATED);
    }


    
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable Long id, @RequestBody Note note) {
        User currentUser = getCurrentUser();
        Note updatedNote = noteService.updateNote(id, note, currentUser);
        if (updatedNote != null) {
            return new ResponseEntity<>(updatedNote, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        boolean deleted = noteService.deleteNote(id, currentUser);
        if (deleted) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    
    @GetMapping("/filter")
    public ResponseEntity<List<Note>> getNotesByTag(@RequestParam String tag) {
        User currentUser = getCurrentUser();
        List<Note> notes = noteService.getNotesByTag(tag, currentUser);
        return new ResponseEntity<>(notes, HttpStatus.OK);
    }

}
