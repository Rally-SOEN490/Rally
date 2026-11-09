# Tournaments

How organizers create, set up and publish a tournament (RALLY-48 #70, RALLY-49 #71, RALLY-68 #90, RALLY-51 #73), how players find it in Search (RALLY-226 #302), and its page (RALLY-225 #301, RALLY-209 #285). Status: proposed, for team review.

## Model

A **tournament** contains **divisions**. A division is one competition within it, such as "6v6 Co-ed B".

| Tournament field           | Notes                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Name                       | Required, even for a draft. Up to 100 characters.                                                                               |
| Location                   | Free text, up to 200 characters. A list of Montreal areas comes with #192.                                                      |
| Courts                     | 1 to 50.                                                                                                                        |
| Starts, ends               | Date and time, in Montreal time.                                                                                                |
| Registration opens, closes | Date and time, in Montreal time.                                                                                                |
| Description                | Plain text, up to 5,000 characters, kept exactly as typed: line breaks, indentation and emojis. Bold, lists and links are #286. |
| Status                     | `DRAFT` or `PUBLISHED`.                                                                                                         |

| Division field | Notes                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Name           | Suggested from the format, type and levels ("6v6 Co-ed B / B+") and editable. Unique within the tournament. |
| Format         | 2v2, 3v3, 4v4, 6v6 or 9v9.                                                                                  |
| Type           | Co-ed, men or women.                                                                                        |
| Levels         | One or more of C-, C, C+, B, B+, A, Open, Elite. A division can span levels, like "B / B+".                 |
| Max teams      | 2 to 64.                                                                                                    |
| Price          | Per team, stored in cents. For display only: players pay the organizer outside Rally.                       |

Formats, types and levels are PostgreSQL enums, so adding one is a migration (#71). Check constraints keep courts, max teams and price in range, require at least one level and no blank ones, and require a published tournament to have every field filled in.

## Time zone

Rally is for Montreal, so all tournament times are Montreal times: 9:00 means 9:00 in Montreal, whatever the viewer's phone says.

- The API reads and writes times as `"YYYY-MM-DDTHH:mm"` in Montreal. The database stores the exact moment (`timestamptz`).
- The server converts them (`modules/tournaments/montreal-time.ts`), handling daylight saving time. It rejects a time skipped when clocks spring forward (2:30 on the second Sunday of March), and takes the first of the two 1:30s when clocks fall back.
- The app never converts these times; it only displays them.

## Drafts and publishing

1. **Setup** (step 1 of 2): name, location, courts, the four dates and the description. "Save draft" needs only a name. Dates that are filled in must be in order: the end after the start, registration opening before it closes, and registration opening and closing before or at the moment the tournament starts.
2. **Divisions** (step 2 of 2): add, edit and remove divisions. Each is saved on its own.
3. **Create tournament** publishes. It needs every setup field, valid dates, a start in the future, and at least one division. Only drafts can be changed for now; editing a published tournament is #80.

Once published, a tournament shows in Search until it ends (see [Search](#search)). Registration (#58) will use the registration dates.

## Search

Players find published tournaments in Search (#302).

- **Which:** published tournaments that haven't ended yet, including ones in progress. Drafts and ended tournaments are left out. Cancelling is #81; a cancelled tournament will need leaving out too.
- **What is sent:** name, location, the four dates (Montreal time), the organizer's display name, and each division's format, type, levels, max teams, price and registered teams. The organizer's account, the status, courts and description are not sent.
- **The card** combines the divisions: a tag for each format and type ("6v6 Co-ed"), the levels ("C / B+"), the price ("$240 per team", or "From $40 per team" when divisions differ, or "Free"), and the spots left across all divisions.
- **Filters:** date, format, type, level, price and spots. Format, type, level, price and spots describe a division, so one division has to match all of them: "6v6" and "Under $50" don't match a tournament whose 6v6 costs $240 and whose $40 division is a 2v2. The date filter compares the Montreal start date as written. Text search matches the name, location and organizer.
- **Refreshing:** the tabs keep Search loaded, so it reloads tournaments each time it comes back into view (`useFocusEffect`), like the Organizer section. A tournament published from Events then shows when the player returns. The results already on screen stay while the new ones load.
- **Opening a tournament:** the whole card is one button that opens the tournament's page, even when it is full. "Register" is only its label.

## Tournament page

One page at `/tournaments/:id` for everyone (#301), with extra parts for the tournament's organizer (#285). It follows the "Tournament · Player sign-up" mock-ups agreed with François on Nov 2.

- **Who sees it:** any logged-in account sees a published tournament, including one that has ended. A draft is only visible to its organizer; anyone else, admins included, gets "not found", so nobody learns that it exists.
- **What is sent:** the same fields as Search, plus the description. The organizer also gets what they set up (status, courts, publishing date). `isOrganizer` says which view it is.
- **Sign-ups:** the API sends `signUps`: `NOT_OPEN`, `OPEN` or `CLOSED`, worked out from the registration dates and the server's clock. The app never compares Montreal times with the phone's clock.
- **Layout:** the name and organizer; an info card with the date and hours, the location, when sign-ups open or close (and the other date), and, for a tournament with one division, that division and its price; the description exactly as typed; then the teams count (one division) or the Divisions list (several), where full divisions are greyed out.
- **The bar at the bottom:** "N spots left" and **Sign up** while sign-ups are open and a division has room. Otherwise it only says why: "Sign-ups open Oct 20", "Sign-ups closed Nov 12" or "Full". Signing up is RALLY-36 and RALLY-38, so for now Sign up says registration isn't available yet.
- **The organizer's extras:** each division's "10 / 15 teams" and the total, "Sign-ups open" in the bar instead of Sign up, a greyed-out "Registered teams" button until the list exists (RALLY-53), and "Continue setup" on a draft.
- **Not yet:** team lists ("See all", tapping a division), Share link, the "…" menu (editing #80, cancelling #81) and the Map button.
- **Setup screens** load through the same route, and refuse a tournament whose `isOrganizer` is false.

## Permissions

- `GET /tournaments` (Search) and `GET /tournaments/:id` (a tournament's page) only need a logged-in account: any player may see published tournaments. The service decides who sees a draft.
- Every other tournament route needs the `tournament:create` permission (organizer or admin). See [roles and permissions](roles-and-permissions.md). In `routes.ts` these routes sit in their own Fastify scope, so the permission hook only applies to them.
- Only the organizer who created a tournament can change it. Another organizer gets "not found", so nobody learns that a draft exists.
- A demoted organizer loses access to their drafts, because the permission is checked on every request. On a tournament's page they count as a player: their drafts answer "not found" and their published tournaments show the player's view.

## Simultaneous changes

Every change to a draft runs in a transaction that first locks the tournament row (`SELECT … FOR UPDATE`). A publish and a division removal can't interleave, so a tournament is never published without a division. Publishing is a conditional update (`WHERE status = 'DRAFT'`), so two publishes at once publish once.

## API

| Request                                         | What it does                                                                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `GET /tournaments`                              | Published tournaments that haven't ended, soonest first, for Search. Any logged-in account.                 |
| `POST /tournaments`                             | Creates a draft. Only `name` is required.                                                                   |
| `GET /tournaments/mine`                         | The caller's tournaments, soonest first, undated last.                                                      |
| `GET /tournaments/:id`                          | A tournament's page: any published one, or the caller's own draft. See [Tournament page](#tournament-page). |
| `PATCH /tournaments/:id`                        | Changes setup fields of a draft. `null` clears a field.                                                     |
| `POST /tournaments/:id/divisions`               | Adds a division to a draft.                                                                                 |
| `PATCH /tournaments/:id/divisions/:divisionId`  | Changes a division of a draft.                                                                              |
| `DELETE /tournaments/:id/divisions/:divisionId` | Removes a division from a draft.                                                                            |
| `DELETE /tournaments/:id`                       | Deletes a draft and its divisions. A published tournament can't be deleted; cancelling it is #81.           |
| `POST /tournaments/:id/publish`                 | Publishes a complete draft. Returns 400 listing what's missing.                                             |

Responses include `registeredTeams`, which is 0 until teams can register (#58).

## App

- **Events tab:** organizers and admins see the Organizer section: the Create tournament button, and their tournaments with a date tile, location and formats, "0 / N teams", and a Draft or Published badge. A draft reopens its setup; a published tournament opens its page. Players still see "Coming soon" until #91.
- **Leaving a step:** going back doesn't save. If the setup step has unsaved changes, or a division is still open in the editor, a pop-up asks before the screen closes, whichever way it is closed: the on-screen back arrow, Android's back button, or the iOS swipe back (the native stack blocks the swipe while the question is pending). This uses React Navigation's `usePreventRemove`. On the web, the browser's own back button and closing the tab are not covered. "Save draft" and "Create tournament" save first, so they leave without asking.
- **Deleting a draft:** a draft row on the Events page has a delete button, which asks before deleting the draft and its divisions.
- **Date and time fields:** the browser's own date and time inputs on the web, and `@react-native-community/datetimepicker` on phones. That native module requires rebuilding the development build once.

## Open points

- Deleting an organizer's account deletes their tournaments. Revisit once teams can register (#58).
- Editing (#80) and cancelling (#81) are separate issues.
- Search loads every published tournament that hasn't ended and filters them on the phone. That is fine for Release 1's numbers; past a few hundred, filtering and paging should move to the API (RALLY-232, #319).
