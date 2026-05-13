<?php
// save_score.php
require 'db_config.php';

header('Content-Type: application/json');

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['name']) && isset($data['score'])) {
    $name = substr(strip_tags($data['name']), 0, 10);
    $score = (int)$data['score'];

    try {
        $stmt = $pdo->prepare("INSERT INTO leaderboard (name, score) VALUES (?, ?)");
        $stmt->execute([$name, $score]);
        echo json_encode(['status' => 'success']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
    }
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
}
?>
