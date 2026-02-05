package com.notes.service;

import com.notes.entity.Note;
import com.notes.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
    
    public Optional<Note> getNoteById(Long id) {
        return noteRepository.findById(id);
    }
    
    public Note createNote(Note note) {
        return noteRepository.save(note);
    }
    
    public Note updateNote(Long id, Note noteDetails) {
        Optional<Note> optionalNote = noteRepository.findById(id);
        if (optionalNote.isPresent()) {
            Note note = optionalNote.get();
            note.setTitle(noteDetails.getTitle());
            note.setContent(noteDetails.getContent());
            note.setPositionX(noteDetails.getPositionX());
            note.setPositionY(noteDetails.getPositionY());
            note.setColor(noteDetails.getColor());
            return noteRepository.save(note);
        }
        return null;
    }
    
    public boolean deleteNote(Long id) {
        if (noteRepository.existsById(id)) {
            noteRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
