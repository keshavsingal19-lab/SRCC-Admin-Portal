-- schema.sql

DROP TABLE IF EXISTS global_absences;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS teacher_credentials;
DROP TABLE IF EXISTS timetable_slots;
DROP TABLE IF EXISTS teacher_leaves;
DROP TABLE IF EXISTS campus_rooms;

CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE global_absences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    marked_by TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT,
    access_code TEXT UNIQUE NOT NULL
);

CREATE TABLE teacher_credentials (
    teacher_id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    salt TEXT,
    pending_password TEXT,
    updated_at INTEGER
);

CREATE TABLE timetable_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    subject TEXT,
    room TEXT,
    batch TEXT,
    class_type TEXT
);

CREATE TABLE teacher_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campus_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    emptySlots TEXT NOT NULL,
    occupiedBy TEXT NOT NULL DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user for testing (password: admin123)
-- Note: In a real app, use a proper password hashing mechanism like bcrypt.
INSERT INTO admin_users (username, password_hash) VALUES ('admin', 'admin123');
