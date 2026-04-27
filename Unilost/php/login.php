<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';
start_app_session();

require __DIR__ . '/db.php';

require_method('POST');
no_cache_headers();

$data = read_json_input();

$errors = validate_required($data, ['email', 'password']);
if (!empty($errors)) {
    send_json(['success' => false, 'message' => implode(' ', $errors)], 422);
}

if (!validate_email($data['email'])) {
    send_json(['success' => false, 'message' => 'Please enter a valid email address.'], 422);
}

$email = trim($data['email']);
$password = $data['password'];

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
