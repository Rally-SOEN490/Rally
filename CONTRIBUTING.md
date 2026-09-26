# Contributing

## Issues

Choose the issue form that matches the work:

- **Epic:** one parent issue per feature, with its feature label and its stories as sub-issues.
- **User story:** a user-facing outcome beneath its feature epic. Include the actor, goal, outcome, acceptance criteria, risk, and a task plan. Add the feature label, and set Story points and Priority in the issue fields. Add the iteration milestone when the story is planned. Add links to diagrams, discussion notes, and related pull requests as work progresses, then record stakeholder signoff in a comment.
- **Task:** a substantial piece of a story or standalone work such as CI or deployment. Attach a story task beneath its story. Keep small steps in the story's checklist. Set Ideal time in the issue fields. Standalone tasks have no epic parent.
- **Bug:** a defect with steps to reproduce and its expected and actual behaviour.

## Branches and pull requests

Create a short-lived branch for each issue. Reference the issue in commits, such as `Working on #12`.

Start the pull request body with `Closes #12` so GitHub links it to the issue, moves the issue on the project board, and closes it on merge. For work that only covers part of a story, write `Part of #12` instead and link the pull request from the issue's Development section.

The pull request must explain the change, list the tests performed, and include an AI-use acknowledgment. The pull request check fails when the issue link or AI acknowledgment is missing. It also copies the issue's labels and milestone to the pull request.

Pull requests are squash merged. The pull request title becomes the commit title and the body becomes the commit message, so keep both accurate. A team member must review the pull request before merge.

## AI acknowledgment

SOEN 490 requires a brief AI-use acknowledgment on every issue, commit, and pull request. State the tool used and what it contributed. Write `None` when no AI tool contributed.

## Source-file license notice

Add this notice at the top of each new source file, using the comment syntax of its language:

```text
Copyright (c) 2026 Rally contributors
SPDX-License-Identifier: MIT
```
