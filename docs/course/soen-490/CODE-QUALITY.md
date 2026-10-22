# Code-quality rubric

Source: October 20 [Code Quality Rubric](https://docs.google.com/document/d/1dW0fNpftc1OM8gk-q6R91G1yt7VWEbdLveh8yQw4GCs/edit), collected October 21, 2026. See the [course index](README.md) for deadlines and precedence and [grading](GRADING.md) for weights.

The same criteria apply across Releases 1–3. The required level of completion and consistency increases with each release. Unless stated otherwise, definitions, exclusions, applicability rules, and caps apply to all three releases.

## 1. Feature implementation and volume of work

Only substantive features count. A feature needs a completed story/feature issue, identifiable implementation code, and a change to application behavior. Closely related micro-stories implementing one capability count as one feature. It must meet **at least two** of these criteria:

- Business rules/validation beyond basic required-field checks.
- State transition or multi-step workflow.
- Data transformation, aggregation, ranking, calculation, or algorithmic processing.
- Coordination of multiple internal components/services.
- Non-trivial authorization/permission logic.
- Background/asynchronous processing.
- External-service integration that processes/transforms results.
- Significant project-specific domain logic.

The following **alone do not qualify**: basic CRUD, forwarding-only API wrappers, routing, form submission, displaying database records, UI styling, documentation, CI/configuration, dependency updates, or pure refactoring.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | fewer than 2 substantive features OR <30% of planned substantive feature stories implemented. | 2–3 features AND ≥30%. | 4–5 features AND ≥50%. | ≥6 features AND ≥75%. |
| 2 | fewer than 3 substantive features OR <40% implemented. | 3–4 features AND ≥40%. | 5–7 features AND ≥65%. | ≥8 features AND ≥85%. |
| 3 | fewer than 4 substantive features OR <50% implemented. | 4–5 features AND ≥50%. | 6–9 features AND ≥75%. | ≥11 features AND ≥95%. |

## 2. Automated testing

A tested feature has at least one meaningful automated test exercising its implementation and verifying expected behavior. An edge/error test additionally covers invalid input, a boundary, failure, or alternative path.

- Use applicable unit, integration, API, end-to-end, or other automated tests. Integration tests must verify **interactions**, not just components independently: database access, frontend/API, services/modules, multi-component authentication/authorization, or external services. Appropriate environments, mocks, stubs, or equivalent approaches are allowed.
- Include project-specific tests required by stories, acceptance criteria, architecture, technology, or instructor requirements: workflow, performance/load, security, API/contract, data-processing/model-evaluation, compatibility, or other applicable testing. Inapplicable test types are not required.
- Empty/placeholder tests, absent assertions, constant-only assertions, non-null-only checks where behavior should be verified, duplicate cases, and tests that do not exercise the claimed behavior **do not count**.

**Cap:** no meaningful automated tests → Poor.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | <15% of implemented features tested. | 15–34%. | ≥35% tested AND ≥25% of tested features include an edge/error test. | ≥70% tested AND ≥70% include an edge/error test, with applicable integration and project-specific testing demonstrated. |
| 2 | <20% tested. | 20–39%. | ≥45% tested AND ≥40% include an edge/error test AND applicable integration testing is demonstrated. | ≥80% tested AND ≥80% include an edge/error test AND applicable integration and project-specific testing requirements are satisfied. |
| 3 | <25% tested. | 25–49%. | ≥50% tested AND ≥50% include an edge/error test AND applicable integration and project-specific testing are demonstrated. | ≥90% tested AND ≥90% include an edge/error test AND all applicable integration and project-specific testing requirements are satisfied. |

## 3. Code structure and maintainability

Assess these **11 applicable checks**:

1. Source files generally **≤500 lines of code**.
2. Functions/methods generally **≤50 lines of code**.
3. Cyclomatic complexity **≤15**.
4. Each class has one primary responsibility; no substantially unrelated responsibilities.
5. No unnecessary coupling, circular dependencies, or cross-layer dependencies.
6. Cohesive classes/modules/components: related data and methods; no unrelated functionality grouped for convenience.
7. No identical/near-identical **≥20-line blocks in ≥3 locations**; domain/business rules normally have one source of truth.
8. No unresolved TODO/FIXME for required functionality, NotImplemented/placeholders, placeholder returns, large commented-out replacements, clearly unused files/classes/functions, or duplicate alternative implementations in important source code.
9. Wiki has a current high-level component/layer diagram with relationships and relevant class/domain diagrams, reasonably consistent with implementation. Later releases may describe material changes without recreating unchanged diagrams.
10. Consistent naming for files, classes, functions/methods, variables, and other relevant elements; document conventions in the wiki or link the adopted language/framework standard.
11. When performance matters, wiki identifies requirements/bottlenecks and the architectural/implementation approach, reasonably consistent with the system.

Exclude generated code, vendored libraries, generated migrations/fixtures, and other automatically generated files. Class responsibility is N/A without OOP; performance is N/A when not meaningful to the project.

**Exceptions:** document a specific technical justification near the code or in linked documentation. An exception satisfies a check only if it explains why the design is preferable to reasonable alternatives. Generic claims such as “necessary,” “too difficult to refactor,” or “generated by AI” are insufficient.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–2 checks. | 3–5 checks. | 6–10 checks. | all applicable checks. |
| 2 | 0–3 checks. | 4–6 checks. | 7–10 checks. | all applicable checks. |
| 3 | 0–4 checks. | 5–7 checks. | 8–10 checks. | all applicable checks. |

## 4. Input validation, error handling, and logging

Assess these **nine applicable checks**:

1. Validate user/external input for expected type, format, range, and required values before important operations.
2. Handle required fields and invalid values explicitly.
3. No empty catch/except blocks or silently ignored exceptions in important code.
4. Do not deliberately expose internal exception details/stack traces to users.
5. Handle external-service, database, and file-operation failures where appropriate.
6. Use a logging framework/central utility rather than primarily debug output.
7. Use appropriate log levels.
8. Include useful context for important operations/failures.
9. Do not deliberately log sensitive information.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–2 checks. | 3–4 checks. | 5–8 checks. | all 9 checks. |
| 2 | 0–3 checks. | 4 checks. | 5–8 checks. | all 9 checks. |
| 3 | 0–3 checks. | 4–5 checks. | 6–8 checks. | all 9 checks. |

## 5. Security practices

Assess these **eight applicable checks**:

1. No committed real passwords, API keys, tokens, private keys, or credentials.
2. Enforce authentication server-side where required.
3. Check authorization server-side before protected-resource access.
4. Use parameterized queries/framework-safe database operations.
5. Do not pass user-controlled values directly to dangerous operations such as shell commands or `eval`.
6. Hash stored passwords appropriately.
7. No hardcoded sensitive configuration.
8. Document project-specific security requirements in the wiki and implement **all** that apply, including those from project requirements, stories, acceptance criteria, architecture/design, and external services; partial implementation does not satisfy this check.

For projects using an LLM in their features, add **five checks**:

9. LLM output cannot directly execute privileged operations without application-side checks.
10. Validate model-generated commands, SQL, URLs, and file paths.
11. Application logic makes authorization decisions.
12. Do not include secrets or unnecessary sensitive data in prompts.
13. Do not treat untrusted content as trusted system instructions.

**Caps:** a real usable committed secret or missing required server-side authorization → Poor.

### Release grading

#### Projects without an LLM

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–2 checks. | 3–4 checks. | 5–7 checks. | all 8 checks. |
| 2 | 0–3 checks. | 4–5 checks. | 6–7 checks. | all 8 checks. |
| 3 | 0–3 checks. | 4–5 checks. | 6–7 checks. | all 8 checks. |

#### Projects containing an LLM

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–3 checks. | 4–5 checks. | 6–12 checks. | all 13 checks. |
| 2 | 0–4 checks. | 5–7 checks. | 8–12 checks. | all 13 checks. |
| 3 | 0–4 checks. | 5–7 checks. | 8–12 checks. | all 13 checks. |

## 6. Code review quality

A substantive review is completed **before merge by someone other than the author**, with technical evidence: a question, concern, suggestion, requested change, or approval comment identifying a specific aspect checked. Relevant aspects include correctness, tests, security, error handling, architecture, and maintainability. A specific approval can count even when no change is needed.

Generic “LGTM”/“looks good”/“approved,” spelling/formatting-only comments, and bot comments do not count. Requested technical changes must be addressed or technically justified before merge.

**Substantive-review rate** = merged feature/fix PRs with a substantive pre-merge review ÷ all merged feature/fix PRs.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | <15%. | 15–34%. | 35–79%. | ≥80%. |
| 2 | <20%. | 20–39%. | 40–84%. | ≥85%. |
| 3 | <25%. | 25–49%. | 50–89%. | ≥90%. |

## 7. User story traceability, change tracking, and commit quality

Expected workflow: **Feature → Story/issue → PR → Commit(s) → Source change → Related test → Release**.

Assess these **13 checks**:

1. **Features:** GitHub feature labels identify features and are assigned to applicable stories.
2. **Story description:** short descriptive title and full “As [user], I want [goal], so that [reason/value]” statement.
3. **Estimation:** story points and ideal-time estimate for related work.
4. **Priority/risk:** record priority or value and risk.
5. **Planning information:** planned stories have the appropriate feature label. Iteration assignment is additionally required by the [course structure](PROJECT.md#repository-and-planning).
6. **Implementation evidence:** completed stories link PRs/commits and applicable diagrams, design decisions, or technical-discussion summaries.
7. **Tests/signoff:** completed stories link relevant unit/integration/other automated tests and record customer signoff directly or through agreed labels/status.
8. **Story-to-code:** merged feature/fix PRs reference the story/issue and contain source changes implementing it.
9. **Test traceability:** feature/fix PRs add, modify, or reference relevant tests.
10. **Commit messages:** describe the actual change and affected functionality/component with clear action-oriented wording.
11. **Tracked-work links:** commits reference the issue number (for example `Working on #87`/`Fix #87`), or the containing PR provides equivalent traceability.
12. **Release tags/notes:** tag submitted versions and reference the tag in [release notes](RELEASES.md#iteration-and-release-notes).
13. **Personal contributions:** every student supplies an evidence-backed release contribution description per the same release-note requirements; missing information or insufficient evidence earns zero for that student's release contribution.

A story is properly tracked only with all required information. The rubric imposes no specific commit-message syntax; merge commits and automated dependency updates are excluded from message-quality assessment. Identify joint substantial contributions in history, PRs, or issues.

**Do not squash.** Use merge commits to preserve individual commits/authors for contribution analysis, traceability, and commit-quality assessment.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–3 checks. | 4–7 checks. | 8–11 checks. | 12–13 checks. |
| 2 | 0–4 checks. | 5–8 checks. | 9–11 checks. | 12–13 checks. |
| 3 | 0–4 checks. | 5–8 checks. | 9–12 checks. | all 13 checks. |

Cap: If the team does not use GitHub issues to track user stories, this category cannot score above Poor.

Cap: If the project does not preserve sufficient repository history to establish meaningful story-to-code and individual-contribution traceability, this category cannot score above Poor.

## 8. Responsible use of AI-generated code

### Declarations

Every applicable team-authored/modified source file needs a declaration **near its beginning**; every feature/fix PR needs one for introduced/substantially modified code and must identify substantially AI-assisted files. Use the same three levels:

| Level | Meaning |
| --- | --- |
| No substantial AI-generated code | No meaningful implementation generated by AI; minor autocomplete, token completions, and syntax suggestions do not count as substantial |
| Below 50% AI-generated | A meaningful portion, but less than half of the current implementation, originated from AI |
| 50% or more AI-generated | At least half of the current implementation originated from AI |

Make good-faith estimates for the current file or PR changes; student edits do not erase AI origin. Exclude generated files/migrations, vendored third-party code, dependencies, and other files not authored by the team. File/PR/project declarations must be reasonably consistent; teaching staff may compare them with history/code/docs and ask students questions to verify reporting.

### AI-use checklist

Maintain **AI_USAGE.md** or an equivalent clearly identified section. Assess these **seven applicable checks**:

1. List generative-AI coding tools, or explicitly state none were used.
2. Name **all** substantive features with substantial AI implementation assistance, using the [§1 feature definition](#1-feature-implementation-and-volume-of-work).
3. At least **90%** of applicable source files contain declarations.
4. At least **90%** of feature/fix PRs contain declarations.
5. For at least **50%** of the features named in check 2, describe AI's contribution in **at most two paragraphs per feature** and link relevant PRs.
6. Each documented example has verification evidence, such as an automated test or substantive-review comment.
7. Document problems in generated code, corrections, and rejected suggestions when they occurred.

Without GenAI, checks requiring AI-assisted features/examples are N/A; source-file and PR declarations are still required.

### Release grading

All releases: Poor: 0–1 applicable checks satisfied. OK: 2–3 applicable checks satisfied. Expected: 4–6 applicable checks satisfied. Exceptional: all applicable checks satisfied.

Cap: If fewer than 50% of applicable source files contain the required AI-contribution declaration, this category cannot score above Poor.

## 9. Automated code-quality controls, dependencies, containerization, and deployment

Assess these **18 applicable checks**:

### Automated quality controls

1. Linter/static-analysis configuration.
2. Formatter/formatting configuration.
3. Automated tests in CI.
4. Lint/static analysis in CI.
5. Automated dependency/security scanning.
6. Automatic CI on PRs or relevant pushes.

### Dependencies

7. Standard dependency manifest.
8. Lock file/equivalent reproducibility mechanism where supported.
9. No clearly unused direct dependencies.
10. No unnecessary duplicate libraries with substantially the same functionality.
11. Required attribution for third-party/copied code.

### Containers

12. Dockerfile/equivalent where applicable.
13. `.dockerignore`/equivalent.
14. Docker Compose/equivalent for multi-service applications.
15. No hardcoded production secrets in container configuration.

Containers are expected for server-side/web/API/multi-service applications. They can be N/A for native mobile clients, browser extensions, embedded systems, or projects where they do not offer a meaningful runtime. For Rally, document managed external services or genuine exceptions in the deployment design.

### Deployment

16. Current wiki deployment diagram/equivalent locating major components, databases, services, and infrastructure.
17. Wiki deployment plan and release strategy explaining how deployment/releases work and appropriate stages (stakeholder, selected users, alpha, beta, production).
18. Each deployed release's GitHub Release/notes identifies **exact version/tag, destination/environment, deployment date, and outcome**.

A public production launch is not required. Deployment must suit the project/stakeholder; the [presentation requirements](RELEASES.md#deployment-and-feedback-by-release) still require a deployed R2 demo.

### Release grading

| Release | Poor | OK | Expected | Exceptional |
| --- | --- | --- | --- | --- |
| 1 | 0–4 checks. | 5–8 checks. | 9–17 checks. | all applicable checks. |
| 2 | 0–5 checks. | 6–9 checks. | 10–17 checks. | all applicable checks. |
| 3 | 0–7 checks. | 8–10 checks. | 11–17 checks. | all applicable checks. |
