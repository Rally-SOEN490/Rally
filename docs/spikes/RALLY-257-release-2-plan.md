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
- [ ] Days card in the Schedule setup (mockup F5.2)
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
- [ ] Setup screen with the estimate and the Generate button (mockups F5.2, F5.2b)
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
- [ ] Referee option in the setup screen (mockup F5.2)
- [ ] "No referee · add" in the editor and the referee picker (mockups F5.3, F5.4)

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
- [ ] Web: the grid with the tools and the problems panel (mockup F5.3)
- [ ] Phone: the list with the edit sheet (mockup F5.4)

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
- [ ] Publish screen (mockup F5.5)
- [ ] Hook into the notification from #297

**Related references**
Spike #362.

---

### #112 RALLY-90 and #113 RALLY-91: the player's Schedule tab (Iteration 8)

Tasks to add to #112:

- [ ] API: the published schedule of a tournament, by day and division; never the draft
- [ ] Schedule tab next to Results and the match tabs, matches grouped by time slot with court and referee (mockup F5.1)
- [ ] My team filter with matches and ref duties (mockup F5.1b)
- [ ] Empty state before publishing (mockup F5.1c), loading and reconnecting states
- [ ] Test that a draft is never visible

Tasks to add to #113:

- [ ] "Your next match" card: time, court, opponent and referee (mockup F5.1)
- [ ] Show the team's next ref duty too
- [ ] Updates when a new version of the schedule is published

---

## Figma prompt

Paste this into Figma Make (or Figma AI) in the team's file, next to the scoreboard frames (F5.2 to F5.4). The HTML mockups (docs/mockups/schedule.html) show the same screens; screenshot them as references.

> Add a **Schedule** feature to "Rally", a volleyball tournament app for Montreal. Match the existing "Tournament scoreboard" frames exactly:
>
> - **Style:** off-white page (#F2F2EE), white rounded cards (radius 16, no border), a dark green header (#2D4A3A) with rounded bottom corners and a faint volleyball line drawing in the top right, a small uppercase lime eyebrow label (#D4E86A), a bold white title ("Verdun Winter Cup") and a light subtitle ("Sat Nov 15 · Verdun Auditorium"). Pill tabs under the header: the selected tab is dark green with white text, the others grey text. A white dropdown "6v6 · Co-ed B". Rounded geometric sans-serif (like Figtree), sentence case. Score boxes and value fields are light grey rounded rectangles.
> - **Phone frames:** iPhone (393×852) with the status bar at 9:41.
>
> Screens:
>
> 1. **F5.1 Tournament · Schedule (player).** Tabs: "Schedule" (selected, with a small lime "New" badge), "Results", "Match 1", "Match 2". A dark green "Your next match" card: lime eyebrow "Your next match" with "in 14 min" on the right, "9:55 · Court 1" in large bold white, and "Net Ninjas vs Ace Makers · Ref: Quad Squad". An "All matches / My team" segmented control. Then time slots as section headings ("9:00", right side "Match 1 · now"), each with court cards like the scoreboard: "COURT 1" label, the two team names stacked, and a footer row "Referee — Ace Makers". The player's own matches have a dark green outline and a tag "You play" (dark green) or "You referee" (lime).
> 2. **F5.1b Schedule · My team.** The same header and tabs, "My team" selected. A list for the day: each row has the time in bold, "vs Ace Makers" with "Court 1 · Ref: Quad Squad" below, and a "Play" or "Ref" tag. Heading "Saturday" with "7 matches · 3 referee duties".
> 3. **F5.1c Schedule · Not published yet.** An empty state with a calendar icon in a pale green circle: "The schedule isn't out yet" and "The organizer publishes it after registration closes. You'll get a notification when it's ready."
> 4. **F5.2 Organizer · Build the schedule.** Header eyebrow "Organizer · Schedule", subtitle "8 of 8 teams registered · Registration closed". Cards: "Days" (Sat Nov 15 9:00 – 20:00, Sun Nov 16 9:00 – 14:00, "+ Add a day"), "Courts" with a − 3 + stepper, "Match length" (Pool play 55', Quarterfinals 60', Semifinals 60', Final 60'), "Referees" with two radio options ("Teams that aren't playing — Rally picks a free team and spreads the duty evenly" selected, "We have our own referees"), "Minimum rest between matches 0 min". A pale green estimate card: "All 35 matches fit. Pools end Saturday around 18:10, and the final ends Sunday around 12:00." A full-width dark green "Generate schedule" button.
> 5. **F5.2b Organizer · Something doesn't fit.** A pale red notice "1 match doesn't fit: the final would end at 21:10, after 21:00." A card "Ways to fix it" with rows and a green "Try" link: "Shorten pool play to 45'", "Add a court (4)", "Add Sunday Nov 16", and "Place the final by hand" with "Edit". A pale green note "The other 36 matches are on the grid. Every pool match has a referee." An outlined button "See the schedule".
> 6. **F5.3 Organizer · Edit and publish (web, 1440×900).** The green header full width with tabs Overview, Teams, Pools & playoffs, Schedule (selected, page-coloured), Results, and a "Draft · players can't see it" tag. A toolbar: segmented tools Move (selected), Swap, Referee, Lock, Remove; on the right "Generate again", "Save draft", a "Published" checkbox and a disabled "Publish" button. Three columns: (a) a left panel with the division's stages and match lengths (Pool play 55', Pool 1, Playoffs, 1/4 Final 60', 1/2 Final 60', Final 60') and "Not on the grid: All matches placed ✓"; (b) a grid titled "Saturday, Nov 15" with day pills (Sat, + Day), columns Court 1–3 and rows 9:00, 9:55, 10:50, 11:45, 12:40; each cell is a light grey rounded card with the match in bold ("Block Party – Side Out") and "Ref · Ace Makers" below, or "No referee · add" in amber; one cell is selected with a green outline, two cells have a red outline and pale red fill (a conflict), and one shows a lock icon; (c) a right "Problems" panel with a red card "Net Ninjas plays two matches at 9:55 (Court 1 and Court 3). Publishing is blocked." and an amber card "9 matches have no referee", then "Selected" details and an "Undo swap" button.
> 7. **F5.4 Organizer · Edit a match (phone).** The schedule list dimmed behind a white bottom sheet: "Quad Squad vs Bump Club", "Pool play · 55'", rows Time 9:55, Court "Court 3", Referee "None ⌄", a pale red notice "Court 3 already has Side Out vs Set Theory at 9:55, and Quad Squad referees Court 1 then. Swap with that match or pick another time.", and buttons Swap, Lock and "Move anyway".
> 8. **F5.5 Organizer · Publish (phone).** Tabs Sat, Problems · 0, Publish (selected). A pale green notice "No problems. 28 matches on 3 courts, 9:00 – 18:10.", an amber notice "9 matches have no referee. Players will see 'Organizer's referee'.", a card "When you publish" with three checked rows (players see the schedule, every team gets a notification, publishing again replaces this version), and a "Publish schedule" button.

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
