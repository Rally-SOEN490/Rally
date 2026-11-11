50% or more of the file has been created with the help of AI

# First release test plan

This document is the test inventory for the first Rally release. It records
automated coverage that exists today, the feature boundaries covered by each
suite, and the flows that remain outside the release scope.

the content of docs\account-test-plan.md and docs\player-profile-test-plan.md
are also part of the first release. They were created before the Epic reformat
that was done recently.

## Test levels

- **Unit/component** — isolated application logic, components, screens, and API
  client behavior using Jest or Vitest mocks.
- **API integration** — Fastify routes, services, repositories, authentication,
  authorization, and PostgreSQL working together.
- **HTTP contract integration** — requests shaped like the app client sent over
  real HTTP to the Fastify API.
- **E2E** — the Expo app exercised on a device or emulator with Maestro.
- **Manual** — flows that depend on external applications or accounts.

## Exceptional-grade coverage matrix

The first-release feature inventory below maps each implemented feature to a
meaningful automated test and an edge, error, boundary, or alternative-path
test. The files named in this table contain assertions about behavior and
state, not only constants or object existence.

| Implemented feature | Meaningful automated coverage | Edge/error or alternative-path coverage |
| --- | --- | --- |
| Account lifecycle | `account-lifecycle.integration.test.ts` | Unauthenticated requests and deletion isolation |
| Authentication and sessions | `auth.test.ts`, `session.test.tsx`, `login.test.tsx` | Invalid/expired credentials and signed-out states |
| Profile and settings | `users.test.ts`, `profile.test.tsx`, `settings.test.tsx` | Invalid fields, private-field filtering, and failed requests |
| Player directory and badges | `users.test.ts`, `badges.test.ts`, `playerCard.test.tsx` | Duplicate names, missing badges, and idempotent restoration |
| Profile photos | `profile-photo.test.ts`, `photo-storage.test.ts` | Invalid files, storage failures, and photo removal |
| Tournament browsing | `tournament-browse.test.ts`, `tournaments.test.ts`, `search.test.ts` | Ended/unpublished tournaments, filters, and unavailable spots |
| Organizer tournament setup | `tournaments.test.ts`, `tournament-divisions.test.ts`, `tournament-rules.test.ts` | Invalid dates, divisions, publishing, and deletion cases |
| Authorization and ownership | `authorization.integration.test.ts`, `tournaments.test.ts` | Player denial, rival-organizer isolation, and demotion |
| Organizer applications | `organizer-applications.test.ts`, `organizer-review.test.ts` | Invalid/expired links, duplicate submissions, denial, and races |
| Account, tournament, and application HTTP workflows | `first-release-http.integration.test.ts`, `api-client-contract.integration.test.ts` | Invalid profile update, unauthorized tournament creation, denial flow, and unauthenticated responses |

This coverage also demonstrates the project-specific requirements that apply to
Rally: database integration, frontend/API contracts, authentication and
authorization, email outbox behavior, storage-adapter behavior, performance,
and Maestro workflows.

## How to run

From `apps/api`:

```text
npm test
npm run typecheck
npm run lint
```

The API integration tests require PostgreSQL and a separate `TEST_DATABASE_URL`.
The test setup applies Prisma migrations before running the suite.

From `apps/app`:

```text
npm test
npx expo lint
npx tsc --noEmit
```

Maestro flows require a configured emulator, a running app build, the API, and
the test account or inbox described by each runner script.

## Account and authentication

### Unit/component

- Login, sign-up, email verification, account recovery, and setup screens —
  `apps/app/tests/app/login.test.tsx`,
  `apps/app/tests/app/sign-up.test.tsx`,
  `apps/app/tests/app/verify-email.test.tsx`,
  `apps/app/tests/app/recover-account.test.tsx`, and
  `apps/app/tests/app/finish-setup.test.tsx`
- Firebase and session behavior —
  `apps/app/tests/lib/firebase.test.ts`,
  `apps/app/tests/lib/session.test.tsx`, and
  `apps/app/tests/lib/auth-errors.test.ts`

### API integration

- Register, read, update, and delete an account —
  `apps/api/test/account-lifecycle.integration.test.ts`
