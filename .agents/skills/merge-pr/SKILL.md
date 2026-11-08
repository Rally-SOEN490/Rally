---
name: merge-pr
description: Use only when the user explicitly asks to merge a Rally pull request. Checks that the pull request is ready, confirms the merge method and commit message with the user, merges, and follows up on the linked issue.
disable-model-invocation: true
---

# Merge a pull request

Merging changes `main` for everyone and cannot be undone cleanly. Merge only after the user confirms, and never bypass the repository's rules (no `--admin`).

## 1. Check readiness

Run the `pr-status` report:

```bash
node .agents/skills/pr-status/scripts/pr-status.mjs <number>
```

If it reports blockers, stop and list them. Continue only if the user explicitly decides to merge anyway and says why; repeat that reason in your final summary. Warnings, such as unresolved threads or an approval of an earlier commit, need the user's acknowledgment before continuing.

## 2. Choose the merge method

Read the allowed methods from the repository, not from memory:

```bash
gh api repos/Rally-SOEN490/Rally/rulesets --jq '.[].id' \
  | xargs -I{} gh api repos/Rally-SOEN490/Rally/rulesets/{} --jq '.rules[] | select(.type == "pull_request") | .parameters.allowed_merge_methods'
gh repo view Rally-SOEN490/Rally --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed
```

Rally merges with a merge commit (`CONTRIBUTING.md`: do not squash). If the repository does not allow it, stop and tell the user.

## 3. Confirm the commit message

The branch's commits stay as they are on `main`; keep GitHub's default merge commit subject.

Show the method and the subject, and ask the user to confirm.

## 4. Merge

```bash
gh pr merge <number> --merge --match-head-commit <headRefOid>
```

`--match-head-commit` stops the merge if someone pushed after the check. If it fails, run step 1 again.

## 5. Follow up

- Confirm the pull request is merged and the linked issue closed: `gh issue view <issue> --json state`.
- For a user story, remind the user to record the stakeholder's signoff in a comment on the issue once the stakeholder accepts it, and to tick the acceptance criteria that are met.
- Ask whether to delete the remote branch (`git push origin --delete <branch>`). Then offer to update the local `main` (`git fetch origin main`) and to remove the branch's worktree if it has one.
