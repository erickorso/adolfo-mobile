# Adolfo Mobile (Expo / React Native)

Cliente RN de [Adolfo](https://adolfo-nine.vercel.app) contra el BFF FastAPI [`services/mobile-api`](https://github.com/erickorso/adolfo/tree/main/services/mobile-api).

[![Expo](https://img.shields.io/badge/Expo-54-000.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![API](https://img.shields.io/badge/BFF-FastAPI-009688.svg?style=flat-square&logo=fastapi)](https://github.com/erickorso/adolfo/tree/main/services/mobile-api)

## Setup local

```bash
# 1) BFF (repo adolfo)
cd ../adolfo/services/mobile-api
# .venv + DATABASE_URL / secrets — ver .env.example
uvicorn app.main:app --reload --host 0.0.0.0 --port 4002

# 2) App
cd ../adolfo-mobile
cp .env.example .env
npm install
npm start
```

## `EXPO_PUBLIC_API_URL`

| Runtime | Valor |
|---------|--------|
| Expo web / iOS sim | `http://127.0.0.1:4002` |
| Android emulator | `http://10.0.2.2:4002` |
| Device físico (LAN) | `http://<tu-IP-LAN>:4002` |
| **Producción (Railway)** | `https://<tu-servicio>.up.railway.app` |

## Tabs

| Tab | Qué hace |
|-----|----------|
| **Auth** | login / register / me (JWT en SecureStore) · muestra ingest al login |
| **Jobs** | listado público + búsqueda (`q`) filtrada por scope keywords |
| **Courses** | catálogo + búsqueda; query default desde Scope |
| **Coach** | Career Coach IA (contexto scope + jobs + courses) · requiere login |
| **Scope** | keywords / searches por usuario · **Run ingest now** |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Expo |
| `npm run web` | Browser |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy BFF (Railway)

El BFF vive en el monorepo Adolfo (`services/mobile-api`, Dockerfile + `railway.toml`).

1. [railway.app/new](https://railway.app/new) → GitHub `erickorso/adolfo`
2. **Root Directory:** `services/mobile-api`
3. Variables:
   - `DATABASE_URL` — Neon (misma que Adolfo)
   - `MOBILE_JWT_SECRET` — string largo
   - `ADOLFO_BASE_URL=https://adolfo-nine.vercel.app`
   - `JOBS_INGEST_SECRET` — mismo Bearer que Vercel (ingest + AI)
4. **Settings → Networking → Generate Domain**  
   → ej. `https://adolfo-mobile-api-production.up.railway.app`  
5. Health: `GET https://<dominio>/health` → `ingest_secret_configured: true`

Dashboard: [railway.app/dashboard](https://railway.app/dashboard)

## Compartir demo en vivo

Tunnel (`expo start --tunnel`) solo mientras tu PC está on.

| Opción | Cómo | Duración |
|--------|------|----------|
| **A. Expo Go + tunnel** | `EXPO_PUBLIC_API_URL=<Railway>` + `npx expo start --tunnel` | Mientras Metro corre |
| **B. Web** | `npx expo export -p web` → deploy `dist/` a Vercel | Permanente (https) |
| **C. EAS** | `npx eas-cli build --profile preview` / EAS Update | Preview instalable |

Checklist:

- [ ] mobile-api en Railway (health OK)
- [ ] `.env` con `EXPO_PUBLIC_API_URL` = URL Railway
- [ ] Probar Auth → Scope → Jobs/Courses → Coach
- [ ] Link web **o** QR Expo Go

## Estructura

```text
app/(tabs)/     # jobs · courses · coach · scope · auth
src/lib/
  api.ts
  auth-context.tsx
  scope.ts
```

## Autor

**Erick Vargas Ramos** — Senior Frontend / Product Engineer  
Web: [adolfo-nine.vercel.app](https://adolfo-nine.vercel.app) · GitHub: [@erickorso](https://github.com/erickorso)

## License

MIT
