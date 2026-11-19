package edu.campuscommons;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSetup implements CommandLineRunner {
    private final JdbcTemplate db;
    public DatabaseSetup(JdbcTemplate db) { this.db=db; }
    @Override public void run(String... args) {
        db.execute("CREATE TABLE IF NOT EXISTS users (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,email VARCHAR(190) NOT NULL UNIQUE,password_hash VARCHAR(255) NOT NULL,role VARCHAR(20) NOT NULL,campus_id VARCHAR(50) NOT NULL,department VARCHAR(100) DEFAULT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB");
        // Upgrade the original enum column when the existing XAMPP database came from v1.
        db.execute("ALTER TABLE users MODIFY role VARCHAR(20) NOT NULL");
        db.update("UPDATE users SET role='teacher' WHERE role='lecturer'");
        db.execute("CREATE TABLE IF NOT EXISTS resources (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,category VARCHAR(40) NOT NULL,status VARCHAR(20) NOT NULL DEFAULT 'Available',booked_by INT UNSIGNED DEFAULT NULL,booked_at TIMESTAMP NULL DEFAULT NULL,created_by INT UNSIGNED DEFAULT NULL,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT fk_resources_booked_by FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL,CONSTRAINT fk_resources_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,INDEX idx_resource_status(status),INDEX idx_resource_category(category)) ENGINE=InnoDB");
        db.execute("CREATE TABLE IF NOT EXISTS course_classes (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,title VARCHAR(140) NOT NULL,subject VARCHAR(100) NOT NULL,teacher_id INT UNSIGNED NOT NULL,starts_at DATETIME NOT NULL,meeting_code VARCHAR(40) NOT NULL UNIQUE,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB");
        db.execute("CREATE TABLE IF NOT EXISTS meetings (id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,title VARCHAR(140) NOT NULL,host_id INT UNSIGNED NOT NULL,starts_at DATETIME NOT NULL,meeting_code VARCHAR(40) NOT NULL UNIQUE,created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB");
        if (db.queryForObject("SELECT COUNT(*) FROM resources", Integer.class)==0) {
            db.update("INSERT INTO resources(name,category) VALUES ('Arduino Starter Kit','Lab Equipment'),('Digital Microscope','Lab Equipment'),('Quiet Study Pod','Study Room'),('Physics Revision Guide','Study Material')");
        }
    }
}
