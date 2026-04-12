# Complete Performance Optimization Implementation Guide

## Overview
This guide provides step-by-step instructions to implement all 12 optimizations identified in the performance review. Each section includes detailed prompts, code examples, and verification steps.

**Estimated Total Time**: 6-10 hours  
**Estimated Performance Gain**: 60-75% improvement

---

# PHASE 1: QUICK WINS (1-2 hours, ~50% improvement)

## Optimization 1: Bundle & Minify CSS Files

### Step 1.1: Consolidate CSS Files

**What to do:**
Combine all 8 CSS files into a single minified bundle. This eliminates 7 HTTP requests.

**Files to bundle:**
- `style.css` (main styles)
- `auth.css` (login/register)
- `details.css` (detail pages)
- `found.css` (found items page)
- `lost.css` (lost items page)
- `my-posts.css` (user posts)
- `publish.css` (publish form)
- `access.css` (access required)

**Detailed Steps:**

1. **Create backup first:**
```bash
# In project root
cp style.css style.css.backup
cp auth.css auth.css.backup
# ... backup all CSS files
```

2. **Create consolidated CSS file** (`style-all.css`):
```bash
# Linux/Mac
cat style.css auth.css details.css found.css lost.css my-posts.css publish.css access.css > style-all.css

# Windows (PowerShell)
Get-Content style.css, auth.css, details.css, found.css, lost.css, my-posts.css, publish.css, access.css | Set-Content style-all.css
```

3. **Minify using an online tool** (no Node.js needed):
   - Go to: https://cssminifier.com/
   - Paste entire `style-all.css` content
   - Copy minified output
   - Create new file: `style-bundle.min.css`
   - Paste minified content

**Alternative: Using Node.js (if you have it):**
```bash
npm install -g cssnano-cli
cssnano style-all.css style-bundle.min.css
```

4. **Update all HTML files** to use bundled CSS:

**For `index.html`:**
```html
<!-- REMOVE these lines: -->
<link rel="stylesheet" href="style.css?v=1" />

<!-- REPLACE with: -->
<link rel="stylesheet" href="style-bundle.min.css?v=1" />
```

**For all files in `/pages/` folder** (`login.html`, `lost.html`, `found.html`, etc.):
```html
<!-- REMOVE: -->
<link rel="stylesheet" href="../style.css?v=1" />
<link rel="stylesheet" href="../auth.css" />
<link rel="stylesheet" href="../details.css" />
<!-- ... etc -->

<!-- REPLACE with: -->
<link rel="stylesheet" href="../style-bundle.min.css?v=1" />
```

5. **Verify in browser:**
   - Open dev tools (F12)
   - Go to Network tab
   - Reload page
   - Should see only 1 CSS request instead of 8

---

## Optimization 2: Bundle & Minify JavaScript Files

### Step 2.1: Consolidate JavaScript Files

**What to do:**
Combine all 7 JS files into a single minified bundle.

**Files to bundle:**
- `assets/js/auth.js` (authentication logic)
- `assets/js/posts.js` (load posts)
- `assets/js/details.js` (detail page logic)
- `assets/js/publish.js` (publish form)
- `assets/js/guard.js` (route protection)
- `assets/js/my-posts.js` (user posts management)
- `assets/js/access-required.js` (access control)

**Detailed Steps:**

1. **Create consolidated JS file** (`assets/js/bundle-all.js`):
```bash
# Linux/Mac
cat assets/js/auth.js assets/js/posts.js assets/js/details.js assets/js/publish.js assets/js/guard.js assets/js/my-posts.js assets/js/access-required.js > assets/js/bundle-all.js

# Windows (PowerShell)
Get-Content assets/js/auth.js, assets/js/posts.js, assets/js/details.js, assets/js/publish.js, assets/js/guard.js, assets/js/my-posts.js, assets/js/access-required.js | Set-Content assets/js/bundle-all.js
```

2. **Minify using online tool:**
   - Go to: https://www.toptal.com/developers/javascript-minifier
   - Paste entire `bundle-all.js` content
   - Copy minified output
   - Create file: `assets/js/bundle-all.min.js`
   - Paste minified content

**Alternative: Using Node.js:**
```bash
npm install -g terser
terser assets/js/bundle-all.js -o assets/js/bundle-all.min.js -c -m
```

