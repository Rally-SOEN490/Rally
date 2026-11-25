# Tournament schedule

Status: Proposed (spike RALLY-257, [#362](https://github.com/Rally-SOEN490/Rally/issues/362)). The team and Chau still have to agree on it.

This document records how Rally builds and shows a tournament's schedule: which match is played on which court, at what time, and who referees it.

Scheduling is the last step of setting up a tournament. When it starts, registration is full and everything else is already set: the days and hours, the number of courts, how long a match lasts in each stage, the teams, the pools and who plays whom, and the playoff bracket. Those come from the tournament setup and from the pools and playoffs spike ([#361](https://github.com/Rally-SOEN490/Rally/issues/361)), and this document doesn't decide them. Match-format research was moved out of this spike to [docs/spikes/match-format-research.md](../spikes/match-format-research.md).

Prototype code: `apps/api/src/modules/scheduling/` (pure TypeScript, no Fastify or Prisma), tested in `apps/api/test/scheduling.test.ts`.

## 1. The organizer's flow

1. Registration is full. In **Game set up**, after the Pools and Playoffs tabs, the organizer opens the **Schedule** tab.
2. They check the inputs: the start and end, each day's hours, the courts, the match slot of each pool and round (from its match format, plus the time between matches), the most matches a team plays in a day, the referee option and an optional minimum rest time. An estimate shows whether everything fits.
3. They press **Generate**. The app fills the grid and says what doesn't fit, if anything.
4. They change what they want: move or swap matches, change a referee, lock matches and generate again around them.
5. They **Save** (a draft that players can't see) and **Publish**. Players then see the schedule, and publishing again replaces it.

## 2. What the schedule looks like

The organizer sees a **grid for each day**: courts as columns and time slots as rows. Each cell is a match with its referee, e.g. `A1-A6 (B1)` means team A1 against team A6, refereed by team B1. Team names replace the codes in the app.

A side panel lists the division's stages and their match lengths (Pool A, Pool B, quarterfinals, semifinals, final). It also lists matches that are not on the grid yet, so the organizer can place them by hand.

Players see the **published** schedule in the tournament's tabs, next to Results and the match tabs of the tournament-day screens (#363):

- A day picker, and the matches grouped by time slot with their court, like the score screens.
- "Your next match" at the top, and the player's own matches and refereeing duties highlighted.
- A filter for the player's team.

Mockups: [docs/mockups/schedule.html](../mockups/schedule.html), one static page made to import into Figma with an HTML-to-design plugin.

## 3. How the schedule is built (Generate)

### Inputs

| Input                                                                            | Where it comes from                                                                                                                                           |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The days, each with its start and end time (e.g. Sat 8:00–21:00, Sun 9:00–18:00) | Tournament setup                                                                                                                                              |
| The number of courts                                                             | `Tournament.courts` (already exists)                                                                                                                          |
| The match slot of each pool and round                                            | Its match format (sets × time per set + changeovers + timeouts, from the Pools and Playoffs tabs) plus the time between matches, e.g. pools 50', playoffs 70' |
| The most matches a team plays in one day (e.g. 3)                                | The Schedule tab                                                                                                                                              |
| The pool matches and the playoff bracket                                         | #361                                                                                                                                                          |
| The referee option: teams that aren't playing, or dedicated referees             | A checkbox in the Schedule tab                                                                                                                                |
| The minimum rest time (optional)                                                 | The Schedule tab                                                                                                                                              |

### Rules

Errors (the schedule can't be published with them):

- No team plays two matches at once.
- No court holds two matches at once.
- Every match is inside one of the tournament's days. Nothing is scheduled at night.
- A division's pool matches end before its playoffs start, and a playoff match starts after the matches that feed it (a semifinal after its quarterfinals).
- A team never plays and referees at the same time, never referees its own match, and never referees two matches at once.

Warning (the organizer confirms):

- A team rests less than the minimum rest time.
- A team plays more matches in one day than the daily limit. Generate never does this; only a hand edit can. Playoff teams aren't known yet, so Generate assumes the worst: a team that played the most pool matches that day also plays every playoff round that day.

All divisions of a tournament share its courts, so the schedule is built for the whole tournament, not one division at a time.

### Referees

When the organizer picks **teams referee**, every match whose teams are known gets a referee:

- a team of the **same division** that **isn't playing or refereeing** at that time;
- the team with the **fewest duties so far**, so the duty is spread evenly.

The referees are picked **after** all the matches are placed, so refereeing never delays a match. If every team of the division is busy, the match has no referee and the organizer can add one. With 5 teams on 2 courts, the team sitting out referees one of the two matches.

Playoff matches get no referee at Generate, because their teams aren't known until the pools end. The organizer picks them later, usually from the eliminated teams.

When the organizer picks **dedicated referees**, the schedule assigns none.

### Options compared

|                         | A. Greedy slotting (chosen)                                                        | B. Constraint solver (OR-Tools CP-SAT, or integer programming with HiGHS/GLPK in WebAssembly)                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it works            | Fill the court that frees up first with the most urgent match that can start then. | Model every match × court × time slot as a variable with the rules as constraints; the solver searches for the best schedule.                                          |
| Quality                 | Good, not optimal. On the test case it finishes at 19:30.                          | Optimal for the stated goal (e.g. the earliest finish).                                                                                                                |
| Speed                   | Milliseconds for one tournament.                                                   | Seconds to minutes. 37 matches × 3 courts × 160 five-minute slots is about 18,000 variables.                                                                           |
| Stack                   | Plain TypeScript in the API.                                                       | CP-SAT has no maintained Node binding, so it would need a Python service, which AGENTS.md forbids without a review. WebAssembly solvers are large and harder to debug. |
| When it doesn't fit     | It says which matches don't fit.                                                   | It says only "infeasible", so we'd need extra work to explain why.                                                                                                     |
| Same input, same output | Yes, by construction.                                                              | Only with a fixed seed and the same solver version.                                                                                                                    |
| Editing afterwards      | The same rule checker validates edits.                                             | Needs a separate checker anyway.                                                                                                                                       |

**Decision: greedy slotting plus a rule checker.** It fits the stack, it's explainable to organizers, it's deterministic, and it covers Release 2. Revisit option B if real tournaments show greedy schedules that are noticeably worse than what organizers build by hand.

### How the greedy works

1. Take the court that frees up first.
2. List the matches that can start at that time: their teams have rested, and the matches they wait for have ended.
3. Put the most urgent one on the court: pool matches before playoffs, then lower rounds, then the teams that have waited the longest.
4. If no match can start, move that court's time forward to when the next match can start.
5. If the most urgent match would end after the day's end, close the court until the next day. When there are no days left, the remaining matches are reported as not fitting.
6. When every match is placed, pick the referees (see above).

### Prototype results: a weekend with at most 3 matches a day

12 teams in 4 pools of 3, the top 8 to a Gold bracket with a third-place game, 3 courts, Sat 9:00–18:00 and Sun 9:00–14:00, pools 50' and playoffs 70', at most 3 matches per team per day (the mockups use this schedule):

- Saturday: every team plays 2 pool matches (9:00–12:20), then the quarterfinals (12:20–14:40). A quarterfinalist plays 3 matches that day.
- Sunday: the semifinals at 9:00, then the final and the third-place game at 10:10.
- With 2 pools of 6 instead, a team can play 5 pool matches plus 3 playoff rounds, which is 8 matches: too many for 2 days at 3 a day. Five playoff matches don't fit. Pools of 3, or a third day (everything then ends Monday 12:30), fix it.

### Prototype results: 12 teams, 2 pools of 6, 3 courts, no daily limit

The playoffs are the top 4 of each pool in crossover quarterfinals, then semifinals and a final. The bracket shape is a placeholder until #361.

| Match lengths           | Days                              | Result                                                              |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Pools 45', playoffs 60' | Sat 8:00–21:00                    | All 37 matches placed, no conflicts, ends at **19:30**              |
| Pools 55', playoffs 60' | Sat 8:00–21:00                    | 36 placed. **The final doesn't fit**, and the organizer is told so. |
| Pools 55', playoffs 60' | Sat 8:00–21:00 and Sun 9:00–18:00 | All 37 placed. The final moves to **Sunday 9:00**.                  |

In every case, each team referees 2 or 3 pool matches.

What we learned:

- **Courts, not teams, are the bottleneck.** 30 pool matches on 3 courts take 10 waves whatever the order. The Generate screen should show the estimated end before the organizer generates.
- **Pools A and B alternate**, so the 6 teams of the other pool are free in every wave and referee. Each team plays every second wave, so it rests one match length between its matches.
- **A playoff round can be split across two days.** With 8 teams on 3 courts, Sat 9:00–20:00 and Sun 9:00–14:00, three quarterfinals play Saturday evening and the fourth Sunday morning. Organizers probably want a whole round on one day: a candidate rule for later. Until then, the organizer can move the matches and lock them.
- **The pools-before-playoffs rule leaves courts idle near the end** (QF4 runs alone). Later, the playoffs of one division could start while another division is still in pools; that already works because the rule is per division.

Schedule (pools 45', playoffs 60', Saturday only):

```
08:00  C1 A1-A6 (B1) | C2 A2-A5 (B2) | C3 A3-A4 (B3)
08:45  C1 B1-B6 (A1) | C2 B2-B5 (A2) | C3 B3-B4 (A3)
09:30  C1 A1-A5 (B4) | C2 A6-A4 (B5) | C3 A2-A3 (B6)
...      (pools A and B alternate, 10 waves)
14:45  C1 B1-B2 (A1) | C2 B3-B6 (A2) | C3 B4-B5 (A3)
15:30  C1 QF1        | C2 QF2        | C3 QF3
16:30  C1 QF4        | C2 SF1
17:30  C1 SF2
18:30  C1 Final
```

## 4. Changing the schedule (#292) and publishing (#293)

The organizer works on a **draft**. Players see only the **published** schedule.

Editing tools (like the scheduling tool in the reference screenshot the team looked at):

| Tool    | What it does                                                                        |
| ------- | ----------------------------------------------------------------------------------- |
| Place   | Put a match that isn't on the grid yet into an empty cell.                          |
| Remove  | Take a match off the grid. It goes back to the side panel.                          |
| Move    | Drag a match to another cell (web), or pick a time and court (phone).               |
| Swap    | Exchange two matches.                                                               |
| Referee | Change or clear a match's referee.                                                  |
| Lock    | Keep a match where it is. **Generate** again then places only the unlocked matches. |

After every change, the app checks the rules (`scheduleProblems` in `check.ts`) and shows the problems next to the grid:

- An **error** (e.g. "A team plays and referees at the same time") doesn't stop saving the draft, but it blocks **Publish**.
- A **warning** (too little rest) asks the organizer to confirm before publishing.

The server runs the same check, so a UI shortcut can't publish a broken schedule. Publishing again replaces the published version and sends the schedule notification (#343). A match that already has a confirmed score can't be moved.

## 5. Database proposal

These are additions to the existing Prisma schema, and **only a proposal: there is no migration yet.** `Match` belongs to #361's combined diagram.

```prisma
enum RefereeMode {
  TEAMS
  DEDICATED
  @@map("referee_mode")
}

enum ScheduleStatus {
  DRAFT
  PUBLISHED
  @@map("schedule_status")
}

// The hours the courts are available on one day of the tournament.
model TournamentDay {
  id           String     @id @default(uuid()) @db.Uuid
  tournamentId String     @map("tournament_id") @db.Uuid
  startsAt     DateTime   @map("starts_at") @db.Timestamptz
  endsAt       DateTime   @map("ends_at") @db.Timestamptz
  tournament   Tournament @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  @@index([tournamentId, startsAt])
  @@map("tournament_days")
}

// One draft and at most one published schedule per tournament. Divisions share
// the tournament's courts, so the schedule is per tournament, not per division.
model Schedule {
  id             String         @id @default(uuid()) @db.Uuid
  tournamentId   String         @map("tournament_id") @db.Uuid
  status         ScheduleStatus
  refereeMode    RefereeMode    @default(TEAMS) @map("referee_mode")
  minRestMinutes Int            @default(0) @map("min_rest_minutes")
  // Goes up by one each time the organizer publishes.
  version        Int            @default(1)
  publishedAt    DateTime?      @map("published_at") @db.Timestamptz
  createdAt      DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime       @updatedAt @map("updated_at") @db.Timestamptz
  tournament     Tournament     @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  slots          ScheduleSlot[]
  @@unique([tournamentId, status])
  @@map("schedules")
}

// When and where one match is played, and who referees it.
model ScheduleSlot {
  id               String   @id @default(uuid()) @db.Uuid
  scheduleId       String   @map("schedule_id") @db.Uuid
  matchId          String   @map("match_id") @db.Uuid
  // 1 to Tournament.courts. Court names come later.
  court            Int
  startsAt         DateTime @map("starts_at") @db.Timestamptz
  endsAt           DateTime @map("ends_at") @db.Timestamptz
  // Null with dedicated referees, or when nobody is free.
  refereeTeamId    String?  @map("referee_team_id") @db.Uuid
  // Generate keeps a locked match where the organizer put it.
  locked           Boolean  @default(false)
  schedule         Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  match            Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  refereeTeam      Team?    @relation(fields: [refereeTeamId], references: [id], onDelete: SetNull)
  @@unique([scheduleId, matchId])
  @@index([scheduleId, court, startsAt])
  @@index([refereeTeamId])
  @@map("schedule_slots")
}
```

What this needs from other tables:

- **Match length per stage:** each `Pool` and `PlayoffRound` from #361 needs a `matchMinutes Int` (e.g. 55 and 60). That's all the schedule needs from match formats.
- `Tournament` keeps `courts`. Its `startsAt` and `endsAt` stay as the first and last moment of the tournament, and `TournamentDay` gives the hours of each day.

Publishing copies the draft's slots into the published schedule in one transaction and adds one to its version.

A PostgreSQL exclusion constraint on `(schedule_id, court, tstzrange(starts_at, ends_at))` could stop a double-booked court in the database itself. Prisma can't declare it, so it would need raw SQL in the migration. Not needed for Release 2: the server check already blocks publishing.

## 6. Open questions

For Chau:

- Are the days and hours of a tournament always the same courts, or can a day have fewer courts?
- In the playoffs, who usually referees: eliminated teams, or the losers of the previous round?
- What minimum rest do they want by default?
- Should a playoff round always be played on one day?

For the team:

- Team reffing (#107) is in Release 3, but this spike now includes it. Does it move into Release 2?
- Who owns match formats (#92) now that they're out of this spike? The schedule only needs a match length per stage.

For #361:

- Agree on the shape of the matches the scheduler receives: the teams (none for playoffs), the matches each one waits for, the round and the stage. See `ScheduleMatch` in `generate.ts`.
- Add `matchMinutes` to `Pool` and `PlayoffRound`.

## AI-use acknowledgment

Claude (Claude Code) wrote this document and the prototype, and ran its tests. Vincent chose the scope with Hoang Vu and reviews the decisions with the team.
