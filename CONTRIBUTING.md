# Contributing

## Issues

Choose the issue form that matches the work:

- **Epic:** one parent issue per feature, with its feature label and its stories as sub-issues.
- **User story:** a user-facing outcome beneath its feature epic. Include the actor, goal, outcome, acceptance criteria, risk, and a task plan. Add the feature label, and set Story points and Priority in the issue fields. Add the iteration milestone when the story is planned. Add links to diagrams, discussion notes, and related pull requests as work progresses, then record stakeholder signoff in a comment.
- **Task:** a substantial piece of a story or standalone work such as CI or deployment. Attach a story task beneath its story. Keep small steps in the story's checklist. Set Ideal time in the issue fields. Standalone tasks have no epic parent.
- **Bug:** a defect with steps to reproduce and its expected and actual behaviour.

## Branches and pull requests

Create a short-lived branch for each issue. Use `feature/RALLY-123`, `bug/RALLY-123`, or `doc/RALLY-123`, matching the RALLY ticket ID in the issue title. CI enforces these branch names and PR titles in the form `RALLY-123: Describe the change`. The RALLY ticket ID and GitHub issue number can differ: use the GitHub issue number in commit references such as `Working on #12` and in closing references. If you create a branch from the issue's Development section, enter a name that matches this convention.

Link the pull request to its issue from the Development section of the pull request sidebar. GitHub then moves the issue on the project board and closes it when the pull request merges.

Fill in the pull request template and delete sections that do not apply, such as Screenshots for changes without a visible UI. Keep the AI-use acknowledgment, writing `None` when no AI tool contributed. Every feature/fix PR also needs the AI-contribution declaration described below.

Merge pull requests with a merge commit so that individual commits and authors remain visible. Do not squash commits. The October 20 SOEN 490 rubric requires this history for contribution analysis and traceability.

Someone other than the author must substantively review the PR before merge. Record a specific technical question, concern, suggestion, or description of what was checked; a generic approval or bot comment does not count. Address requested technical changes or provide a technical explanation before merging.

## AI use and contribution declarations

SOEN 490 requires a brief AI-use acknowledgment on every issue, commit, and pull request. State the tool used and what it contributed. Write `None` when no AI tool contributed.

Every applicable source file written or modified by the team needs a declaration near its beginning, and every feature/fix PR needs a declaration for the implementation it introduces or substantially changes. Use one of these levels:

- `No substantial AI-generated code`
- `Below 50% AI-generated`
- `50% or more AI-generated`

These are good-faith estimates of implementation that originated from AI. Student edits do not erase that origin. Minor autocomplete and syntax suggestions are not substantial AI-generated implementation. Generated files, vendored code, dependencies, and generated migrations are excluded. Source-file and feature/fix PR declarations are required even when the level is `No substantial AI-generated code`. Identify substantially AI-assisted source files in the PR and describe how their behavior was verified.

Maintain `AI_USAGE.md` or an equivalent clearly identified section. List the tools and all substantive AI-assisted features. For at least half of those features, describe AI's contribution in no more than two paragraphs, link the relevant PRs, and include test or substantive-review evidence. Record problems, corrections, and rejected suggestions when they occurred. Keep file, PR, and project-level declarations consistent; do not guess another contributor's AI usage.

See [Code Quality Rubric §8](docs/course/soen-490/CODE-QUALITY.md#8-responsible-use-of-ai-generated-code) for the detailed checks, coverage thresholds, and exclusions.

## Source-file license notice

Add this notice at the top of each new source file, using the comment syntax of its language:

```text
Copyright (c) 2026 Rally. All rights reserved.
```

Put the source-file AI-contribution declaration near this notice, using the file's comment syntax. Preserve third-party license notices.
