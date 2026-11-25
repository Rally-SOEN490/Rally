# RALLY-257: Release 2 plan, Figma prompt and presentation

Working notes for the schedule spike ([#362](https://github.com/Rally-SOEN490/Rally/issues/362)). Decisions are in [docs/architecture/scheduling.md](../architecture/scheduling.md) and the mockups in [docs/mockups/schedule.html](../mockups/schedule.html). None of the story changes below are posted to GitHub yet.

## Release 2 plan

| Iteration (due) | Story                                                        | Points | Change proposed                                                                                                                      |
| --------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 6 (Dec 15)      | **New:** Set the playing hours of each tournament day        | 2      | Create it. The scheduler needs each day's hours, and nothing covers them (#114 was closed when courts moved to tournament creation). |
| 7 (Jan 17)      | #105 RALLY-83 Generate a suggested schedule                  | 5      | Fill in the task plan; risk lowered (algorithm decided)                                                                              |
| 7 (Jan 17)      | #107 RALLY-85 Assign team reffing automatically              | 3      | **Move from Release 3 into Iteration 7.** Hoang Vu confirmed it's wanted; the prototype already does it.                             |
| 7 (Jan 17)      | #292 RALLY-216 Edit the schedule                             | 3      | Add swap, referee and lock; fill in the task plan                                                                                    |
| 7 (Jan 17)      | #293 RALLY-217 Publish the schedule                          | 3      | Add "errors block publishing"; fill in the task plan                                                                                 |
| 8 (Feb 5)       | #112 RALLY-90 See a tournament's schedule, pools and bracket | 3      | Add the Schedule tab tasks (shared with #361 and #363)                                                                               |
| 8 (Feb 5)       | #113 RALLY-91 See my team's next match                       | —      | Add the "Your next match" card and referee duty tasks                                                                                |

Optional, if there's room in Iteration 7: #106 RALLY-84 Respect a minimum rest time (2), from Release 3. The prototype already supports it.

Not this spike's stories, but the schedule depends on them:

- **Match length per stage** (pools 55', playoffs 60'): needed before #105. It belongs to match formats (#92) or the pools and playoffs setup (#361). See [match-format-research.md](match-format-research.md).
- **Pools, matchups and the bracket:** #361.
- **Notification when the schedule is published:** #297 (notifications, #343).

---

### New story: Set the playing hours of each tournament day (Iteration 6)

**User story**
As an organizer, I want to set the playing hours of each day of my tournament, so that the schedule only uses the times the courts are available.

**Acceptance criteria**

- [ ] The organizer can add one or more days, each with a start and end time (e.g. Sat 9:00–20:00, Sun 9:00–14:00).
- [ ] The days are inside the tournament's start and end dates, and don't overlap.
- [ ] The end time is after the start time.
- [ ] By default, one day matches the tournament's start and end.
- [ ] PO approval

**Risk**
Low. Times are stored in UTC and shown in Montreal time, like the tournament dates. Check: tests for overlapping days and days outside the tournament.

**Task plan**

- [ ] Add the `TournamentDay` table (migration; docs/architecture/scheduling.md §5)
- [ ] API: add, change and remove days; only the tournament's organizer
- [ ] Days and hours in the Schedule tab
- [ ] Translations, loading and error states

**Related references**
Spike #362. Replaces the playing-times part of #114.

---

### #105 RALLY-83: Generate a suggested schedule (Iteration 7)

**User story**
As an organizer, I want the app to suggest a schedule once teams have signed up, so that I don't build it by hand.

**Acceptance criteria**

- [ ] Scheduling is available once registration is full; it isn't part of creating the tournament.
- [ ] The schedule uses the tournament's days and hours, its number of courts and the match length of each stage.
- [ ] Nothing is scheduled outside a day's hours; a day that is full continues on the next day.
- [ ] All divisions share the tournament's courts.
- [ ] No team plays two matches at the same time, and no court holds two matches at once.
- [ ] Pool matches come before playoff matches, and a playoff match comes after the matches that feed it.
- [ ] Before generating, the organizer sees whether everything fits and roughly when the last match ends.
- [ ] If everything doesn't fit, the organizer is told which matches don't fit and what they could change.
- [ ] The same teams and settings always give the same schedule.
- [ ] PO approval

**Risk**
Medium (was High). The algorithm is decided: greedy slotting (docs/architecture/scheduling.md §3). Remaining risk: real tournaments with uneven pools or several divisions. Check: tests for 12 teams on 3 courts, two days, two divisions sharing courts, a day that's too short and odd pool sizes.

**Task plan**

- [ ] Add the `Schedule` and `ScheduleSlot` tables (migration)
- [ ] Move `generate.ts` and `check.ts` from the spike, with their tests
- [ ] Read the matches from #361's tables and save the result as the draft schedule
- [ ] API: generate the draft schedule; only the tournament's organizer
- [ ] Setup screen with the estimate and the Generate button
- [ ] Show what doesn't fit and the ways to fix it

**Related references**
Spike #362. Depends on #361 and the new days story.

---

### #107 RALLY-85: Assign team reffing automatically (move to Iteration 7)

**User story**
As an organizer, I want to turn team reffing on and have ref duty assigned automatically, so that every match has a ref.

**Acceptance criteria**

- [ ] The organizer picks "Teams that aren't playing" or "We have our own referees" for the tournament.
- [ ] With team reffing, each pool match gets a team of the same division that isn't playing or refereeing at that time.
- [ ] Ref duty is spread evenly: no team referees more than one match more than another.
- [ ] Refereeing never delays a match. If no team is free, the match has no referee and the organizer sees it.
- [ ] Playoff matches get their referee from the organizer once the teams are known.
- [ ] Teams see their ref duty in the schedule.
- [ ] PO approval

**Risk**
Medium. With few free teams (e.g. 8 teams on 3 courts) some matches can't have a team referee. Check: tests for 5 teams on 2 courts and 8 teams on 3 courts, and that no team plays and referees at once.

**Task plan**

- [ ] `refereeMode` on the schedule and `refereeTeamId` on each slot (in #105's migration)
- [ ] Referee pass after the matches are placed (already in the spike's `generate.ts`)
- [ ] Referee option in the setup screen
- [ ] "No referee · add" in the editor and the referee picker

**Related references**
Spike #362. Hoang Vu asked for it on 2026-11-25.

---

### #292 RALLY-216: Edit the schedule (Iteration 7)

**User story**
As an organizer, I want to edit the suggested schedule, so that I can fix anything I don't like.

**Acceptance criteria**

- [ ] The organizer can move a match to another time or court, swap two matches, change a referee, or remove a match from the grid and place it again.
- [ ] The organizer can lock a match, so generating again keeps it where it is.
- [ ] The app shows conflicts right away: a team playing twice at once, a team playing and refereeing at once, a court already used, a time outside the day's hours, or a playoff before the matches it waits for. Too little rest is a warning.
- [ ] Changes are saved as a draft until published.
- [ ] A match with a confirmed score can't be moved.
- [ ] PO approval

**Risk**
Medium. Edits can create conflicts and change times that players have already seen. Check: conflict tests for each rule, and the server re-checks every change.

**Task plan**

- [ ] API: move, swap, remove, place, change the referee and lock a slot, returning the schedule's problems
- [ ] Generate again around the locked matches (extends `generate.ts`)
- [ ] Web: the grid with the tools and the problems panel
- [ ] Phone: the list with the edit sheet

**Related references**
Spike #362. Drag and drop options from #361.

---

### #293 RALLY-217: Publish the schedule (Iteration 7)

**User story**
As an organizer, I want to publish the schedule, so that players can see when and where they play.

**Acceptance criteria**

- [ ] Publishing makes the schedule visible to players.
- [ ] A schedule with errors can't be published; warnings are shown before publishing.
- [ ] Publishing again after changes replaces the previous version.
- [ ] Publishing triggers the schedule notification (#297).
- [ ] PO approval

**Risk**
Low. Publishing a schedule with conflicts would expose errors. Check: the server checks for conflicts before publishing, and tests show players see only the published version.

**Task plan**

- [ ] API: publish copies the draft into the published schedule in one transaction and adds one to its version
- [ ] Block publishing on errors on the server too
- [ ] Publish screen
- [ ] Hook into the notification from #297

**Related references**
Spike #362.

---

### #112 RALLY-90 and #113 RALLY-91: the player's Schedule tab (Iteration 8)

Tasks to add to #112:

- [ ] API: the published schedule of a tournament, by day and division; never the draft
- [ ] Player Schedule tab next to Results and the match tabs, matches grouped by time slot with court and referee
- [ ] My team filter with matches and ref duties
- [ ] Empty state before publishing, loading and reconnecting states
- [ ] Test that a draft is never visible

Tasks to add to #113:

- [ ] "Your next match" card: time, court, opponent and referee
- [ ] Show the team's next ref duty too
- [ ] Updates when a new version of the schedule is published

---

## Figma

The mockups are one static HTML page made for Figma: [docs/mockups/schedule.html](../mockups/schedule.html). It has no tabs or scripts, uses flexbox only and puts every frame on the canvas, so an HTML-to-design plugin imports each frame as editable layers with auto layout.

1. In Figma, run the **html.to.design** plugin (or another HTML import plugin).
2. Import the file, or a URL where it's hosted. Use a viewport at least 1560 px wide so the web editor fits.
3. Move the frames next to the Pools and Playoffs frames of Game set up, then swap the text and colour styles for the file's own.

Frames: Schedule · Before generating, Generated · Saturday and Generated · Sunday (the mobile court × time grid), the other views (by time, bracket, by team), Edit a match and Publish (phone), and the same grid on a computer. The schedule's inputs (dates, courts, pools, formats, bracket) come from the tournament and the Pools and Playoffs tabs, so the Schedule tab only adds the referee option and the daily limit.

## Presentation outline (about 5 minutes)

1. **Where it fits (30 s).** Scheduling is the last setup step: registration is full, and the courts, days, match lengths, pools and bracket are set. The organizer presses Generate, edits and publishes.
2. **What it looks like (1.5 min).** The mockups: the player's Schedule tab next to Results (next match, time slots, court and referee), the organizer's setup with the estimate, the web grid with the tools, and publishing.
3. **How it's built (1.5 min).** Greedy slotting vs a constraint solver, and why greedy (our TypeScript stack, deterministic, says what doesn't fit). Referees are picked after the matches, so they never delay one. Days: courts close at night and continue the next day.
4. **Demo (1 min).** Run the tests. 12 teams, 3 courts: with 45' pools everything fits by 19:30; with 55' the final doesn't fit Saturday and moves to Sunday 9:00. Every team referees 2 or 3 times.
5. **Plan and questions (30 s).** The Release 2 table above, the new days story, moving #107 into Release 2, and who owns match lengths. Questions for Chau in scheduling.md §6.

Demo commands. The scheduling tests don't use the database, but the repo's Vitest setup migrates the test database before any test, so PostgreSQL must be running:

```bash
docker compose up -d postgres              # from the repo root
cd apps/api && npx vitest run test/scheduling.test.ts
```

## AI-use acknowledgment

Claude (Claude Code) drafted the story text, the Figma prompt and the outline. Vincent reviews them before anything is posted.
