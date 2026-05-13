<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../src/helpers.php';

use function Soinsync\Reports\read_json_body;
use function Soinsync\Reports\render_template;
use function Soinsync\Reports\html_to_pdf;
use function Soinsync\Reports\send_pdf;
use function Soinsync\Reports\send_csv;
use function Soinsync\Reports\json_error;
use function Soinsync\Reports\require_fields;

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

// --- Health -----------------------------------------------------------------
if ($method === 'GET' && $path === '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'message' => 'OK',
        'data' => [
            'status' => 'ok',
            'php' => PHP_VERSION,
            'service' => 'soinsync-reports',
        ],
    ]);
    exit;
}

// --- PDFs -------------------------------------------------------------------
if ($method === 'POST' && preg_match('#^/pdf/(receipt|invoice|lease|report)$#', $path, $m)) {
    $template = $m[1];
    $data = read_json_body();

    // Each template enforces its own required fields at render time, but we
    // pre-check the obvious ones here so the error message is consistent.
    switch ($template) {
        case 'receipt':
            require_fields($data, ['payment']);
            $filename = 'receipt-' . (string) ($data['payment']['id'] ?? 'unknown') . '.pdf';
            break;
        case 'invoice':
            require_fields($data, ['lease', 'period']);
            $filename = 'invoice-' . (string) ($data['lease']['id'] ?? 'unknown') . '-'
                . (string) ($data['period']['month'] ?? 'unknown') . '.pdf';
            break;
        case 'lease':
            require_fields($data, ['lease']);
            $filename = 'lease-' . (string) ($data['lease']['id'] ?? 'unknown') . '.pdf';
            break;
        case 'report':
            require_fields($data, ['title']);
            $filename = (string) ($data['filename'] ?? 'report') . '.pdf';
            break;
        default:
            json_error(400, "unknown pdf template");
    }

    $html = render_template($template, $data);
    $pdf = html_to_pdf($html);
    send_pdf($pdf, $filename);
}

// --- CSV --------------------------------------------------------------------
if ($method === 'POST' && $path === '/csv') {
    $data = read_json_body();
    require_fields($data, ['columns', 'rows']);

    if (!is_array($data['columns']) || array_is_list($data['columns']) === false) {
        json_error(400, 'columns must be an ordered array of header names');
    }
    if (!is_array($data['rows'])) {
        json_error(400, 'rows must be an array');
    }
    foreach ($data['columns'] as $col) {
        if (!is_string($col)) {
            json_error(400, 'columns must contain only strings');
        }
    }

    $filename = (string) ($data['filename'] ?? 'export') . '.csv';
    send_csv($data['columns'], $data['rows'], $filename);
}

// --- 404 --------------------------------------------------------------------
json_error(404, "no handler for {$method} {$path}");
