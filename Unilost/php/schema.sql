CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type ENUM('lost', 'found') NOT NULL,
    status ENUM('active', 'resolved') NOT NULL DEFAULT 'active',
    title VARCHAR(150) NOT NULL,
    location VARCHAR(190) NOT NULL,
    item_date DATE NOT NULL,
    description TEXT NULL,
    photo_path VARCHAR(255) NULL,
    resolved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
