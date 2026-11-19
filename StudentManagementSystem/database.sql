CREATE DATABASE IF NOT EXISTS student_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_management;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(120) NULL UNIQUE,
  department VARCHAR(80) NULL,
  semester VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional sample record:
INSERT IGNORE INTO students (name, roll_no, email, department, semester)
VALUES ('Ali Ahmed', 'BSIT-001', 'ali@example.com', 'Information Technology', '5th Semester');
