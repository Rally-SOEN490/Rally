# Match-format research (hand-off)

Status: Research notes, not decisions. This came out of spike RALLY-257 ([#362](https://github.com/Rally-SOEN490/Rally/issues/362)) before match formats were taken out of its scope on 2026-11-25. Whoever takes story #92 (Set a match format) can start from here. The schedule only needs one thing from match formats: **how long a match lasts in each stage**, which the organizer sets (for example pools 55', playoffs 60').

Nothing here has been confirmed with Chau.

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

## 3. Local Montreal and Quebec rules found later

- **Volleyball Québec tournaments:** a team that isn't on the court loses the first set 21-0, and forfeits the second set 21-0 15 minutes later. This suggests sets to 21 in their tournaments, and gives a partial-forfeit rule for lateness.
- **Montréal Sport Ligue (rec league):** each set won counts in the standings, with a cap of 27 points per set.

## Sources

- [Volleyball Québec tournament rules](https://media.publicationsports.com/1710/6cc0b90f-2f69-11f0-80ed-0611ff2db335)
- [Montréal Sport Ligue: volleyball rules](https://montrealsportligue.ca/index.php/2019/01/28/volleyball/)
- [Carleton coed volleyball rules](https://athletics.carleton.ca/wp-content/uploads/coed-volleyball-rules.pdf)
- [UBC volleyball league rules 2025](https://recreation.ubc.ca/wp-content/uploads/2025/09/Cross-Volleyball-League-Rules-2025.pdf)
- [Western University indoor volleyball regulations](https://uwo.ca/campusrec/intramurals/intramural_policies_and_playing_regulations/Indoor%20Volleyball%20Regulations%20.html)
- [SONJ volleyball tournament rules](https://www.sonj.org/wp-content/uploads/2023/08/VB-Tournament-Rules.pdf)

## AI-use acknowledgment

Claude (Claude Code) researched the public rules and wrote these notes.
