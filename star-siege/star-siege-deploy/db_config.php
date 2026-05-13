<?php
// db_config.php
// Get these details from your InfinityFree Dashboard (MySQL Databases section)

$host = 'sqlXXX.infinityfree.com'; // REPLACE THIS (e.g. sql204.infinityfree.com)
$dbname = 'epiz_XXXXXXXX_starsiege'; // REPLACE THIS (e.g. epiz_12345678_starsiege)
$username = 'epiz_XXXXXXXX'; // REPLACE THIS (e.g. epiz_12345678)
$password = 'XXXXXXXX'; // REPLACE THIS (Your account password)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // If it fails, don't show the error to users
    http_response_code(500);
    exit;
}
?>
