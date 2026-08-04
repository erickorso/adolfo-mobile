# Adolfo Mobile (Expo / React Native)

Cliente RN de [Adolfo](https://github.com/erickorso/adolfo) contra el BFF FastAPI `services/mobile-api`.

## Setup

```bash
cd ../adolfo/services/mobile-api   # en otra terminal
# uvicorn app.main:app --reload --port 4002

cd ../adolfo-mobile
cp .env.example .env
npm install
npm start
```

### API URL

| Entorno | `EXPO_PUBLIC_API_URL` |
|---------|----------------------|
| Expo web / iOS sim | `http://127.0.0.1:4002` |
| Android emulator | `http://10.0.2.2:4002` |
| Device físico | `http://<tu-IP-LAN>:4002` |

## Tabs

- **Auth** — login / register / me (JWT en SecureStore)
- **Jobs** — listado público
- **Courses** — catálogo

## Scripts

- `npm start` — Expo
- `npm run web` — navegador
- `npm run typecheck` — `tsc --noEmit`