- Reject unauthenticated account requests —
  `apps/api/test/account-lifecycle.integration.test.ts`
- Prevent duplicate account creation and enforce account-role behavior —
  `apps/api/test/users.test.ts` and
  `apps/api/test/account-role.test.ts`
- Validate authentication, errors, CORS, and health behavior —
  `apps/api/test/auth.test.ts`, `apps/api/test/errors.test.ts`,
  `apps/api/test/cors.test.ts`, and `apps/api/test/health.test.ts`
- Verify concurrent account-read performance —
  `apps/api/test/account-performance.test.ts`

### E2E

- Sign up, verify the email, and reach Home —
  `apps/app/.maestro/signup-verify-and-home.yaml`, run with
  `apps/app/.maestro/run-account-e2e.ps1`
- Log in and reach Home —
  `apps/app/.maestro/login-and-home.yaml`
- Submit an organizer application and verify the pending state —
  `apps/app/.maestro/organizer-request.yaml`, run with
  `apps/app/.maestro/run-organizer-request-e2e.ps1`

  The runner creates a unique player account using `MAESTRO_EMAIL_BASE` and
  `MAESTRO_TEST_PASSWORD` from `apps/app/.env.local`. Email verification uses
  the configured Gmail account on the emulator.

Organizer tournament-draft E2E is excluded because the account must first be
approved by a separate organizer. Draft setup remains covered by component and
API tests.

## Player profile and directory

### Unit/component

- Profile, settings, awards, and navigation screens —
  `apps/app/tests/app/profile.test.tsx`,
  `apps/app/tests/app/settings.test.tsx`,
  `apps/app/tests/app/awards.test.tsx`,
  `apps/app/tests/app/tabs-layout.test.tsx`, and
  `apps/app/tests/app/routing.test.tsx`
- Profile and API client behavior —
  `apps/app/tests/lib/api.test.ts`,
  `apps/app/tests/lib/tournaments.test.ts`,
  `apps/app/tests/components/playerCard.test.tsx`, and
  `apps/app/tests/components/auth.test.tsx`

### API integration

- Read and update profile fields, validate input, protect private data, and
  maintain badge state —
  `apps/api/test/users.test.ts` and `apps/api/test/badges.test.ts`
- Store and remove profile photos through the storage adapter —
  `apps/api/test/profile-photo.test.ts` and
  `apps/api/test/photo-storage.test.ts`

### E2E

- Edit profile basics, team-seeking status, interests, thoughts, social-link
  state, and awards —
  `apps/app/.maestro/player-profile.yaml`, run with
  `apps/app/.maestro/run-player-profile-e2e.ps1`

The current Maestro suite covers account onboarding, authenticated navigation,
profile editing, and organizer application submission. Reviewer approval,
account deletion, and full tournament publishing remain separate flows because
they require reviewer-link access, destructive account state, or date-picker/
device setup.

## Tournament browsing and organizer setup

### Unit/component

- Tournament search, filters, cards, and organizer setup —
  `apps/app/tests/app/events.test.tsx`,
  `apps/app/tests/app/search.test.tsx`,
  `apps/app/tests/app/search-navigation.test.tsx`,
  `apps/app/tests/app/organizer-review.test.tsx`,
  `apps/app/tests/components/tournamentDivisions.test.tsx`,
  `apps/app/tests/components/tournamentSetup.test.tsx`,
  `apps/app/tests/lib/tournaments.test.ts`, and
  `apps/app/tests/lib/organizer-tournaments.test.ts`

### API integration

- Create, list, update, publish, and delete tournaments —
  `apps/api/test/tournaments.test.ts`
- Add, update, remove, and validate divisions —
  `apps/api/test/tournament-divisions.test.ts`
- Enforce tournament setup and publishing rules —
  `apps/api/test/tournament-rules.test.ts`
- Browse published tournaments and calculate Montreal-time responses —
  `apps/api/test/tournament-browse.test.ts`
- Verify authentication, role permissions, and organizer ownership through the
  real route stack —
  `apps/api/test/authorization.integration.test.ts` and
  `apps/api/test/tournaments.test.ts`

## HTTP integration

The following tests exercise the boundaries used by the app over real HTTP,
including request authentication, route handling, service logic, repository
persistence, and response shapes.

