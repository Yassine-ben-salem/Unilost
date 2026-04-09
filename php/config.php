<?php
$host = getenv('MYSQLHOST');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');
$db   = getenv('MYSQLDATABASE');
$port = (int)getenv('MYSQLPORT');

$conn = mysqli_connect($host, $user, $pass, $db, $port);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
