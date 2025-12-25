<?php
/**
 * Pageviews counter API
 * Returns JSON with current pageview count
 */

// Suppress all errors to output - log them instead
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Clean any previous output
if (ob_get_level()) {
    ob_end_clean();
}

// Set headers early
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Get request method safely
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

// Handle preflight
if ($method === 'OPTIONS') {
    http_response_code(200);
    echo '{}';
    exit;
}

// File path for storing count
$file = __DIR__ . '/pageviews.json';
$data = array('count' => 0);

// Try to read existing data
if (file_exists($file) && is_readable($file)) {
    $content = @file_get_contents($file);
    if ($content !== false && strlen($content) > 0) {
        $decoded = @json_decode($content, true);
        if (is_array($decoded) && isset($decoded['count'])) {
            $data = $decoded;
        }
    }
}

// Increment counter for GET or POST
if ($method === 'GET' || $method === 'POST') {
    $currentCount = isset($data['count']) ? intval($data['count']) : 0;
    $data['count'] = $currentCount + 1;

    // Try to save - but don't fail if we can't
    if (is_writable(__DIR__)) {
        $json = json_encode($data, JSON_PRETTY_PRINT);
        if ($json !== false) {
            @file_put_contents($file, $json, LOCK_EX);
        }
    }
}

// Output result
$count = isset($data['count']) ? intval($data['count']) : 0;
$output = json_encode(array('count' => $count));

if ($output === false) {
    $output = '{"count":0}';
}

http_response_code(200);
echo $output;
exit;
