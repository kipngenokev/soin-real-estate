# Soinsync PHP Reports — Document Utility Service

A stateless, HTTP-only PHP utility that turns JSON into PDFs and CSVs.

It does **one thing**: receive a payload from the Node.js backend and return a
formatted document. No authentication, no database, no business logic — Node
owns all of that.

## Why a separate service

Node.js owns the data and the business rules. PHP just renders documents —
templates can evolve independently and the renderer can be swapped out without
touching the Node codebase.

## Stack

- PHP 8.1+ (tested on 8.3)
- [Dompdf](https://github.com/dompdf/dompdf) for HTML → PDF
- Composer (no framework, no router library — a single front controller)
- Required PHP extensions: `dom`, `xml`, `gd`, `mbstring`, `zip`

On Ubuntu/Debian:

```bash
sudo apt install php-cli php-xml php-gd php-mbstring composer
```

## Install & run

```bash
cd php-reports
composer install
composer start            # serves on 127.0.0.1:8080
```

Or, equivalently:

```bash
php -S 127.0.0.1:8080 -t public
```

## API

All endpoints accept `application/json` and return either a binary file or
the standardized error envelope `{success, message, data}`.

| Method | Path             | Body                                                       | Response       |
|--------|------------------|------------------------------------------------------------|----------------|
| GET    | `/health`        | —                                                          | JSON status    |
| POST   | `/pdf/receipt`   | `{payment, tenant?, lease?, unit?, property?, currency?}`  | `application/pdf` |
| POST   | `/pdf/invoice`   | `{lease, period, currency?}`                               | `application/pdf` |
| POST   | `/pdf/lease`     | `{lease, terms?, currency?}`                               | `application/pdf` |
| POST   | `/pdf/report`    | `{title, subtitle?, sections[], filename?}`                | `application/pdf` |
| POST   | `/csv`           | `{filename?, columns:[...], rows:[{col:val,...}]}`         | `text/csv`     |

### Sample: receipt

```bash
curl -X POST http://127.0.0.1:8080/pdf/receipt \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "KES",
    "organization": {"name": "Soinsync Real Estate"},
    "payment": {"id": 42, "amount": "12500.00", "method": "MPESA",
                "reference": "QWE123XYZ", "paidAt": "2026-05-13"},
    "tenant": {"fullName": "Jane Tenant", "email": "jane@example.com"},
    "lease": {"id": 7},
    "property": {"name": "Cedar Court", "location": "Nakuru"},
    "unit": {"label": "A2"}
  }' --output receipt.pdf
```

### Sample: CSV

```bash
curl -X POST http://127.0.0.1:8080/csv \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "payments-may",
    "columns": ["Date", "Tenant", "Method", "Amount"],
    "rows": [
      {"Date":"2026-05-01","Tenant":"Jane","Method":"MPESA","Amount":"12500.00"},
      {"Date":"2026-05-05","Tenant":"John","Method":"CASH","Amount":"8000.00"}
    ]
  }' --output payments-may.csv
```

### Sample: generic report

```bash
curl -X POST http://127.0.0.1:8080/pdf/report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "May portfolio summary",
    "subtitle": "Cedar Court · 1 May – 31 May 2026",
    "filename": "may-summary",
    "sections": [
      {"heading":"Overview","type":"kv","rows":{"Occupancy":"100%","Open issues":"0"}},
      {"heading":"Payments","type":"table",
       "columns":["Date","Tenant","Amount"],
       "rows":[{"Date":"01 May","Tenant":"Jane","Amount":"12,500.00"}]}
    ]
  }' --output may-summary.pdf
```

## File layout

```
php-reports/
├── composer.json
├── public/
│   └── index.php             # front controller + router
├── src/
│   ├── helpers.php           # render, send, format helpers
│   └── templates/
│       ├── _layout.tpl.php   # shared inline CSS
│       ├── receipt.tpl.php
│       ├── invoice.tpl.php
│       ├── lease.tpl.php
│       └── report.tpl.php
└── README.md
```

## Production notes

- Run behind nginx + php-fpm. The built-in dev server is for development only.
- Bind to localhost or place behind the same internal network as the Node
  backend — there is no auth here on purpose.
- If you place it on a separate host, set `PHP_REPORTS_URL` on the Node backend
  to point at it.
