package com.notes.config;

import com.notes.entity.Note;
import com.notes.entity.User;
import com.notes.repository.NoteRepository;
import com.notes.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create demo user if it doesn't exist
        User demoUser = userRepository.findByEmail("demo@example.com")
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail("demo@example.com");
                    user.setPassword(passwordEncoder.encode("password123"));
                    User saved = userRepository.save(user);
                    System.out.println("Demo user created: demo@example.com / password123");
                    return saved;
                });
        }
    }

}