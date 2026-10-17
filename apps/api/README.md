# API (apps/api)

The backend is written in TypeScript with Fastify. It stores data in PostgreSQL and uses Prisma to read and write it. The app never talks to the database directly; it calls this API.

## Prerequisites

- Node.js 22.18 or newer (the LTS is fine). Node runs the TypeScript files directly, so there is no build step.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), to run PostgreSQL. Open it before the steps below.

## Setup (once)

From the repo root:

```bash
docker compose up -d        # start PostgreSQL in the background
cd apps/api
cp .env.example .env        # then fill in FIREBASE_PROJECT_ID (see the comment in the file)
npm install
npm run db:deploy           # create the tables
```

## Every day

```bash
docker compose up -d        # from the repo root, if PostgreSQL isn't running
cd apps/api
npm run dev                 # start the API on http://localhost:3000, restarts when you save a file
```

Open http://localhost:3000/health. You should see `{"status":"ok"}`. Press `Ctrl+C` to stop the API.

After pulling new code, run `npm install` and `npm run db:deploy` in case someone added a package or a table.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the API and restarts it when files change |
| `npm test` | Runs the tests against the separate `rally_test` database |
| `npm run typecheck` | Checks the TypeScript types |
| `npm run db:deploy` | Applies new migrations to your database |
| `npm run db:migrate -- --name <name>` | Creates a migration after you change the schema |
| `npm run db:studio` | Opens a web page where you can browse and edit the tables |

## Changing the database

1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name add-teams` (describe your change in the name). This writes a SQL file in `prisma/migrations/`, applies it to your database and updates the TypeScript types.
3. Commit the schema and the new migration folder together.

Never edit a migration that is already on `main`. Make a new one instead.

## Code layout

```text
prisma/
  schema.prisma        the tables
  migrations/          the SQL changes, one folder per change
src/
  server.ts            starts the API
  app.ts               puts the routes together (tests use this without starting a server)
  auth.ts              checks the Firebase login token
  db.ts                connects to PostgreSQL
  health.ts            GET /health
  modules/users/
    routes.ts          the URLs, and checks the request is valid
    service.ts         the rules: what happens and what gets sent back
    repository.ts      the only place that reads and writes the users table
  generated/           created by Prisma, not committed
test/                  tests, using a fake Firebase so no real accounts are needed
```

New features (teams, events…) get their own folder in `src/modules/` with the same three files.

## Using the API from the app

The app calls `http://localhost:3000` by default. That works on the web and the iOS simulator. For other devices, add `EXPO_PUBLIC_API_URL` to `apps/app/.env.local` and restart Expo:

- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- A real phone: `EXPO_PUBLIC_API_URL=http://<your computer's IP address>:3000`. The phone must be on the same Wi-Fi network. On a Mac, find the IP with `ipconfig getifaddr en0`.

## Troubleshooting

**`Can't reach database server`:** PostgreSQL isn't running. Open Docker Desktop, then run `docker compose up -d` from the repo root.

**`port 5432 is already allocated`:** Another PostgreSQL is already running on your computer. If you installed it with Homebrew, stop it with `brew services stop postgresql@17`.

**The app says "Can't reach the Rally server":** Start the API with `npm run dev`. On a phone or the Android emulator, check `EXPO_PUBLIC_API_URL` above.

**Start over with an empty database:** `npx prisma migrate reset`. This deletes all your local data.
