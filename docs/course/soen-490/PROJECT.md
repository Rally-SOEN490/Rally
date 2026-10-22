# Project requirements

See the [course index](README.md#sources-and-precedence) for sources and precedence. The rubric holds the detailed [review](CODE-QUALITY.md#6-code-review-quality), [story/commit traceability](CODE-QUALITY.md#7-user-story-traceability-change-tracking-and-commit-quality), and [AI-disclosure](CODE-QUALITY.md#8-responsible-use-of-ai-generated-code) requirements; follow [CONTRIBUTING.md](../../../CONTRIBUTING.md) for the repository workflow.

## Repository and planning

- Keep code and documentation in one private GitHub repository named in **CamelCase**. Use GitHub-linked commit emails so contributions appear in metrics.
- Preserve professor access for **one year after course completion** for grade disputes. Keep personal information and signed forms outside Git in restricted storage.
- Use GitHub Projects, feature labels, issues for stories, and milestones for iterations. Plan the current and next iteration. Name milestones by iteration, adding the release where applicable, following the [current schedule](README.md#dates-and-penalties).
- [Naming CI](../../../.github/workflows/branch-pr-naming.yml) requires `feature/RALLY-123`, `bug/RALLY-123`, or `doc/RALLY-123` and PR titles `RALLY-123: Description`. Commit/closing references use the **GitHub issue number**, which can differ from the RALLY ID.
- Acknowledge the AI tool and its contribution on each issue, commit, and PR. Unacknowledged use is treated as plagiarism; students remain responsible for correctness, originality, understanding, and validation. Detailed declarations are in [rubric §8](CODE-QUALITY.md#8-responsible-use-of-ai-generated-code).

## Required project documentation

Keep the wiki consistent with implementation and provide stakeholder-specific documentation, such as a user guide, where required.

| Location/topic | Required content |
| --- | --- |
| Repository README | CI information; release-demo links at the top; project summary/elevator pitch of at most one paragraph; developer setup/run instructions; project-board link; wiki table of contents; brief diversity statement |
| Meeting minutes | Date, attendance and absences, rotating note taker, notes, action items linked to issues where possible |
| Project risks | Bullet points or at most one paragraph on the largest domain-specific risks; evidence, linked to code/stories, that the highest risks were attacked first |
| Legal, ethics, society/environment | Applicable legal and ethical issues, societal/environmental risks and mitigations, discrimination/equity and effects on jobs/careers. Cross-reference the risk discussion when it already covers an issue |
| Economics | Revenue model or other measurable benefit/impact, with supporting assumptions/figures |
| Budget | Estimated costs in a table, free resources in a separate column. Retain receipts and proof of payment privately for possible reimbursement; funding is not guaranteed |
| Users | Personas; project-specific diversity/equity statement; user consent and EULA |
| Architecture, naming, performance | [Rubric §3](CODE-QUALITY.md#3-code-structure-and-maintainability): current component/layer and relevant domain/class diagrams, naming standard, applicable performance requirements/bottlenecks and approach. For existing diagrams describe material changes |
| Infrastructure and tools | Libraries, frameworks, databases and tools used, reasons for choosing them, alternatives/trade-offs and lessons from poor choices |
| Testing and CI | Testing strategy and evidence of effectiveness, GitHub Actions CI strategy, PR review/approval process; [rubric §§2](CODE-QUALITY.md#2-automated-testing), [6](CODE-QUALITY.md#6-code-review-quality), and [9](CODE-QUALITY.md#9-automated-code-quality-controls-dependencies-containerization-and-deployment) give the checks |
| Security | Plan and project-specific security requirements, implemented practices and evidence per [rubric §5](CODE-QUALITY.md#5-security-practices) |
| Deployment | Diagram, plan, release strategy, and deployed-release records per [rubric §9](CODE-QUALITY.md#9-automated-code-quality-controls-dependencies-containerization-and-deployment). Plan stakeholder signoff releases, family/friends trials, alpha with trusted clients, beta with selected users, and a path for the stakeholder to a full release; a public launch is not mandatory |
| Independent learning | Knowledge gaps, how knowledge was acquired, and independent learning; see the separate [individual reflection requirement](GRADING.md#individual-reflection) |

## Stakeholder, licensing, and agreements

- **License: proprietary**, replacing MIT per the [team's September 30 decision](https://discord.com/channels/1548129860361388054/1548129861724274822/1554869411008225462) and the merged October 6 change to [LICENSE](../../../LICENSE). Preserve its warranty/liability disclaimer without contradictory terms.
- The stakeholder signs off on completed stories and meets briefly at the end of every **two-week iteration** (online is allowed), with commitment from **September through the end of May**; see the [responsibilities agreement](https://docs.google.com/document/d/1P6A1NbI6TVVKaIzGQbjeRwZRulwWYfhRqqcr-iY8wxg/edit).
- Only students write substantial project code during capstone; outside developers may review PRs.
- The stakeholder helps create the **EULA**, which users must accept before using the software; include user consent.
- If an NDA applies, the professor/TAs can sign only the [university-approved grading NDA](https://docs.google.com/document/d/17pe30eOg1tn1yaCTqzb7jvsMKG_G52Tj/edit).
