<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$file = __DIR__ . '/pageviews.json';
$default = ['count' => 0];

// Läs nuvarande värde
$data = $default;
if (file_exists($file)) {
    $content = @file_get_contents($file);
    if ($content !== false) {
        $decoded = @json_decode($content, true);
        if ($decoded !== null && is_array($decoded)) {
            $data = $decoded;
        }
    }
}

// Öka räknaren vid GET eller POST
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data['count'] = max(0, intval($data['count'] ?? 0)) + 1;

    // Spara tillbaka med file locking för att undvika race conditions
    $json = json_encode($data, JSON_PRETTY_PRINT);
    if ($json !== false) {
        @file_put_contents($file, $json, LOCK_EX);
    }
}

echo json_encode(['count' => intval($data['count'] ?? 0)]);
?>

