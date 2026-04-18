<?php

declare(strict_types=1);

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

require_method('GET');
no_cache_headers();

$itemId = isset($_GET['id']) ? (int) $_GET['id'] : null;
$type = isset($_GET['type']) ? trim((string) $_GET['type']) : null;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : null;
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$pageSize = isset($_GET['page_size']) ? min(100, max(1, (int) $_GET['page_size'])) : 20;
$offset = ($page - 1) * $pageSize;

if ($type !== null && $type !== '' && !in_array($type, ['lost', 'found'], true)) {
    send_json(['success' => false, 'message' => 'Invalid item type filter.'], 422);
}

if ($limit !== null && $limit < 1) {
    $limit = null;
}

if ($itemId !== null && $itemId < 1) {
    send_json(['success' => false, 'message' => 'Invalid item id.'], 422);
}

try {
    $pdo = db();
    $supportsResolution = items_support_resolution($pdo);

    if ($supportsResolution) {
        $sql = 'SELECT items.id, items.user_id, items.type, items.status, items.title, items.location, items.item_date,
                       items.description, items.photo_path, items.resolved_at, items.created_at,
                       users.name AS poster_name, users.email AS poster_email
                FROM items
                INNER JOIN users ON users.id = items.user_id';
    } else {
        $sql = "SELECT items.id, items.user_id, items.type, 'active' AS status, items.title, items.location, items.item_date,
                       items.description, items.photo_path, NULL AS resolved_at, items.created_at,
                       users.name AS poster_name, users.email AS poster_email
                FROM items
                INNER JOIN users ON users.id = items.user_id";
    }

    $params = [];

    if ($itemId !== null) {
        $sql .= ' WHERE items.id = ?';
        $params[] = $itemId;
    } elseif ($type) {
        if ($supportsResolution) {
            $sql .= ' WHERE items.type = ? AND items.status = ?';
            $params[] = $type;
            $params[] = 'active';
        } else {
            $sql .= ' WHERE items.type = ?';
            $params[] = $type;
        }
    } elseif ($supportsResolution) {
        $sql .= ' WHERE items.status = ?';
        $params[] = 'active';
    }

    $sql .= ' ORDER BY items.created_at DESC';

    if ($limit !== null) {
        $sql .= ' LIMIT ' . (int) $limit;
    } elseif ($itemId === null) {
        $sql .= ' LIMIT ' . $pageSize . ' OFFSET ' . $offset;
    }

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

    if ($itemId !== null) {
        if (count($formattedItems) === 0) {
            send_json(['success' => false, 'message' => 'Item not found.'], 404);
        }

        send_json([
            'success' => true,
            'item' => $formattedItems[0]
        ]);
    }

    send_json([
        'success' => true,
        'items' => $formattedItems,
        'pagination' => [
            'current_page' => $limit !== null ? 1 : $page,
            'page_size' => $limit !== null ? $limit : $pageSize,
            'total_items' => count($formattedItems),
            'has_more' => $itemId === null && $limit === null && count($formattedItems) === $pageSize
        ]
    ]);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while fetching items.'], 500);
}
