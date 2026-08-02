# MusterMate Deployment Guide

MusterMate ships as a **single Node.js server**: Express serves the built React
SPA (`dist/`) and the API (`/api/*`) from one origin. This keeps CORS and CSP
simple and makes the whole app one deployable unit.

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for how the app works
internally.

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
| `LOGIN_*`, `REGISTER_*` | No | Auth rate limits (in-memory per process). |
| `VITE_CURRENCY`, `VITE_NIGHT_SHIFT_ALLOWANCE` | No | Build-time client config (baked into the SPA at `npm run build`). |

Generate a strong secret:

```bash
openssl rand -hex 32
```

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

## Running as a service

Do not run the app in a bare terminal. Use a process manager so it restarts on
crash and survives reboots. The server handles `SIGTERM`/`SIGINT` gracefully
(drains HTTP + closes the pg pool).

### systemd

`/etc/systemd/system/mustermate.service`:

```ini
[Unit]
Description=MusterMate
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=/opt/mustermate
EnvironmentFile=/opt/mustermate/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=5
# Optional hardening
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mustermate
sudo systemctl status mustermate
```

### pm2 (alternative)

```bash
npm install -g pm2
pm2 start server/dist/index.js --name mustermate
pm2 save
pm2 startup
```

## Reverse proxy + TLS

Terminate TLS at a reverse proxy and forward to `127.0.0.1:3000`. The app's
CSP (production) uses `upgradeInsecureRequests`, so serving over HTTPS is the
intended setup.

### nginx

```nginx
server {
    listen 80;
    server_name mustermate.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mustermate.example.com;

    ssl_certificate     /etc/letsencrypt/live/mustermate.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mustermate.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy

```caddy
mustermate.example.com {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy obtains and renews TLS certificates automatically.

## Backups

Back up PostgreSQL regularly:

```bash
# Snapshot
pg_dump -U <user> -h <host> -d mustermate | gzip > mustermate_$(date +%F).sql.gz

# Restore
gunzip -c mustermate_2026-01-01.sql.gz | psql -U <user> -h <host> -d mustermate
```

Schedule this with cron/systemd timers and copy archives off-host. Photos and
signatures live in the database (Base64), so the DB backup covers all app data.

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
- Backups: `pg_dump` regularly (see above).

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Server exits at startup | `JWT_SECRET` missing. Set it in `.env`. |
| API returns `429` | In-memory rate limit (register 10 / 15 min, login 20 / 15 min). Restart the process to reset, or raise limits via `REGISTER_*` / `LOGIN_*`. |
| Login request hangs / high CPU | A stale or spinning server process holding the port. Restart the service (`sudo systemctl restart mustermate`). |
| 400 on user/worker writes | Optional fields sent as empty strings are rejected by zod — omit empty fields. |
| Browser tab has no/old icon | Favicon is `public/favicon.svg`, referenced from `index.html`. Hard-refresh to clear cached icons. |
| Logged-in state looks wrong | Session lives in localStorage (`mm_session_user`, `mm_token`). Clear site data to force a fresh login. |

## Development

```bash
npm run dev            # concurrently runs Vite (5173) + API (3000)
npm run typecheck      # client typecheck
npm run typecheck:server
npm run lint
npm run build          # full production build (no typecheck on server separately)
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run API + Vite concurrently |
| `npm run typecheck` | Client typecheck |
| `npm run typecheck:server` | Server typecheck |
| `npm run lint` | Oxlint |
| `npm run build` | Typecheck + build SPA + compile server |
| `npm run start` | Run compiled server (`server/dist`) |
