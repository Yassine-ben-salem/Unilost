<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';
require __DIR__ . '/Cache.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$userId = require_auth();
$data = read_json_input();
$itemId = isset($data['item_id']) ? (int) $data['item_id'] : 0;
$status = trim((string) ($data['status'] ?? ''));

if ($itemId < 1) {
    send_json(['success' => false, 'message' => 'Invalid item id.'], 422);
}

if (!in_array($status, ['active', 'resolved'], true)) {
    send_json(['success' => false, 'message' => 'Invalid status update.'], 422);
}

try {
    $pdo = db();
    $supportsResolution = items_support_resolution($pdo);

    if (!$supportsResolution) {
        send_json([
            'success' => false,
            'message' => 'The database is missing the resolved-post columns. Run php/migrate_resolved_posts.sql first.'
        ], 503);
    }

    $stmt = $pdo->prepare(
        'SELECT id, user_id, status FROM items WHERE id = ? LIMIT 1'
    );
    $stmt->execute([$itemId]);
    $item = $stmt->fetch();

    if (!$item) {
        send_json(['success' => false, 'message' => 'Item not found.'], 404);
    }

    if ((int) $item['user_id'] !== $userId) {
        send_json(['success' => false, 'message' => 'You can only update your own posts.'], 403);
    }

    if ($item['status'] === $status) {
        send_json(['success' => false, 'message' => 'This post already has that status.'], 409);
    }

    if ($status === 'resolved') {
        $update = $pdo->prepare(
            'UPDATE items SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?'
        );
        $update->execute([$status, $itemId]);
        $resolvedAt = date('Y-m-d H:i:s');
    } else {
        $update = $pdo->prepare(
            'UPDATE items SET status = ?, resolved_at = NULL WHERE id = ?'
        );
        $update->execute([$status, $itemId]);
        $resolvedAt = null;
    }

    $cache = new Cache(__DIR__ . '/../.cache');
    $cache->clear();

    send_json([
        'success' => true,
        'status' => $status,
        'resolved_at' => $resolvedAt
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while updating the item status.'], 500);
}
