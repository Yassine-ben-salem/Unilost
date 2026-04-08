<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$data = read_json_input();
$email = trim((string) ($data['email'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($email === '' || $password === '') {
    send_json(['success' => false, 'message' => 'Email and password are required.'], 422);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        send_json(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }

    $_SESSION['user_id'] = (int) $user['id'];

    send_json([
        'success' => true,
        'user' => [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email']
        ]
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error during login.'], 500);
}
