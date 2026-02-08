package com.notes.controller;

import com.notes.dto.LoginRequest;
import com.notes.dto.LoginResponse;
import com.notes.dto.RegisterRequest;
import com.notes.dto.RegisterResponse;
import com.notes.entity.User;
import com.notes.repository.UserRepository;
import com.notes.security.JwtUtil;
import com.notes.service.DemoUserService;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:4200", "http://frontend:80"})
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private DemoUserService demoUserService;

    
    @PostMapping("/login")

    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(),
                    loginRequest.getPassword()
                )
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtil.generateToken(authentication.getName());
            
            // Initialize demo user data if this is the demo user
            if (demoUserService.isDemoUser(authentication.getName())) {
                demoUserService.initializeDemoUserData();
            }
            
            LoginResponse response = new LoginResponse(
                jwt,
                authentication.getName(),
                "Login successful"
            );
            
            return ResponseEntity.ok(response);

            
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("An error occurred during login"));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Get current authentication before clearing
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && demoUserService.isDemoUser(authentication.getName())) {
            // Clean up demo user data on logout
            demoUserService.cleanupDemoUserData();
        }
        
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new SuccessResponse("Logout successful"));
    }

    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Check if passwords match
            if (!registerRequest.isPasswordMatching()) {
                Map<String, String> errors = new HashMap<>();
                errors.put("confirmPassword", "Passwords do not match");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ValidationErrorResponse("Validation failed", errors));
            }
            
            // Check if email already exists
            if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new RegisterResponse(false, "An account with this email already exists"));
            }
            
            // Create new user
            User newUser = new User();
            newUser.setEmail(registerRequest.getEmail());
            newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            
            // Save user to database
            User savedUser = userRepository.save(newUser);
            
            // Initialize default data for regular users (one-time only, not for demo user)
            demoUserService.initializeUserData(savedUser);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new RegisterResponse(true, "Account created successfully", savedUser.getEmail()));

            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new RegisterResponse(false, "An error occurred during registration"));
        }
    }

    
    // Inner classes for simple responses
    public static class ErrorResponse {
        private String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
    }
    
    public static class SuccessResponse {
        private String message;
        
        public SuccessResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
    
    public static class ValidationErrorResponse {
        private String error;
        private Map<String, String> details;
        
        public ValidationErrorResponse(String error, Map<String, String> details) {
            this.error = error;
            this.details = details;
        }
        
        public String getError() {
            return error;
        }
        
        public void setError(String error) {
            this.error = error;
        }
        
        public Map<String, String> getDetails() {
            return details;
        }
        
        public void setDetails(Map<String, String> details) {
            this.details = details;
        }
    }
}
