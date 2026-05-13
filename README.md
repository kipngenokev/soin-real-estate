# Soinsync Real Estate

Production-ready MVP rental management system. Tracks properties, units,
tenants, leases, rent payments and maintenance issues, with separate admin
and tenant experiences behind a single login.

## Stack

- **Frontend** — React + Vite + TypeScript + Tailwind CSS, with a small
  in-house design system (`PageHeader`, `HeroBanner`, `StatTile`, `Pill`,
  `Avatar`) and `brand`/`ink`/`surface` Tailwind tokens.
- **Backend** — Node.js + Express + TypeScript + Prisma ORM
- **Database** — MySQL 8+
- **Reports** — PHP utility layer (Slim) for PDFs and CSV exports

No microservices, no queues, no Redis, no event bus. MVP-simple by design.

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+
- PHP 8.1+ with `php-xml`, `php-gd`, `php-mbstring`, `php-zip` (for the reports utility)
- Composer 2+

## Repository layout

```
.
├── backend/         Node + Express + TS + Prisma API
├── frontend/        React + Vite + TS + Tailwind app
├── php-reports/     PHP utility service for PDF and CSV exports
└── README.md
```

## Getting started

### 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE soinsyncreale;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit DATABASE_URL + JWT secrets to your values
npm install
npm run prisma:migrate        # applies all migrations (users, properties,
                              # units, tenants, leases, payments, issues)
npm run prisma:seed           # creates the initial admin user
npm run dev                   # http://localhost:4000
```

The seed creates an admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
Default: `admin@soinsync.local` / `ChangeMe!123` (change for production).

Smoke test:

```bash
curl http://localhost:4000/api/v1/health
# → {"success":true,"message":"OK","data":{"status":"ok"}}
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

### 4. PHP reports utility (optional for browsing, required for PDFs/CSV)

```bash
cd php-reports
composer install
composer start               # http://127.0.0.1:8080
```

Node talks to this service over HTTP — set `PHP_REPORTS_URL` in the backend
`.env` if you run it on a different host or port (default `http://127.0.0.1:8080`).
See `php-reports/README.md` for the full API.

Open `http://localhost:5173`, sign in with the seeded admin. You will be
redirected to `/admin`. Tenant users (created by an admin) land on `/portal`.

## Auth model

- **Roles** — `ADMIN`, `TENANT`
- **Tokens** — short-lived access JWT (15m) + longer refresh JWT (7d), both
  delivered as `httpOnly` cookies (`SameSite=Lax`, `Secure` in production)
- **Refresh flow** — axios interceptor calls `POST /auth/refresh` on a 401 and
  retries the original request once. On refresh failure the client clears
  state and the user is redirected to `/login`.
- **Registration** — public sign-up is disabled. Only an authenticated admin
  may call `POST /auth/register` to create users.

### Auth endpoints

| Method | Path                    | Auth           | Purpose              |
|--------|-------------------------|----------------|----------------------|
| POST   | `/api/v1/auth/login`    | public         | Sign in, set cookies |
| POST   | `/api/v1/auth/refresh`  | refresh cookie | Rotate tokens        |
| POST   | `/api/v1/auth/logout`   | public         | Clear auth cookies   |
| GET    | `/api/v1/auth/me`       | access token   | Current user         |
| POST   | `/api/v1/auth/register` | ADMIN only     | Create a new user    |

## Domain model

```
User ──1:1── Tenant ──*── Lease ──*── Payment
                          │
Property ──*── Unit ──────┘──*── Issue
```

- **Property** — name, location, description; owns many units.
- **Unit** — label, type (`STUDIO` / `ONE_BEDROOM`), rent amount,
  status (`AVAILABLE` / `OCCUPIED`).
- **Tenant** — profile fields (phone, national ID, emergency contact)
  linked 1:1 to a `User` with the `TENANT` role.
- **Lease** — ties a tenant to a unit; status (`DRAFT` / `ACTIVE` / `ENDED`),
  start/end dates, monthly rent snapshot.
- **Payment** — recorded against a lease; method (`CASH` / `BANK` / `MPESA`),
  reference, paid-on date, amount.
- **Issue** — maintenance request raised by a tenant against their unit;
  status (`OPEN` / `RESOLVED`).

## Domain endpoints

All routes are mounted under `/api/v1` and require a valid access token.
Admin-only routes are gated by the `ADMIN` role; tenant-scoped routes live
under `/portal`.

| Resource    | Base path                  | Notes                                |
|-------------|----------------------------|--------------------------------------|
| Properties  | `/properties`              | CRUD + detail with unit counts        |
| Units       | `/units`                   | CRUD, status toggle, per-property list |
| Tenants     | `/tenants`                 | CRUD, assign-to-unit, end-lease       |
| Leases      | `/leases`                  | CRUD, activate, end                   |
| Payments    | `/payments`                | List/create/delete, monthly summary, per-tenant view |
| Issues      | `/issues`                  | Admin list + resolve                  |
| Portal      | `/portal/*`                | Tenant-scoped lease, payments, issues |
| Dashboard   | `/admin/dashboard/*`       | Aggregate stats for the admin home    |

## Frontend surface

- `/login` — public entry.
- `/admin` — admin dashboard (hero, KPI tiles, revenue/occupancy charts,
  recent activity, open-issues feed).
- `/admin/properties`, `/admin/tenants`, `/admin/leases`, `/admin/payments`,
  `/admin/issues` — list pages with stat tiles + filtering.
- `/admin/properties/:id`, `/admin/tenants/:id`, `/admin/leases/:id` —
  detail pages with inline editing/actions.
- `/portal` — tenant overview.
- `/portal/maintenance` — tenant submits and tracks maintenance issues.

## API response shape

Every backend response (success or error) follows:

```json
{ "success": true|false, "message": "string", "data": <payload|null> }
```

## Status

MVP feature-complete: authentication, full property/unit/tenant/lease/
payment/issue domain, admin dashboard with charts, and tenant portal. The
PHP reports utility is wired for PDF/CSV exports — see
`php-reports/README.md`.
