<?php
// get_leaderboard.php
require 'db_config.php';

header('Content-Type: application/json');

try {
    // Select top 3 scores
    $stmt = $pdo->query("SELECT name, score, DATE_FORMAT(date_saved, '%m/%d/%y') as date FROM leaderboard ORDER BY score DESC LIMIT 3");
    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countStmt = $pdo->query("SELECT COUNT(*) as total FROM leaderboard");
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode(['top' => $leaderboard, 'total' => $total]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['top' => [], 'total' => 0]);
}
?>
