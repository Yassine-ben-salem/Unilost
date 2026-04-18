<?php

declare(strict_types=1);

require __DIR__ . '/helpers.php';
start_app_session();

require __DIR__ . '/db.php';
require __DIR__ . '/RateLimiter.php';

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

function compress_image(string $path, string $mimeType): void
{
    if (!function_exists('imagecreatefromjpeg')) {
        return;
    }

    try {
        $maxWidth = 1200;
        $maxHeight = 1200;
        $quality = 75;

        if ($mimeType === 'image/jpeg') {
            $image = imagecreatefromjpeg($path);
        } elseif ($mimeType === 'image/png') {
            $image = imagecreatefrompng($path);
        } elseif ($mimeType === 'image/webp') {
            $image = imagecreatefromwebp($path);
        } elseif ($mimeType === 'image/gif') {
            $image = imagecreatefromgif($path);
        } else {
            return;
        }

        if ($image === false) {
            return;
        }

        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > $maxWidth || $height > $maxHeight) {
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            $newWidth = (int) ($width * $ratio);
            $newHeight = (int) ($height * $ratio);

            $resized = imagecreatetruecolor($newWidth, $newHeight);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        if ($mimeType === 'image/jpeg') {
            imagejpeg($image, $path, $quality);
        } elseif ($mimeType === 'image/png') {
            imagepng($image, $path, 8);
        } elseif ($mimeType === 'image/webp') {
            imagewebp($image, $path, $quality);
        }

        imagedestroy($image);
    } catch (Throwable $e) {
    }
}

require_method('POST');
no_cache_headers();

$userId = require_auth();
$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 10, 3600);

if (!$limiter->isAllowed('post_' . $userId)) {
    send_json([
        'success' => false,
        'message' => 'Too many requests. Please wait before posting again.'
    ], 429);
}

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

    compress_image($destination, $mimeType);

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
