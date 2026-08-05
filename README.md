# Adolfo Mobile

**React Native client for [Adolfo](https://adolfo-nine.vercel.app)** — auth, remote job board, and course catalog on a shared FastAPI backend.

[![Expo](https://img.shields.io/badge/Expo-57-000.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![API](https://img.shields.io/badge/BFF-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://github.com/erickorso/adolfo/tree/main/services/mobile-api)

> Part of the Adolfo product family: web (Next.js) · mobile (this repo) · BFF (`mobile-api`).

---

## Why this project

Adolfo is a personal product platform (jobs, courses, learning paths). This app proves the same domain works on **mobile** with a clean client/server split:

- Typed API client against a dedicated FastAPI BFF
- Secure JWT session (SecureStore / web fallback)
- File-based routing with Expo Router
- Same Postgres data as the web app (Neon)

Built as a **portfolio-grade RN client** — not a toy todo list.

---

## Features

| Module | What you get |
|--------|----------------|
| **Auth** | Login, register, session restore, logout · JWT Bearer · SecureStore |
| **Jobs** | Search + scope keywords · public remote listings · open apply URL |
| **Courses** | Search + default query from Scope · catalog from Neon |
| **Scope** | Per-user keywords/queries (Neon) · **Run ingest now** · auto-ingest on login |
| **Coach** | Career Coach IA · contexto Jobs/Courses/Scope · chips deep-link · requiere login |

---

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│  Adolfo Mobile      │  HTTPS  │  mobile-api (FastAPI) │         │  Neon       │
│  Expo + RN + TS     │ ──────► │  JWT · Jobs · Courses│ ──────► │  Postgres   │
│  Expo Router tabs   │         │  shared Prisma tables│         │  (Adolfo)   │
└─────────────────────┘         └──────────────────────┘         └─────────────┘
```

| Layer | Stack |
|-------|--------|
| UI | React Native 0.86, Expo 57, Expo Router |
| Auth storage | `expo-secure-store` (native) · `localStorage` (web) |
| API | REST `/api/v1/*` · OpenAPI at `:4002/docs` |
| Backend | [adolfo/services/mobile-api](https://github.com/erickorso/adolfo/tree/main/services/mobile-api) |
| Web twin | [erickorso/adolfo](https://github.com/erickorso/adolfo) · [live](https://adolfo-nine.vercel.app) |

---

## Screenshots

> Drop device captures in `docs/screenshots/` and uncomment:

<!--
| Auth | Jobs | Courses |
|:---:|:---:|:---:|
| ![Auth](docs/screenshots/auth.png) | ![Jobs](docs/screenshots/jobs.png) | ![Courses](docs/screenshots/courses.png) |
-->

```text
docs/screenshots/auth.png
docs/screenshots/jobs.png
docs/screenshots/courses.png
```

---

## Quick start

**1. API** (from the Adolfo monorepo):

```bash
cd ../adolfo/services/mobile-api
# .venv + DATABASE_URL from Adolfo .env
uvicorn app.main:app --reload --port 4002
```

**2. App:**

```bash
cp .env.example .env
npm install
npm start
```

Then press `w` (web), scan the QR with Expo Go, or run an emulator.

### `EXPO_PUBLIC_API_URL`

| Runtime | Value |
|---------|--------|
| Expo web / iOS simulator | `http://127.0.0.1:4002` |
| Android emulator | `http://10.0.2.2:4002` |
| Physical device | `http://<your-LAN-IP>:4002` |

---

## Share a live demo

Tunnel (`expo start --tunnel`) only works while tu PC está prendida. Para link compartible:

### 1. API siempre up (Railway)

En `adolfo/services/mobile-api` (ya tiene `railway.toml` + Dockerfile):

1. Crear servicio Railway → root `services/mobile-api`
2. Env: `DATABASE_URL` (Neon), `MOBILE_JWT_SECRET`, `ADOLFO_BASE_URL=https://adolfo-nine.vercel.app`, `JOBS_INGEST_SECRET` (mismo que Vercel)
3. Public URL ej. `https://adolfo-mobile-api.up.railway.app`

### 2. App compartible

**Opción A — Expo Go (rápida, portfolio)**  
```bash
# .env
EXPO_PUBLIC_API_URL=https://TU-API.up.railway.app
npx expo start --tunnel
```
Compartí el QR / `exp://…` mientras Metro corre. Para algo más estable: [EAS Update](https://docs.expo.dev/eas-update/introduction/) + proyecto en expo.dev.

**Opción B — Web (link https permanente)**  
```bash
EXPO_PUBLIC_API_URL=https://TU-API.up.railway.app npx expo export -p web
# deploy la carpeta dist/ a Vercel/Netlify
```

**Opción C — APK/IPA preview**  
```bash
npx eas-cli build --profile preview
```

### Checklist demo Creatunity / recruiters

- [ ] mobile-api en Railway (health verde)
- [ ] `EXPO_PUBLIC_API_URL` apunta a Railway
- [ ] Login de prueba + Scope + Coach
- [ ] Link web **o** Expo Go + tunnel/EAS

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run web` | Run in browser |
| `npm run android` / `ios` | Native targets |
| `npm run typecheck` | `tsc --noEmit` |

---

## Project structure

```text
app/
  (tabs)/          # Jobs · Courses · Coach · Scope · Auth
  _layout.tsx      # AuthProvider + root stack
src/lib/
  api.ts           # Typed fetch client
  auth-context.tsx # Session + SecureStore
  scope.ts         # Local + server search scope
```

---

## Roadmap

- [x] Search + per-user Scope + ingest trigger
- [x] Career Coach (jobs/courses context)
- [ ] Job / course detail screens (in-app)
- [ ] EAS Update / web deploy for shareable demo
- [ ] EAS Build (preview + store)
- [ ] Flutter twin client (same BFF) for DX comparison

---

## Author

**Erick Vargas Ramos** — Senior Frontend / Product Engineer  
Web: [adolfo-nine.vercel.app](https://adolfo-nine.vercel.app) · GitHub: [@erickorso](https://github.com/erickorso)

---

## License

MIT — see [LICENSE](./LICENSE).
