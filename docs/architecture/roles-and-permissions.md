# Roles and permissions

Decision for RALLY-161 (#183). Status: proposed, for team review.

## Account roles

Every account has exactly one account role, stored in `users.role`.

| Role        | Who                                               | May do                                                        |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------- |
| `PLAYER`    | Everyone who signs up. This is the default.       | Everything a logged-in account can do. No extra permissions.  |
| `ORGANIZER` | A player whose organizer application was approved | Everything a player can, and create tournaments               |
| `ADMIN`     | Rally's own team                                  | Everything an organizer can. The admin dashboard comes later. |

| Permission          | `PLAYER` | `ORGANIZER` | `ADMIN` |
| ------------------- | -------- | ----------- | ------- |
| `tournament:create` | No       | Yes         | Yes     |

An organizer only manages the tournaments they created. That check compares the tournament's organizer with the caller, so it will live with tournaments, not in this table.

### How someone gets a role

- **Player:** automatically, at sign-up. Sign-up ignores any role sent with it.
- **Organizer:** by applying in the app. The application flow is a separate issue; these decisions were made for it:
  - The application asks for a short description of the events the person runs, plus an optional link to past events or a community page.
  - Rally emails the application to a list of reviewer addresses, set in the `ORGANIZER_REVIEWER_EMAILS` environment variable.
  - The email links to a page with Approve and Deny buttons. Anyone holding the link may decide, and the first decision wins. The person who opens it doesn't log in.
  - Deny takes an optional reason, which the player sees in the app.
  - Links expire after 14 days. The application is then marked expired.
  - A denied or expired applicant may apply again. Only one application per person may be pending at a time.
  - The applicant gets no email about the decision for now; the app shows the result.
  - This replaces the admin review list described in #157, and the acceptance criteria of #157 and #162 need updating to match.
- **Admin:** set directly in the database. See "Giving an account a role" in the [API README](../../apps/api/README.md#giving-an-account-a-role).

No API endpoint changes a role. `PATCH /users/me` rejects a request that sends `role`.

## Roles that belong to a team or tournament

These are not account roles. A person can hold them in one place and not in another, so they are never stored on `users`.

- **Captain:** the player who created a team in a tournament. Teams don't last across tournaments (decision for #180), so captaincy belongs to that one team in that one tournament. Captain checks will take the team, and will be added with teams (#58).
- **Staff:** not part of this decision. Event staff (#79) is still a planned story and will define its own role when it is built.

## Where permissions are checked

- `apps/api/src/permissions.ts` lists the roles, the permissions and `can(role, permission)`. It is plain TypeScript with no Fastify, Prisma or Firebase, so tournament code and tests can use it directly. It is the only place that maps roles to permissions.
- `apps/api/src/authorization.ts` provides `requirePermission(findRole, permission)`, a Fastify hook that runs after `requireUser`. It reads the caller's role from the database on every request, so a promotion or demotion applies on the next request. It answers 403 when the role lacks the permission, or when the person has no Rally account.
- `findRole` comes from the users repository (`findRoleByFirebaseUid`). Other modules receive it as a function and never read the `users` table themselves.
- `GET /users/me` returns `role` to its owner, so the app can show or hide organizer tools. The player directory doesn't include it. Hiding a button in the app is never the security check.

To add a permission, add it to `permissions` and to each role that may use it in `permissions.ts`, then update the table in `apps/api/test/permissions.test.ts` and in this document.

## Naming

A tournament contains divisions. A division is one competition within it, such as "Men's A" or "Coed B". This matches the Figma mock-ups and the issues (#70, #71). It replaces "an Event contains Tournaments" in the earlier rules, which `AGENTS.md` now also uses.
