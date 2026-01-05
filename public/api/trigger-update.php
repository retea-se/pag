<?php
/**
 * Manual update trigger API
 * Triggers update-events.sh on the server
 * Returns JSON with status
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Only allow POST
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(array('success' => false, 'error' => 'Method not allowed. Use POST.'));
    exit;
}

// Get home directory
$homeDir = isset($_SERVER['HOME']) ? $_SERVER['HOME'] : (isset($_ENV['HOME']) ? $_ENV['HOME'] : '/home/' . get_current_user());

// Path to update script
$updateScript = $homeDir . '/pag-scripts/scripts/update-events.sh';

// Check if script exists
if (!file_exists($updateScript)) {
    // Try alternative paths
    $alternativePaths = array(
        dirname(dirname(__DIR__)) . '/scripts/update-events.sh',
        '/home/mackaneu/pag-scripts/scripts/update-events.sh',
        dirname(__DIR__) . '/../scripts/update-events.sh'
    );

    $found = false;
    foreach ($alternativePaths as $path) {
        if (file_exists($path)) {
            $updateScript = $path;
            $found = true;
            break;
        }
    }

    if (!$found) {
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'error' => 'Update script not found',
            'searched' => array_merge(array($updateScript), $alternativePaths)
        ));
        exit;
    }
}

// Check if script is executable
if (!is_executable($updateScript)) {
    // Try to make it executable
    @chmod($updateScript, 0755);
    if (!is_executable($updateScript)) {
        http_response_code(500);
        echo json_encode(array(
            'success' => false,
            'error' => 'Update script is not executable and could not be made executable'
        ));
        exit;
    }
}

// Execute script in background (non-blocking)
// Use nohup to detach from parent process and redirect output
$command = 'nohup bash ' . escapeshellarg($updateScript) . ' > /dev/null 2>&1 & echo $!';
$pid = null;

// Try to execute
if (function_exists('exec')) {
    $output = array();
    exec($command, $output, $return_var);
    $pid = !empty($output) ? trim($output[0]) : 'background';
} elseif (function_exists('shell_exec')) {
    $result = shell_exec($command);
    $pid = $result ? trim($result) : 'background';
} else {
    http_response_code(500);
    echo json_encode(array(
        'success' => false,
        'error' => 'Cannot execute script (exec/shell_exec disabled)'
    ));
    exit;
}

// Return success
http_response_code(200);
echo json_encode(array(
    'success' => true,
    'message' => 'Update triggered',
    'script' => $updateScript,
    'timestamp' => date('c')
));
exit;
