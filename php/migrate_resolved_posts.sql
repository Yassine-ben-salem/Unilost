ALTER TABLE items
    ADD COLUMN status ENUM('active', 'resolved') NOT NULL DEFAULT 'active' AFTER type,
    ADD COLUMN resolved_at TIMESTAMP NULL DEFAULT NULL AFTER photo_path;
