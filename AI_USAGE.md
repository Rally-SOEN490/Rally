# AI usage

This file is Rally's project-level record of generative-AI use, required by [Code Quality Rubric §8](docs/course/soen-490/CODE-QUALITY.md#8-responsible-use-of-ai-generated-code). Keep it consistent with the source-file and pull request declarations described in [CONTRIBUTING.md](CONTRIBUTING.md#ai-use-and-contribution-declarations).

Each contributor records their own use. Do not guess another contributor's AI usage.

## Tools

Tools named in Rally's acknowledgments so far. Add any other tool you used.

| Tool           | Used for                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code    | RALLY-161, RALLY-140, RALLY-135: roles, organizer applications, email outbox, tests and docs. Other contributors add their own use |
| OpenAI Codex   | RALLY-149 (#171): lint/format configuration, PR quality checks, formatting baseline, documentation, and local verification         |
| GitHub Copilot | Automated pull request review comments; RALLY-112 (#134): tournament search, cards, filters, and tests                             |
| OpenAI         | RALLY-115 player cards, directory states, tests, and visual validation                                                             |

## Tooling contributions

### RALLY-149: pull request quality checks

Issue: [#171](https://github.com/Rally-SOEN490/Rally/issues/171). Pull request: [#263](https://github.com/Rally-SOEN490/Rally/pull/263). The new ESLint configurations, quality workflow, and shared Home/Search navigation renderer are 50% or more AI-generated. OpenAI Codex wrote the configuration, scripts, workflow, and CI documentation, and ran Prettier to establish a passing formatting baseline. Existing source-file declarations were preserved or normalized from their stated levels; missing historical levels remain for the original contributors to declare rather than being guessed. CI/configuration is recorded here separately because rubric §1 excludes it from substantive features.

Verification after merging the profile update from `main`: both projects' lint and formatting checks and TypeScript checks passed; the app's 208 tests and the API's 89 tests passed with coverage. API migrations ran only in isolated local PostgreSQL 17. Added navigation cases check that Home still pushes routes, Search still replaces them, and active/unavailable tabs do nothing. The shared renderer has full line, function, and branch coverage in this run. A static web export rendered 13 routes using dummy Firebase configuration. The new workflow previously passed `actionlint`. These are local results, not a deployment or a claim that the latest remote Sonar analysis has completed.

Problems and corrections: the first web export failed without Firebase configuration, so CI explicitly supplies dummy values and disables dotenv loading. Initial app lint found an unescaped JSX apostrophe and existing effect-state updates; the text was escaped without changing its displayed value, and the remaining search effect exception documents its existing request/reset lifecycle. Sonar then reported 18 duplicated new lines (3.7%) in the formatted Home/Search navigation. Their renderer is now shared while each screen retains its existing styles and navigation behavior; Sonar exclusions and thresholds were not relaxed. A later merge from `main` retained the profile thought/interests tests and their new migrations, resolving the formatting conflict in the users test file. Size/complexity warnings remain as required by #171. Legacy source files without an AI-contribution level still need their authors' declarations before contribution compliance can be claimed.

## Features with substantial AI assistance

List every substantive feature, as defined in [rubric §1](docs/course/soen-490/CODE-QUALITY.md#1-feature-implementation-and-volume-of-work), whose implementation had substantial AI assistance.

| Feature                          | Stories and pull requests                                                                                                  | AI-contribution level    |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Tournament search and filters    | RALLY-112 (#134), PR [#309](https://github.com/Rally-SOEN490/Rally/pull/309)                                               | 50% or more AI-generated |
| Roles and organizer applications | RALLY-161 (#183), RALLY-140 (#162), RALLY-135 (#157), PR [#313](https://github.com/Rally-SOEN490/Rally/pull/313)           | 50% or more AI-generated |
| Tournament setup                 | RALLY-48 (#70), RALLY-49 (#71), RALLY-68 (#90), RALLY-51 (#73), PR [#315](https://github.com/Rally-SOEN490/Rally/pull/315) | 50% or more AI-generated |
| Real tournaments in Search       | RALLY-226 (#302), PR [#320](https://github.com/Rally-SOEN490/Rally/pull/320)                                               | 50% or more AI-generated |
| Tournament page                  | RALLY-225 (#301), RALLY-209 (#285), RALLY-68 (#90), PR [#322](https://github.com/Rally-SOEN490/Rally/pull/322)             | 50% or more AI-generated |

## Feature descriptions

Describe at least half of the features listed above. Copy this template for each one:

```markdown
### <Feature name>

Pull requests: #<number>

<At most two paragraphs on what AI contributed and how the contributor reviewed and changed it.>

Verification: <tests or substantive review comments that check the behaviour, with links>

Problems and rejected suggestions: <generated code that was wrong, corrected, or rejected, or "None found">
```

### RALLY-112: Tournament search and filters

Pull request: [#309](https://github.com/Rally-SOEN490/Rally/pull/309).

GitHub Copilot contributed the tournament directory, search and filter behavior, filter sheet, tournament cards, translations, and behavior tests. The contributor reviewed the implementation against the story criteria and refined the tests to isolate each filter and verify multiple selections.

Verification: the app search tests cover tournament search, the filter UI, registration feedback, loading/error states, and cards; the tournament utility tests cover each filter independently and multiple selections. Native emulator/simulator comparison against Figma remains pending; use `Refs #134` rather than `Closes #134` in the PR description until that criterion is complete.

Problems and rejected suggestions: the original registration feedback used `Alert.alert`, which does not display on web; it is now an accessible inline notice on web while native retains its alert.

### RALLY-161, RALLY-140, RALLY-135: Roles and organizer applications

Pull request: [#313](https://github.com/Rally-SOEN490/Rally/pull/313).

Claude Code (Claude Opus 5.5) planned the work with Hoang Vu, then wrote the account roles, the permission module and route hook, the organizer application API, the email outbox and Resend sender, the migrations, the Settings request sheet, the reviewer page, the tests and the architecture documents. Hoang made the design decisions: three account roles with captain scoped to one team in one tournament and staff left to #79; review through an emailed link that anyone holding it can use, instead of an admin list in the app; the first decision wins; reviewer emails in an environment variable; 14-day expiry; and applying again at once after a denial. He reviewed the plan against the existing issues and tested the flow manually with a real Resend email.

Verification: [permission tests](apps/api/test/permissions.test.ts), [route hook tests](apps/api/test/authorization.test.ts), [account role tests](apps/api/test/account-role.test.ts), [application tests](apps/api/test/organizer-applications.test.ts), [review tests](apps/api/test/organizer-review.test.ts) and [outbox tests](apps/api/test/email-outbox.test.ts) run against PostgreSQL, including simultaneous requests and decisions. The [request sheet](apps/app/tests/components/organizerApplicationSheet.test.tsx), [review page](apps/app/tests/app/organizer-review.test.tsx) and [client](apps/app/tests/lib/organizer-applications.test.ts) tests cover the app.

Problems and rejected suggestions: Hoang's manual test found that clicks inside the request sheet closed it on the web, because the sheet was nested in the tap-to-close backdrop; the backdrop now sits behind the sheet, with a regression test. A test assumed Fastify rejects unknown request fields, but it removes them; the test now checks that a `status` sent with an application is ignored. Making `role` required on the app's user type broke 51 test fixtures, so it is optional and a missing role is treated as a player. A second PostgreSQL (Postgres.app) on port 5432 blocked `prisma migrate dev`, so the migrations were generated from a schema diff and checked against the test database. Rejected: one pull request per issue (Hoang chose one pull request), requiring an admin login on the review page (#157's wording), and committing the reviewer emails to the public repository.

### RALLY-48, RALLY-49, RALLY-68, RALLY-51: Tournament setup

Pull request: [#315](https://github.com/Rally-SOEN490/Rally/pull/315).

Claude Code (Claude Opus 5.5) planned the work with Hoang Vu, then wrote the tournaments API (setup fields, divisions, publishing, deleting drafts, Montreal time conversion), the migration with its check constraints, the Events Organizer section, the two setup steps, the date and time fields, the leave confirmation, the tests and the architecture document. Hoang made the decisions: follow his Figma mock-up, browser and phone date pickers, plain-text descriptions (rich text stays #286), drafts that need only a name, Montreal time for everyone, "Create tournament" publishing, deleting drafts from the Events page, asking before leaving with unsaved changes (including Android's back button and the iOS swipe), and registration opening and closing no later than the start. He tried the screens locally, which is how the back-arrow gap below was found.

Verification: [setup and permission tests](apps/api/test/tournaments.test.ts), [division and publishing tests](apps/api/test/tournament-divisions.test.ts), [rule tests](apps/api/test/tournament-rules.test.ts) and [Montreal time tests](apps/api/test/montreal-time.test.ts) run against PostgreSQL, including a publish racing a division removal. The [Events](apps/app/tests/app/events.test.tsx), [setup](apps/app/tests/components/tournamentSetup.test.tsx), [divisions](apps/app/tests/components/tournamentDivisions.test.tsx), [leave confirmation with the real navigator](apps/app/tests/app/tournament-leave.test.tsx) and [web date field](apps/app/tests/components/dateTimeField.web.test.tsx) tests cover the app.

Problems and rejected suggestions: installing the date picker with npm 11 rewrote the app's lockfile in a way npm 10 (the Docker image) rejects; Claude first called the change harmless, and Hoang's Docker build failed, so the lockfile was regenerated with npm 10 and checked with both. Fastify's validator turned `courts: 0` into `null` instead of rejecting it; nullable fields now list their types, with tests. `prisma format` removed the schema's AI declaration and realigned every model, so its output was discarded. Expo Router's generated route types don't include new screens until `expo start` runs, so screen links go through one typed helper. Hoang found that the back arrow left without saving or asking, then asked to cover Android's back button and the iOS swipe; a test then found that a "leaving on purpose" flag could outlive the save it was set for, which was fixed. Rejected: the "Ours (latest)" mock-up (it lacked courts and the registration-open date), a rich-text editor in this PR, and adding Search (#302) and registration (#58, #301) to it. HaichuanLi's review on #315 found three gaps, each now covered by a test: tournament and division ids that weren't real UUIDs reached the database and returned 500 instead of 400; the database check on division levels let a missing list or a blank level through, so a new migration tightens it; and the players' Events placeholder text wasn't in the translation file.

### RALLY-226: Real tournaments in Search

Pull request: [#320](https://github.com/Rally-SOEN490/Rally/pull/320).

Claude Code (Claude Opus 5.5) wrote the `GET /tournaments` route that lists published tournaments that haven't ended for any logged-in account, the app's switch from mock data to that route, the card that combines a tournament's divisions, the filters on real formats, types and levels, the tests and the architecture notes. Hoang Vu made the decisions: replace the mock filters with the real fields (dropping Surface and Team size), one card per tournament that combines its divisions, and leaving the Register button's link to the tournament page for RALLY-225.

Verification: [Search route tests](apps/api/test/tournament-browse.test.ts) run against PostgreSQL and cover drafts, ended and in-progress tournaments, the order, the exact fields sent, logging in, and that the organizer routes still turn players away. The [filter tests](apps/app/tests/lib/tournaments.test.ts) and [Search screen tests](apps/app/tests/app/search.test.tsx) cover the card and filters on real data.

Problems and rejected suggestions: filtering each field separately would have shown a tournament for "6v6" and "Under $50" when only its 2v2 was under $50, so one division now has to match every division filter. The date filter compares the Montreal start date as written instead of converting it. Rejected: keeping a Surface filter, which no tournament stores, and adding a tournament page in this PR. vtaing10's review on #320 found that Search didn't reload when the player came back to the tab, so a tournament published from Events stayed hidden; it now reloads on focus, with a test using the real tab navigator.

### RALLY-225, RALLY-209, RALLY-68: Tournament page

Pull request: [#322](https://github.com/Rally-SOEN490/Rally/pull/322).

Claude Code (Claude Opus 5.5) planned the work with Hoang Vu, then wrote the change to `GET /tournaments/:id` (published tournaments for any logged-in account, drafts only for their organizer, and the sign-ups state worked out on the server), the tournament page with its player and organizer views, the links from Search and the Events page, the tests and the architecture notes. Hoang made the decisions: follow the Nov 2 "Player sign-up" mock-ups, one pull request for the three issues, a Sign up button that says registration isn't available until RALLY-36, team counts shown but not tappable and "Registered teams" greyed out until teams exist, and no Share link, "…" menu or Map button.

Verification: [page route tests](apps/api/test/tournament-page.test.ts) run against PostgreSQL and cover who sees a published tournament or a draft, the exact fields each viewer gets, and the three sign-up states. The [page tests](apps/app/tests/components/tournamentPage.test.tsx) cover the player and organizer views, one or several divisions, closed, not yet open and full tournaments, a bare draft, loading, errors and going back; the [Search](apps/app/tests/app/search.test.tsx), [Events](apps/app/tests/app/events.test.tsx) and [routing](apps/app/tests/app/routing.test.tsx) tests cover opening it.

Problems and rejected suggestions: the issue asked for team lists and a "Create a team" button under each division, but the agreed mock-ups have one Sign up button for the whole tournament, and teams don't exist yet, so those parts move to RALLY-36 and RALLY-38. Making `GET /tournaments/:id` public meant the setup screens could have loaded another organizer's published tournament, so they now refuse one that isn't the caller's. On the Search card, a disabled "Full" button would have blocked opening a full tournament's page, so the whole card is now the button. The Figma tool-call limit ran out while planning, so the organizer's view was read from the mock-up's layer names rather than its picture. Rejected for now: Share link, the "…" menu and the Map button.

## Additional assisted work

### RALLY-115: Player browsing

Issue: #137. Pull request: [#262](https://github.com/Rally-SOEN490/Rally/pull/262).
This browsing-only increment leaves filtering open; displaying records and styling
are not counted as a separate substantive feature under rubric §1. The local
integration incorporates current main, including #256 and the shared tab navigation.

OpenAI Codex generated the player-card presentation, directory loading/error/empty
states, retry behavior, translations, tests, and stable directory ordering. The
contributor selected **50% or more AI-generated**. The updated Figma card has four
statistic tiles, one interests section with overflow, and View profile/Message
actions. Unavailable data remains explicit and unavailable actions stay disabled.
Codex also resolved the main integration conflicts and applied the shared review-pr
checklist. Main's navigation, account, profile, settings, and API contracts were preserved.

Verification: [card tests](apps/app/tests/components/playerCard.test.tsx),
[search tests](apps/app/tests/app/search.test.tsx),
[shared navigation tests](apps/app/tests/app/tabs-layout.test.tsx), and
[directory integration tests](apps/api/test/users.test.ts). The integrated local app
passed 285 tests; the API passed 147 tests. Both projects passed type, lint, and
format checks, with existing size/complexity warnings. Android API 29 testing used
the supplied navigation development build, actual Search/Home/shared navigation,
and an isolated session/database fixture. It covered case-insensitive search,
loading, empty/no-match states, retry preserving input, keyboard dismissal, disabled
actions, scrolling, and Home/Search state retention. Separate native card fixtures
verified interest overflow, Android Back, and narrow-width long names. The supplied
APK lacks main's image-picker module, so Profile alone was replaced in the ignored
preview harness; Profile and real Firebase sign-in are not end-to-end verified.
No web or iOS checks were run for this revision.

Corrections: fixed a broad font mock, asynchronous test cleanup, narrow-width
wrapping, clipped chip text, and native SVG button-edge artifacts using exact Figma
3x PNG exports. Current assets and typography were compared with the specified
Figma card; platform rasterization differences remain. The initial parallel test
run hit resource-contention timeouts; API rerun and the full serial app run passed
without increasing timeouts. Committed screenshots were removed from the proposed
tree and fresh Android Search captures prepared as PR attachments. Existing
contribution levels were preserved, including extracted styles. Three inherited
Search Toggle commits lack AI acknowledgments; their authors' history was not
rewritten. Human review, current remote CI, and stakeholder signoff remain pending.

## AI-use acknowledgment

Claude Code drafted this file's structure. The contributors complete its content.