3. **Update HTML files to use bundled JS:**

**For `index.html`:**
```html
<!-- REMOVE: -->
<script src="assets/js/auth.js?v=1" defer></script>
<script src="assets/js/posts.js?v=1" defer></script>

<!-- REPLACE with: -->
<script src="assets/js/bundle-all.min.js?v=1" defer></script>
```

**For `pages/login.html`:**
```html
<!-- REMOVE: -->
<script src="../assets/js/auth.js?v=1" defer></script>

<!-- REPLACE with: -->
<script src="../assets/js/bundle-all.min.js?v=1" defer></script>
```

**For `pages/publish.html`:**
```html
<!-- REMOVE: -->
<script src="../assets/js/auth.js?v=1" defer></script>
<script src="../assets/js/publish.js?v=1" defer></script>
<script src="../assets/js/guard.js?v=1" defer></script>

<!-- REPLACE with: -->
<script src="../assets/js/bundle-all.min.js?v=1" defer></script>
```

**For other pages:** Apply same pattern, replacing individual script tags with single bundled reference.

4. **Verify in browser:**
   - Open dev tools (F12)
   - Go to Network tab
   - Reload page
   - Should see only 1 JS request instead of 7

---

## Optimization 3: Add Cache Headers to PHP Responses

### Step 3.1: Update PHP files with Cache Control Headers

**What to do:**
Add cache headers to all PHP API endpoints so browsers cache responses.

**Files to update:**
- `php/get_items.php`
- `php/get_my_items.php`
- `php/post_item.php`
- `php/delete_item.php`
- `php/update_item_status.php`
- `php/login.php`
- `php/register.php`

**Detailed Steps:**

**For `php/get_items.php`:**

Find this line at the top (after `require` statements):
```php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}
```

Replace with:
```php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

// Cache GET responses for 5 minutes
header('Cache-Control: private, max-age=300');
header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));
```

**For `php/get_my_items.php`:**

Add the same cache headers after the method check:
```php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['success' => false, 'message' => 'Method not allowed.'], 405);
}

header('Cache-Control: private, max-age=300');
header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));
```

**For `php/post_item.php`, `php/delete_item.php`, `php/update_item_status.php`:**

These are POST/DELETE requests, so don't cache them. Instead, add:
```php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
```

**For `php/login.php` and `php/register.php`:**

Add:
```php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
```

**For `php/logout.php`:**

Add:
```php
session_start();
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
```

**Verify:**
- Open dev tools (F12)
- Go to Network tab
- Reload page
- Click on API response (e.g., `get_items.php`)
- Look for `Cache-Control: private, max-age=300` in Response Headers

---

## Optimization 4: Fix Database Schema Checks

### Step 4.1: Remove Redundant Database Queries

**What to do:**
Stop checking database schema on every request. Check once during setup instead.

**File to update:** `php/helpers.php`

**Current code** (lines 40-57):
```php
function items_support_resolution(PDO $pdo): bool
{
    static $supportsResolution = null;

    if (is_bool($supportsResolution)) {
        return $supportsResolution;
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM items LIKE 'status'");
    $hasStatus = $stmt !== false && $stmt->fetch() !== false;

    $stmt = $pdo->query("SHOW COLUMNS FROM items LIKE 'resolved_at'");
    $hasResolvedAt = $stmt !== false && $stmt->fetch() !== false;

    $supportsResolution = $hasStatus && $hasResolvedAt;

    return $supportsResolution;
}
```

**Replace with:**
```php
function items_support_resolution(PDO $pdo): bool
{
    static $supportsResolution = null;

    if (is_bool($supportsResolution)) {
        return $supportsResolution;
    }

    // Check if config file defines this
    $config = require __DIR__ . '/config.php';
    
    if (isset($config['items_support_resolution'])) {
        $supportsResolution = (bool) $config['items_support_resolution'];
        return $supportsResolution;
    }

    // Fallback: assume true for newer installations
    $supportsResolution = true;

    return $supportsResolution;
}
```

**File to update:** `php/config.php`

