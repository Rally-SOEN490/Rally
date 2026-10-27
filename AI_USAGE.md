# AI usage

This file is Rally's project-level record of generative-AI use, required by [Code Quality Rubric §8](docs/course/soen-490/CODE-QUALITY.md#8-responsible-use-of-ai-generated-code). Keep it consistent with the source-file and pull request declarations described in [CONTRIBUTING.md](CONTRIBUTING.md#ai-use-and-contribution-declarations).

Each contributor records their own use. Do not guess another contributor's AI usage.

## Tools

Tools named in Rally's acknowledgments so far. Add any other tool you used.

| Tool | Used for |
| --- | --- |
| Claude Code | To be completed by the contributors who used it |
| OpenAI Codex | To be completed by the contributors who used it |
| GitHub Copilot | Automated pull request review comments |
| OpenAI | RALLY-115 player cards, directory states, tests, and visual validation |

## Features with substantial AI assistance

List every substantive feature, as defined in [rubric §1](docs/course/soen-490/CODE-QUALITY.md#1-feature-implementation-and-volume-of-work), whose implementation had substantial AI assistance.

| Feature | Stories and pull requests | AI-contribution level |
| --- | --- | --- |
| | | |

## Feature descriptions

Describe at least half of the features listed above. Copy this template for each one:

```markdown
### <Feature name>

Pull requests: #<number>

<At most two paragraphs on what AI contributed and how the contributor reviewed and changed it.>

Verification: <tests or substantive review comments that check the behaviour, with links>

Problems and rejected suggestions: <generated code that was wrong, corrected, or rejected, or "None found">
```

## Additional assisted work

### RALLY-115: Player browsing

Issue: #137. Pull request: not published. This browsing-only increment depends on
#256 and leaves filtering open; displaying records and styling are not counted as
a separate substantive feature under rubric §1.

OpenAI generated the reusable player-card presentation, directory loading/error/
empty states, retry behavior, translations, and tests, and added stable directory
ordering. The contributor selected **50% or more AI-generated**. Missing preferences,
statistics, profile navigation, and invitations are explicitly unavailable rather
than fabricated.

Verification: [card behavior tests](apps/app/tests/components/playerCard.test.tsx),
[search flow tests](apps/app/tests/app/search.test.tsx), and
[authenticated directory integration tests](apps/api/test/users.test.ts). Local
validation includes app/API tests, type checks, a native Android render, and web
search/retry checks using an isolated test identity/database. The real Firebase
sign-in-to-directory flow and human usability signoff remain pending.

Corrections: replaced an overbroad font test mock that broke icon loading; awaited
asynchronous test cleanup; corrected card actions wrapping at phone width; replaced
low-resolution metric exports with the exact Figma vectors. The first parallel app
test run hit timeouts in existing authentication tests; the full serial run passed.

## AI-use acknowledgment

Claude Code drafted this file's structure. The contributors complete its content.
