<?php
$host = getenv('MYSQLHOST');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');
$db   = getenv('MYSQLDATABASE');
$port = (int)getenv('MYSQLPORT');

echo "HOST: " . $host . "<br>";
echo "USER: " . $user . "<br>";
echo "DB: " . $db . "<br>";
echo "PORT: " . $port . "<br>";
echo "<br>";

$conn = mysqli_connect($host, $user, $pass, $db, $port);

if (!$conn) {
    echo "ERROR: " . mysqli_connect_error();
} else {
    echo "Connected successfully!";
}
?>
