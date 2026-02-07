-- Initialize database schema for Notes Management Application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
);

-- Create notes table (if not exists from JPA)
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION,
    height DOUBLE PRECISION,
    color VARCHAR(7) DEFAULT '#fef3c7',
    created_at TIMESTAMP NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    board_id BIGINT REFERENCES boards(id) ON DELETE CASCADE
);

-- Create note_tags table for ElementCollection
CREATE TABLE IF NOT EXISTS note_tags (
    note_id BIGINT REFERENCES notes(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (note_id, tag)
);

-- Demo user will be created by DataInitializer with properly encoded password

-- Create default "main board" for demo user if not exists
INSERT INTO boards (name, created_at, user_id)
SELECT 
    'main board',
    CURRENT_TIMESTAMP,
    id
FROM users WHERE email = 'demo@example.com'
    AND NOT EXISTS (SELECT 1 FROM boards WHERE user_id = users.id)
ON CONFLICT DO NOTHING;

-- Insert sample notes for demo user (associated with the main board)
INSERT INTO notes (title, content, position_x, position_y, width, height, color, created_at, user_id, board_id)
SELECT 
    'Welcome to Notes Management!',
    'This is a demo note. You can drag me around, edit me, or delete me. Try it out!',
    100.0,
    100.0,
    385.0,
    300.0,
    '#fef3c7',
    CURRENT_TIMESTAMP,
    u.id,
    b.id
FROM users u
CROSS JOIN boards b
WHERE u.email = 'demo@example.com' 
    AND b.user_id = u.id 
    AND b.name = 'main board'
    AND NOT EXISTS (SELECT 1 FROM notes WHERE user_id = u.id)
ON CONFLICT DO NOTHING;

INSERT INTO notes (title, content, position_x, position_y, width, height, color, created_at, user_id, board_id)
SELECT 
    'Getting Started',
    E'1. Create new notes by clicking the + button\n2. Drag notes to organize\n3. Change note size by dragging the right bottom corner\n4. Use tags to categorize\n5. Set reminders\n6. Switch themes with the moon/sun button',
    530.0,
    150.0,
    275.0,
    500.0,
    '#dbeafe',
    CURRENT_TIMESTAMP,
    u.id,
    b.id
FROM users u
CROSS JOIN boards b
WHERE u.email = 'demo@example.com' 
    AND b.user_id = u.id 
    AND b.name = 'main board'
ON CONFLICT DO NOTHING;

INSERT INTO notes (title, content, position_x, position_y, width, height, color, created_at, user_id, board_id)
SELECT 
    'Security Features',
    E'This app uses:\n• JWT authentication\n• BCrypt password hashing\n• PostgreSQL database\n• Spring Security',
    850.0,
    50.0,
    300.0,
    350.0,
    '#d1fae5',
    CURRENT_TIMESTAMP,
    u.id,
    b.id
FROM users u
CROSS JOIN boards b
WHERE u.email = 'demo@example.com' 
    AND b.user_id = u.id 
    AND b.name = 'main board'
ON CONFLICT DO NOTHING;