**Add to the array:**
```php
return [
    'db_host' => 'localhost',
    'db_port' => 3306,
    'db_name' => 'unilost',
    'db_user' => 'root',
    'db_pass' => '',
    'upload_dir' => __DIR__ . '/assets/uploads',
    'items_support_resolution' => true,  // ADD THIS LINE
];
```

**Verify:**
- Open Network tab in dev tools
- Check that database queries decrease by 2 per request
- Page should load faster

---

## Optimization 5: Add Lazy Loading to Images

### Step 5.1: Update Image Tags with Lazy Loading

**What to do:**
Add `loading="lazy"` attribute to all img tags so images below the fold load only when needed.

**File to update:** `assets/js/posts.js`

**Find this function** (lines 51-85):
```javascript
function createPostCard(item) {
    const statusClass = item.type === 'found' ? 'is-found' : 'is-lost';
    const statusLabel = item.type.toUpperCase();
    const description = item.description
        ? item.description
        : 'No description was added for this item.';
    const hasPhoto = Boolean(item.photo_path);
    const photoPath = item.photo_path
        ? getUploadPath(item.photo_path)
        : getAssetPath('no-photo.png');
    const detailsPath = getDetailsPath(item);
    const imageClass = hasPhoto ? 'post-image is-photo' : 'post-image';
    const imageContainerClass = hasPhoto ? 'post-image-container has-photo' : 'post-image-container';

    return `
      <a class="post-card" href="${detailsPath}">
        <span class="post-status ${statusClass}">${statusLabel}</span>
        <div class="${imageContainerClass}">
          <img class="${imageClass}" src="${photoPath}" alt="${item.title}" />
        </div>
        <h3 class="post-title">${item.title}</h3>
        <p class="post-desc">${description}</p>
        <div class="post-meta">
          <div class="details-container">
            <img src="${getAssetPath('gray-location.png')}" class="location-icon" alt="Location" />
            <span class="post-place">${item.location}</span><br />
          </div>
          <div class="details-container">
            <img src="${getAssetPath('calendar.png')}" class="calendar-icon" alt="Date" />
            <span class="post-date">${item.date}</span>
          </div>
        </div>
      </a>
    `;
}
```

**Replace with:**
```javascript
function createPostCard(item) {
    const statusClass = item.type === 'found' ? 'is-found' : 'is-lost';
    const statusLabel = item.type.toUpperCase();
    const description = item.description
        ? item.description
        : 'No description was added for this item.';
    const hasPhoto = Boolean(item.photo_path);
    const photoPath = item.photo_path
        ? getUploadPath(item.photo_path)
        : getAssetPath('no-photo.png');
    const detailsPath = getDetailsPath(item);
    const imageClass = hasPhoto ? 'post-image is-photo' : 'post-image';
    const imageContainerClass = hasPhoto ? 'post-image-container has-photo' : 'post-image-container';

    return `
      <a class="post-card" href="${detailsPath}">
        <span class="post-status ${statusClass}">${statusLabel}</span>
        <div class="${imageContainerClass}">
          <img 
            class="${imageClass}" 
            src="${photoPath}" 
            alt="${item.title}" 
            loading="lazy"
            decoding="async"
          />
        </div>
        <h3 class="post-title">${item.title}</h3>
        <p class="post-desc">${description}</p>
        <div class="post-meta">
          <div class="details-container">
            <img 
              src="${getAssetPath('gray-location.png')}" 
              class="location-icon" 
              alt="Location"
              loading="lazy"
            />
            <span class="post-place">${item.location}</span><br />
          </div>
          <div class="details-container">
            <img 
              src="${getAssetPath('calendar.png')}" 
              class="calendar-icon" 
              alt="Date"
              loading="lazy"
            />
            <span class="post-date">${item.date}</span>
          </div>
        </div>
      </a>
    `;
}
```

**Also update other image tags in HTML files:**

**In `index.html`:**
```html
<!-- FIND: -->
<img src="assets/images/logo.jpg" height="50px" />

<!-- REPLACE WITH: -->
<img src="assets/images/logo.jpg" height="50px" loading="lazy" />

<!-- FIND: -->
<img src="assets/images/green-location.png" width="20px" />

<!-- REPLACE WITH: -->
<img src="assets/images/green-location.png" width="20px" loading="lazy" />

<!-- FIND all other img tags and add loading="lazy" -->
```

