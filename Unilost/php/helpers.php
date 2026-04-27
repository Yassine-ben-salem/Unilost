<?php

declare(strict_types=1);

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $lifetime = 60 * 60 * 24 * 30;

    ini_set('session.gc_maxlifetime', (string) $lifetime);
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_start();
}

function send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function read_json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function current_user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function require_auth(): int
{
    $userId = current_user_id();
    if (!$userId) {
        send_json([
            'success' => false,
            'message' => 'You must be logged in to post an item.'
        ], 401);
    }

    return $userId;
}

function require_method(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
    }
}

function no_cache_headers(): void
{
    header('Cache-Control: no-cache, no-store, must-revalidate, private');
    header('Pragma: no-cache');
    header('Expires: 0');
}

function items_support_resolution(PDO $pdo): bool
{
    static $supportsResolution = null;

    if (is_bool($supportsResolution)) {
        return $supportsResolution;
    }

    $config = require __DIR__ . '/config.php';

    if (array_key_exists('items_support_resolution', $config)) {
        $supportsResolution = (bool) $config['items_support_resolution'];
        return $supportsResolution;
    }

    $supportsResolution = true;

    return $supportsResolution;
}

function remove_item_photo(?string $photoPath): void
{
    if (!$photoPath) {
        return;
    }

    $config = require __DIR__ . '/config.php';
    $fullPath = $config['upload_dir'] . DIRECTORY_SEPARATOR . basename($photoPath);

    if (is_file($fullPath)) {
        @unlink($fullPath);
    }
}

function validate_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validate_required(array $data, array $fields): array
{
    $errors = [];

    foreach ($fields as $field) {
        $value = $data[$field] ?? null;
        $trimmed = is_string($value) ? trim($value) : $value;

        if ($trimmed === '' || $trimmed === null) {
            $errors[$field] = ucfirst($field) . ' is required.';
        }
    }

    return $errors;
}

function validate_min_length(string $value, int $min, string $field): ?string
{
    if (mb_strlen($value) < $min) {
        return ucfirst($field) . ' must be at least ' . $min . ' characters.';
    }
    return null;
}
