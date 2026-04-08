<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = read_json_input();
$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
    send_json(['success' => false, 'message' => 'All fields are required.'], 422);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(['success' => false, 'message' => 'Please enter a valid email address.'], 422);
}

if (mb_strlen($password) < 8) {
    send_json(['success' => false, 'message' => 'Password must be at least 8 characters.'], 422);
}

try {
    $pdo = db();

    $existing = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $existing->execute([$email]);

    if ($existing->fetch()) {
        send_json(['success' => false, 'message' => 'An account with this email already exists.'], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    );
    $stmt->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT)
    ]);

    $userId = (int) $pdo->lastInsertId();
    $_SESSION['user_id'] = $userId;

    send_json([
        'success' => true,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email
        ]
    ], 201);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error during registration.'], 500);
}
