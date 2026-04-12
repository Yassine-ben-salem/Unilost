<?php

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
