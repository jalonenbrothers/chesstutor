<?php
declare(strict_types=1);
require_once dirname(__DIR__, 2) . '/src/AppConfig.php';
require_once dirname(__DIR__, 2) . '/src/OpenRouterClient.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function send(int $code, string $message, string $mode = 'error'): never
{
    http_response_code($code);
    echo json_encode(['message' => $message, 'mode' => $mode], JSON_THROW_ON_ERROR);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    send(405, 'Please use POST for tutor questions.');
}
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) send(413, 'Message too large.');
try {
    $request = json_decode(file_get_contents('php://input') ?: '', true, 64, JSON_THROW_ON_ERROR);
} catch (JsonException) { send(400, 'Invalid JSON.'); }
if (!is_array($request)) send(400, 'Expected a JSON object.');
$fen = (string)($request['fen'] ?? '');
$move = (string)($request['last_move'] ?? '');
$question = (string)($request['question'] ?? 'What basic idea should I look for?');
if (strlen($fen) > 130 || strlen($fen) < 8 || strlen($move) > 20 || preg_match_all('/./us', $question) > 200) {
    send(422, 'Invalid or oversized chess context.');
}

// Local-dev configuration only; do not place credentials inside public/.
// Priority: environment variables, then config/config.php (the real,
// gitignored environment file), then the legacy config/.env file.
$config = AppConfig::openrouter();
$key = $config['api_key'];
$model = $config['model'];
if (!$key || !$model) {
    send(200, 'The board and guided lessons work offline. To enable AI explanations, copy config/config.php.example to config/config.php (or config/.env.example to config/.env) and set OPENROUTER_API_KEY and OPENROUTER_MODEL. Until Stockfish is integrated, AI replies will be general chess coaching rather than verified move analysis.', 'setup');
}
try {
    $client = new OpenRouterClient($key, $model);
    send(200, $client->explain($fen, $move, $question), 'ai');
} catch (Throwable $error) {
    error_log('[chess-tutor] AI API failed: ' . get_class($error));
    send(502, 'The AI tutor could not respond. Please try again later.');
}
