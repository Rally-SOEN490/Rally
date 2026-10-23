# Iterations, releases, and presentations

Sources: the course structure, October 19 release guide, and September 8 presentation template, linked in the [course index](README.md#sources-and-precedence). [Deadlines and peer evaluations](README.md#dates-and-penalties) and [grading](GRADING.md) are maintained separately.

## Iteration and release notes

Preserve the submitted repository state with an identifiable iteration/release tag (for example `Iteration1` or `Release1`). Release notes must reference the release tag and include:

| Section | Content |
| --- | --- |
| Overall summary | Main achievements in a paragraph of **at most four sentences** |
| Velocity and contractor estimate | Work completed versus planned, slips/early completion, and what a contractor would charge the stakeholder for the iteration |
| Retrospective | What went well, what went wrong, and planned improvements |
| Individual contributions | Each student's stories, code, tests, reviews, or other work, linked to issues/PRs/commits/reviews where possible. Missing descriptions, sporadic work, or insufficient evidence can result in **zero** for the iteration/release. Claims are visible to the team and must be truthful; team leads should flag inappropriate claims |

[Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes) are a starting point, not a replacement for individual descriptions. For deployed releases also include the [deployment record](CODE-QUALITY.md#9-automated-code-quality-controls-dependencies-containerization-and-deployment).

## Video submission

- Submit **one combined, downloadable video**, linked at the top of the repository README (for example “Release 1 demo”). A YouTube-only submission does not satisfy the download requirement. If an NDA applies, restrict access to people who signed it.
- Copy/adapt the [presentation template](https://docs.google.com/presentation/d/1r0E6IzxVvahG4yhYPdb61JAhgBrtid3LHkjvXE87kSQ/edit), following the outline below. Some unchanged topics can be brief or omitted where the template allows.
- **20 minutes maximum**, including a **five-minute product demo near the start** and a **five-minute code walkthrough at the end**. Focus both on substantial engineering work on open-ended problems. Login/basic features may be acceptable in R1; prioritize domain features and omit obvious login demonstrations after R1.
- Keep slide bullets to **two lines or fewer**; longer bullets lose marks. Use appropriate images, concise phrases, and readable text rather than shrinking it.
- Have the system ready and open issues, wiki pages, files, and tests before recording. Multiple takes/presenters are allowed; combine them into one video. Suggested format: recorded screen-share/Zoom session with one speaker image; two or three presenters can be enough.

## Presentation outline

The first template slide contains instructions; the remaining slides follow this order. Show the required [project documentation](PROJECT.md#required-project-documentation). Economics, societal risks, equity, architecture, frameworks, and tools can be brief when unchanged.

| Template slide | Show or discuss |
| --- | --- |
| 2. Title | Project name, “490 Group Presentation,” student names |
| 3. Problem and domain | Elevator pitch in bullet points, **every release** |
| 4. Major features | Finished, substantial domain features in priority order; **bold those finished in this release** |
| 5. Product demo | Highest-priority substantial functionality and deployment status. Five minutes; **R2 must run deployed, not locally** |
| 6. Deployment and feedback | Deployment plan/status, feedback collection, and resulting design/implementation changes; release-specific requirements below |
| 7. Planning and project board | Walk through the release/project board, planning and retrospective |
| 8. UX and mockups | UX and mockups |
| 9. Economics | Revenue or quantifiable nonfinancial benefit |
| 10. Societal risks | Domain-specific societal/environmental risks, including direct stakeholders/users, and mitigations |
| 11. Equity and diversity | Brief diversity statement in the README and domain-specific equity concerns |
| 12. Planning and costs | Consultant/employee cost estimate, whether iteration deadlines were met, infrastructure/other costs |
| 13. Architecture/domain diagrams | Main components, important diagrams, and changes to architecture/design |
| 14. Framework/library rationale | Choices and reasons; what you would choose differently next time |
| 15. Engineering tools | Tools used, including CI and IDE |
| 16. Testing and validation | Strategy, evidence of effectiveness, applicable integration tests; rubric feature-based thresholds control |
| 17. README/documentation | Developer onboarding, stakeholder-required documentation (for example a user guide), release notes |
| 18. Code walkthrough | Substantial engineering work using the files/tests linked below; five minutes at the end |
| 19. Top five source files | Clickable GitHub file paths and one-line purpose for each; open in advance |
| 20. Top five tests | Clickable GitHub test-file paths and one-line purpose for each; open in advance |

### Deployment and feedback by release

| Release | Required evidence |
| --- | --- |
| R1 | Feedback from the stakeholder and family/friends |
| R2 | Feedback from the stakeholder and **at least 15 people**; a deployed system, not a local-only demo. Give non-domain experts specific tasks. Concordia machines are an available minimum deployment option |
| R3 | Report deployment reach with numbers: user counts/types and features used. The template encourages competing for the largest-deployment award; it does not impose a public-production launch |

Explain how feedback was collected (for example logs or assigned tasks), issues recorded/prioritized/fixed, and how findings changed the design, implementation, or work plan.

## Individual follow-up

The professor assigns grades after inspecting the project and receiving the TAs' code review. Multiple poor peer reviews, few commits, or little real issue/story work can trigger an individual assessment; only add yourself to issues you actually worked on.

If requested, follow the [five-minute individual-video instructions](https://docs.google.com/document/d/1mdoK7O-aeLmNgFil4-xFzKhWaFrNn6NWxEr01TD1BZ4/edit): show consistent work, commit/PR history, substantial code, and linked design issues demonstrating engineering design/implementation. The professor determines any individual reduction from the team grade and communicates it privately. [Course advice](https://docs.google.com/document/d/16xIRYpRNHU8Oa2s-_Q1ulpAZPN3C6ZRcYOj7ctyqVko/edit) is available for students struggling with the work.
