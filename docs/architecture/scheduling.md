# Match formats and scheduling

Status: Proposed (spike RALLY-257, [#362](https://github.com/Rally-SOEN490/Rally/issues/362)). The team and Chau still have to agree on it.

This document records the spike's decisions for match formats, forfeits, schedule generation and schedule editing. It depends on the pools and playoffs spike ([#361](https://github.com/Rally-SOEN490/Rally/issues/361)) for pools, seeding and bracket structure, and on the tournament-day spike ([#363](https://github.com/Rally-SOEN490/Rally/issues/363)) for scores and standings.

Prototype code: `apps/api/src/modules/scheduling/` (pure TypeScript, no Fastify or Prisma), tested in `apps/api/test/scheduling.test.ts`.

## 1. Match formats

### Research

MyTeamClick doesn't publish its tournament rules, so the options below come from public Canadian and North American rec and university rules. **Chau still has to confirm which ones their tournaments use** (marked _To confirm_).

| Option              | What we found                                                                                                       | Rally keeps it?                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Sets per match      | Pools often play 2 sets (both played, a match can end 1-1). Playoffs play best of 3. Competitive play is best of 5. | Yes: `FIXED_SETS` and `BEST_OF`                 |
| Points per set      | 25 is standard; 21 is common to save time.                                                                          | Yes                                             |
| Deciding set target | The third set of a best of 3 is usually played to 15.                                                               | Yes, best-of only                               |
| Win by 2            | Standard.                                                                                                           | Yes (win by 1 or 2)                             |
| Point cap           | Common in rec: 27 for sets to 25, 23 for sets to 21, 17 for sets to 15. Some events have none.                      | Yes, optional, per set and for the deciding set |
| Timed matches       | Some leagues play until a time limit when courts are short.                                                         | Yes: `TIMED` with a time limit                  |
| Forfeit             | Commonly scored as sets lost at 0 to the target (25-0), or by forfeiting sets for lateness.                         | See section 2                                   |

### Defaults (_To confirm_)

|                        | Pools               | Playoffs                         |
| ---------------------- | ------------------- | -------------------------------- |
| Mode                   | 2 sets, both played | Best of 3                        |
| Points                 | 25, cap 27          | 25, cap 27; third set 15, cap 17 |
| Win by                 | 2                   | 2                                |
| Warm-up / between sets | 5 min / 2 min       | 5 min / 2 min                    |
| Estimated court time   | 55 min              | 70 min                           |

Each pool and each playoff round stores its own format (story #92 now, #96 in Release 3). Scores are validated against the stored format of their pool or round, never against these defaults.

### How long a match takes

The estimate is about **0.9 minutes per point to win**: a set to 25 ends near 25-20, about 45 rallies of about 30 seconds each with dead time included. The organizer can replace the estimate with their own set length (#287 decides the final formula with Chau).

- Court time = warm-up + every set the match could need + breaks between sets, rounded up to 5 minutes.
- A best-of match is booked for its deciding set too. A short match leaves a gap, but a long one doesn't make the rest of the day run late.
- A timed match is booked for warm-up + its time limit.

| Format              | Court time |
| ------------------- | ---------- |
| 2 sets to 25        | 55 min     |
| 2 sets to 21        | 45 min     |
| Best of 3, 25/25/15 | 70 min     |
| Best of 3, 21/21/15 | 65 min     |
| Timed, 40 min       | 45 min     |

## 2. Forfeits

- A forfeit is stored as a **result type** (`FORFEIT`) with its winner. It doesn't store fake set scores, so a corrected forfeit keeps its revision history like any other score (#363).
- **Standings** count a forfeit as a win by every set needed, each at the target score to 0 (2 sets at 25-0 for both defaults). This rule is stored with the match format (`forfeitRule`), so a tournament can change it later.
- In the **playoffs**, the winner advances as usual.
- _To confirm with Chau:_ partial forfeits (a team arrives late and loses the first set only).

## 3. Schedule generation

### Inputs and rules

Inputs: the tournament's start and end, its number of courts (already on `Tournament`), each match's court time (from its format), the pool matches and the playoff bracket (from #361), and an optional minimum rest time.

Hard rules:

- No team plays two matches at once.
- No court holds two matches at once.
- Every match is inside the tournament's times.
- Pool matches of a division end before its playoffs start.
- A playoff match starts after the matches that feed it (a semifinal after its quarterfinals).

Soft rule: a team rests at least the minimum rest time between matches.

All divisions of a tournament share its courts, so the schedule is built for the whole tournament, not one division at a time.

### Options compared

|                         | A. Greedy slotting (chosen)                                                        | B. Constraint solver (OR-Tools CP-SAT, or integer programming with HiGHS/GLPK in WebAssembly)                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How it works            | Fill the court that frees up first with the most urgent match that can start then. | Model every match × court × time slot as a variable with the rules as constraints; the solver searches for the best schedule.                                          |
| Quality                 | Good, not optimal. On the test case it finishes the day at 19:50.                  | Optimal for the stated goal (e.g. the earliest finish).                                                                                                                |
| Speed                   | Milliseconds for one tournament.                                                   | Seconds to minutes. 37 matches × 3 courts × 160 five-minute slots is about 18,000 variables.                                                                           |
| Stack                   | Plain TypeScript in the API.                                                       | CP-SAT has no maintained Node binding, so it would need a Python service, which AGENTS.md forbids without a review. WebAssembly solvers are large and harder to debug. |
| When it doesn't fit     | It says which matches don't fit and why.                                           | It says only "infeasible", so we'd need extra work to explain why.                                                                                                     |
| Same input, same output | Yes, by construction.                                                              | Only with a fixed seed and the same solver version.                                                                                                                    |
| Editing afterwards      | The same rule checker validates edits.                                             | Needs a separate checker anyway.                                                                                                                                       |

**Decision: greedy slotting plus a rule checker.** It fits the stack, it's explainable to organizers, it's deterministic, and it covers Release 2. Revisit option B if the referee assignments in Release 3 (#107) make greedy schedules noticeably worse.

### How the greedy works

1. Take the court that frees up first.
2. List the matches that can start at that time: their teams have rested, and the matches they wait for have ended.
3. Put the most urgent one on the court: pool matches before playoffs, then lower rounds, then the teams that have waited the longest.
4. If no match can start, move that court's time forward to when the next match can start.
5. If the most urgent match would end after the tournament, it never fits. It's reported, and so are the matches that wait for it.

### Prototype result: 12 teams, 2 pools of 6, 3 courts, 8:00 to 21:00

The playoffs are top 4 of each pool into crossover quarterfinals, then semifinals and a final. The bracket shape is a placeholder until #361.

| Formats                             | Result                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Defaults (2×25 pools, Bo3 25/25/15) | 36 of 37 matches placed. **The final doesn't fit**, and the organizer is told so. |
| 2×21 pools, Bo3 21/21/15            | All 37 placed, no conflicts, last match ends **19:50**.                           |
| Same with 15 min minimum rest       | All 37 placed, ends 20:35.                                                        |

What we learned:

- **Courts, not teams, are the bottleneck.** 30 pool matches on 3 courts take 10 waves whatever the order. The scheduler should show the organizer the estimated end time while they pick formats, so they can see when to shorten sets or add courts.
- Alternating pools A and B means each team plays every second wave, so it rests about 45 minutes. The teams sitting out can referee (Release 3, #107).
- The pools-before-playoffs barrier leaves courts idle near the end (QF4 runs alone). Release 3 could let the playoffs of division 1 start while division 2 is still in pools, and that already works because the barrier is per division.

Full schedule (2×21 / Bo3 21):

```
08:00-08:45  C1 A1 v A6 | C2 A2 v A5 | C3 A3 v A4
08:45-09:30  C1 B1 v B6 | C2 B2 v B5 | C3 B3 v B4
...            (pools A and B alternate, 10 waves)
14:45-15:30  C1 B1 v B2 | C2 B3 v B6 | C3 B4 v B5
15:30-16:35  C1 QF1     | C2 QF2     | C3 QF3
16:35-17:40  C1 QF4     | C2 SF1
17:40-18:45  C1 SF2
18:45-19:50  C1 Final
```

## 4. Editing the schedule (#292) and publishing (#293)

The organizer works on a **draft** schedule. Players see only the **published** one.

What the organizer can do in the draft:

- Move a match to another time or court.
- Swap two matches.
- **Lock** a match so that regenerating keeps it where it is.
- Regenerate the rest around the locked matches.

What happens when a change breaks a rule (`scheduleProblems` in `check.ts`):

| Problem                                                                     | Severity | Effect                                   |
| --------------------------------------------------------------------------- | -------- | ---------------------------------------- |
| A team plays two matches at once                                            | Error    | The draft saves; publishing is blocked   |
| A court is double-booked                                                    | Error    | The draft saves; publishing is blocked   |
| A match is outside the tournament's times, or on a court that doesn't exist | Error    | The draft saves; publishing is blocked   |
| A playoff starts before its pools or its feeding matches end                | Error    | The draft saves; publishing is blocked   |
| A team rests less than the minimum                                          | Warning  | The organizer confirms, then can publish |

The server runs the same check, so a UI shortcut can't publish a broken schedule. Publishing again replaces the published version and sends the schedule notification (#343). A match that already has a confirmed score can't be moved.

## 5. Database proposal

These are additions to the existing Prisma schema, and **only a proposal: there is no migration yet.** `Pool`, `PlayoffRound` and `Match` belong to the combined diagram from #361. This spike adds the match format link and the schedule.

```prisma
enum MatchFormatMode {
  BEST_OF
  FIXED_SETS
  TIMED
  @@map("match_format_mode")
}

enum ForfeitRule {
  // A win by every set needed, each at the target score to 0.
  ALL_SETS_AT_TARGET
  @@map("forfeit_rule")
}

// How the matches of one pool or playoff round are played (#92).
model MatchFormat {
  id                  String          @id @default(uuid()) @db.Uuid
  divisionId          String          @map("division_id") @db.Uuid
  mode                MatchFormatMode
  sets                Int
  pointsPerSet        Int             @map("points_per_set")
  decidingSetPoints   Int?            @map("deciding_set_points")
  winBy               Int             @default(2) @map("win_by")
  pointCap            Int?            @map("point_cap")
  decidingSetPointCap Int?            @map("deciding_set_point_cap")
  timeLimitMinutes    Int?            @map("time_limit_minutes")
  // Null means estimated from the points (#287).
  setMinutes          Int?            @map("set_minutes")
  minutesBetweenSets  Int             @default(2) @map("minutes_between_sets")
  warmupMinutes       Int             @default(5) @map("warmup_minutes")
  forfeitRule         ForfeitRule     @default(ALL_SETS_AT_TARGET) @map("forfeit_rule")
  division            Division        @relation(fields: [divisionId], references: [id], onDelete: Cascade)
  pools               Pool[]          // #361: Pool.matchFormatId
  playoffRounds       PlayoffRound[]  // #361: PlayoffRound.matchFormatId
  @@map("match_formats")
}

enum ScheduleStatus {
  DRAFT
  PUBLISHED
  @@map("schedule_status")
}

// One draft and at most one published schedule per tournament. Divisions share
// the tournament's courts, so the schedule is per tournament, not per division.
model Schedule {
  id           String         @id @default(uuid()) @db.Uuid
  tournamentId String         @map("tournament_id") @db.Uuid
  status       ScheduleStatus
  // Goes up by one each time the organizer publishes.
  version      Int            @default(1)
  publishedAt  DateTime?      @map("published_at") @db.Timestamptz
  createdAt    DateTime       @default(now()) @map("created_at") @db.Timestamptz
  updatedAt    DateTime       @updatedAt @map("updated_at") @db.Timestamptz
  tournament   Tournament     @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  slots        ScheduleSlot[]
  @@unique([tournamentId, status])
  @@map("schedules")
}

// When and where one match is played (court and time).
model ScheduleSlot {
  id         String   @id @default(uuid()) @db.Uuid
  scheduleId String   @map("schedule_id") @db.Uuid
  matchId    String   @map("match_id") @db.Uuid
  // 1 to Tournament.courts. Court names come later.
  court      Int
  startsAt   DateTime @map("starts_at") @db.Timestamptz
  endsAt     DateTime @map("ends_at") @db.Timestamptz
  // Regenerating keeps a locked match where the organizer put it.
  locked     Boolean  @default(false)
  schedule   Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  match      Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  @@unique([scheduleId, matchId])
  @@index([scheduleId, court, startsAt])
  @@map("schedule_slots")
}
```

Changes to existing models:

- `Tournament`: add `minRestMinutes Int @default(0) @map("min_rest_minutes")` (#106). `courts`, `startsAt` and `endsAt` already exist.
- `Match` (#361 and #363): needs a `resultType` (`PLAYED` or `FORFEIT`) for the forfeit rule above.

Publishing copies the draft's slots into the published schedule in one transaction and adds one to its version.

A PostgreSQL exclusion constraint on `(schedule_id, court, tstzrange(starts_at, ends_at))` could stop a double-booked court in the database itself. Prisma can't declare it, so it would need raw SQL in the migration. The team should decide whether it's worth it: the server check already blocks publishing.

## 6. Open questions

For Chau:

- Which match formats and caps do they use in pools and in playoffs?
- How is a forfeit scored, and is there a partial forfeit for lateness?
- Is 0.9 minutes per point realistic for their tournaments? What warm-up do they allow?
- What minimum rest do they want by default?
- Do teams referee the matches between theirs? (This affects Release 3, #107.)

For #361:

- How are pool matchups and the playoff bracket generated? The prototype uses a plain round robin and a 4+4 crossover.
- Does each pool or round point to a `MatchFormat`, or does a division have one format for pools and one for playoffs in Release 2?

For #363:

- The `Match` table and score revisions, including `resultType` for forfeits.

## Sources

Public rules used as placeholders until Chau confirms:

- [Carleton coed volleyball rules](https://athletics.carleton.ca/wp-content/uploads/coed-volleyball-rules.pdf): third set to 15, cap 17.
- [UBC volleyball league rules 2025](https://recreation.ubc.ca/wp-content/uploads/2025/09/Cross-Volleyball-League-Rules-2025.pdf): win by 2 unless the point cap is reached first.
- [Western University indoor volleyball regulations](https://uwo.ca/campusrec/intramurals/intramural_policies_and_playing_regulations/Indoor%20Volleyball%20Regulations%20.html)
- [University of Calgary volleyball rules 2025](https://active-living.ucalgary.ca/sites/default/files/teams/1/2025%20-%20Volleyball%20Rules%20.pdf)
- [Volleyball Canada rulebook](https://volleyball.ca/uploads/Development/Referee/Rules/Rulebook_2018-19_EN_FINAL_-_updated_Oct_2018.pdf)
- [SONJ volleyball tournament rules](https://www.sonj.org/wp-content/uploads/2023/08/VB-Tournament-Rules.pdf): late arrival forfeits the first set 0-25.
- [Tournify set options](https://tournifyapp.com/en/features/sets): how another tournament app configures sets.

## AI-use acknowledgment

Claude (Claude Code) researched the public rules, wrote this document and the prototype, and ran its tests. Vincent chose the scope and reviews the decisions with the team.
