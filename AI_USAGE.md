# AI usage

This file is Rally's project-level record of generative-AI use, required by [Code Quality Rubric §8](docs/course/soen-490/CODE-QUALITY.md#8-responsible-use-of-ai-generated-code). Keep it consistent with the source-file and pull request declarations described in [CONTRIBUTING.md](CONTRIBUTING.md#ai-use-and-contribution-declarations).

Each contributor records their own use. Do not guess another contributor's AI usage.

## Tools

Tools named in Rally's acknowledgments so far. Add any other tool you used.

| Tool           | Used for                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Claude Code    | To be completed by the contributors who used it                                                                            |
| OpenAI Codex   | RALLY-149 (#171): lint/format configuration, PR quality checks, formatting baseline, documentation, and local verification |
| GitHub Copilot | Automated pull request review comments; RALLY-112 (#134): tournament search, cards, filters, and tests                     |
| OpenAI         | RALLY-115 player cards, directory states, tests, and visual validation                                                     |

## Tooling contributions

### RALLY-149: pull request quality checks

Issue: [#171](https://github.com/Rally-SOEN490/Rally/issues/171). Pull request: [#263](https://github.com/Rally-SOEN490/Rally/pull/263). The new ESLint configurations, quality workflow, and shared Home/Search navigation renderer are 50% or more AI-generated. OpenAI Codex wrote the configuration, scripts, workflow, and CI documentation, and ran Prettier to establish a passing formatting baseline. Existing source-file declarations were preserved or normalized from their stated levels; missing historical levels remain for the original contributors to declare rather than being guessed. CI/configuration is recorded here separately because rubric §1 excludes it from substantive features.

Verification after merging the profile update from `main`: both projects' lint and formatting checks and TypeScript checks passed; the app's 208 tests and the API's 89 tests passed with coverage. API migrations ran only in isolated local PostgreSQL 17. Added navigation cases check that Home still pushes routes, Search still replaces them, and active/unavailable tabs do nothing. The shared renderer has full line, function, and branch coverage in this run. A static web export rendered 13 routes using dummy Firebase configuration. The new workflow previously passed `actionlint`. These are local results, not a deployment or a claim that the latest remote Sonar analysis has completed.

Problems and corrections: the first web export failed without Firebase configuration, so CI explicitly supplies dummy values and disables dotenv loading. Initial app lint found an unescaped JSX apostrophe and existing effect-state updates; the text was escaped without changing its displayed value, and the remaining search effect exception documents its existing request/reset lifecycle. Sonar then reported 18 duplicated new lines (3.7%) in the formatted Home/Search navigation. Their renderer is now shared while each screen retains its existing styles and navigation behavior; Sonar exclusions and thresholds were not relaxed. A later merge from `main` retained the profile thought/interests tests and their new migrations, resolving the formatting conflict in the users test file. Size/complexity warnings remain as required by #171. Legacy source files without an AI-contribution level still need their authors' declarations before contribution compliance can be claimed.

## Features with substantial AI assistance

List every substantive feature, as defined in [rubric §1](docs/course/soen-490/CODE-QUALITY.md#1-feature-implementation-and-volume-of-work), whose implementation had substantial AI assistance.

| Feature                       | Stories and pull requests                                                    | AI-contribution level    |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------ |
| Tournament search and filters | RALLY-112 (#134), PR [#309](https://github.com/Rally-SOEN490/Rally/pull/309) | 50% or more AI-generated |

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
