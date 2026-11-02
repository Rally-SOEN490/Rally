# Account feature test plan

The account feature currently has one end-to-end test and the implemented API integration/performance tests listed below.

## End-to-end

- **Sign up, verify the email, and reach the home screen** — **E2E — implemented with Maestro**

  Run `apps/app/.maestro/run-account-e2e.ps1` with the dedicated Gmail inbox signed in on the emulator. Maestro creates a unique account, opens Gmail, taps the Firebase verification email and link, returns to Rally, and verifies that the app reaches Home.

  Flow: `apps/app/.maestro/signup-verify-and-home.yaml`

## API integration

- **Register, read, update, and delete an account**

  Tests the complete account lifecycle through the API and confirms that changes are persisted correctly.

  File: `apps/api/test/account-lifecycle.integration.test.ts`

- **Reject unauthenticated account requests**

  Calls protected account endpoints without an authentication token and confirms that the API returns `401` without changing the database.

  File: `apps/api/test/account-lifecycle.integration.test.ts`

- **Handle repeated sign-up requests safely**

  Sends several registration requests for the same Firebase user and confirms that only one database record is created.

  File: `apps/api/test/users.test.ts`

- **Delete only the signed-in user's profile**

  Deletes Alice's account and confirms that Bob's account remains.

  Files: `apps/api/test/users.test.ts` and `apps/api/test/account-lifecycle.integration.test.ts`

## Performance

- **Handle concurrent account reads within the performance budget**

  Sends 25 concurrent account-read requests through Fastify and PostgreSQL. The test requires the 95th-percentile response time to remain below `ACCOUNT_READ_P95_MS`, which defaults to two seconds.

  File: `apps/api/test/account-performance.test.ts`
