<?php

/**
 * Shared CSS for all PDF templates. Inline-included into each template
 * inside a <style> tag — Dompdf reads inline styles without remote fetch.
 */
?>
* { box-sizing: border-box; }
body { font-family: "DejaVu Sans", Arial, sans-serif; color: #1f2937; font-size: 11px; margin: 0; }
.page { padding: 32px 36px; }
h1 { font-size: 18px; margin: 0 0 4px; color: #0f172a; }
h2 { font-size: 13px; margin: 24px 0 8px; color: #0f172a; }
.muted { color: #6b7280; }
.right { text-align: right; }
.row { display: flex; justify-content: space-between; align-items: flex-start; }
.header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
.brand { font-size: 14px; font-weight: 700; color: #0f172a; letter-spacing: 0.4px; }
.brand-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
.meta-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
.meta-table td { padding: 4px 8px 4px 0; vertical-align: top; font-size: 11px; }
.meta-table td.label { color: #6b7280; width: 110px; }
table.lined { width: 100%; border-collapse: collapse; margin-top: 8px; }
table.lined th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 6px 8px; }
table.lined td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 11px; }
table.lined tr:last-child td { border-bottom: 0; }
.total-box { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
.total-row { display: flex; justify-content: space-between; padding: 3px 0; }
.total-row.grand { font-weight: 700; font-size: 13px; color: #0f172a; border-top: 1px solid #0f172a; margin-top: 6px; padding-top: 8px; }
.stamp { margin-top: 24px; padding: 8px 12px; background: #f1f5f9; border-left: 3px solid #0f172a; }
.footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; }
.section { margin-top: 20px; }
.col-2 { width: 50%; }
.notice { color: #b45309; font-size: 10px; margin-top: 6px; }
.signatures { margin-top: 48px; }
.signature-line { border-top: 1px solid #1f2937; padding-top: 6px; width: 220px; }
