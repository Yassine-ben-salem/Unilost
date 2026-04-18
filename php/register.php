<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';
start_app_session();

require __DIR__ . '/db.php';

require_method('POST');
no_cache_headers();

$data = read_json_input();

$errors = validate_required($data, ['name', 'email', 'password']);
if (!empty($errors)) {
    send_json(['success' => false, 'message' => implode(' ', $errors)], 422);
}

if (!validate_email($data['email'])) {
    send_json(['success' => false, 'message' => 'Please enter a valid email address.'], 422);
}

$pwError = validate_min_length($data['password'], 8, 'Password');
if ($pwError) {
    send_json(['success' => false, 'message' => $pwError], 422);
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = $data['password'];

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
