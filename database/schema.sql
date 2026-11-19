CREATE DATABASE IF NOT EXISTS campus_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  campus_id VARCHAR(50) NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS course_classes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(140) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  meeting_code VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS meetings (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(140) NOT NULL,
  host_id INT UNSIGNED NOT NULL,
  starts_at DATETIME NOT NULL,
  meeting_code VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS resources (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Lab Equipment', 'Study Room', 'Study Material') NOT NULL,
  status ENUM('Available', 'Booked') NOT NULL DEFAULT 'Available',
  booked_by INT UNSIGNED DEFAULT NULL,
  booked_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resources_booked_by FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_resources_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_resource_status (status),
  INDEX idx_resource_category (category)
) ENGINE=InnoDB;

INSERT INTO resources (name, category)
SELECT seed.name, seed.category
FROM (
  SELECT 'Arduino Uno R4 Kit' AS name, 'Lab Equipment' AS category
  UNION ALL SELECT 'Digital Oscilloscope #3', 'Lab Equipment'
  UNION ALL SELECT 'Library Study Pod B2', 'Study Room'
  UNION ALL SELECT 'Digital Logic Design Notes (Sem 3)', 'Study Material'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM resources LIMIT 1);
