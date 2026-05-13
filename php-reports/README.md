# PHP Reports Layer (Reserved)

This directory is reserved for the PHP-based reporting utility layer of the
Soinsync rental management system. It will host PDF generation (rent statements,
invoices, receipts), Excel/CSV exports, and portfolio reports.

No PHP code yet — this layer is implemented in a later phase. The Node.js backend
will shell out to or proxy these PHP scripts when report endpoints are added.

## Planned scope
- Rent statements (PDF, per tenant)
- Invoices & receipts (PDF)
- Tenant / payment / arrears exports (Excel/CSV)
- Owner portfolio summaries (PDF)

## Planned stack
- PHP 8.2+
- mPDF or Dompdf for PDF generation
- PhpSpreadsheet for Excel exports
