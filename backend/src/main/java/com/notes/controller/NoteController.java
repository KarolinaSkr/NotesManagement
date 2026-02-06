package com.notes.controller;

import com.notes.entity.Note;
import com.notes.entity.User;
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

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = {"http://localhost:4200", "http://frontend:80"})
public class NoteController {
    
    private final NoteService noteService;
    private final UserRepository userRepository;
    
    @Autowired
    public NoteController(NoteService noteService, UserRepository userRepository) {
        this.noteService = noteService;
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
    public ResponseEntity<List<Note>> getAllNotes() {
        User currentUser = getCurrentUser();
        List<Note> notes = noteService.getAllNotesByUser(currentUser);
        return new ResponseEntity<>(notes, HttpStatus.OK);
    }

    
    @GetMapping("/{id}")
    public ResponseEntity<Note> getNoteById(@PathVariable Long id) {
        return noteService.getNoteById(id)
                .map(note -> new ResponseEntity<>(note, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }
    
    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Note note) {
        User currentUser = getCurrentUser();
        note.setUser(currentUser);
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
