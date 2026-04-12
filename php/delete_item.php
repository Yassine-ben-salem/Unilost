<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/RateLimiter.php';
require __DIR__ . '/Cache.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$userId = require_auth();
$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 30, 60);

if (!$limiter->isAllowed('delete_' . $userId)) {
    send_json([
        'success' => false,
        'message' => 'Too many requests. Please wait before deleting again.'
    ], 429);
}

$payload = read_json_input();
$itemId = isset($payload['item_id']) ? (int) $payload['item_id'] : 0;

if ($itemId < 1) {
    send_json(['success' => false, 'message' => 'Invalid item id.'], 422);
}

try {
    $pdo = db();
    $stmt = $pdo->prepare('SELECT id, user_id, photo_path FROM items WHERE id = ? LIMIT 1');
    $stmt->execute([$itemId]);
    $item = $stmt->fetch();

    if (!$item) {
        send_json(['success' => false, 'message' => 'Item not found.'], 404);
    }

    if ((int) $item['user_id'] !== $userId) {
        send_json(['success' => false, 'message' => 'You are not allowed to delete this item.'], 403);
    }

    $deleteStmt = $pdo->prepare('DELETE FROM items WHERE id = ? LIMIT 1');
    $deleteStmt->execute([$itemId]);

    remove_item_photo($item['photo_path'] ?? null);

    $cache = new Cache(__DIR__ . '/../.cache');
    $cache->clear();

    send_json([
        'success' => true,
        'message' => 'Post deleted successfully.'
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while deleting the item.'], 500);
}
