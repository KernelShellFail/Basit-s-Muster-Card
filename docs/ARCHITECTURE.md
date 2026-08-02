# MusterMate Architecture

How the application works end to end. Read this before contributing or debugging.

## 1. Overview

MusterMate is a **single Node.js server** application:

- Express serves the **built React SPA** (`dist/`) and the **REST API** (`/api/*`) from one origin.
- **PostgreSQL** is the only external service.
- The app is **multi-tenant**: every organization is fully isolated by an
  `organization_id` stamped onto every row and enforced in every query.

```
Browser
  │  (SPA at /, JSON at /api/*)
  ▼
Express (single origin)
  ├─ /            → static SPA (production only)
  ├─ /api/health  → { status: "UP" }
  └─ /api/*       → auth → zod validate → controller → repository → PostgreSQL
```

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, TypeScript |
| Client state | Zustand (`src/store/useAppStore.ts`) |
| Server state | TanStack React Query (`src/api/queries.ts`) |
| Routing / animation | react-router-dom 7, framer-motion, Lenis (smooth scroll) |
| Backend | Express 5, zod validation, custom HS256 JWT auth |
| Database | PostgreSQL via `pg` |
| PDFs | jspdf + html2canvas-pro |
| CLI | npm scripts (`dev`, `build`, `start`, `lint`, `typecheck`) |

## 3. Request flow

A typical read or write travels this path (client → server):

```
React component
  → react-query hook (src/api/queries.ts)
  → LocalDB adapter (src/services/db.ts)
  → fetch /api/<resource>        (Bearer token in Authorization header)
  → Express router (server/src/routes/index.ts)
  → requireAuth / requireRole    (middleware/auth.middleware.ts)
  → validateBody (zod)           (middleware/validate.middleware.ts)
  → controller                   (server/src/controllers/*.ts)
  → repository                   (server/src/repositories/*.ts)
  → pg pool                      (server/src/db.ts)
  → PostgreSQL
```

### Offline / degraded behavior

`LocalDB` (`src/services/db.ts`) is the single client data adapter. It:

- **Reads**: hits the API when online, otherwise falls back to a read-only
  `localStorage` cache (`mm_*` keys).
