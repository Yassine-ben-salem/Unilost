<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/RateLimiter.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 5, 60);
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!$limiter->isAllowed('login_' . $clientIp)) {
    send_json([
        'success' => false,
        'message' => 'Too many login attempts. Please try again later.'
    ], 429);
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
