# Rally

Rally, a **centralized volleyball tournament and community platform** designed to simplify tournament management and help players connect. This project is build as part of a Capstone project for SOEN 490. In this application, organizers can create tournaments, manage teams, brackets, scores, standings, and announcements, while players can build profiles, track their statistics, discover tournaments, and find teams with open positions. The platform brings tournament organization, player statistics, team formation, and community engagement together in one modern and user-friendly application **tailored to Montreal volleyball players and organizers**.


## CI status

On every pull request, GitHub Actions checks the branch name and PR title and that the required repository files are present. It also runs the app and API tests (the API tests against a PostgreSQL database), type-checks the API, and sends test coverage to SonarQube Cloud.

## Release demos

| Release | Demo |
| --- | --- |
| Release 1 | To be added |
| Release 2 | To be added |
| Final release | To be added |

## Developer setup

Rally has two parts:

- **App** (`apps/app`): React Native with Expo. Users sign up and log in with Firebase Authentication. More details in the [app README](apps/app/README.md).
- **API** (`apps/api`): Fastify, with a PostgreSQL database accessed through Prisma. The app calls the API and never talks to the database directly. More details in the [API README](apps/api/README.md).

### What you need

- [Node.js](https://nodejs.org/) 22.18 or newer (the LTS is fine).
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), to run PostgreSQL. Open it before running the commands below.
- The Firebase keys file `apps/app/.env.local`. Ask a teammate for it. It is never committed.

### First-time setup

```bash
docker compose up -d                 # start PostgreSQL

cd apps/api
cp .env.example .env                 # then set FIREBASE_PROJECT_ID (same value as in apps/app/.env.local)
npm install
npm run db:deploy                    # create the tables

cd ../app
npm install
```

The app needs a development build installed once on each simulator or phone. See [Setup step 1 in the app README](apps/app/README.md#setup).

### Run the project

Use two terminal windows:

```bash
# Terminal 1: the API, on http://localhost:3000
cd apps/api
npm run dev

# Terminal 2: the app. Press w for the web version.
cd apps/app
npx expo start --dev-client
```

If PostgreSQL isn't running (for example after a restart), open Docker Desktop and run `docker compose up -d` from the repo root.

After pulling new code, run `npm install` in both folders, then `npm run db:deploy` in `apps/api`.

### Run the tests

```bash
cd apps/app && npm test              # app tests
cd apps/api && npm test              # API tests (PostgreSQL must be running)
```

Run `npm run test:coverage` in either folder to see which lines the tests cover. SonarQube expects new code to be covered.

### Look at the database

- **In the browser:** run `npm run db:studio` in `apps/api` and click a table.
- **Live in the terminal:** from the repo root, run `docker compose exec postgres psql -U rally -d rally`. Then type `SELECT * FROM users \watch 2` to see the table refresh every 2 seconds. Press `Ctrl+C`, then type `\q`, to quit.

## Project planning

- [GitHub Project board](https://github.com/orgs/Rally-SOEN490/projects/1)
- [Project documentation](docs/wiki/Home.md)
- [Meeting minutes](docs/wiki/Meeting-Minutes.md)
- [Risks](docs/wiki/Risks.md)

## Course records

Administrative forms belong in `admin/`. Do not commit documents containing student IDs, signatures, addresses, or other personal information until the instructor confirms an approved storage method.

## License

This project uses the MIT License. See [LICENSE](LICENSE).
