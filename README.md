# CEX Exchange

A modular exchange application with a React frontend and Express server.

## Project structure

- `apps/client/` – Vite + React frontend
- `apps/server/` – Express + TypeScript backend
- `docker-compose.yml` – local MongoDB container
- `.env.example` – root environment template
- `apps/client/.env.example` – frontend environment template

## Local development

1. Copy the environment templates and adjust values as needed.
2. Start MongoDB:
   ```bash
   docker compose up -d
   ```
3. Start the server:
   ```bash
   cd apps/server
   npm install
   npm run dev
   ```
4. Start the client:
   ```bash
   cd apps/client
   npm install
   npm run dev
   ```

## Production-style architecture

- Config is separated into `apps/server/src/config`
- Route registration is centralized via `apps/server/src/routes`
- Feature services are isolated (auth, wallet, market)
- Frontend API configuration is centralized in `apps/client/src/config/api.ts`
