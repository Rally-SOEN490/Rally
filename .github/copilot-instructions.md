# Review instructions for Rally

Rally is a volleyball tournament platform: an Expo/React Native app (`apps/app`, web first) and a Fastify API with PostgreSQL through Prisma (`apps/api`). `AGENTS.md` and `CONTRIBUTING.md` hold the full rules. Copilot code review reads only the first 4,000 characters of each instruction file, so keep this file short.

## Flag first

- A protected API operation that does not verify identity and authorization for that resource on the server. UI checks do not count. Captain and staff permissions are limited to their own team or event.
- Request input used without validation, or errors that expose internal details or stack traces.
- Committed credentials, tokens, or server-only code in the app bundle. Logs containing credentials, bearer tokens, birth dates, or private messages.
- Private fields returned in API responses, search results, or live updates.
- Layer violations: screens access the database; routes contain business logic instead of calling services; database access outside repositories.
- Related writes outside a transaction, or external service calls or parallel queries inside one.
- A change to `apps/api/prisma/schema.prisma` without a migration in `apps/api/prisma/migrations`.
- Empty `catch` blocks or errors that are logged and then ignored.

## Domain rules

- The server validates scores and decides winners. Unconfirmed or disputed scores do not affect official results.
- Score corrections keep revisions. Random draws are persisted.
- Scoring and tie-break rules come from stored configuration, not hard-coded values.
- Current team membership never rewrites historical participation. Participants are never merged by matching names.

## Frontend

- Interface text belongs in translation files.
- Screens handle loading, failure, empty, and reconnecting states.
- A score is not shown as saved until the server confirms it, and user input survives a failed request.
- Expo APIs must match the installed SDK version.

## Tests

- Behaviour changes need tests that would fail if the change were reverted.
- Permission changes need both allowed and denied cases.
- Point out tests without meaningful assertions.

## AI declarations and license notice

Each new or changed source file in `apps/` starts with:

```ts
// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: <level>
```

`<level>` is exactly one of `No substantial AI-generated code`, `Below 50% AI-generated`, or `50% or more AI-generated`. Flag missing declarations and the old `Rally contributors` MIT notice. Feature and bug PRs must tick one level in the description, list AI-assisted files, and give verification evidence.

## Skip

Formatting, naming preferences without a documented rule, and anything CI already checks.
