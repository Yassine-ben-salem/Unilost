<?php
$host = getenv('MYSQLHOST');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');
$db   = getenv('MYSQLDATABASE');
$port = (int)getenv('MYSQLPORT');

<<<<<<< HEAD
function env_value(array $keys, $default = null)
{
    foreach ($keys as $key) {
        $value = getenv($key);
        if ($value !== false && $value !== '') {
            return $value;
        }

        if (array_key_exists($key, $_ENV) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }

        if (array_key_exists($key, $_SERVER) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }
    }

    return $default;
}

function parse_mysql_url(?string $url): array
{
    if (!$url) {
        return [];
    }

    $parts = parse_url($url);
    if (!is_array($parts)) {
        return [];
    }

    return [
        'db_host' => $parts['host'] ?? null,
        'db_port' => isset($parts['port']) ? (int) $parts['port'] : null,
        'db_name' => isset($parts['path']) ? ltrim($parts['path'], '/') : null,
        'db_user' => $parts['user'] ?? null,
        'db_pass' => $parts['pass'] ?? null,
    ];
}

$mysqlUrlConfig = parse_mysql_url(env_value(['MYSQL_URL', 'DATABASE_URL']));

return [
    'db_host' => env_value(['MYSQLHOST', 'DB_HOST'], $mysqlUrlConfig['db_host'] ?? '127.0.0.1'),
    'db_port' => (int) env_value(['MYSQLPORT', 'DB_PORT'], $mysqlUrlConfig['db_port'] ?? 3306),
    'db_name' => env_value(['MYSQLDATABASE', 'DB_NAME'], $mysqlUrlConfig['db_name'] ?? 'unilost'),
    'db_user' => env_value(['MYSQLUSER', 'DB_USER'], $mysqlUrlConfig['db_user'] ?? 'root'),
    'db_pass' => env_value(['MYSQLPASSWORD', 'DB_PASS'], $mysqlUrlConfig['db_pass'] ?? 'root'),
    'upload_dir' => __DIR__ . '/../assets/uploads'
];
=======
$conn = mysqli_connect($host, $user, $pass, $db, $port);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
>>>>>>> 045a2d9cc45762593d9b40f62ff78b7834d7462e
