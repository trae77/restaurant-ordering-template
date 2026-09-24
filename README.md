# Restaurant Ordering App Template

A mostly-complete **client demo template** for restaurant online ordering: browse a seeded Italian menu, manage a cart, check out (pickup or delivery stub), create an account, and see order history.

Built for pitches and quick re-skins — not production payments or kitchen integrations.

**Stack:** React + Vite + TypeScript · Express · SQLite (`better-sqlite3`) · JWT auth

**Demo brand:** Nonna's Kitchen (easy to swap)

---

## Quick start

```bash
npm install
npm run init-db          # creates server/data.db + seeds menu & demo user
npm run start:server     # API on http://localhost:4000
# in another terminal:
npm run dev:web          # Vite on http://localhost:5173 (proxies /api → 4000)
```

Or run both together:

```bash
npm install && npm run init-db && npm run dev
```

Open **http://localhost:5173**.

### Demo credentials

| Field    | Value                 |
|----------|-----------------------|
| Email    | `demo@nonnas.example` |
| Password | `demo1234`            |

Smoke-test the API (with the server running):

```bash
npm run smoke
```

---

## Environment

Copy `.env.example` → `.env` and adjust:

| Variable | Default | Notes |
|----------|---------|--------|
| `PORT` | `4000` | Express API port |
| `JWT_SECRET` | (dev fallback) | **Change in any shared/deployed environment** |
| `DATABASE_PATH` | `server/data.db` | SQLite file path |
| `VITE_API_URL` | _(empty)_ | Leave empty in local Vite (uses proxy). Set to full API origin when frontend is hosted separately |
| `VITE_RESTAURANT_NAME` | `Nonna's Kitchen` | Header / hero / title branding |
| `VITE_TAGLINE` | Homemade Italian… | Hero tagline |

---

## Swap branding for a client

1. **Name & copy** — set `VITE_RESTAURANT_NAME` / `VITE_TAGLINE`, or edit `src/lib/branding.ts`.
2. **Colors** — CSS variables at the top of `src/styles/index.css` (`--primary`, `--accent`, `--cream`, …).
3. **Logo** — replace `public/favicon.svg` and the `NK` mark in `src/components/Header.tsx`.
4. **Menu** — edit the seed arrays in `server/init-db.cjs`, then re-run `npm run init-db` (this **wipes** the SQLite DB).

---

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/menu` | — | Categories + items |
| POST | `/api/auth/signup` | — | Create account → JWT |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| POST | `/api/orders` | optional | Place order (guest or logged-in) |
| GET | `/api/orders/mine` | Bearer | Order history |
| GET | `/api/orders/:id` | optional | Single order |

Tax is a flat **8%** stub calculated server-side.

---

## Deploy notes

**Option A — split hosts**

- Build frontend: `npm run build` → host `dist/` on Netlify / Cloudflare Pages / S3+CDN.
- Set `VITE_API_URL=https://your-api.example.com` at build time.
- Run `node server/server.cjs` on a Node host (Railway, Render, Fly, VPS) with persistent disk for `data.db`.
- Enable CORS (already on) and use a strong `JWT_SECRET`.

**Option B — combined**

- Serve `dist/` from Express with `express.static` after `vite build`, and point a single process at one port. (Not wired by default — add a few lines in `server/server.cjs` if you want that path.)

SQLite is fine for demos; for multi-instance production, move to Postgres.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | API + Vite together |
| `npm run start:server` | API only |
| `npm run dev:web` | Vite only |
| `npm run init-db` / `seed` | Recreate DB + seed |
| `npm run build` | Typecheck + production frontend build |
| `npm run smoke` | curl-style API smoke test |

---

## Project layout

```
├── package.json
├── vite.config.ts          # Vite + /api proxy → :4000
├── index.html
├── .env.example
├── server/
│   ├── server.cjs          # Express API
│   ├── init-db.cjs         # schema + Nonna's Kitchen seed
│   ├── smoke-test.cjs
│   └── data.db             # gitignored
└── src/                    # React app (menu, cart, checkout, auth, account)
```

---

## License / use

Template code for demos and client proposals. Replace branding, menu, and secrets before sharing with a real restaurant.
