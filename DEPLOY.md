# MusterMate Deployment Guide

MusterMate ships as a **single Node.js server**: Express serves the built React
SPA (`dist/`) and the API (`/api/*`) from one origin. This keeps CORS and CSP
simple and makes the whole app one deployable unit.

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+

## Environment variables

Copy `.env.example` to `.env` and set real values:

| Variable | Required | Notes |
| --- | --- | --- |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT` | Yes | PostgreSQL connection. Use a dedicated non-superuser account. |
| `JWT_SECRET` | Yes | **Long random value** (e.g. `openssl rand -hex 32`). Never reuse the dev default. Rotate before first production deploy. |
| `NODE_ENV` | Yes | `production` enables the SPA static serving + strict CSP. |
| `PORT` | No | Default `3000`. |
| `CORS_ORIGIN` | No | Comma-separated allowed origins. With single-server hosting this can be left unset (same-origin requests don't need CORS). |
| `LOGIN_*`, `REGISTER_*` | No | Auth rate limits. |
| `VITE_CURRENCY`, `VITE_NIGHT_SHIFT_ALLOWANCE` | No | Build-time client config (baked into the SPA at `npm run build`). |

## Database setup

1. Create the database:
   ```sql
   CREATE DATABASE mustermate;
   ```
2. The schema (tables + columns) is created and reconciled automatically on
   first server boot (`initSchema`). No migration tool is required.

### Removing demo data from an existing dev database

The demo seeder was removed from the codebase. Databases that were previously
seeded with the demo org (`org-101`) still contain that data. Purge it before
shipping:

```bash
# 1. Backup first
pg_dump -U <user> -h <host> mustermate > mustermate_pre_demo_cleanup.sql

# 2. Run the cleanup script
psql -U <user> -h <host> -d mustermate -f server/scripts/cleanup_demo.sql
```

## Build & run

```bash
npm ci
npm run build          # typechecks + builds SPA (dist/) + compiles server (server/dist/)
NODE_ENV=production npm start   # node server/dist/index.js
```

The app is now served at `http://localhost:3000`:

- `GET /` → the SPA (all non-`/api` GET routes return `index.html`)
- `GET /api/health` → `{ "status": "UP" }`
- All other `/api/*` routes → the REST API

## Production considerations

- **Terminate TLS** at a reverse proxy (nginx / Caddy) or the platform's TLS
  terminator and forward to port 3000.
- **Serve the app behind a hostname** and set a strong `JWT_SECRET`. The server
  refuses to boot without one.
- **Photos / signatures** are stored as Base64 in PostgreSQL (20 MB body limit).
  For large deployments consider moving to object storage (S3) and storing URLs.
- **Rate limiting** is in-memory per process — fine for a single instance. For
  multi-instance horizontal scaling, move to a shared store (e.g. Redis) or a
  platform gateway limit.
- Backups: `pg_dump` regularly.

## Development

```bash
npm run dev            # concurrently runs Vite (5173) + API (3000)
npm run typecheck      # client typecheck
npm run typecheck:server
npm run lint
```
