package com.notes.service;

import com.notes.entity.Note;
import com.notes.entity.User;
import com.notes.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class NoteService {
    
    private final NoteRepository noteRepository;
    
    @Autowired
    public NoteService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }
    
    public List<Note> getAllNotes() {
        return noteRepository.findAll();
    }
    
    public List<Note> getAllNotesByUser(User user) {
        return noteRepository.findByUser(user);
    }

    
    public Optional<Note> getNoteById(Long id) {
        return noteRepository.findById(id);
    }
    
    public Note createNote(Note note) {
        return noteRepository.save(note);
    }
    
    public Note updateNote(Long id, Note noteDetails, User user) {
        Optional<Note> optionalNote = noteRepository.findById(id);
        if (optionalNote.isPresent()) {
            Note note = optionalNote.get();
            // Check if the note belongs to the user
            if (!note.getUser().getId().equals(user.getId())) {
                return null; // Not authorized to update this note
            }
            note.setTitle(noteDetails.getTitle());
            note.setContent(noteDetails.getContent());
            note.setPositionX(noteDetails.getPositionX());
            note.setPositionY(noteDetails.getPositionY());
            note.setWidth(noteDetails.getWidth());
            note.setHeight(noteDetails.getHeight());
            note.setColor(noteDetails.getColor());
            note.setTags(noteDetails.getTags());

            return noteRepository.save(note);
        }
        return null;
    }

    
    public List<Note> getNotesByTag(String tag) {
        return noteRepository.findByTagsContaining(tag);
    }
    
    public List<Note> getNotesByTag(String tag, User user) {
        return noteRepository.findByTagsContaining(tag).stream()
                .filter(note -> note.getUser().getId().equals(user.getId()))
                .collect(Collectors.toList());
    }


    
    public boolean deleteNote(Long id) {
        if (noteRepository.existsById(id)) {
            noteRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public boolean deleteNote(Long id, User user) {
        Optional<Note> optionalNote = noteRepository.findById(id);
        if (optionalNote.isPresent()) {
            Note note = optionalNote.get();
            // Check if the note belongs to the user
            if (!note.getUser().getId().equals(user.getId())) {
                return false; // Not authorized to delete this note
            }
            noteRepository.deleteById(id);
            return true;
        }
        return false;
    }

}