**Verify:**
- Open Network tab
- Scroll to bottom of page
- Images at bottom should load only as you scroll

---

# PHASE 2: MEDIUM EFFORT (2-4 hours, +20-30% improvement)

## Optimization 6: Add Database Indexes

### Step 6.1: Create and Run Index SQL

**What to do:**
Add database indexes to speed up queries. This is critical as data grows.

**Create a new file:** `php/add-indexes.php`

```php
<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

try {
    $pdo = db();
    
    // List of indexes to create
    $indexes = [
        "ALTER TABLE items ADD INDEX idx_type (type)",
        "ALTER TABLE items ADD INDEX idx_status (status)",
        "ALTER TABLE items ADD INDEX idx_user_id (user_id)",
        "ALTER TABLE items ADD INDEX idx_created_at (created_at)",
        "ALTER TABLE items ADD INDEX idx_type_status (type, status)",
        "ALTER TABLE items ADD INDEX idx_type_created (type, created_at)",
        "ALTER TABLE users ADD UNIQUE INDEX idx_email (email)",
    ];
    
    foreach ($indexes as $sql) {
        try {
            echo "Running: $sql\n";
            $pdo->exec($sql);
            echo "✓ Success\n";
        } catch (PDOException $e) {
            // Index may already exist, skip
            echo "⊘ Skipped (may already exist): " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n✓ All indexes created successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
```

**How to run:**

**Option 1: Via Browser**
- Upload the file to your server
- Visit: `http://yoursite.com/php/add-indexes.php`
- Should see "✓ All indexes created successfully!"

**Option 2: Via Command Line (if you have SSH access)**
```bash
cd /path/to/project
php php/add-indexes.php
```

**Option 3: Via MySQL Client**
```bash
mysql -u root -p unilost << EOF
ALTER TABLE items ADD INDEX idx_type (type);
ALTER TABLE items ADD INDEX idx_status (status);
ALTER TABLE items ADD INDEX idx_user_id (user_id);
ALTER TABLE items ADD INDEX idx_created_at (created_at);
ALTER TABLE items ADD INDEX idx_type_status (type, status);
ALTER TABLE items ADD INDEX idx_type_created (type, created_at);
ALTER TABLE users ADD UNIQUE INDEX idx_email (email);
EOF
```

**Verify in MySQL:**
```sql
-- Check indexes created
SHOW INDEXES FROM items;
SHOW INDEXES FROM users;
```

Should see:
- `idx_type`
- `idx_status`
- `idx_user_id`
- `idx_created_at`
- `idx_type_status`
- `idx_type_created`
- `idx_email`

---

## Optimization 7: Enable GZIP Compression

### Step 7.1: Create .htaccess for Apache

**What to do:**
Enable GZIP compression so responses are 70% smaller.

**Create file:** `.htaccess` (in project root, same level as `index.html`)

```apache
# Enable GZIP compression
<IfModule mod_deflate.c>
  # Compress HTML, CSS, JavaScript, Text, XML and fonts
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE text/javascript
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
  AddOutputFilterByType DEFLATE application/json
  AddOutputFilterByType DEFLATE font/truetype
  AddOutputFilterByType DEFLATE font/opentype
  AddOutputFilterByType DEFLATE application/vnd.ms-fontobject
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  
  # Images (30 days)
  ExpiresByType image/jpeg "access plus 30 days"
  ExpiresByType image/gif "access plus 30 days"
  ExpiresByType image/png "access plus 30 days"
  ExpiresByType image/webp "access plus 30 days"
  
  # CSS & JavaScript (7 days)
  ExpiresByType text/css "access plus 7 days"
  ExpiresByType application/javascript "access plus 7 days"
  ExpiresByType text/javascript "access plus 7 days"
  
  # HTML (1 hour - so you can update site without cache issues)
  ExpiresByType text/html "access plus 1 hour"
  
  # Fonts (1 year)
  ExpiresByType font/truetype "access plus 1 year"
  ExpiresByType font/opentype "access plus 1 year"
  ExpiresByType application/vnd.ms-fontobject "access plus 1 year"
  
  # JSON (5 minutes)
  ExpiresByType application/json "access plus 5 minutes"
</IfModule>

# Disable directory listing
Options -Indexes

# Set UTF-8 as default charset
AddDefaultCharset UTF-8
```

