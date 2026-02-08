package com.notes.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notes.dto.LoginRequest;
import com.notes.dto.RegisterRequest;
import com.notes.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerEdgeCaseTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // ==================== SQL INJECTION TESTS ====================

    @Test
    void testRegisterWithSqlInjectionInEmail() throws Exception {
        String[] sqlInjectionAttempts = {
            "user' OR '1'='1' --",
            "user'; DROP TABLE users; --",
            "user' UNION SELECT * FROM users --",
            "user' AND 1=1 --",
            "' OR '1'='1"
        };

        for (String maliciousEmail : sqlInjectionAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(maliciousEmail);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testLoginWithSqlInjectionInEmail() throws Exception {
        String[] sqlInjectionAttempts = {
            "user' OR '1'='1' --",
            "admin'--",
            "' OR 1=1--"
        };

        for (String maliciousEmail : sqlInjectionAttempts) {
            LoginRequest request = new LoginRequest();
            request.setEmail(maliciousEmail);
            request.setPassword("password123");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    // ==================== XSS ATTEMPTS TESTS ====================

    @Test
    void testRegisterWithXssInEmail() throws Exception {
        String[] xssAttempts = {
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "user@example.com<script>alert(1)</script>"
        };

        for (String maliciousEmail : xssAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(maliciousEmail);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testLoginWithXssInEmail() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("<script>alert('XSS')</script>");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").exists());
    }

    // ==================== VERY LONG EMAIL ADDRESSES TESTS ====================

    @Test
    void testRegisterWithVeryLongEmail() throws Exception {
        String longLocalPart = "a".repeat(250);
        String longEmail = longLocalPart + "@example.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(longEmail);
        request.setPassword("Test123");
        request.setConfirmPassword("Test123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").exists());
    }


    @Test
    void testLoginWithVeryLongEmail() throws Exception {
        String longLocalPart = "a".repeat(250);
        String longEmail = longLocalPart + "@example.com";

        LoginRequest request = new LoginRequest();
        request.setEmail(longEmail);
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").exists());
    }


    @Test
    void testRegisterWithEmailAtBoundaryLength() throws Exception {
        String localPart = "a".repeat(20);
        String email = localPart + "@example.com";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setPassword("Test123");
        request.setConfirmPassword("Test123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    // ==================== SPECIAL CHARACTERS TESTS ====================

    @Test
    void testRegisterWithSpecialCharactersInEmail() throws Exception {
        String[] specialCharAttempts = {
            "user<>@example.com",
            "user\"@example.com",
            "user'@example.com",
            "user&@example.com"
        };

        for (String maliciousEmail : specialCharAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(maliciousEmail);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testLoginWithSpecialCharactersInEmail() throws Exception {
        String[] specialCharAttempts = {
            "user<>@example.com",
            "user\"@example.com"
        };

        for (String maliciousEmail : specialCharAttempts) {
            LoginRequest request = new LoginRequest();
            request.setEmail(maliciousEmail);
            request.setPassword("password123");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    // ==================== EMPTY FORM SUBMISSION TESTS ====================

    @Test
    void testRegisterWithEmptyRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email is required"))
                .andExpect(jsonPath("$.details.password").value("Password is required"))
                .andExpect(jsonPath("$.details.confirmPassword").value("Please confirm your password"));
    }

    @Test
    void testLoginWithEmptyRequest() throws Exception {
        LoginRequest request = new LoginRequest();

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email is required"))
                .andExpect(jsonPath("$.details.password").value("Password is required"));
    }

    @Test
    void testRegisterWithEmptyStrings() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("");
        request.setPassword("");
        request.setConfirmPassword("");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.password").exists())
                .andExpect(jsonPath("$.details.confirmPassword").value("Please confirm your password"));
    }


    @Test
    void testLoginWithEmptyStrings() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("");
        request.setPassword("");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email is required"))
                .andExpect(jsonPath("$.details.password").value("Password is required"));
    }

    // ==================== MISSING REQUIRED FIELDS TESTS ====================

    @Test
    void testRegisterWithMissingEmail() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(null);
        request.setPassword("Test123");
        request.setConfirmPassword("Test123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email is required"));
    }

    @Test
    void testRegisterWithMissingPassword() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword(null);
        request.setConfirmPassword("Test123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.password").value("Password is required"));
    }

    @Test
    void testRegisterWithMissingConfirmPassword() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("Test123");
        request.setConfirmPassword(null);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.confirmPassword").value("Please confirm your password"));
    }

    @Test
    void testLoginWithMissingEmail() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail(null);
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email is required"));
    }

    @Test
    void testLoginWithMissingPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword(null);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.password").value("Password is required"));
    }

    // ==================== ADDITIONAL SECURITY TESTS ====================

    @Test
    void testRegisterWithHtmlEntities() throws Exception {
        String[] htmlEntityAttempts = {
            "user<@example.com",
            "user>@example.com",
            "user\"@example.com"
        };

        for (String email : htmlEntityAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithNullBytes() throws Exception {
        String emailWithNullByte = "user@example.com\u0000<script>";

        RegisterRequest request = new RegisterRequest();
        request.setEmail(emailWithNullByte);
        request.setPassword("Test123");
        request.setConfirmPassword("Test123");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void testRegisterWithNewlineCharacters() throws Exception {
        String[] newlineAttempts = {
            "user@example.com\n<script>",
            "user@example.com\r\n<script>"
        };

        for (String email : newlineAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"));
        }
    }

    @Test
    void testRegisterWithPathTraversal() throws Exception {
        String[] pathTraversalAttempts = {
            "../../../etc/passwd@example.com",
            "user@../../../etc/passwd.com"
        };

        for (String email : pathTraversalAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"));
        }
    }

    @Test
    void testRegisterWithNoSQLInjection() throws Exception {
        String[] noSqlInjectionAttempts = {
            "{\"$gt\": \"\"}@example.com",
            "{\"$ne\": null}@example.com"
        };

        for (String email : noSqlInjectionAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"));
        }
    }

    @Test
    void testRegisterWithXMLInjection() throws Exception {
        String[] xmlInjectionAttempts = {
            "<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file:///etc/passwd\">]><foo>&xxe;</foo>@example.com"
        };

        for (String email : xmlInjectionAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"));
        }
    }

    @Test
    void testRegisterWithCrlfInjection() throws Exception {
        String[] crlfAttempts = {
            "user@example.com\nLocation: http://evil.com",
            "user@example.com\r\nLocation: http://evil.com"
        };

        for (String email : crlfAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"));
        }
    }

    @Test
    void testRegisterWithIframeInjection() throws Exception {
        String[] iframeAttempts = {
            "<iframe src='javascript:alert(1)'>@example.com",
            "<iframe srcdoc='<script>alert(1)</script>'>@example.com"
        };

        for (String email : iframeAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithObjectTagInjection() throws Exception {
        String[] objectTagAttempts = {
            "<object data='javascript:alert(1)'>@example.com",
            "<embed src='javascript:alert(1)'>@example.com"
        };

        for (String email : objectTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithFormTagInjection() throws Exception {
        String[] formTagAttempts = {
            "<form action='javascript:alert(1)'>@example.com",
            "<form onsubmit='alert(1)'>@example.com"
        };

        for (String email : formTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithStyleTagInjection() throws Exception {
        String[] styleTagAttempts = {
            "<style>@import'javascript:alert(1)'</style>@example.com",
            "<style>body{background-image:url('javascript:alert(1)')}</style>@example.com"
        };

        for (String email : styleTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithLinkTagInjection() throws Exception {
        String[] linkTagAttempts = {
            "<link rel='stylesheet' href='javascript:alert(1)'>@example.com",
            "<link rel='import' href='javascript:alert(1)'>@example.com"
        };

        for (String email : linkTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithBaseTagInjection() throws Exception {
        String[] baseTagAttempts = {
            "<base href='javascript:alert(1)//'>@example.com",
            "<base target='_blank' href='javascript:alert(1)//'>@example.com"
        };

        for (String email : baseTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }

    @Test
    void testRegisterWithMetaTagInjection() throws Exception {
        String[] metaTagAttempts = {
            "<meta http-equiv='refresh' content='0;url=javascript:alert(1)'>@example.com",
            "<meta charset='x-imap4-modified-utf7'>@example.com"
        };

        for (String email : metaTagAttempts) {
            RegisterRequest request = new RegisterRequest();
            request.setEmail(email);
            request.setPassword("Test123");
            request.setConfirmPassword("Test123");

            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Validation failed"))
                    .andExpect(jsonPath("$.details.email").exists());
        }
    }
}
