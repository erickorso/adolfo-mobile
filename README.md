# Adolfo Mobile (Expo / React Native)

Cliente RN de [Adolfo](https://adolfo-nine.vercel.app) contra el BFF FastAPI [`services/mobile-api`](https://github.com/erickorso/adolfo/tree/main/services/mobile-api).

[![Expo](https://img.shields.io/badge/Expo-54-000.svg?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN-0f172a.svg?style=flat-square)](./src/i18n)
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
| **Producción ([Render](https://render.com))** | `https://adolfo-mobile-api.onrender.com` |

## Tabs

| Tab | Qué hace |
|-----|----------|
| **Auth** | login / register / me (JWT en SecureStore) · muestra ingest al login · selector **ES/EN** |
| **Jobs** | listado público + búsqueda (`q`) filtrada por scope keywords |
| **Courses** | catálogo + búsqueda; query default desde Scope |
| **Coach** | Career Coach IA · historial persistido · share Q+A · BYOK Gemini · ES/EN |
| **Scope** | keywords / searches por usuario · Gemini opcional · idioma ES/EN |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm start` | Expo |
| `npm run web` | Browser |
| `npm run typecheck` | `tsc --noEmit` |

## Deploy BFF ([Render](https://render.com) — producción)

BFF en vivo: **https://adolfo-mobile-api.onrender.com**  
Código: monorepo Adolfo [`services/mobile-api`](https://github.com/erickorso/adolfo/tree/main/services/mobile-api) (Docker).

Health: [GET /health](https://adolfo-mobile-api.onrender.com/health) → `ok` + `ingest_secret_configured: true`  
(Plan free: cold start ~50s tras inactividad.)

Setup en [dashboard.render.com](https://dashboard.render.com):

1. **Web Service** → repo `erickorso/adolfo` · branch `main` · **Language: Docker**
2. **Root Directory:** `services/mobile-api`
3. **Health Check Path:** `/health`
4. Env: `DATABASE_URL`, `MOBILE_JWT_SECRET`, `ADOLFO_BASE_URL=https://adolfo-nine.vercel.app`, `JOBS_INGEST_SECRET`
5. Auto-deploy on commit (filtro opcional: `services/mobile-api/**`)

## Compartir demo en vivo

Tunnel (`expo start --tunnel`) solo mientras tu PC está on.

| Opción | Cómo | Duración |
|--------|------|----------|
| **A. Expo Go + tunnel** | `EXPO_PUBLIC_API_URL=https://adolfo-mobile-api.onrender.com` + `npx expo start --tunnel` | Mientras Metro corre |
| **B. Web** | `npx expo export -p web` → deploy `dist/` a Vercel | Permanente (https) |
| **C. EAS** | `npx eas-cli build --profile preview` / EAS Update | Preview instalable |

Checklist:

- [ ] BFF en Render (health OK)
- [ ] `.env` con `EXPO_PUBLIC_API_URL=https://adolfo-mobile-api.onrender.com`
- [ ] Probar Auth → Scope → Jobs/Courses → Coach
- [ ] Link web **o** QR Expo Go

## Estructura

```text
app/(tabs)/     # jobs · courses · coach · scope · auth
src/i18n/       # ES | EN (i18next + SecureStore)
src/lib/
  api.ts
  auth-context.tsx
  scope.ts
  gemini-key.ts
  coach-share.ts
```

## Autor

**Erick Vargas Ramos** — Senior Frontend / Product Engineer  
Web: [adolfo-nine.vercel.app](https://adolfo-nine.vercel.app) · GitHub: [@erickorso](https://github.com/erickorso)

## License

MIT
