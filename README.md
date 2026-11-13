# Rally

Rally, a **centralized volleyball tournament and community platform** designed to simplify tournament management and help players connect. This project is build as part of a Capstone project for SOEN 490. In this application, organizers can create tournaments, manage teams, brackets, scores, standings, and announcements, while players can build profiles, track their statistics, discover tournaments, and find teams with open positions. The platform brings tournament organization, player statistics, team formation, and community engagement together in one modern and user-friendly application **tailored to Montreal volleyball players and organizers**.


## CI status

On every pull request, GitHub Actions checks the branch name and PR title and that the required repository files are present. It also runs the app and API tests (the API tests against a PostgreSQL database), type-checks the API, and sends test coverage to SonarQube Cloud.

The [Code quality workflow](.github/workflows/quality.yml) runs ESLint and Prettier checks for both `apps/app` and `apps/api`, and exports the app for web with `expo export --platform web`. The existing [SonarQube workflow](.github/workflows/sonar.yml) continues to run the tests and API type check. Lint errors, formatting differences, and build failures fail CI. The rubric's size limits are warnings while existing code exceeds them: 500 lines per file, 50 lines per function (excluding blank lines and comments), and cyclomatic complexity 15. Promote these warnings to errors once the existing code complies.

After installing dependencies with `npm ci` in each directory, run the same checks locally:

```bash
cd apps/app
npm run lint           # expo lint, including tests and configuration
npm run format:check   # Prettier check; npm run format applies formatting
npm run build:web      # outputs dist/; needs the app's local Firebase configuration

cd ../api
npm run lint
npm run format:check
npm run typecheck
```

Both formatting commands use the shared root `.prettierrc.json` and `.prettierignore`; they check each app's source, tests, configuration, and documentation while excluding generated code, dependencies, and build output. CI uses explicit dummy Firebase values for the static web export, so it needs no Firebase secrets or live API. That export checks compilation and rendering; it is not a deployable production build or a live authentication test. Tests remain in SonarQube, and architecture-boundary lint rules are deferred to [#247](https://github.com/Rally-SOEN490/Rally/issues/247).

### Dependency and security scanning

The [CodeQL workflow](.github/workflows/codeql.yml) scans the TypeScript code and the GitHub Actions workflows for security problems on every pull request, on every push to `main`, and once a week. New alerts appear on the pull request, and all alerts are listed under the repository's **Security > Code scanning** tab.

[Dependabot](.github/dependabot.yml) checks the npm dependencies of `apps/app` and `apps/api` and the GitHub Actions versions every Monday and opens pull requests for new versions. Minor and patch updates are grouped into one pull request per directory. Dependabot ignores the packages pinned by the Expo SDK (`expo`, `expo-*`, `react`, `react-native`, and the others listed in the file), because it would propose versions that do not match the SDK. Update those in `apps/app` with `npx expo install --check` and `npx expo install --fix`. Dependabot pull requests skip the branch name and PR title check and the SonarQube scan, because Dependabot pull requests cannot read the Sonar token.

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

- [Docker Desktop](https://www.docker.com/products/docker-desktop/). Open it before running the commands below.
- [Node.js](https://nodejs.org/) 22.18 or newer (the LTS is fine).
- The Firebase keys file `apps/app/.env.local`. Ask a teammate for it. It is never committed.

### First-time setup

```bash
cd apps/api
cp .env.example .env                 # then set FIREBASE_PROJECT_ID (same value as in apps/app/.env.local)
```

The app needs a development build installed once on each simulator or phone. See [Setup step 1 in the app README](apps/app/README.md#setup).

### Run the project with Docker

This is the simplest way to run Rally: one command starts PostgreSQL, the API and the app. To run the API and the app directly on your computer instead, see [Run the frontend and backend in separate terminals](#run-the-frontend-and-backend-in-separate-terminals).

#### iOS Simulator (Mac)

1. From the repo root, run:

   ```bash
   docker compose up --build --watch
   ```

2. Open the Rally development build on the simulator. If the server isn't listed, choose to enter a URL and type `http://localhost:8081`.

#### Android emulator (Windows)

1. Start the emulator, then run these two commands so it can reach your computer. Run them again each time the emulator restarts.

   ```bash
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:3000 tcp:3000
   ```

   If Windows says `'adb' is not recognized`, add the folder that contains `adb` to your Path, then open a new terminal. It's the `platform-tools` folder of your Android SDK: by default `%LOCALAPPDATA%\Android\Sdk\platform-tools`. Android Studio shows the SDK location under **Settings → Languages & Frameworks → Android SDK**.

2. From the repo root, run:

   ```bash
   docker compose up --build --watch
   ```

3. Open the Rally development build on the emulator. If the server isn't listed, choose to enter a URL and type `http://localhost:8081`.

#### While it runs

- The first run builds the containers and takes a few minutes. Later runs take seconds.
- The API applies new database migrations when it starts.
- Saving a file in `apps/api/src` or `apps/app/src` reloads it. Changing a `package.json`, the Prisma schema or `app.json` rebuilds that container on its own.
- Keep `--build` in the command so the containers pick up new packages after you pull.
- Expo's keyboard shortcuts don't work in that terminal. To use them, run `docker compose attach app` in another terminal. Leave with `Ctrl+P` then `Ctrl+Q`, because `Ctrl+C` there stops the app container.

To stop:

- `Ctrl+C` stops everything. Your data stays.
- `docker compose down` also removes the containers.
- `docker compose down -v` also deletes the database.

### Run the frontend and backend in separate terminals

Use this instead of the Docker setup if you prefer to run the API and the app directly on your computer. PostgreSQL still runs in Docker. The first time, install the packages and create the tables:

```bash
docker compose up -d postgres        # only the database, from the repo root

cd apps/api
npm install
npm run db:deploy                    # create the tables

cd ../app
npm install
```

Then use two terminal windows:

```bash
# Terminal 1: the API, on http://localhost:3000
cd apps/api
npm run dev

# Terminal 2: the app
cd apps/app
npx expo start --dev-client
```

If PostgreSQL isn't running (for example after a restart), open Docker Desktop and run `docker compose up -d postgres` from the repo root. Both setups use ports 3000 and 8081, so if the Docker setup is still running, stop it first with `docker compose stop api app`.

After pulling new code, run `npm install` in both folders, then `npm run db:deploy` in `apps/api`.

### Run the tests

```bash
cd apps/app && npm test              # app tests
cd apps/api && npm test              # API tests (PostgreSQL must be running: docker compose up -d postgres)
```

Run `npm run test:coverage` in either folder to see which lines the tests cover. SonarQube expects new code to be covered.

### Look at the database

- **In the browser:** run `npm run db:studio` in `apps/api` and click a table.
- **Live in the terminal:** from the repo root, run `docker compose exec postgres psql -U rally -d rally`. Then type `SELECT * FROM users \watch 2` to see the table refresh every 2 seconds. Press `Ctrl+C`, then type `\q`, to quit.

## Project planning

- [GitHub Project board](https://github.com/orgs/Rally-SOEN490/projects/1)
- [Project documentation](https://github.com/Rally-SOEN490/Rally/wiki)
- [Meeting minutes](https://github.com/Rally-SOEN490/Rally/wiki/Meeting-Minutes)
- [Risks](https://github.com/Rally-SOEN490/Rally/wiki/Risks)

## Course records

The [SOEN 490 reference](docs/course/soen-490/README.md) records the project requirements, deadlines, and instruction conflicts. Keep signed administrative forms and other personal records outside Git.

## License

This project uses a proprietary license. See [LICENSE](LICENSE).
