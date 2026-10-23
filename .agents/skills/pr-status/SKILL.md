---
name: pr-status
description: Use when the user asks about the state of a Rally pull request, such as whether it is ready to merge, why CI failed, whether it has been reviewed, or what is blocking it, by number, URL, or "this branch". Read-only.
---

# Check a pull request's status

Report what stands between a Rally pull request and merging. This skill only reads; it never changes GitHub.

## 1. Run the report

```bash
node .agents/skills/pr-status/scripts/pr-status.mjs [<number>] [--json]
```

Without a number it uses the pull request for the current branch. It reports:

- **State:** draft, merged, or closed.
- **CI:** every check, including the SonarCloud quality gate.
- **Branch:** conflicts, or being behind `main`.
- **Description:** the Summary and Testing sections, screenshots when app screens changed, and the AI sections (through the `ai-checklist` script).
- **Issue:** a linked issue, its milestone, and a reminder about stakeholder signoff for user stories.
- **Reviews:** approval from another member, requested changes, approvals of an earlier commit, unresolved threads, and whether any review comment has technical content.

Blockers are marked `✗`, warnings `!`, and information `·`. The exit code is 1 when something blocks the merge.

The "Protect main" ruleset only requires one approval, so GitHub may allow a merge that this report blocks. Rally's rules still apply: a substantive review before merge (`CONTRIBUTING.md`, rubric §6) and passing CI.

## 2. Explain and suggest next steps

For each blocker, say what to do and who should do it:

- **Failed check:** read the log with `gh run view <run id> --log-failed` (the run id is in the check's URL) and summarize the failing test or step. Compare with a local run (`node .agents/skills/prepare-pr/scripts/local-ci.mjs --only <job>`). If it passes locally and looks flaky, such as a timeout, offer to re-run the failed jobs with `gh run rerun <run id> --failed`, and do so only after the user agrees.
- **Description or AI sections:** offer the `prepare-pr` or `ai-checklist` skill.
- **No linked issue:** add `Closes #<number>` to the description or link it in the Development sidebar.
- **Reviews:** a review counts only if another member comments on something specific they checked. Suggest asking a reviewer directly; do not write review comments on another member's behalf.

The substantive-review check is a heuristic. Show the comments it found so the user can judge them.
