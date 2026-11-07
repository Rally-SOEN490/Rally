## AI-use acknowledgment

Copilot assisted with implementing the Maestro flow and runner, organizing the
test cases, and identifying feasible in-app coverage. The flow and API suite
should be run against the configured local services before merging.

# Player profile feature test plan

The player profile currently has API coverage for the implemented profile fields.
The Maestro cases below are the profile flows that can be exercised inside Rally
with a test account; they do not depend on opening Facebook, Instagram, or
another external service.

## End-to-end

- **Open the signed-in player's profile** — **E2E — implemented with Maestro**

  Sign in with the dedicated fixed Maestro account, open Profile, and verify
  that the signed-in player's display name, team status control, interests section,
  thought placeholder, social-link states, awards section, and results section
  are visible.

- **Edit profile basics and persist the changes** — **E2E — implemented with Maestro**

  Open Settings from Profile, change the display name, return to Profile, and
  verify the new name is shown. Reopen the profile to confirm the saved value is
  loaded from the server.

- **Set team-seeking status and interests** — **E2E — implemented with Maestro**

  Turn on “Looking for a team” and select a play format and position. Verify the
  profile badge and selected interests appear, then reload the profile and
  confirm both values remain selected.

- **Add, edit, and clear a profile thought** — **E2E — implemented with Maestro**

  Add a short thought from the profile, verify it is displayed, edit it, and
  clear it. Confirm the profile returns to the “Your thought” placeholder.

- **Set gender and social links without leaving Rally** — **E2E — implemented with Maestro**

  In Settings, choose a gender and save valid Instagram and Facebook profile
  URLs using test-only placeholder accounts. Return to Profile and verify the
  links show as connected. The test stops at Rally and does not open either
  external site.

- **View the complete badge collection and choose profile badges** — **E2E —
  implemented with Maestro**

  Open Awards from Profile, verify the player and locked award collections are
  visible, select up to four player awards, return to Profile, and verify the
  selected awards are shown.

## Manual test
- **Link Facebook and Instagram**
  Linking those two accouts require some more steps that could be easier to test
  by hand rather than automated it. For instance, we would need to create and
  verify a new Rally acocunt for both platforms and link it to the app. Since we
  don't know if Facebook or Instagram plans on changing their UI, manually
  testing this feature will prevent the smallest changes from Meta to break our
  test.

  File: `apps\api\test\manual_tests\link-facebook-instagram-manual-test.md`

## API integration

- **Read and update the signed-in player's profile**

  Covers display-name updates, team-seeking status, social links, interests,
  profile thoughts, and shown badge keys. It also confirms that updates affect
  only the authenticated player's account.

  File: `apps/api/test/users.test.ts`

- **Validate profile fields and reject unsafe values**

  Rejects blank or oversized names, unsupported interests, duplicate interests,
  malformed Instagram and Facebook URLs, and invalid shown-badge selections.
  Valid values are persisted and can be read on a later profile request.

  File: `apps/api/test/users.test.ts`

- **Read and update self-declared gender**

  Reads the initial unset value, saves male or female, allows clearing the
  value, rejects unsupported values, and confirms the value is scoped to the
  signed-in player.

  File: `apps/api/test/users.test.ts`

- **Return directory-safe player profiles**

  Confirms that the player directory returns other players without private
  account settings or Firebase identifiers, while exposing the fields needed
  for directory cards.

  File: `apps/api/test/users.test.ts`

- **Read, select, and restore profile badges**

  Confirms default badge creation, tier and progress data, shown badge
  persistence, and idempotent restoration of missing default badges.

  Files: `apps/api/test/users.test.ts` and `apps/api/test/badges.test.ts`

## Not included yet

- Opening Facebook or Instagram and verifying information there requires an
  external app, account, and network state, so it is outside the deterministic
  Maestro plan.
- Profile-photo selection is not included because it depends on device gallery
  state and is already covered by API tests in
  `apps/api/test/profile-photo.test.ts`.
- Complete profiles for other players, upcoming tournament teams, and confirmed
  tournament results are not included until those user-facing flows and
  testable backing data are available.


