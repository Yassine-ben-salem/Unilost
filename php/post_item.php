<?php

declare(strict_types=1);

session_start();

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

function detect_image_mime_type(string $path): ?string
{
    if (function_exists('mime_content_type')) {
        $mimeType = mime_content_type($path);
        return is_string($mimeType) ? $mimeType : null;
    }

    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if ($finfo !== false) {
            $mimeType = finfo_file($finfo, $path);
            finfo_close($finfo);

            return is_string($mimeType) ? $mimeType : null;
        }
    }

    $imageInfo = @getimagesize($path);

    return is_array($imageInfo) && isset($imageInfo['mime']) && is_string($imageInfo['mime'])
        ? $imageInfo['mime']
        : null;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$userId = require_auth();
$config = require __DIR__ . '/config.php';

$type = trim((string) ($_POST['type'] ?? ''));
$title = trim((string) ($_POST['title'] ?? ''));
$location = trim((string) ($_POST['location'] ?? ''));
$date = trim((string) ($_POST['date'] ?? ''));
$description = trim((string) ($_POST['description'] ?? ''));

$allowedTypes = ['lost', 'found'];

if (!in_array($type, $allowedTypes, true)) {
    send_json(['success' => false, 'message' => 'Invalid item type.'], 422);
}

if ($title === '' || $location === '' || $date === '') {
    send_json(['success' => false, 'message' => 'Title, location, and date are required.'], 422);
}

$photoPath = null;

if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        send_json(['success' => false, 'message' => 'Photo upload failed.'], 422);
    }

    $tmpPath = $_FILES['photo']['tmp_name'];
    $mimeType = detect_image_mime_type($tmpPath);
    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif'
    ];

    if (!isset($allowedMimeTypes[$mimeType])) {
        send_json(['success' => false, 'message' => 'Only JPG, PNG, WEBP, and GIF images are allowed.'], 422);
    }

    if (!is_dir($config['upload_dir']) && !mkdir($config['upload_dir'], 0775, true) && !is_dir($config['upload_dir'])) {
        send_json(['success' => false, 'message' => 'Could not prepare the upload directory.'], 500);
    }

    $filename = uniqid('item_', true) . '.' . $allowedMimeTypes[$mimeType];
    $destination = $config['upload_dir'] . DIRECTORY_SEPARATOR . $filename;

    if (!move_uploaded_file($tmpPath, $destination)) {
        send_json(['success' => false, 'message' => 'Could not save the uploaded photo.'], 500);
    }

    $photoPath = $filename;
}

try {
    $pdo = db();
    $supportsResolution = items_support_resolution($pdo);

    if ($supportsResolution) {
        $stmt = $pdo->prepare(
            'INSERT INTO items (user_id, type, status, title, location, item_date, description, photo_path)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $type,
            'active',
            $title,
            $location,
            $date,
            $description !== '' ? $description : null,
            $photoPath
        ]);
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO items (user_id, type, title, location, item_date, description, photo_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $type,
            $title,
            $location,
            $date,
            $description !== '' ? $description : null,
            $photoPath
        ]);
    }

    send_json([
        'success' => true,
        'item' => [
            'id' => (int) $pdo->lastInsertId(),
            'type' => $type,
            'status' => 'active',
            'title' => $title,
            'location' => $location,
            'date' => $date,
            'description' => $description,
            'photo_path' => $photoPath
        ]
    ], 201);
} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while posting the item.'], 500);
}
