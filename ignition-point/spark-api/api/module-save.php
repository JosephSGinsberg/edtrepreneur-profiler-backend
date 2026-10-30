<?php
// Ignition Point module profile save -> Groundhogg.
// Reuses spark-api config + CORS helpers. One call per module completion.
// Stores per-module door tallies, the learner's answers, and rolls up a cumulative behavioural profile.

require_once dirname(__DIR__) . '/lib/cors.php';

$config = joebot_load_config();
joebot_handle_preflight($config);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

joebot_send_cors_headers($config);
$body = joebot_read_json_body();

$email  = strtolower(trim($body['email'] ?? ''));
$module = (int)($body['module'] ?? 0);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'saved' => false, 'message' => 'A valid email is required to save progress']);
    exit;
}
if ($module < 1 || $module > 7) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'saved' => false, 'message' => 'Unknown module']);
    exit;
}

$token     = $config['groundhogg_token'] ?? '';
$publicKey = $config['groundhogg_public_key'] ?? '';
$ghUrl     = rtrim($config['groundhogg_url'] ?? '', '/');

if (!$token || !$publicKey || !$ghUrl || str_starts_with($token, 'YOUR_') || str_starts_with($publicKey, 'YOUR_')) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'saved' => false, 'message' => 'CRM not configured on server']);
    exit;
}

function ip_gh(string $method, string $url, ?array $payload, string $token, string $publicKey): array
{
    $ch = curl_init($url);
    $opts = [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'gh-token: ' . $token,
            'gh-public-key: ' . $publicKey,
        ],
    ];
    if ($payload !== null) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($payload);
    }
    curl_setopt_array($ch, $opts);
    $raw    = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $json = is_string($raw) ? json_decode($raw, true) : null;
    return ['status' => $status, 'json' => is_array($json) ? $json : []];
}

$doorKeys = ['diagram', 'passage', 'clip', 'puzzle', 'thread'];

$tally = [];
foreach ($doorKeys as $d) {
    $tally[$d] = max(0, (int)($body['tally'][$d] ?? 0));
}

// Leading door for this module (or a mix).
$max = max($tally);
$leaders = array_keys(array_filter($tally, fn($v) => $v === $max && $max > 0));
$lead = count($leaders) === 1 ? $leaders[0] : ($max > 0 ? 'mix' : 'none');

// Constructor / deconstructor lean, inferred from behaviour (puzzle vs the other four doors).
$whole = $tally['diagram'] + $tally['passage'] + $tally['clip'] + $tally['thread'];
if ($max === 0)                $lean = 'none';
elseif ($tally['puzzle'] > $whole) $lean = 'constructor';
elseif ($tally['puzzle'] < $whole) $lean = 'deconstructor';
else                           $lean = 'mixed';

$answers = $body['answers'] ?? [];
$answersJson = json_encode($answers, JSON_UNESCAPED_UNICODE);
if ($answersJson === false) { $answersJson = '{}'; }
if (strlen($answersJson) > 8000) { $answersJson = substr($answersJson, 0, 8000); }

$pfx = 'ip_m' . $module . '_';
$newMeta = [
    $pfx . 'completed'     => date('c'),
    $pfx . 'lead_door'     => $lead,
    $pfx . 'lean'          => $lean,
    $pfx . 'answers'       => $answersJson,
];
foreach ($doorKeys as $d) {
    $newMeta[$pfx . 'door_' . $d] = $tally[$d];
}

// 1) Find existing contact by email.
$found = null;
$res = ip_gh('GET', $ghUrl . '?search=' . rawurlencode($email), null, $token, $publicKey);
$items = $res['json']['items'] ?? [];
foreach ($items as $it) {
    $itEmail = strtolower($it['data']['email'] ?? '');
    if ($itEmail === $email) { $found = $it; break; }
}
$existingMeta = $found['meta'] ?? [];

// 2) Cumulative behavioural profile = sum of every module's door counts (this module overrides its old values).
$cum = array_fill_keys($doorKeys, 0);
$modulesDone = [];
for ($m = 1; $m <= 7; $m++) {
    $p = 'ip_m' . $m . '_';
    if ($m === $module) {
        foreach ($doorKeys as $d) { $cum[$d] += $tally[$d]; }
        $modulesDone[] = $m;
        continue;
    }
    if (!empty($existingMeta[$p . 'completed'])) {
        $modulesDone[] = $m;
        foreach ($doorKeys as $d) { $cum[$d] += (int)($existingMeta[$p . 'door_' . $d] ?? 0); }
    }
}
$cmax = max($cum);
$cleaders = array_keys(array_filter($cum, fn($v) => $v === $cmax && $cmax > 0));
$clead = count($cleaders) === 1 ? $cleaders[0] : ($cmax > 0 ? 'mix' : 'none');
$cwhole = $cum['diagram'] + $cum['passage'] + $cum['clip'] + $cum['thread'];
if ($cmax === 0)                  $clean = 'none';
elseif ($cum['puzzle'] > $cwhole) $clean = 'constructor';
elseif ($cum['puzzle'] < $cwhole) $clean = 'deconstructor';
else                              $clean = 'mixed';

$newMeta['ip_profile_lead_door'] = $clead;
$newMeta['ip_profile_lean']      = $clean;
$newMeta['ip_modules_done']      = implode(',', $modulesDone);
foreach ($doorKeys as $d) {
    $newMeta['ip_profile_door_' . $d] = $cum[$d];
}
$newMeta['ip_profile_updated'] = date('c');

$tags = ['ip_m' . $module . '_complete', 'ip_door_' . $clead, 'ip_lean_' . $clean];

// Remove superseded cumulative-profile tags so only the current ones remain.
$allDoorTags = array_map(fn($d) => 'ip_door_' . $d, array_merge($doorKeys, ['mix', 'none']));
$allLeanTags = ['ip_lean_constructor', 'ip_lean_deconstructor', 'ip_lean_mixed', 'ip_lean_none'];
$removeTags = array_values(array_diff(array_merge($allDoorTags, $allLeanTags), $tags));

// 3) Update or create.
if ($found && !empty($found['ID'])) {
    $out = ip_gh('PATCH', $ghUrl . '/' . (int)$found['ID'], ['meta' => $newMeta, 'tags' => $tags, 'remove_tags' => $removeTags], $token, $publicKey);
    $mode = 'updated';
} else {
    $out = ip_gh('POST', $ghUrl, ['data' => ['email' => $email], 'meta' => $newMeta, 'tags' => $tags], $token, $publicKey);
    $mode = 'created';
}

$ok = $out['status'] >= 200 && $out['status'] < 300;

echo json_encode([
    'ok'      => $ok,
    'saved'   => $ok,
    'mode'    => $ok ? $mode : null,
    'module'  => $module,
    'lead'    => $lead,
    'lean'    => $lean,
    'profile' => ['lead' => $clead, 'lean' => $clean, 'modules_done' => $modulesDone],
    'message' => $ok ? 'Progress saved to learner record' : 'Could not save to CRM',
    'debug_status' => $ok ? null : $out['status'],
]);
