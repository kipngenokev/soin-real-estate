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
mysql -u root -p -e "CREATE DATABASE soinsync;"
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # then edit DATABASE_URL to match your MySQL
npm install
npx prisma migrate dev --name init
npm run dev
```

Server runs at `http://localhost:4000`.

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
npm run dev
```

App runs at `http://localhost:5173`.

## API response shape

Every backend response (success or error) follows:

```json
{ "success": true|false, "message": "string", "data": <payload|null> }
```

## Status

Phase 0 — foundation scaffold. No business logic yet. Auth, domain models, and
reports land in subsequent phases.
