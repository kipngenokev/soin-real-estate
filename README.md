# Soinsync Real Estate

Production-ready MVP rental management system.

## Stack

- **Frontend** — React + Vite + TypeScript + Tailwind CSS
- **Backend** — Node.js + Express + TypeScript + Prisma ORM
- **Database** — MySQL 8+
- **Reports (later)** — PHP utility layer for PDFs and exports

No microservices, no queues, no Redis, no event bus. MVP-simple by design.

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+
- PHP 8.2+ (only needed once the reports layer lands)

## Repository layout

```
.
├── backend/         Node + Express + TS + Prisma API
├── frontend/        React + Vite + TS + Tailwind app
├── php-reports/     Reserved for the PHP reporting layer (later phase)
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
npm run prisma:migrate -- --name auth_init   # creates users table
npm run prisma:seed                          # creates the initial admin user
npm run dev                                  # http://localhost:4000
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

### Endpoints

| Method | Path                  | Auth         | Purpose                  |
|--------|-----------------------|--------------|--------------------------|
| POST   | `/api/v1/auth/login`  | public       | Sign in, set cookies     |
| POST   | `/api/v1/auth/refresh`| refresh cookie | Rotate tokens          |
| POST   | `/api/v1/auth/logout` | public       | Clear auth cookies       |
| GET    | `/api/v1/auth/me`     | access token | Current user             |
| POST   | `/api/v1/auth/register` | ADMIN only | Create a new user        |

## API response shape

Every backend response (success or error) follows:

```json
{ "success": true|false, "message": "string", "data": <payload|null> }
```

## Status

Phase 1 — authentication complete. Phase 2 will introduce domain models
(properties, units, tenants, leases, payments, maintenance).
