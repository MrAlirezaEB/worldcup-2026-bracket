# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

BUGLOOS WorldCup 2026 Bracket — a group-stage prediction app. Users log in by email (one submission per email), drag-and-drop to rank the 4 teams in each of the 12 groups (A–L), and submit a final, immutable prediction. An admin sets the official results; scores are the count of teams predicted in the correct position.

## Commands

Docker (production, recommended) — uses the `Makefile`:
```bash
make build      # docker compose build
make up         # docker compose up -d  (app at http://localhost:7021)
make down
make logs
APP_PORT=9090 make up   # override host port
```

Local development (no Docker):
```bash
# Backend (serves API + built frontend on PORT, default 5000)
cd backend && npm install && node server.js

# Frontend (Vite dev server with HMR)
cd frontend && npm install && npm run dev
npm run build   # outputs to frontend/dist
```

There are no tests, linters, or build step for the backend.

## Architecture

Two services, two different ways the frontend is served depending on how you run it:

- **Docker:** `frontend` container (Caddy, see `frontend/Caddyfile`) serves the built SPA on port 80 and reverse-proxies `/api/*` to the `backend` container on port 5000. The two containers are separate; `backend` is not exposed to the host.
- **Single-server (local `node server.js`):** the backend itself serves `frontend/dist` as static files and falls back to `index.html` for SPA routing (`server.js:184-188`). For this to work you must `npm run build` the frontend first.

The frontend always calls the API at the relative path `/api` (`API_BASE` in `App.vue`), so both serving modes work without config changes.

### Backend (`backend/server.js`, single file)

Express 5 app. **The datastore is a plain JSON file (`backend/db.json`) read/written with `fs` on every request** — `getDb`/`saveDb`. Despite `mongoose` and `lowdb` being in `package.json` and `MONGODB_URI` being in `backend/.env`, **neither is used**; ignore the Mongo references (including in the README). The `db.json` file is bind-mounted in `docker-compose.yml` so data survives container rebuilds.

`db.json` shape: `{ submissions: [], results: [], settings: { submissionsEnabled } }`.
- `submissions`: `{ email, standings: [{groupName, teams: [...]}], createdAt }`
- `results`: official standings, same `[{groupName, teams}]` shape
- Scores are **never stored** — `calculateScore` recomputes on every read by comparing each submission's team positions against `results`.

API routes (all under `/api`): `GET/POST settings`, `POST check-email`, `GET submissions`, `GET/POST results`, `GET scoreboard`, `POST submit`. `POST /submit` enforces one-per-email and the `submissionsEnabled` gate.

### Frontend (`frontend/src/App.vue`, single file)

Vue 3 `<script setup>` SPA — essentially everything lives in `App.vue`. Vite + Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config`), `vuedraggable` for ranking, `axios` for the API. View state is driven by refs (`isLoggedIn`, `isAdmin`, `hasSubmitted`) rather than a router — login/bracket/results/admin are conditional sections in one template.

**Two pieces of hardcoded data live in `App.vue`, not the backend:** the 48-team / 12-group bracket layout (`groups`) and the `teamFlags` map (team name → flagcdn country code). Changing teams or groups means editing `App.vue`.

**Auth is frontend-only and trivial:** typing `admin@bugloos.com` as the email unlocks the admin panel (`checkEmail` in `App.vue`). There is no password and no server-side auth — the admin `POST /results` and `POST /settings` endpoints are unprotected.
