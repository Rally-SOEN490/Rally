---
name: prepare-pr
description: Use when the user wants to open, prepare, or update a pull request in the Rally repository, or to run the CI checks locally before pushing. Runs the pull request CI jobs locally in parallel, checks the branch, and drafts the title and description from the PR template with the linked issue. Pushes or opens the PR only after the user approves.
---

# Prepare a pull request

Get a branch ready for review: run CI locally so the user does not wait for GitHub, then draft the pull request. Read `CONTRIBUTING.md` under "Branches and pull requests" and `.github/PULL_REQUEST_TEMPLATE.md` first; when this skill disagrees with them, they win.

## Rules

- **Nothing leaves the machine without a yes.** Show the exact title, description, and reviewers, then ask before pushing, opening, or editing the pull request.
- **Report only what ran.** The Testing section lists commands that actually ran in this session and their real results, plus manual checks the user confirms.
- **Leave the user's work alone.** Do not commit, stash, or discard changes. If there are uncommitted changes, say so and let the user decide.

## 1. Find the issue

The branch must be `feature/RALLY-<n>`, `bug/RALLY-<n>`, or `doc/RALLY-<n>`. The RALLY ID and the GitHub issue number differ, so look the issue up:

```bash
gh issue list -R Rally-SOEN490/Rally --state all --search "RALLY-<n> in:title" --json number,title,state,milestone,body
```

Use the issue whose title starts with `RALLY-<n>:`. Note its acceptance criteria or Done-when list, and whether it has a milestone.

## 2. Set up and start local CI

A fresh worktree has no `node_modules` and no `apps/api/.env`. If they are missing, offer to run `npm ci` in `apps/app` and `apps/api`, and to copy `apps/api/.env` from the main checkout (the first path in `git worktree list`). The API tests need PostgreSQL (`docker compose up -d`).

Then start local CI in the background and keep working while it runs:

```bash
node .agents/skills/prepare-pr/scripts/local-ci.mjs [--title "RALLY-<n>: <title>"]
```

It runs the same jobs as the pull request workflows in parallel: naming, required files, the AI checklist, app tests, API type-check, and API tests. It also runs app checks that CI does not run yet. Logs go to `.agents/local/ci/`. API test runs from different worktrees wait for each other because they share the `rally_test` database. The script lists any workflow step it does not run locally, such as the SonarQube scan.

## 3. Check the branch

```bash
git fetch origin main
git rev-list --count HEAD..origin/main                     # commits behind main
git merge-tree --write-tree origin/main HEAD > /dev/null   # exit code 1 means conflicts
git status --short
```

Report how far behind the branch is, any conflicts, uncommitted changes, and unpushed commits.

## 4. Draft the pull request

- **Title:** `RALLY-<n>: <what the change does>`, usually the issue title.
- **Summary:** what changed and why, from the diff. Go through the issue's acceptance criteria and say which ones this PR meets; ask the user about any it does not.
- **Closing reference:** `Closes #<issue number>` in the Summary, so GitHub links the issue.
- **Testing:** the local CI results and any manual checks the user confirms.
- **Screenshots:** when screens under `apps/app/src/` changed, ask the user for screenshots. Delete the section when nothing visible changed.
- **AI sections:** use the `ai-checklist` skill to fill in the AI contribution level, the AI-assisted files, the verification evidence, and the acknowledgment. Write the draft to a file and check it with `node .agents/skills/ai-checklist/scripts/check.mjs --body-only --pr-body <file> --branch <branch>`.

Show the local CI result and the draft together.

## 5. Push and open

After the user approves:

```bash
git push -u origin HEAD
gh pr create --base main --title "<title>" --body-file <file> [--draft] [--reviewer <login>]
# or, if the PR already exists:
gh pr edit <number> --title "<title>" --body-file <file>
```

Ask whether to open it as a draft and who should review it. Then run the `pr-status` skill and show the result. When a GitHub check fails but passed locally, read its log (`gh run view <run id> --log-failed`). If it looks flaky, such as a timeout, offer to re-run the failed jobs with `gh run rerun <run id> --failed`, and do so only after the user agrees.

If the user has a personal skill for announcing pull requests, offer to use it.
