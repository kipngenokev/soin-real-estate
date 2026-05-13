<?php

declare(strict_types=1);

namespace Soinsync\Reports;

use Dompdf\Dompdf;
use Dompdf\Options;
use Throwable;

/**
 * Read the JSON body from the current request.
 * @return array<string,mixed>
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_error(400, 'invalid JSON body');
    }
    return $data;
}

/**
 * Emit a JSON error response and terminate.
 */
function json_error(int $status, string $message): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => $message, 'data' => null]);
    exit;
}

/**
 * Render a template file with the given data into an HTML string.
 * @param array<string,mixed> $data
 */
function render_template(string $template, array $data): string
{
    $path = __DIR__ . '/templates/' . $template . '.tpl.php';
    if (!is_file($path)) {
        json_error(500, "template not found: {$template}");
    }
    // Extract data into the template scope. Templates must use $vars defensively.
    extract($data, EXTR_SKIP);
    ob_start();
    try {
        require $path;
    } catch (Throwable $e) {
        ob_end_clean();
        json_error(500, 'template render failed: ' . $e->getMessage());
    }
    $html = ob_get_clean();
    if ($html === false) {
        json_error(500, 'template render produced no output');
    }
    return $html;
}

/**
 * Convert HTML to a PDF binary string using Dompdf.
 */
function html_to_pdf(string $html, string $paper = 'A4', string $orientation = 'portrait'): string
{
    $options = new Options();
    $options->set('isRemoteEnabled', false);
    $options->set('defaultFont', 'DejaVu Sans');
    $options->set('chroot', __DIR__);

    $dompdf = new Dompdf($options);
    $dompdf->loadHtml($html, 'UTF-8');
    $dompdf->setPaper($paper, $orientation);
    $dompdf->render();
    return (string) $dompdf->output();
}

/**
 * Stream a PDF file to the client.
 */
function send_pdf(string $pdf, string $filename): never
{
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="' . sanitize_filename($filename) . '"');
    header('Content-Length: ' . strlen($pdf));
    header('Cache-Control: private, no-store');
    echo $pdf;
    exit;
}

/**
 * Build and stream a CSV file from columns + rows.
 * @param list<string> $columns
 * @param list<array<int|string,mixed>> $rows
 */
function send_csv(array $columns, array $rows, string $filename): never
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . sanitize_filename($filename) . '"');
    header('Cache-Control: private, no-store');

    $out = fopen('php://output', 'w');
    if ($out === false) {
        json_error(500, 'failed to open output stream');
    }
    // UTF-8 BOM so Excel opens correctly.
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $columns);
    foreach ($rows as $row) {
        $ordered = [];
        foreach ($columns as $col) {
            $ordered[] = format_cell($row[$col] ?? '');
        }
        fputcsv($out, $ordered);
    }
    fclose($out);
    exit;
}

function format_cell(mixed $value): string
{
    if ($value === null) {
        return '';
    }
    if (is_bool($value)) {
        return $value ? 'true' : 'false';
    }
    if (is_scalar($value)) {
        return (string) $value;
    }
    return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '';
}

function sanitize_filename(string $name): string
{
    $name = preg_replace('/[^A-Za-z0-9._\-]+/', '_', $name) ?? 'document';
    return $name === '' ? 'document' : $name;
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data)) {
            json_error(400, "missing required field: {$f}");
        }
    }
}

function escape(mixed $value): string
{
    if ($value === null) {
        return '';
    }
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function format_money(mixed $value, string $currency = ''): string
{
    if ($value === null || $value === '') {
        return '—';
    }
    $n = is_numeric($value) ? (float) $value : 0.0;
    $formatted = number_format($n, 2, '.', ',');
    return $currency === '' ? $formatted : "{$currency} {$formatted}";
}

function format_date(?string $iso): string
{
    if ($iso === null || $iso === '') {
        return '—';
    }
    $t = strtotime($iso);
    return $t === false ? $iso : date('d M Y', $t);
}
