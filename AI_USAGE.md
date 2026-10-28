# AI usage

This file is Rally's project-level record of generative-AI use, required by [Code Quality Rubric §8](docs/course/soen-490/CODE-QUALITY.md#8-responsible-use-of-ai-generated-code). Keep it consistent with the source-file and pull request declarations described in [CONTRIBUTING.md](CONTRIBUTING.md#ai-use-and-contribution-declarations).

Each contributor records their own use. Do not guess another contributor's AI usage.

## Tools

Tools named in Rally's acknowledgments so far. Add any other tool you used.

| Tool | Used for |
| --- | --- |
| Claude Code | To be completed by the contributors who used it |
| OpenAI Codex | RALLY-149 (#171): lint/format configuration, PR quality checks, formatting baseline, documentation, and local verification |
| GitHub Copilot | Automated pull request review comments |

## Tooling contributions

### RALLY-149: pull request quality checks

Issue: [#171](https://github.com/Rally-SOEN490/Rally/issues/171). Pull request: [#263](https://github.com/Rally-SOEN490/Rally/pull/263). The new ESLint configurations, quality workflow, and shared Home/Search navigation renderer are 50% or more AI-generated. OpenAI Codex wrote the configuration, scripts, workflow, and CI documentation, and ran Prettier to establish a passing formatting baseline. Existing source-file declarations were preserved or normalized from their stated levels; missing historical levels remain for the original contributors to declare rather than being guessed. CI/configuration is recorded here separately because rubric §1 excludes it from substantive features.

Verification after merging the profile update from `main`: both projects' lint and formatting checks and TypeScript checks passed; the app's 208 tests and the API's 89 tests passed with coverage. API migrations ran only in isolated local PostgreSQL 17. Added navigation cases check that Home still pushes routes, Search still replaces them, and active/unavailable tabs do nothing. The shared renderer has full line, function, and branch coverage in this run. A static web export rendered 13 routes using dummy Firebase configuration. The new workflow previously passed `actionlint`. These are local results, not a deployment or a claim that the latest remote Sonar analysis has completed.

Problems and corrections: the first web export failed without Firebase configuration, so CI explicitly supplies dummy values and disables dotenv loading. Initial app lint found an unescaped JSX apostrophe and existing effect-state updates; the text was escaped without changing its displayed value, and the remaining search effect exception documents its existing request/reset lifecycle. Sonar then reported 18 duplicated new lines (3.7%) in the formatted Home/Search navigation. Their renderer is now shared while each screen retains its existing styles and navigation behavior; Sonar exclusions and thresholds were not relaxed. A later merge from `main` retained the profile thought/interests tests and their new migrations, resolving the formatting conflict in the users test file. Size/complexity warnings remain as required by #171. Legacy source files without an AI-contribution level still need their authors' declarations before contribution compliance can be claimed.

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

## AI-use acknowledgment

Claude Code drafted this file's structure. The contributors complete its content.
