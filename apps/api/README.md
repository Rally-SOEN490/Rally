# API (apps/api)

The backend is written in TypeScript with Fastify. It stores data in PostgreSQL and uses Prisma to read and write it. The app never talks to the database directly; it calls this API.

## Prerequisites

- Node.js 22.18 or newer (the LTS is fine). Node runs the TypeScript files directly, so there is no build step.
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), to run PostgreSQL. Open it before the steps below.

To run the API, the app and the database together in Docker with one command, see [Run the project with Docker](../../README.md#run-the-project-with-docker). The steps below run the API directly on your computer.

## Setup (once)

From the repo root:

```bash
docker compose up -d postgres   # start PostgreSQL in the background
cd apps/api
cp .env.example .env        # then fill in FIREBASE_PROJECT_ID (see the comment in the file)
npm install
npm run db:deploy           # create the tables
```

To enable profile photo uploads, create a private Cloudflare R2 bucket and an R2 API token with object read/write access to that bucket. Add the account ID, access key ID, secret access key, and bucket name to the `R2_*` settings in `.env`. Leave all four blank to keep photo uploads disabled. The API validates images, enforces a 5 MB limit, stores objects in R2, and returns short-lived signed URLs; credentials never go to the app.

## Every day

```bash
docker compose up -d postgres   # from the repo root, if PostgreSQL isn't running
cd apps/api
npm run dev                 # start the API on http://localhost:3000, restarts when you save a file
```

Open http://localhost:3000/health. You should see `{"status":"ok"}`. Press `Ctrl+C` to stop the API.

After pulling new code, run `npm install` and `npm run db:deploy` in case someone added a package or a table.

| Command                               | What it does                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                         | Starts the API and restarts it when files change                             |
| `npm test`                            | Runs the tests against the separate `rally_test` database                    |
| `npm run test:coverage`               | Runs the tests and shows which lines they cover (full report in `coverage/`) |
| `npm run typecheck`                   | Checks the TypeScript types                                                  |
| `npm run db:deploy`                   | Applies new migrations to your database                                      |
| `npm run db:migrate -- --name <name>` | Creates a migration after you change the schema                              |
| `npm run db:studio`                   | Opens a web page where you can browse and edit the tables                    |

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
  config.ts            reads the settings from .env
  auth.ts              checks the Firebase login token
  permissions.ts       which account role may do what (the one place for this)
  authorization.ts     requirePermission: rejects a request whose role lacks a permission
  db.ts                connects to PostgreSQL
  health.ts            GET /health
  modules/users/
    routes.ts          the URLs, and checks the request is valid
    service.ts         the rules: what happens and what gets sent back
    repository.ts      the only place that reads and writes the users table
  modules/organizer-applications/
                       applying to become an organizer, and the reviewers' approve/deny link
  modules/email/
    outbox.ts          the only place that reads and writes the email_outbox table
    sender.ts          sends queued emails through Resend (or prints them), with retries
  generated/           created by Prisma, not committed
test/                  tests, using a fake Firebase so no real accounts are needed
```

New features (teams, tournaments…) get their own folder in `src/modules/` with the same three files.

## Giving an account a role

Every account starts as a player. To make your own test account an organizer or admin, find its row and change `role` to `ORGANIZER` or `ADMIN`:

- **In the browser:** run `npm run db:studio`, open the `User` table, and edit `role`.
- **In SQL:** from the repo root, run

  ```bash
  docker compose exec postgres psql -U rally -d rally \
    -c "UPDATE users SET role = 'ORGANIZER' WHERE id = '<the account id>';"
  ```

  Find the id with `SELECT id, display_name, role FROM users;`. Use the id, not the display name: names aren't unique.

The change applies on the next request; the app shows it after it reloads the account. The roles are explained in [roles and permissions](../../docs/architecture/roles-and-permissions.md).

## Trying "Become an organizer" locally

1. In `apps/api/.env`, set `ORGANIZER_REVIEWER_EMAILS` to your own email. Leave `RESEND_API_KEY` empty, so the email is printed instead of sent.
2. Restart the API (`docker compose up --build --watch`, or `npm run dev`).
3. As a player, open Settings → **Become an organizer**, fill in the form and send it.
4. Find the email in the API's output: `docker compose logs api` with Docker, or the `npm run dev` terminal. Copy the review link.
5. Open the link in a browser (the web app on `http://localhost:8081`), then approve or deny.
6. Back in Settings, open **Become an organizer** again to see the answer. After an approval, close it: the row changes to **Organizer account**.

The printed email contains a working review link, so printing is for your own computer only. With `NODE_ENV=production`, the API refuses to start without `RESEND_API_KEY`; set `NODE_ENV=production` on every hosted server. How the flow works is in [organizer applications](../../docs/architecture/organizer-applications.md).

## Using the API from the app

The app calls `http://localhost:3000` by default. That works on the web and the iOS simulator. For other devices, add `EXPO_PUBLIC_API_URL` to `apps/app/.env.local` and restart Expo:

- Android emulator: run `adb reverse tcp:3000 tcp:3000` each time the emulator starts, as in the [Android emulator steps](../../README.md#android-emulator-windows). Or set `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.
- A real phone: `EXPO_PUBLIC_API_URL=http://<your computer's IP address>:3000`. The phone must be on the same Wi-Fi network. On a Mac, find the IP with `ipconfig getifaddr en0`.

## Troubleshooting

**`Can't reach database server`:** PostgreSQL isn't running. Open Docker Desktop, then run `docker compose up -d postgres` from the repo root.

**`EADDRINUSE` on port 3000:** the API is already running, probably in Docker. Stop it with `docker compose stop api`, or use the Docker setup instead.

**`port 5432 is already allocated`:** Another PostgreSQL is already running on your computer. If you installed it with Homebrew, stop it with `brew services stop postgresql@17`.

**`P1010: User was denied access` when running the tests or migrations:** another PostgreSQL on your computer is answering on `localhost:5432` instead of Docker's. Docker can start even when that happens. Check with `lsof -nP -iTCP:5432 -sTCP:LISTEN`: a `postgres` process that isn't `com.docker` is the other one. Stop it: in Postgres.app, click **Stop** and turn off starting at login (or move it to port 5433 in its server settings); if you installed it with Homebrew, run `brew services stop postgresql@17` (use your version).

**The app says "Can't reach the Rally server":** Start the API, with `npm run dev` or the Docker setup. On the Android emulator, run `adb reverse tcp:3000 tcp:3000` again if the emulator restarted. On a phone, check `EXPO_PUBLIC_API_URL` above.

**Start over with an empty database:** `npx prisma migrate reset`. This deletes all your local data.
