# Rally — Architecture and Contribution Rules

These instructions guide human and AI-assisted contributions.

Status: Proposed rules. Adopt them after the team reviews the architecture.

## Read First

Read `CONTRIBUTING.md`, the relevant issue, and local architecture and decision documents before changing code.

Keep accepted architecture documents under `docs/architecture/`. The Wiki is the published overview; keep it consistent with the repository.

If an issue and an architecture decision conflict, identify the conflict. Do not silently change requirements or the technology stack.

## Technology Stack

Rally uses:

- Expo and React Native, web first.
- TypeScript for the application and backend.
- Fastify feature modules within one backend.
- MongoDB through Mongoose.
- Firebase Authentication.
- Cloudflare R2 for images.
- Resend for application email.
- SSE for live updates.

Do not introduce a new framework, database, service, or messaging system without a documented architectural reason and team review.

## Code Boundaries

- Screens call the API; they never access MongoDB.
- Routes validate requests and call application services.
- Services coordinate permissions, domain operations, and transactions.
- Tournament algorithms remain independent of framework and provider SDKs.
- Database access stays inside repositories.
- Modules use explicit interfaces instead of importing another module's internal models.
- Shared client packages contain public contracts and pure code only.
- Never place credentials or server-only code in the client bundle.

## Domain Rules

- An Event contains Tournaments.
- A Tournament represents a competition/division.
- Follow the accepted decision for team lifetime and tournament roster versions.
- Current team membership must not rewrite historical participation.
- Support name-only participants.
- Never merge participant identities by matching names.
- Captain and staff permissions are scoped to their team/event.
- Scoring and tie-break rules come from stored configuration.
- The server validates scores and calculates winners.
- Unconfirmed or disputed scores do not affect official results.
- Score corrections preserve revisions and account for downstream bracket impact.
- Persist random draws so unchanged inputs produce stable results.
- Statistics derive from accepted results and the approved participation policy.
- Scheduling considers shared courts and referee assignments across the event.

## Reliability and Privacy

- Verify identity and resource authorization on every protected operation.
- UI restrictions do not replace server checks.
- Use appropriate uniqueness constraints and concurrency controls.
- Coordinate related writes through tested transactions.
- Do not make external service calls inside database transactions.
- Do not run parallel database operations inside one transaction.
- Store follow-up work durably before attempting delivery.
- Make retried commands and jobs safe to repeat.
- Filter private fields in API responses, search, images, and live streams.
- Do not log credentials, bearer tokens, birth dates, or private messages.
- Keep development, staging, and production credentials separate.

## Frontend Rules

- Put interface text in translation files.
- Use agreed shared components and accessibility conventions.
- Handle loading, failure, empty, and reconnecting states.
- Do not report a score as saved until the server confirms it.
- Preserve user input when a network request fails.
- Treat web push separately from native mobile notifications.

## Tests and Validation

For behavioral changes, add or update tests that demonstrate the intended outcome.

Tournament changes require relevant normal and edge-case fixtures.

Permission changes require allowed and denied cases.

Database changes require versioned migration/index scripts and compatibility checks.

Use the actual scripts defined by the repository. Do not invent commands or claim checks passed without running them.

Explain:

- What changed.
- Why it changed.
- What was verified.
- What remains uncertain.

## Scope

Do not implement optional AI, leagues, double elimination, online payments, or other extras merely because the original requirements mention them.

Use the issue's accepted scope and acceptance criteria.

Do not remove committed features from the project plan without an explicit scope decision.

## Documentation and Contributions

Update architecture documents when a change affects:

- Module boundaries.
- Data ownership.
- Business invariants.
- External dependencies.
- Deployment structure.

For existing diagrams, explain changes from the previous baseline rather than repeating the full architecture.

Follow merged contribution and license requirements.

If repository and Wiki naming instructions disagree, identify the inconsistency before choosing a new convention.

Include the required AI-use acknowledgment in issues, commits, and pull requests.

Never invent stakeholder approval, completed deployments, or test results.

A request to prepare code or documentation does not automatically authorize publishing, pushing, merging, or deploying it.
