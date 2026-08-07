# Adolfo Mobile

Cliente **Expo Router / React Native** de [Adolfo](https://adolfo-nine.vercel.app). Habla con el BFF FastAPI del monorepo ([`services/mobile-api`](https://github.com/erickorso/adolfo/tree/main/services/mobile-api)).

[![Expo](https://img.shields.io/badge/Expo-54-000.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN-0f172a.svg?style=flat-square)](./src/i18n)
[![API](https://img.shields.io/badge/BFF-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://github.com/erickorso/adolfo/tree/main/services/mobile-api)

> Familia Adolfo: **web** (Next.js) · **mobile** (este repo) · **BFF** (`mobile-api` en Render). Misma Neon / mismos users (bcrypt compatible).

---

## Setup local

```bash
# 1) BFF (repo adolfo)
cd ../adolfo
# services/mobile-api: .venv + .env (DATABASE_URL, MOBILE_JWT_SECRET, …)
npm run dev:mobile-api
# → http://127.0.0.1:4002/health · docs: http://127.0.0.1:4002/docs

# 2) App
cd ../adolfo-mobile
cp .env.example .env
npm install
npm start
```

Ingest / Coach con proxy a Next requieren Adolfo web en `:3000` + `ADOLFO_BASE_URL` / `JOBS_INGEST_SECRET` en el BFF.

## `EXPO_PUBLIC_API_URL`

| Runtime | Valor |
|---------|--------|
| Expo web / iOS simulator | `http://127.0.0.1:4002` |
| Android emulator | `http://10.0.2.2:4002` |
| Device físico (misma Wi‑Fi) | `http://<IP-LAN>:4002` (+ BFF con `--host 0.0.0.0`) |
| **Producción (Render)** | `https://adolfo-mobile-api.onrender.com` |

Sin esta variable, el cliente cae a `http://127.0.0.1:4002` (falla en device físico).

### Cold start (Render free)

Tras inactividad el BFF puede tardar **~50s** en despertar. Probar primero [GET /health](https://adolfo-mobile-api.onrender.com/health) o esperar en Auth/Jobs; no es un bug de la app.

## Tabs

| Tab | Qué hace |
|-----|----------|
| **Auth** | Login / register / restore sesión (JWT en **SecureStore**) · ingest al login · selector **ES/EN** |
| **Jobs** | Listado remoto + `q` + keywords de scope → `GET /api/v1/jobs` |
| **Courses** | Catálogo + búsqueda; query default desde Scope |
| **Coach** | Career Coach (contexto jobs/courses/scope) · conversaciones **persistidas en Neon vía BFF** · share Q+A · BYOK Gemini (`X-User-Gemini-Key`) · ES/EN |
| **Scope** | Keywords / queries por usuario (SecureStore + sync API) · key Gemini opcional · idioma |

## Auth y datos

- Token JWT del BFF (`iss: adolfo-mobile-api`), no cookies de Auth.js.
- Scope y Gemini key: **SecureStore** (no AsyncStorage).
- Coach history: tablas en Postgres (BFF), no solo local.
- Locale ES/EN: carga en `I18nProvider` antes de pintar UI (evita flash de idioma).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Expo Dev Tools |
| `npm run android` / `ios` / `web` | Targets |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy BFF ([Render](https://render.com))

- Live: **https://adolfo-mobile-api.onrender.com**
- Código: monorepo [`erickorso/adolfo`](https://github.com/erickorso/adolfo) → `services/mobile-api` (Docker)
- Health: [/health](https://adolfo-mobile-api.onrender.com/health)
- Env: `DATABASE_URL`, `MOBILE_JWT_SECRET`, `ADOLFO_BASE_URL=https://adolfo-nine.vercel.app`, `JOBS_INGEST_SECRET`

Ver README del BFF para endpoints (`/auth`, `/jobs`, `/courses`, `/coach`, `/me/scope`).

## Compartir demo

| Opción | Cómo | Duración |
|--------|------|----------|
| **A. Expo Go + tunnel** | `EXPO_PUBLIC_API_URL=https://adolfo-mobile-api.onrender.com` + `npx expo start --tunnel` | Mientras Metro corre |
| **B. Web** | `npx expo export -p web` → deploy `dist/` | Permanente |
| **C. EAS** | `eas build` / EAS Update | Preview instalable |

Checklist:

- [ ] BFF health OK (esperar cold start si hace falta)
- [ ] `.env` con URL de Render (o LAN)
- [ ] Auth → Scope → Jobs / Courses → Coach
- [ ] Link web **o** QR Expo Go

## Estructura

```text
app/
  _layout.tsx          # Auth + i18n
  (tabs)/              # jobs · courses · coach · scope · auth
src/
  i18n/                # ES | EN + SecureStore
  lib/
    api.ts             # fetch tipado → BFF
    auth-context.tsx
    scope.ts
    gemini-key.ts      # BYOK en SecureStore
    coach-share.ts
```

## Relacionados

- Web: [adolfo-nine.vercel.app](https://adolfo-nine.vercel.app) · repo [erickorso/adolfo](https://github.com/erickorso/adolfo)
- BFF: [services/mobile-api](https://github.com/erickorso/adolfo/tree/main/services/mobile-api)

## Autor

**Erick Vargas Ramos** — Senior Frontend / Product Engineer  
GitHub: [@erickorso](https://github.com/erickorso)

## License

MIT
