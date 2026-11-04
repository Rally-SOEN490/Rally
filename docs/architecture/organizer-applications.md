# Organizer applications

How a player becomes an organizer (RALLY-140 #162, RALLY-135 #157). Implemented with the roles in [roles and permissions](roles-and-permissions.md). Status: proposed, for team review.

This replaces the admin review list described in #157. The acceptance criteria of #157 and #162 need updating to match.

## The flow

1. **The player applies.** In Settings, "Become an organizer" opens a sheet that asks what they organize (required, up to 1,000 characters) and for an optional link to past events or a community page. Organizers and admins can't apply.
2. **Reviewers are emailed.** Each address in `ORGANIZER_REVIEWER_EMAILS` gets the same email: the applicant's name, what they organize, the link, and a review link. No one is emailed when the list is empty.
3. **A reviewer decides.** The review link opens a web page with Approve and Deny. Both ask for confirmation. Deny takes an optional reason (up to 500 characters). The reviewer doesn't log in: holding the link is the permission.
4. **The first decision wins.** Anyone who opens the link afterwards sees the result and can't change it.
5. **Approving makes the player an organizer**, in the same transaction as the decision. An admin who applied stays an admin.
6. **The player sees the answer in Settings.** There is no email to the applicant for now. After an approval, closing the sheet reloads their account, so organizer tools appear without restarting the app.

Applications expire 14 days after they are sent. An expired application can't be decided, and the player sees it as expired. A denied or expired player may apply again at once, starting from their previous text. Only one application per person can be pending at a time.

## Decisions and why

| Decision                                                                                               | Why                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewer emails come from the `ORGANIZER_REVIEWER_EMAILS` environment variable, not a file in the code | The repository is public, and committed emails would be published. Each developer sets only their own address locally, so testing doesn't email the whole team. The production list lives in the server's settings.                                                         |
| The review link carries the permission, with no login                                                  | The admin dashboard doesn't exist yet. The trade-off is that anyone who receives a forwarded email can decide, so the email asks reviewers not to forward it.                                                                                                               |
| The token is 32 random bytes; the applications table stores only its SHA-256 hash                      | A copy of the applications table can't be used to approve anyone. The full link is also in the queued email until it is sent or given up on (usually seconds; about two hours of retries at most while the API runs, longer if it is down), then the email body is cleared. |
| The token goes after `#` in the link, and the page sends it in a request body                          | Browsers never send the part after `#` to a server, and the API doesn't log request bodies, so the token stays out of server logs.                                                                                                                                          |
| "One pending application per person" is a unique `pending_user_id` column, set only while pending      | PostgreSQL enforces it even when two requests arrive at once. Two check constraints keep the column consistent with the status.                                                                                                                                             |
| A decision is a conditional update (`WHERE status = 'PENDING' AND expires_at > now`)                   | Of two simultaneous decisions, PostgreSQL makes the second wait, then finds nothing to update, so the first wins.                                                                                                                                                           |
| Expiry is applied when an application is read or a new one is sent                                     | No scheduled job is needed.                                                                                                                                                                                                                                                 |

## Email delivery (outbox)

`AGENTS.md` asks to store follow-up work durably before delivering it, and to make no external calls inside a database transaction. Emails therefore go through the `email_outbox` table:

1. The application and its emails are saved in **one transaction**. If either fails, neither is saved.
2. After the transaction, the API tries to send right away. A timer also checks every 30 seconds, which retries failures and sends anything left over from a restart.
3. A sender **claims** due emails with `FOR UPDATE SKIP LOCKED`, so several API instances never send the same email.
4. Emails go through **Resend's HTTP API**. The outbox ID is Resend's `Idempotency-Key`, so a retry after a lost response doesn't send twice.
5. A failed attempt is retried after 1, 2, 4… minutes, at most an hour apart. After 8 attempts the email is marked failed.
6. Once an email is sent or given up on, its **body is cleared**, so review links don't stay in the database.

**Resend** is already part of the stack (`AGENTS.md`). It is called with `fetch`, so there's no new dependency. Without `RESEND_API_KEY`, emails are printed in the API log instead. A printed review link is enough to approve someone, so this is for local development only: with `NODE_ENV=production`, the API refuses to start without a key. Hosted servers must set `NODE_ENV=production`. Real sending needs a Resend key and an `EMAIL_FROM` address on a verified domain. Without `EMAIL_FROM`, Resend's test sender only delivers to the Resend account's own address.

## API

| Request                                        | Who                   | What it does                                                                                                                                         |
| ---------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /organizer-applications`                 | Logged-in player      | Sends an application. Returns 409 if one is already pending, or if the person is already an organizer.                                               |
| `GET /organizer-applications/me`               | Logged in             | Returns `{ application }`, the person's latest application or `null`.                                                                                |
| `POST /organizer-applications/review`          | Anyone with the token | Body `{ token }`. Shows the application and the applicant's display name.                                                                            |
| `POST /organizer-applications/review/decision` | Anyone with the token | Body `{ token, decision: "approve" or "deny", reason? }`. Returns 409 if someone already decided, 410 if the link expired, 404 for an unknown token. |

## Open points

- **Deleted accounts:** deleting an account deletes its applications. An email already queued for an application still goes out, and its link then answers "not valid".
- **Forwarded links:** anyone with a forwarded link can decide. Requiring an admin login on the review page would close this once admins have a way to log in to a dashboard.
