---
name: ai-checklist
description: Use when the user asks to check a Rally branch, commits, or pull request against the SOEN 490 AI-use rules, to add or fix AI-contribution declarations and license notices, to fill in a pull request's AI sections or AI_USAGE.md, or to backfill their own declarations for earlier work.
---

# Check and fix AI-use declarations

Rally's AI-use rules are in `CONTRIBUTING.md` under "AI use and contribution declarations" and "Source-file license notice". The rubric behind them is §8 of `docs/course/soen-490/CODE-QUALITY.md`. Read both before starting; when this skill disagrees with them, they win.

## Ground rules

- **Only the user's own AI use.** Never guess another contributor's AI usage or choose a level for a file the user did not write. Report those files and name the author from git history instead.
- **The user chooses each level.** Levels are good-faith estimates of how much of the current implementation originated from AI. Student edits do not erase that origin. You may share evidence, such as the commit's AI acknowledgment, but the user decides.
- **Nothing outside the working tree changes without a yes.** Show the exact text before editing a pull request description, an issue, or a commit message. Never rewrite pushed commits or force-push.

## 1. Run the check

From the repository root:

```bash
node .agents/skills/ai-checklist/scripts/check.mjs                 # changed files and commits on this branch
node .agents/skills/ai-checklist/scripts/check.mjs --pr <number>   # also the pull request description
node .agents/skills/ai-checklist/scripts/check.mjs --all           # every source file, with coverage
```

Add `--pr` when the branch has a pull request (`gh pr view --json number`). To check a description before it is posted, write it to a file and pass `--pr-body <file>`. Add `--json` for machine-readable output.

The script checks:

- **Source files:** the license notice and an `AI contribution:` line with one of the three exact levels in the first lines. Generated files, migrations, and type declarations are skipped.
- **Commits:** an AI-use acknowledgment line (error) and an issue reference such as `Refs #243` (warning).
- **Pull request:** a filled-in AI-use acknowledgment. On `feature/` and `bug/` branches, also exactly one ticked level, the AI-assisted source files, and verification evidence, unless the level is `No substantial AI-generated code`.

Show the user the result grouped as files, commits, and pull request.

## 2. Fix source files

For each failing file:

1. Find who wrote it: `git log --format='%an' -- <path> | sort | uniq -c` and, for shared files, `git blame --line-porcelain <path> | grep '^author ' | sort | uniq -c`.
2. If it is not mainly the user's file, list it under "Other authors" with the names, and do not edit it.
3. If it is, ask the user which level applies, one file at a time (with buttons if your environment has them). Then put this at the top, in the file's comment syntax, replacing any old `Rally contributors` / `SPDX-License-Identifier: MIT` lines:

   ```ts
   // Copyright (c) 2026 Rally. All rights reserved.
   // AI contribution: <level>
   ```

Run the check again afterwards.

## 3. Fix commits

A commit without an acknowledgment cannot be fixed after it is pushed. Report it, and make sure the pull request's acknowledgment covers that work. For an unpushed commit, offer to reword it, and do so only after the user agrees. Follow the user's own instructions for the acknowledgment's wording; otherwise name the tool and what it contributed, for example `AI: Claude Code helped write the tests.`

## 4. Fill in the pull request sections

Draft the "AI contribution" and "AI-use acknowledgment" sections of `.github/PULL_REQUEST_TEMPLATE.md`:

- **Level:** for the implementation the PR introduces or substantially changes. Base it on the user's file levels; do not pick a lower level than the files support.
- **AI-assisted source files:** every changed file whose level is not `No substantial AI-generated code`.
- **Verification evidence:** the tests that exercise those files, found by reading them, and any substantive review comments. Do not claim tests ran unless they did.

Show the full updated description, then update it with `gh pr edit <number> --body-file <file>` only after the user agrees.

## 5. Update AI_USAGE.md

When the PR implements a substantive feature (rubric §1) with substantial AI assistance:

- Add the feature to the table, with its stories, PRs, and level.
- Offer to add a description from the template in `AI_USAGE.md`. Ask the user what AI got wrong and which suggestions they rejected; record "None found" only if they say so.
- Add any new tool to the tools table.

## Backfill earlier work

When the user wants to catch up on earlier declarations:

1. Run the check with `--all` and keep the files the user mainly wrote (step 2). Go through them in small batches, asking the level for each, and commit them on a branch for the backfill issue.
2. Find the user's merged pull requests: `gh pr list --author @me --state merged --limit 100 --json number,title,body,headRefName`. For each feature or bug PR whose description lacks the AI sections, draft them as in step 4. Edit each PR only after the user agrees to that PR's text.
3. Draft `AI_USAGE.md` entries for the user's features as in step 5.

Finish with a summary: files declared, files left for other authors, PRs updated, and anything the user chose to skip.
