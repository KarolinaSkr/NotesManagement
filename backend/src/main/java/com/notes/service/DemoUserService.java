package com.notes.service;

import com.notes.entity.Board;
import com.notes.entity.Note;
import com.notes.entity.User;
import com.notes.repository.BoardRepository;
import com.notes.repository.NoteRepository;
import com.notes.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class DemoUserService {

    private static final String DEMO_USER_EMAIL = "demo@example.com";
    private static final String MAIN_BOARD_NAME = "Main Board";

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;

    @Autowired
    public DemoUserService(UserRepository userRepository, 
                          BoardRepository boardRepository, 
                          NoteRepository noteRepository) {
        this.userRepository = userRepository;
        this.boardRepository = boardRepository;
        this.noteRepository = noteRepository;
    }

    /**
     * Check if the given user is the demo user
     */
    public boolean isDemoUser(User user) {
        return user != null && DEMO_USER_EMAIL.equals(user.getEmail());
    }

    /**
     * Check if the given email belongs to demo user
     */
    public boolean isDemoUser(String email) {
        return DEMO_USER_EMAIL.equals(email);
    }

    /**
     * Get demo user if exists
     */
    public Optional<User> getDemoUser() {
        return userRepository.findByEmail(DEMO_USER_EMAIL);
    }

    /**
     * Clean all data for demo user (boards and notes)
     */
    @Transactional
    public void cleanupDemoUserData() {
        Optional<User> demoUserOpt = getDemoUser();
        if (demoUserOpt.isPresent()) {
            User demoUser = demoUserOpt.get();
            
            // Delete all notes for demo user first (due to foreign key constraints)
            noteRepository.deleteAllByUser(demoUser);
            
            // Delete all boards for demo user
            boardRepository.deleteAllByUser(demoUser);
            
            System.out.println("Demo user data cleaned up successfully");
        }
    }

    /**
     * Initialize demo user data - create Main Board with default notes
     */
    @Transactional
    public void initializeDemoUserData() {
        Optional<User> demoUserOpt = getDemoUser();
        if (demoUserOpt.isEmpty()) {
            System.out.println("Demo user not found, skipping initialization");
            return;
        }

        User demoUser = demoUserOpt.get();
        
        // Check if Main Board already exists
        Optional<Board> existingBoard = boardRepository.findByNameAndUser(MAIN_BOARD_NAME, demoUser);
        if (existingBoard.isPresent()) {
            System.out.println("Main Board already exists for demo user, skipping initialization");
            return;
        }

        // Create Main Board
        Board mainBoard = new Board();
        mainBoard.setName(MAIN_BOARD_NAME);
        mainBoard.setCreatedAt(LocalDateTime.now());
        mainBoard.setUser(demoUser);
        mainBoard.setNotes(new ArrayList<>());
        
        Board savedBoard = boardRepository.save(mainBoard);
        
        // Create default notes
        createDefaultNotes(demoUser, savedBoard);
        
        System.out.println("Demo user data initialized successfully");
    }

    /**
     * Initialize regular user data - create Main Board with default notes (one-time only)
     * This is called during user registration and only executes once
     */
    @Transactional
    public void initializeUserData(User user) {
        if (user == null) {
            System.out.println("User is null, skipping initialization");
            return;
        }

        // Skip if this is the demo user (demo user has its own logic)
        if (isDemoUser(user)) {
            System.out.println("Demo user detected, using demo user initialization instead");
            return;
        }
        
        // Check if Main Board already exists for this user
        Optional<Board> existingBoard = boardRepository.findByNameAndUser(MAIN_BOARD_NAME, user);
        if (existingBoard.isPresent()) {
            System.out.println("Main Board already exists for user " + user.getEmail() + ", skipping initialization");
            return;
        }

        // Create Main Board
        Board mainBoard = new Board();
        mainBoard.setName(MAIN_BOARD_NAME);
        mainBoard.setCreatedAt(LocalDateTime.now());
        mainBoard.setUser(user);
        mainBoard.setNotes(new ArrayList<>());
        
        Board savedBoard = boardRepository.save(mainBoard);
        
        // Create default notes (same as demo user)
        createDefaultNotes(user, savedBoard);
        
        System.out.println("User data initialized successfully for " + user.getEmail());
    }


    /**
     * Create the three default notes for demo user
     */
    private void createDefaultNotes(User demoUser, Board board) {
        List<Note> notes = new ArrayList<>();
        
        // Note 1: Welcome to Notes Management!
        Note note1 = new Note();
        note1.setTitle("Welcome to Notes Management!");
        note1.setContent("This is a demo note. You can drag me around, edit me, or delete me. Try it out!");
        note1.setPositionX(100.0);
        note1.setPositionY(100.0);
        note1.setWidth(385.0);
        note1.setHeight(300.0);
        note1.setColor("#fef3c7");
        note1.setCreatedAt(LocalDateTime.now());
        note1.setUser(demoUser);
        note1.setBoard(board);
        note1.setTags(new ArrayList<>());
        notes.add(note1);
        
        // Note 2: Getting Started
        Note note2 = new Note();
        note2.setTitle("Getting Started");
        note2.setContent("1. Manage your boards by using the retractable panel on the left\n2. Create new notes by clicking the + button\n3. Drag notes to organize\n4. Change note size by dragging the right bottom corner\n5. Use tags to categorize\n6. Set reminders\n7. Search by tags or title\n8. Switch themes with the moon/sun button");
        note2.setPositionX(530.0);
        note2.setPositionY(150.0);
        note2.setWidth(275.0);
        note2.setHeight(500.0);
        note2.setColor("#dbeafe");
        note2.setCreatedAt(LocalDateTime.now());
        note2.setUser(demoUser);
        note2.setBoard(board);
        note2.setTags(new ArrayList<>());
        notes.add(note2);
        
        // Note 3: Security Features
        Note note3 = new Note();
        note3.setTitle("Security Features");
        note3.setContent("This app uses:\n• JWT authentication\n• BCrypt password hashing\n• PostgreSQL database\n• Spring Security\n• Full data authorization\n• Protection against SQL Injection, XSS and more");
        note3.setPositionX(850.0);
        note3.setPositionY(50.0);
        note3.setWidth(300.0);
        note3.setHeight(350.0);
        note3.setColor("#d1fae5");
        note3.setCreatedAt(LocalDateTime.now());
        note3.setUser(demoUser);
        note3.setBoard(board);
        note3.setTags(new ArrayList<>());
        notes.add(note3);
        
        // Save all notes
        noteRepository.saveAll(notes);
        
        // Update board with notes
        board.setNotes(notes);
        boardRepository.save(board);
    }
}
