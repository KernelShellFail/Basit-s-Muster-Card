# MusterMate

Wage management & muster command center for construction workforces. React +
Vite frontend, Express + PostgreSQL backend, multi-tenant (per-organization)
with role-based access (owner / admin / supervisor / labour).

## Features

- Worker profiles with photos, Aadhaar/PAN/bank details, and printable muster cards
- Daily attendance (with night-shift + overtime flags) and labour self-claims
- Wage payments with signature capture and printable PDF receipts
- Leave requests, site management, and org-level + site-level team chat
- Real-time notifications and offline read-only cache

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, React Query, Zustand, framer-motion
- Backend: Express 5, PostgreSQL, custom JWT auth, zod validation
- PDFs: jspdf + html2canvas-pro

## Quick start (development)

```bash
npm install
cp .env.example .env   # fill in DB + JWT_SECRET
npm run dev            # Vite on :5173, API on :3000
```

The schema auto-creates on first server boot.

## Deploying to production

See [DEPLOY.md](./DEPLOY.md) — single-server deployment (Express serves the
built SPA + API). Requires PostgreSQL, a strong `JWT_SECRET`, and `NODE_ENV=production`.

```bash
npm ci
npm run build
NODE_ENV=production npm start
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
