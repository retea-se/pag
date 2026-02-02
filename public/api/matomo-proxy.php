<?php
/**
 * Matomo Proxy for På G
 *
 * Proxies requests to the Matomo server to avoid ad-blockers
 * and maintain privacy by hiding the analytics endpoint.
 */

// Matomo server URL
$matomoUrl = 'https://stats.mackan.eu/';

// Get the requested file (matomo.js or matomo.php)
$file = isset($_GET['file']) ? $_GET['file'] : '';

// Whitelist allowed files
$allowedFiles = ['matomo.js', 'matomo.php'];

if (!in_array($file, $allowedFiles)) {
    http_response_code(400);
    exit('Invalid request');
}

// Build the target URL
$targetUrl = $matomoUrl . $file;

// For tracking requests (matomo.php), forward all query parameters
if ($file === 'matomo.php') {
    $params = $_GET;
    unset($params['file']);
    if (!empty($params)) {
        $targetUrl .= '?' . http_build_query($params);
    }
}

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_USERAGENT => $_SERVER['HTTP_USER_AGENT'] ?? 'MatomoProxy/1.0',
]);

// For POST requests (tracking), forward the body
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Set response headers
http_response_code($httpCode);

if ($file === 'matomo.js') {
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
} else {
    header('Content-Type: ' . ($contentType ?: 'image/gif'));
    header('Cache-Control: no-cache, no-store, must-revalidate');
}

// Output response
echo $response;
