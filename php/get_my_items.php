<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

header('Cache-Control: private, max-age=300');
header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

$userId = require_auth();
$status = isset($_GET['status']) ? trim((string) $_GET['status']) : null;

if ($status !== null && $status !== '' && !in_array($status, ['active', 'resolved'], true)) {
    send_json(['success' => false, 'message' => 'Invalid status filter.'], 422);
}

try {
    $pdo = db();
    $supportsResolution = items_support_resolution($pdo);

    if (!$supportsResolution && $status === 'resolved') {
        send_json([
            'success' => true,
            'items' => []
        ]);
    }

    if ($supportsResolution) {
        $sql = 'SELECT items.id, items.user_id, items.type, items.status, items.title, items.location, items.item_date,
                       items.description, items.photo_path, items.resolved_at, items.created_at,
                       users.name AS poster_name, users.email AS poster_email
                FROM items
                INNER JOIN users ON users.id = items.user_id
                WHERE items.user_id = ?';
    } else {
        $sql = "SELECT items.id, items.user_id, items.type, 'active' AS status, items.title, items.location, items.item_date,
                       items.description, items.photo_path, NULL AS resolved_at, items.created_at,
                       users.name AS poster_name, users.email AS poster_email
                FROM items
                INNER JOIN users ON users.id = items.user_id
                WHERE items.user_id = ?";
    }

    $params = [$userId];

    if ($supportsResolution && $status) {
        $sql .= ' AND items.status = ?';
        $params[] = $status;
    }

    $sql .= ' ORDER BY items.created_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll();

    $formattedItems = array_map(static function (array $item): array {
        return [
            'id' => (int) $item['id'],
            'user_id' => (int) $item['user_id'],
            'type' => $item['type'],
            'status' => $item['status'],
            'title' => $item['title'],
            'location' => $item['location'],
            'date' => $item['item_date'],
            'description' => $item['description'] ?? '',
            'photo_path' => $item['photo_path'] ?: null,
            'resolved_at' => $item['resolved_at'],
            'poster_name' => $item['poster_name'],
            'poster_email' => $item['poster_email'],
            'created_at' => $item['created_at']
        ];
    }, $items);

    send_json([
        'success' => true,
        'items' => $formattedItems
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while fetching your posts.'], 500);
}
