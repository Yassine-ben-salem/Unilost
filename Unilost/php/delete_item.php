<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';
start_app_session();

require __DIR__ . '/db.php';

require_method('POST');
no_cache_headers();

$userId = require_auth();

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

    send_json([
        'success' => true,
        'message' => 'Post deleted successfully.'
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while deleting the item.'], 500);
}
