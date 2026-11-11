# Teams

How a player creates a team and signs it up for a tournament (RALLY-36 #58). Status: proposed, for team review.

Joining an existing team (RALLY-38 #60), the team page (RALLY-46 #68) and the organizer's list of registered teams (RALLY-53 #75) build on this.

## Decisions

- **A team belongs to one tournament** (decision #180). It is created for that tournament and doesn't carry over to the next one, so a team's history never has to follow its players.
- **A team is in one division** of that tournament.
- **No player limit.** A team can have as many players as it wants. Only divisions have a limit: their maximum number of teams.
- **One team per player per tournament**, across all its divisions. A player can be on teams in different tournaments.
- **Anyone can sign up a team:** any logged-in Rally account, including the tournament's own organizer and admins.
- **Team names are unique in a tournament**, ignoring upper or lower case. Spaces around a name are removed and repeated spaces inside it become one, so "Spike Lee", " spike lee " and "SPIKE LEE" are the same name. The same name can be used in another tournament.
- **Unpaid at first.** Players pay the organizer outside Rally; marking a team as paid is RALLY-54 (#76).

## Module

Teams are their own module, `apps/api/src/modules/teams/`, with the same files as the others (routes, service, repository) plus `rules.ts` for the name rules. Its routes are registered under `/tournaments`, next to the tournament routes.

The two modules talk through small interfaces that `app.ts` passes in, never through each other's repositories:

- The teams module gets `lockForSignUp` from the tournaments module (`tournaments/sign-up-lookup.ts`). It locks a published tournament and says whether sign-ups are open and which divisions it has.
- The tournaments module gets `countByDivision` and `findTeamOf` from the teams module (`teams/lookup.ts`), for the team counts and the viewer's own team.

Whether sign-ups are open (`signUpsAt`) lives in `tournaments/rules.ts`, so the page and the sign-up use the same rule and the same server clock.

## Data

| Table          | What it holds                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `teams`        | Tournament, division, name, `name_key` (the name in lower case), `paid_at` (null means unpaid).                                                                                            |
| `team_members` | Team, tournament, user, `is_captain`, when they joined. The tournament is copied from the team so the database can enforce one team per player per tournament. The creator is the captain. |

The database enforces the rules itself, so a bug or two requests at once can't break them:

- `teams (tournament_id, name_key)` is unique: one name per tournament.
- `team_members (tournament_id, user_id)` is unique: one team per player per tournament.
- A team points at its division with `(division_id, tournament_id)`, so its division must belong to its tournament.
- A member points at its team with `(team_id, tournament_id)`, so the copied tournament must match the team's.
- A check keeps a stored name 1 to 40 characters with no spaces around it.

Deleting a division or tournament deletes its teams; only drafts can be deleted, and drafts never have teams. Deleting a player's account removes them from their teams, in the same transaction, and deletes any team left with no players, so it no longer takes a spot in its division or keeps its name. The users module calls the teams module's `leaveAllTeams` for this (`teams/lookup.ts`).

## Signing up

`POST /tournaments/:id/teams` with `{ divisionId, name }` creates the team with the caller as captain and returns `{ id, name, divisionId, divisionName, isCaptain }`.

Each sign-up runs in one transaction that first locks the tournament row (`SELECT … FOR UPDATE`), the same lock as the organizer's changes. Sign-ups for one tournament therefore run one at a time, so the checks can't go stale before the team is saved: two captains can't both take a division's last spot. Then, in this order:

| Check                                      | Answer                                                         |
| ------------------------------------------ | -------------------------------------------------------------- |
| No Rally account                           | 404 "No Rally account found."                                  |
| The tournament doesn't exist or is a draft | 404 "Tournament not found." (nobody learns a draft exists)     |
| Sign-ups haven't opened, or have closed    | 409, saying which                                              |
| The division isn't in this tournament      | 404 "Division not found."                                      |
| The caller is already on a team here       | 409 "You're already on a team in this tournament."             |
| The division is full                       | 409 "This division is full."                                   |
| Another team here has the name             | 409 "Another team in this tournament already has that name. …" |
| A blank, multi-line or 41+ character name  | 400                                                            |

The unique indexes back these checks up; if one is ever hit, the answer is 409, not a server error.

## What the tournaments module sends

- Every `registeredTeams` (Search, the page, the organizer's Events list) now counts real teams, in one query per request.
- The page sends `myTeam`: the team the caller is on in that tournament, with its division name and whether they are its captain, or `null`.

## App

Following the Nov 2 "Player sign-up" mock-ups (C1, A2):

- **Sign up** on the tournament page opens the **Create a team** sheet: the divisions with their spots left (full ones greyed out and not selectable; the only division with room is picked already), the team name, and a note that the player will be captain and can be on only one team.
- **Continue** shows **Check your team**: the name, division and price, with "Pay $240 to the organizer outside Rally." for a paid division. **Create team and sign up** sends it.
- Once the server confirms, the sheet closes and the bottom bar says "You're captain of Spike Lee" over the division, in place of Sign up. It stays after sign-ups close. The page is then fetched again for the server's team counts, rather than adding one to counts that may be out of date; if that fails, the old counts stay.
- If the server refuses (name taken, division just filled…), its message shows above the button and nothing typed is lost; Back returns to the details. A refusal with 409 also fetches the page again, so a division that filled up meanwhile shows as full and can't be sent again. Only the latest refresh is applied.
- The organizer sees Sign up on their own published tournament too, above their extras.

**Differences from the mock-ups:** there is no "Sign up" choice sheet (S1) yet, because its other choice, "Join a team", is RALLY-38. The "Open to join requests" switch, the live "Available in this tournament" name check and the "View my team" button wait for RALLY-38 and RALLY-46; the server checks the name when the team is created. Hoang Vu asked for the review step on Nov 9.

## Open points

- **The organizer deleting their account** still deletes their tournaments, now with every team signed up in them. This needs a decision before Release 1 (see the note in `tournaments.md`).
- **The captain deleting their account** deletes the team for now, because teams have only their captain until RALLY-38. Once teams have other players, the team stays without a captain, and RALLY-38 must decide who takes over. Once teams have results, deleting an empty team would erase match history, so this must change then (see the "Deleted player" note in `users/service.ts`).
- Name-only teammates (RALLY-62 #84) will need `team_members.user_id` to become optional.