- **Create, read, and update a profile through client-shaped requests**

  Updates the signed-in player's profile, then reads it back through HTTP to
  verify that the API response and PostgreSQL state remain consistent.

- **Reject an invalid profile update without changing saved data**

  Sends a blank display name through the profile endpoint, expects a `400`
  response, and verifies that the previously saved profile remains unchanged.

- **Publish and browse a tournament**

  Creates an organizer account, configures and publishes a tournament, then
  reads it through the player browsing endpoint and verifies its division data.

- **Reject tournament creation by a player**

  Sends an organizer-only tournament request as a player, expects `403`, and
  verifies that no tournament is persisted.

- **Apply, review, and approve an organizer application**

  Submits an application, reads it through the review-link endpoint, approves
  it, and confirms that the applicant sees the approved status and becomes an
  organizer.

- **Apply, review, and deny an organizer application**

  Denies an application with a reason, verifies that the applicant sees the
  denial, and confirms that the applicant remains a player.

  File: `apps/api/test/first-release-http.integration.test.ts`

- **Exercise the account client contract and unauthenticated response**

  Verifies the account request shapes used by the app over authenticated HTTP
  and confirms the server's unauthenticated response shape.

  File: `apps/api/test/api-client-contract.integration.test.ts`

## Organizer applications and review

### Unit/component

- Application submission and review UI —
  `apps/app/tests/app/organizer-review.test.tsx`,
  `apps/app/tests/components/organizerApplicationSheet.test.tsx`,
  `apps/app/tests/lib/organizer-applications.test.ts`, and
  `apps/app/tests/lib/organizer-tournaments.test.ts`

### API integration

- Submit applications, create review links, approve or deny applications, and
  promote approved applicants —
  `apps/api/test/organizer-applications.test.ts`,
  `apps/api/test/organizer-review.test.ts`, and
  `apps/api/test/email-outbox.test.ts`

## Shared UI and navigation

- Navigation, home, settings, account deletion, and tournament exit screens —
  `apps/app/tests/app/home.test.tsx`,
  `apps/app/tests/app/settings.test.tsx`,
  `apps/app/tests/app/tournament-leave.test.tsx`, and
  `apps/app/tests/app/routing.test.tsx`
- Shared components —
  `apps/app/tests/components/navBar.test.tsx`,
  `apps/app/tests/components/dateTimeField.web.test.tsx`, and
  `apps/app/tests/components/tournamentDivisions.test.tsx`

## Not included in the first release

- Tournament scoring, disputes, revisions, standings, winner calculation, and
  live score updates are not implemented yet, so their integration tests are
  deferred.
- Opening or validating Facebook and Instagram in their external applications
  remains a manual test because it depends on third-party accounts and UI.
- Full device photo-picker behavior is not deterministic in automated E2E
  tests; the API and storage paths are covered instead.

## Release evidence

Feature work should link the relevant test files and record the exact command
and result in the pull request. Database-backed integration tests require
PostgreSQL; Maestro flows require a configured emulator or device.

Current validation evidence:

- `apps/api`: `npm test` — **passed**, 25 files and 328 tests.
- `apps/api`: targeted first-release integration run — **passed**, 3 files and
  10 tests.
- `apps/api`: `npm run typecheck` — **passed**.
- `apps/api`: `npm run lint` — **passed with existing warnings**.
- `apps/app`: `npm test -- --runInBand` — **passed**, 30 suites and 433 tests.
- `apps/app`: `npx tsc --noEmit` — **passed**.
- `apps/app`: `npx expo lint` — **not clean** because of an existing
  `import/no-unresolved` error for `expo-blur` and existing complexity/size
  warnings.
- `apps/app`: `.\.maestro\run-organizer-request-e2e.ps1` — **passed** on
  `Medium_Phone_API_36.1`; created and verified an account, submitted the
  organizer application, and confirmed its pending state.
- Organizer tournament-draft Maestro flow — **not run**; it requires a
  verified organizer account configured in `MAESTRO_ORGANIZER_EMAIL`.


## AI-use acknowledgment

Copilot assisted with organizing this first-release test inventory and
documenting the new authorization, HTTP contract, and Maestro integration
tests.
