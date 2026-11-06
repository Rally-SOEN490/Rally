# Tournaments

How organizers create, set up and publish a tournament (RALLY-48 #70, RALLY-49 #71, RALLY-68 #90, RALLY-51 #73). Status: proposed, for team review.

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

A published tournament is not shown in Search yet: search still uses mock data until #302. Its formats and levels ("Beach 4s", "Intermediate") also differ from the real ones, and #302 must reconcile them. Registration (#58) will use the registration dates.

## Permissions

- Every tournament route needs the `tournament:create` permission (organizer or admin). See [roles and permissions](roles-and-permissions.md).
- Only the organizer who created a tournament can see or change it through these routes. Another organizer gets "not found", so nobody learns that a draft exists.
- A demoted organizer loses access to their drafts, because the permission is checked on every request.

## Simultaneous changes

Every change to a draft runs in a transaction that first locks the tournament row (`SELECT … FOR UPDATE`). A publish and a division removal can't interleave, so a tournament is never published without a division. Publishing is a conditional update (`WHERE status = 'DRAFT'`), so two publishes at once publish once.

## API

| Request                                         | What it does                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /tournaments`                             | Creates a draft. Only `name` is required.                                                         |
| `GET /tournaments/mine`                         | The caller's tournaments, soonest first, undated last.                                            |
| `GET /tournaments/:id`                          | One of the caller's tournaments, with its divisions.                                              |
| `PATCH /tournaments/:id`                        | Changes setup fields of a draft. `null` clears a field.                                           |
| `POST /tournaments/:id/divisions`               | Adds a division to a draft.                                                                       |
| `PATCH /tournaments/:id/divisions/:divisionId`  | Changes a division of a draft.                                                                    |
| `DELETE /tournaments/:id/divisions/:divisionId` | Removes a division from a draft.                                                                  |
| `DELETE /tournaments/:id`                       | Deletes a draft and its divisions. A published tournament can't be deleted; cancelling it is #81. |
| `POST /tournaments/:id/publish`                 | Publishes a complete draft. Returns 400 listing what's missing.                                   |

Responses include `registeredTeams`, which is 0 until teams can register (#58).

## App

- **Events tab:** organizers and admins see the Organizer section: the Create tournament button, and their tournaments with a date tile, location and formats, "0 / N teams", and a Draft or Published badge. A draft reopens its setup; a published tournament has nothing to open until its overview page (#285). Players still see "Coming soon" until #91.
- **Leaving a step:** going back doesn't save. If the setup step has unsaved changes, or a division is still open in the editor, a pop-up asks before the screen closes, whichever way it is closed: the on-screen back arrow, Android's back button, or the iOS swipe back (the native stack blocks the swipe while the question is pending). This uses React Navigation's `usePreventRemove`. On the web, the browser's own back button and closing the tab are not covered. "Save draft" and "Create tournament" save first, so they leave without asking.
- **Deleting a draft:** a draft row on the Events page has a delete button, which asks before deleting the draft and its divisions.
- **Date and time fields:** the browser's own date and time inputs on the web, and `@react-native-community/datetimepicker` on phones. That native module requires rebuilding the development build once.

## Open points

- Deleting an organizer's account deletes their tournaments. Revisit once teams can register (#58).
- The overview page (#285), editing (#80) and Search (#302) are separate issues.