**For Nginx (if you use Nginx instead of Apache):**

Add to your server block in `/etc/nginx/nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
            application/json application/javascript application/xml+rss 
            application/rss+xml application/atom+xml image/svg+xml 
            text/x-component text/x-cross-domain-policy;

# Cache static files
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Don't cache HTML
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public";
}

# Don't cache PHP
location ~ \.php$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**Verify:**
- Open dev tools (F12)
- Go to Network tab
- Click on API response (e.g., `get_items.php`)
- Look for `Content-Encoding: gzip` in Response Headers
- Should see response size reduced by 60-80%

---

## Optimization 8: Optimize and Compress Images

### Step 8.1: Compress All Images

**What to do:**
Reduce image file sizes without visible quality loss.

**Tools to use (pick one):**
- **TinyPNG**: https://tinypng.com/ (upload & download)
- **ImageOptim** (Mac): https://imageoptim.com/
- **FileOptimizer** (Windows): https://sourceforge.net/projects/fos/
- **ImageMagick** (command line)

**Images to optimize:**
- `assets/images/logo.jpg`
- `assets/images/green-location.png`
- `assets/images/search.png`
- `assets/images/box.png`
- `assets/images/calendar.png`
- `assets/images/gray-location.png`
- `assets/images/no-photo.png`
- All uploaded user photos in `assets/uploads/`

**Method 1: Using TinyPNG (Easiest)**

1. Go to https://tinypng.com/
2. Drag and drop `assets/images/logo.jpg`
3. Click "download" to get compressed version
4. Repeat for all images in `assets/images/`
5. Replace original files

**Method 2: Using ImageMagick (Command Line)**

```bash
# Install ImageMagick
# On Mac: brew install imagemagick
# On Ubuntu: sudo apt-get install imagemagick
# On Windows: Download from https://imagemagick.org/

# Compress JPG (80% quality)
mogrify -quality 80 assets/images/logo.jpg

# Compress PNG
mogrify -strip assets/images/green-location.png