- **Writes**: refuse to run offline (`requireOnlineForWrite` throws "You're
  offline. Connect to the internet to save changes."). Writes are **never queued**
  locally, so no data is silently lost and no PII is persisted in plaintext
  localStorage. The backend is always the source of truth.
- Health is checked via `/api/health`, cached for 10 seconds.

## 4. Authentication & sessions

### Registration

`POST /api/auth/register` (`server/src/controllers/auth.controller.ts`) performs
a single atomic bootstrap:

1. Creates the `Organization`.
2. Creates a default site ("Headquarters / Main Site").
3. Creates the owner `User` (password hashed with PBKDF2-sha512, 210k iterations).
4. Returns a signed JWT + user profile.

### Login

`POST /api/auth/login` verifies the identifier (email / phone / username / uid)
with the stored PBKDF2 hash, then returns a JWT.

### Tokens

- Custom HS256 JWT (`server/src/utils/jwt.ts`), **7-day expiry**, secret from
  `JWT_SECRET`. The server **refuses to boot** without a `JWT_SECRET`.
- Payload carries `uid`, `role`, `siteId`, `organizationId`, `workerId` — this
  is the basis for all data scoping.
- The client stores the token in `mm_token` and the session user in
  `mm_session_user` (localStorage).

### Middleware

- `requireAuth` — verifies the `Bearer` token and attaches `req.user`.
- `requireRole(roles)` — rejects roles not in the allowed list with 403.
- Applied per-route in each `server/src/routes/*.routes.ts`.

## 5. Roles & data scoping

Four roles, defined in `server/src/routes` and the client `Role` type:

| Role | Scope |
| --- | --- |
| `owner` | Whole organization |
| `admin` | Whole organization |
| `supervisor` | Their assigned site (`siteId`) |
| `labour` | Themselves (`workerId`) |

Every controller derives the org from `req.user.organizationId` and every
repository query filters by it. Example: `getWorkers` in
`server/src/controllers/worker.controller.ts`:

- `labour` → their own worker record only.
- `supervisor` → workers at their site.
- otherwise → all workers in the org.

Cross-organization writes are rejected (e.g. a worker ID belonging to another
org returns 403 in `saveWorker`). The sidebar (`src/components/Sidebar.tsx`)
builds the nav per role.

## 6. Database schema

There is **no migration tool**. `server/src/schemas/dbInit.ts` is the single
source of truth:

- On boot, `initSchema()` runs `CREATE TABLE IF NOT EXISTS` for every table.
- It then reconciles missing columns with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`,
  so schemas from older builds are upgraded automatically.

Tables: `organizations`, `users`, `sites`, `workers`, `attendance`, `payments`,
`leaves`, `notifications`, `chat`, `labour_submissions`.

Columns are `snake_case`; controllers map to the client's `camelCase` types
(see `src/services/db.ts` interfaces).

## 7. Real-time behavior

There is no websocket layer — "real-time" is **polling**:

| Feed | Interval |
| --- | --- |
| Chat (`useChat`) | 5 s |
| Notifications (`useNotifications`) | 15 s |

Chat messages are stored server-side (`server/src/repositories/chat.repository.ts`,
ordered `created_at ASC`). The chat UI (`src/features/chat/Chat.tsx`) handles
scrolling locally: `data-lenis-prevent` on the message stream so the wheel
scrolls the list and not the page, near-bottom auto-scroll, and a
"New messages ↓" pill when the user has scrolled up.

## 8. Modules / screens

Routing is defined in `src/router.tsx` (all behind `AuthGuard`, lazy-loaded):

| Route | File | Purpose |
| --- | --- | --- |
| `/login` | `features/auth/AuthPage.tsx` | Login / owner registration |
| `/dashboard` | `features/dashboard/Dashboard.tsx` | Owner/admin KPIs, attendance trend, payroll overview |
| `/` (labour) | `features/labour/LabourDashboard.tsx` | Worker's own wage roster |
| `/verification` | `features/verification/CrossCheck.tsx` | Muster cross-check / discrepancy resolution |
| `/workers` | `features/workers/Workers.tsx` | Worker directory, credentials, digital muster card + PDF |
| `/attendance` | `features/attendance/Attendance.tsx` | Daily attendance + finalize muster |
| `/payments` | `features/payments/Payments.tsx` | Wages/advances with signature capture + PDF receipts |
| `/leaves` | `features/leave/Leaves.tsx` | Leave requests |
| `/sites` | `features/sites/Sites.tsx` | Site management |
| `/staff` | `features/staff/Staff.tsx` | Staff directory |
| `/chat` | `features/chat/Chat.tsx` | Org + site team chat |
| `/notifications` | `features/notifications/Notifications.tsx` | Notification center |
| `/settings` | `features/settings/Settings.tsx` | Org GST data, profile, backup/restore |

## 9. PDF, themes & branding

- **PDFs**: `jspdf` + `html2canvas-pro` render the muster card and payment
  receipts client-side (`elementToPdf`). Photos/signatures are stored as Base64
  in Postgres (server body limit is 20 MB).
- **Themes**: dark ("chalkboard") and light ("paper"). Tokens live in
  `src/index.css` under `@theme`, `.dark`, and `:root:not(.dark)`. The chosen
  theme is persisted in `mm_theme` and applied pre-paint in `index.html` to
  avoid flash.
- **Branding**: app name is **MusterMate** (sidebar + auth lockup, browser
  title, `public/favicon.svg`). A subtle fixed **"basit's Muster Card"** watermark
  (`src/components/Watermark.tsx`) sits behind every screen using the theme-aware
  `--color-watermark` token (7% opacity, pointer-events-none).

## 10. Key config & environment

| Variable | Purpose |
| --- | --- |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_NAME`, `DB_PORT` | PostgreSQL connection |
| `JWT_SECRET` | Token signing (required — server refuses to boot without it) |
| `NODE_ENV=production` | Enables SPA static serving + strict CSP |
| `PORT` | HTTP port (default 3000) |
| `CORS_ORIGIN` | Comma-separated allowed origins (unset in single-server mode) |
| `LOGIN_*`, `REGISTER_*` | In-memory auth rate limits |
| `VITE_CURRENCY`, `VITE_NIGHT_SHIFT_ALLOWANCE` | Build-time client config |

Rate limiting is in-memory per process (fine for a single instance). For
horizontal scaling, move it to a shared store or platform gateway limit.

## 11. Project layout

```
├─ index.html            # SPA shell, theme pre-paint, favicon, fonts
├─ public/               # favicon.svg, icons.svg
├─ src/
│  ├─ api/queries.ts     # React Query hooks + mutations
│  ├─ services/db.ts     # LocalDB adapter (API + localStorage fallback)
│  ├─ store/useAppStore.ts
│  ├─ components/        # Layout, Sidebar, Header, Watermark, UI kit
│  ├─ features/          # one folder per screen (dashboard, workers, chat…)
│  ├─ router.tsx         # routes + AuthGuard + lazy loading
│  └─ utils/             # i18n, animations, cn
└─ server/
   └─ src/
      ├─ index.ts        # Express bootstrap, static SPA, graceful shutdown
      ├─ db.ts           # pg pool + PBKDF2 password hashing
      ├─ config.ts       # centralized env config
      ├─ schemas/        # zod body schemas + dbInit.ts (tables)
      ├─ middleware/     # auth, validate, rateLimit, errorHandler
      ├─ routes/         # express routers per resource
      ├─ controllers/    # request handlers
      └─ repositories/   # SQL data access
```
