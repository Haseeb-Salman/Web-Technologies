CREATE DATABASE IF NOT EXISTS doctor_appointment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doctor_appointment;
CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL,
 email VARCHAR(160) NOT NULL UNIQUE,
 password_hash VARCHAR(256) NOT NULL,
 role ENUM('ADMIN','DOCTOR','PATIENT') NOT NULL DEFAULT 'PATIENT',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE departments (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL UNIQUE);
CREATE TABLE doctors (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL UNIQUE,
 department_id INT NULL,
 specialization VARCHAR(120) NOT NULL,
 qualification VARCHAR(160),
 consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
 available_days VARCHAR(120) DEFAULT 'Monday-Friday',
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL
);
CREATE TABLE patients (
 id INT AUTO_INCREMENT PRIMARY KEY,
 user_id INT NOT NULL UNIQUE,
 phone VARCHAR(30),
 date_of_birth DATE NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE appointments (
 id INT AUTO_INCREMENT PRIMARY KEY,
 patient_id INT NOT NULL,
 doctor_id INT NOT NULL,
 appointment_date DATE NOT NULL,
 appointment_time TIME NOT NULL,
 reason VARCHAR(500),
 status ENUM('PENDING','APPROVED','REJECTED','CANCELLED','COMPLETED') NOT NULL DEFAULT 'PENDING',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE CASCADE,
 FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
 UNIQUE KEY unique_doctor_slot(doctor_id,appointment_date,appointment_time)
);
INSERT IGNORE INTO departments(name) VALUES ('Cardiology'),('Dermatology'),('Neurology'),('Pediatrics'),('Orthopedics'),('General Medicine');
-- After registering an account, promote it to admin:
-- UPDATE users SET role='ADMIN' WHERE email='admin@example.com';