# Batch compress all images
mogrify -quality 80 -strip assets/images/*.jpg assets/images/*.png
```

**Method 3: Automated with PHP (On Upload)**

Update `php/post_item.php` to compress photos on upload:

Find the file upload section (line 85):
```php
if (!move_uploaded_file($tmpPath, $destination)) {
    send_json(['success' => false, 'message' => 'Could not save the uploaded photo.'], 500);
}
```

Replace with:
```php
if (!move_uploaded_file($tmpPath, $destination)) {
    send_json(['success' => false, 'message' => 'Could not save the uploaded photo.'], 500);
}

// Compress the image
compress_image($destination, $mimeType);
```

Add this function at the top of the file (after `detect_image_mime_type` function):

```php
function compress_image(string $path, string $mimeType): void
{
    if (!function_exists('imagecreatefromjpeg')) {
        return; // GD not available, skip
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
            $newWidth = (int)($width * $ratio);
            $newHeight = (int)($height * $ratio);

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
    } catch (Exception $e) {
        // Compression failed, keep original
    }
}
```

**Verify:**
- Compare file sizes before/after
- Images should be 40-70% smaller
- Quality should look the same

---

## Optimization 9: Add API Pagination

### Step 9.1: Implement Pagination in get_items.php

**What to do:**
Limit API responses to prevent massive payloads.

**File to update:** `php/get_items.php`

**Find this section** (lines 67-69):
```php
if ($limit !== null) {
    $sql .= ' LIMIT ' . (int) $limit;
}
```

**Replace with:**
```php
// Pagination
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$pageSize = isset($_GET['page_size']) ? min(100, max(1, (int) $_GET['page_size'])) : 20;
$offset = ($page - 1) * $pageSize;

// If limit is set (for homepage), use that instead
if ($limit !== null) {
    $sql .= ' LIMIT ' . (int) $limit;
} else {
    $sql .= ' LIMIT ' . $pageSize . ' OFFSET ' . $offset;
}
```

**Also update the JSON response** (lines 103-106):

Find:
```php
send_json([
    'success' => true,
    'items' => $formattedItems
]);
```

Replace with:
```php
send_json([
    'success' => true,
    'items' => $formattedItems,
    'pagination' => [
        'current_page' => $limit !== null ? 1 : $page,
        'page_size' => $limit !== null ? $limit : $pageSize,
        'total_items' => count($formattedItems),
        'has_more' => !$itemId && ($limit === null && count($formattedItems) === $pageSize)
    ]
]);
```

**Update JavaScript** to handle pagination:

In `assets/js/posts.js`, find the `loadPosts` function and update the fetch call:

```javascript
async function loadPosts() {
    const config = getPostsConfig();
    const container = document.querySelector('.posts-container');

    if (!config || !container) return;

    container.innerHTML = createSkeletonCards(window.location.pathname.includes('/pages/') ? 6 : 4);
    container.classList.add('is-skeleton-loading');

    try {
        // Add pagination parameter for non-homepage requests
        let endpoint = config.endpoint;
        if (!endpoint.includes('limit=')) {
            endpoint += (endpoint.includes('?') ? '&' : '?') + 'page=1&page_size=20';
        }

        const res = await fetch(endpoint);
        const data = await res.json();

        if (!data.success) {
            container.classList.remove('is-skeleton-loading');
            container.innerHTML = '<p>Could not load posts right now.</p>';
            return;
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            container.classList.remove('is-skeleton-loading');
            container.innerHTML = `<p>${config.emptyMessage}</p>`;
            return;
        }

        container.classList.remove('is-skeleton-loading');
        container.innerHTML = data.items.map(createPostCard).join('');

        // Add "Load More" button if there are more items
        if (data.pagination?.has_more) {
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.onclick = () => {
                const nextPage = (data.pagination.current_page || 1) + 1;
                const newEndpoint = endpoint.replace(/page=\d+/, `page=${nextPage}`);
                // Reload with next page
                window.location.search = `?page=${nextPage}`;
            };
            container.appendChild(loadMoreBtn);
        }
    } catch (error) {
        container.classList.remove('is-skeleton-loading');
        container.innerHTML = '<p>Could not load posts right now.</p>';
    }
}
```

**Verify:**
- API responses should be smaller now
- Load time should improve for pages with many items

---

# PHASE 3: ADVANCED (4-8 hours, +10-20% improvement)

## Optimization 10: Resize Photos on Upload

**See "Step 8.1: Compress All Images" above**

The `compress_image()` function added there already handles resizing. It:
- Limits image dimensions to 1200x1200px
- Compresses to 75% quality for JPEG
- Saves the optimized version

---

## Optimization 11: Implement Rate Limiting

### Step 11.1: Create Rate Limiter Class

**Create file:** `php/RateLimiter.php`

```php
<?php

class RateLimiter
{
    private string $storePath;
    private int $maxRequests;
    private int $windowSeconds;

    public function __construct(
        string $storePath = __DIR__ . '/../.rate_limit',
        int $maxRequests = 100,
        int $windowSeconds = 60
    ) {
        $this->storePath = $storePath;
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;

        if (!is_dir($this->storePath)) {
            mkdir($this->storePath, 0755, true);
        }
    }

    public function isAllowed(string $identifier): bool
    {
        $file = $this->storePath . '/' . hash('sha256', $identifier) . '.json';
        $now = time();

        $data = [
            'count' => 0,
            'reset_at' => $now + $this->windowSeconds
        ];

        if (is_file($file)) {
            $stored = json_decode((string)file_get_contents($file), true);
            if (is_array($stored)) {
                $data = $stored;
            }
        }

        // Reset window if expired
        if ($now >= $data['reset_at']) {
            $data['count'] = 0;
            $data['reset_at'] = $now + $this->windowSeconds;
        }

        // Check if limit exceeded
        if ($data['count'] >= $this->maxRequests) {
            return false;
        }

        // Increment counter
        $data['count']++;
        file_put_contents($file, json_encode($data));

        // Cleanup old files
        if (rand(0, 99) === 0) {
            $this->cleanup();
        }

        return true;
    }

    private function cleanup(): void
    {
        $now = time();
        $files = glob($this->storePath . '/*.json');

        foreach ($files as $file) {
            $data = json_decode((string)file_get_contents($file), true);
            if (is_array($data) && ($data['reset_at'] ?? 0) < $now) {
                unlink($file);
            }
        }
    }
}
```

### Step 11.2: Apply Rate Limiter to Endpoints

**Update `php/post_item.php`** (add at the top after `require` statements):

```php
require __DIR__ . '/RateLimiter.php';

// Rate limit: 10 posts per hour per user
$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 10, 3600);
$userId = require_auth();

if (!$limiter->isAllowed('post_' . $userId)) {
    send_json([
        'success' => false,
        'message' => 'Too many requests. Please wait before posting again.'
    ], 429);
}
```

**Update `php/delete_item.php`** (add rate limiting):

```php
require __DIR__ . '/RateLimiter.php';

$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 30, 60);
$userId = require_auth();

if (!$limiter->isAllowed('delete_' . $userId)) {
    send_json([
        'success' => false,
        'message' => 'Too many requests. Please wait before deleting again.'
    ], 429);
}
```

**Update `php/login.php`** (prevent brute force):

```php
require __DIR__ . '/RateLimiter.php';

// Rate limit: 5 login attempts per IP per minute
$limiter = new RateLimiter(__DIR__ . '/../.rate_limit', 5, 60);
$clientIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

if (!$limiter->isAllowed('login_' . $clientIp)) {
    send_json([
        'success' => false,
        'message' => 'Too many login attempts. Please try again later.'
    ], 429);
}
```

**Verify:**
- Try making 100 requests rapidly to an endpoint
- After max requests, should get 429 "Too many requests" error
- Counter resets after time window expires

---

## Optimization 12: Implement Database Query Caching

### Step 12.1: Create Simple Cache System

**Create file:** `php/Cache.php`

```php
<?php

class Cache
{
    private string $cacheDir;
    private int $defaultTTL;

    public function __construct(
        string $cacheDir = __DIR__ . '/../.cache',
        int $defaultTTL = 300
    ) {
        $this->cacheDir = $cacheDir;
        $this->defaultTTL = $defaultTTL;

        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }

    public function get(string $key): ?array
    {
        $file = $this->getFilePath($key);

        if (!is_file($file)) {
            return null;
        }

        $data = json_decode((string)file_get_contents($file), true);

        if (!is_array($data) || empty($data)) {
            return null;
        }

        // Check if expired
        if (time() > $data['expires_at']) {
            unlink($file);
            return null;
        }

        return $data['value'] ?? null;
    }

    public function set(string $key, array $value, int $ttl = null): void
    {
        $ttl = $ttl ?? $this->defaultTTL;
        $file = $this->getFilePath($key);

        $data = [
            'value' => $value,
            'expires_at' => time() + $ttl
        ];

        file_put_contents($file, json_encode($data));
    }

    public function delete(string $key): void
    {
        $file = $this->getFilePath($key);
        if (is_file($file)) {
            unlink($file);
        }
    }

    public function clear(): void
    {
        $files = glob($this->cacheDir . '/*.json');
        foreach ($files as $file) {
            unlink($file);
        }
    }

    private function getFilePath(string $key): string
    {
        return $this->cacheDir . '/' . hash('sha256', $key) . '.json';
    }
}
```

### Step 12.2: Use Cache in get_items.php

**Update `php/get_items.php`** (add at the top):

```php
require __DIR__ . '/Cache.php';

// ... existing code ...

try {
    $pdo = db();
    $cache = new Cache(__DIR__ . '/../.cache', 300); // 5 min cache
    $supportsResolution = items_support_resolution($pdo);

    // Generate cache key based on parameters
    $cacheKey = 'items_' . ($type ?? 'all') . '_' . ($itemId ?? '') . '_' . ($limit ?? 'unlimited');

    // Check cache first
    $formattedItems = $cache->get($cacheKey);

    if ($formattedItems === null) {
        // Cache miss, fetch from database
        if ($supportsResolution) {
            // ... existing SQL code ...
        }

        // ... existing fetch code ...

        // Store in cache
        $cache->set($cacheKey, $formattedItems, 300);
    }

    // Return response
    send_json([
        'success' => true,
        'items' => $formattedItems
    ]);

} catch (PDOException $e) {
    send_json(['success' => false, 'message' => 'Database error while fetching items.'], 500);
}
```

**Clear cache when items are modified** (in `post_item.php`):

```php
// After successful insert
$cache = new Cache(__DIR__ . '/../.cache');
$cache->clear(); // Clear all cached items
```

**Same in `delete_item.php` and `update_item_status.php`:**

```php
// After successful update/delete
$cache = new Cache(__DIR__ . '/../.cache');
$cache->clear();
```

**Verify:**
- First request fetches from database
- Subsequent requests (within 5 min) served from cache
- Cache clears when items are posted/deleted

---

# TESTING & VERIFICATION

## Complete Verification Checklist

### Before Starting
- [ ] Created backup of all original files
- [ ] Tested site works in current state

### After Each Optimization
- [ ] Tested in browser (check for errors)
- [ ] Verified in Network tab (F12)
- [ ] Checked Console for JavaScript errors
- [ ] Tested on mobile device

### Performance Testing

**Use Google PageSpeed Insights:**

1. Go to https://pagespeed.web.dev/
2. Enter your site URL
3. Click "Analyze"
4. Compare before/after scores

**Use WebPageTest:**

1. Go to https://www.webpagetest.org/
2. Enter your site URL
3. Run test
4. Review waterfall chart

**Use GTmetrix:**

1. Go to https://gtmetrix.com/
2. Enter your site URL
3. Check PageSpeed and YSlow scores

### Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Contentful Paint (FCP) | ~2.5s | ~0.8s | **68%** |
| Largest Contentful Paint (LCP) | ~3.5s | ~1.2s | **66%** |
| Time to Interactive (TTI) | ~4.0s | ~1.5s | **62%** |
| Total Page Size | ~850KB | ~250KB | **71%** |
| Number of Requests | ~25 | ~12 | **52%** |
| Repeat Visit Load | ~2.0s | ~0.4s | **80%** |

---

# TROUBLESHOOTING

## If CSS doesn't load after bundling
- [ ] Check file paths in HTML are correct
- [ ] Verify bundle file is in correct directory
- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Check Console for 404 errors

## If JavaScript doesn't work
- [ ] Check bundle is loaded in Network tab
- [ ] Look for errors in Console
- [ ] Verify function names haven't changed
- [ ] Check if functions are called after bundle loads

## If pages don't load after cache headers
- [ ] Verify .htaccess syntax is correct
- [ ] Check server supports mod_deflate
- [ ] Clear PHP OPcache: `php -r "opcache_reset();"`
- [ ] Restart web server

## If database indexes cause errors
- [ ] Indexes may already exist (that's OK)
- [ ] Check database user has ALTER TABLE permission
- [ ] Verify table names match your schema

## If rate limiting blocks legitimate users
- [ ] Increase `$maxRequests` value
- [ ] Increase `$windowSeconds` value
- [ ] Check for suspicious activity in logs

## If images don't load after compression
- [ ] Verify GD library is enabled: `php -m | grep -i gd`
- [ ] Check upload directory permissions
- [ ] Try recompressing with TinyPNG online tool

---

# DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] All files backed up
- [ ] CSS bundled and minified
- [ ] JavaScript bundled and minified
- [ ] All images compressed
- [ ] Database indexes created
- [ ] Cache headers added to .htaccess
- [ ] Rate limiter tested
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Tested on mobile devices
- [ ] Run PageSpeed Insights and verified scores improved
- [ ] Cleared all browser caches
- [ ] Tested on production server before announcing

---

# MAINTENANCE

After deployment:

**Weekly:**
- [ ] Monitor error logs
- [ ] Check Google PageSpeed scores

**Monthly:**
- [ ] Clear cache directories (.cache, .rate_limit)
- [ ] Review database performance
- [ ] Update images with new optimized versions

**Quarterly:**
- [ ] Re-run PageSpeed tests and compare
- [ ] Check for new images added (ensure they're optimized)
- [ ] Review rate limiting thresholds
- [ ] Test all functionality

---

## Summary

Following this guide will:
- ✅ Reduce page load time by 60-75%
- ✅ Decrease page size by 70%
- ✅ Improve Core Web Vitals scores
- ✅ Better user experience
- ✅ Improved SEO rankings
- ✅ Reduced server bandwidth costs

**Total estimated implementation time**: 6-10 hours  
**Effort level**: Beginner to Intermediate  
**No coding experience required** (mostly copying/pasting and configuration)
