<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

try {
    $pdo = db();

    $indexes = [
        'ALTER TABLE items ADD INDEX idx_type (type)',
        'ALTER TABLE items ADD INDEX idx_status (status)',
        'ALTER TABLE items ADD INDEX idx_user_id (user_id)',
        'ALTER TABLE items ADD INDEX idx_created_at (created_at)',
        'ALTER TABLE items ADD INDEX idx_type_status (type, status)',
        'ALTER TABLE items ADD INDEX idx_type_created (type, created_at)',
        'ALTER TABLE users ADD UNIQUE INDEX idx_email (email)'
    ];

    foreach ($indexes as $sql) {
        try {
            echo "Running: {$sql}\n";
            $pdo->exec($sql);
            echo "OK\n";
        } catch (PDOException $e) {
            echo "Skipped: {$e->getMessage()}\n";
        }
    }

    echo "Done\n";
} catch (Throwable $e) {
    echo "Error: {$e->getMessage()}\n";
    exit(1);
}

