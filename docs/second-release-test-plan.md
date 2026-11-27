# Second release test plan

This document records the automated coverage for second-release tournament
setup, including the end-to-end validation flow.

## Tournament setup

### Unit/component and API

- Setup form validation, draft saving, and date-order errors —
  `apps/app/tests/components/tournamentSetup.test.tsx`
- Server-side tournament date rules —
  `apps/api/test/tournament-rules.test.ts`

### E2E

- Reject a missing tournament name, block a start/end date conflict, then
  continue after correcting the dates —
  `apps/app/.maestro/tournament-setup-validation.yaml`

The flow uses an existing pre-approved organizer account and does not perform
organizer approval. Configure `MAESTRO_TEST_EMAIL`,
`MAESTRO_TEST_PASSWORD`, and a unique `MAESTRO_TOURNAMENT_NAME` locally; do not
commit account credentials. The flow creates a draft tournament. It must not
depend on Gmail, Chrome, or other external applications.

Start PostgreSQL, the API, the Expo development server, and an Android emulator
with the Rally development build installed. From `apps/app`, run:

```text
maestro test .maestro/tournament-setup-validation.yaml
```

Record the exact command, result, emulator/device, and required setup in the
pull request. Do not report the flow as passing unless it was run on a device
or emulator.
