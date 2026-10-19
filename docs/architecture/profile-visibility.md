# Profile visibility — RALLY-27 (#49)

Implementation proposal for team review; no stakeholder signoff is implied.

- Profiles are private until their owner opts in. Viewing still requires a registered, signed-in Rally account.
- A visible profile always identifies its owner by Rally ID and display name. Photo, bio, status, interests, socials, awards and membership date each have a separate opt-in flag.
- Preferences live in `profile_privacy`, linked to `users` with cascading deletion. Missing rows mean all flags are false. Reads do not create preferences.
- `GET /profiles/me/privacy` and `PATCH /profiles/me/privacy` resolve the owner from the verified Firebase token. The request cannot select another owner.
- Private fields must be omitted by the API; hiding elements in the client is insufficient. All profile responses use `Cache-Control: private, no-store`.
- Profile-field editing remains with RALLY-22–24. These flags reserve the read contract for those sections without implementing their editing workflows.
- Public roster/name-only visibility remains unresolved in #181. This change does not publish roster identities or introduce a player directory.
- Privacy does not erase already viewed information. It controls subsequent profile requests.

The enforced branch format is `feature/RALLY-27`; CONTRIBUTING's older branch example conflicts with the current naming workflow.

AI-use acknowledgment: OpenAI Codex implemented and tested the proposal under the contributor's direction.

## RALLY-26 (#48): viewing profiles

- `GET /profiles/:id` requires both a verified Firebase token and an existing Rally account. Private/missing profiles share the same 404 response. Owner preview uses the same filters as any other viewer.
- The API selects the stored Rally ID/name, optional details, awards and privacy settings, then creates a fresh allowlisted response. Firebase UID, age confirmation, privacy flags, provider credentials and internal row fields are never returned.
- `/players/:id` is guarded by the existing account flow. Initial profile links survive session restoration and sign-in. `PlayerProfileLink` is reusable by future roster/search/free-agent screens.
- `player_profiles` supplies nullable photo/bio/status/social fields and an interests array. There is no new editing form: Ayman's RALLY-22–24 can write these fields through their own validated owner routes. Coordinate this schema contract before merging either contribution.
- Empty sections are omitted. No invented teams, tournament statistics, results or overall skill rating are shown on another player's profile.
- Award display is shared with the existing owner screen. Its earning rules/catalogue are unchanged.
- Remaining upstream integration: connect profile links from roster, search and free-agent screens when those stories exist, and display real team/statistics/results data when their modules exist. #48 must not be called fully accepted until these dependencies and #181 are resolved.
- Review order: RALLY-27 first, then RALLY-26. The local RALLY-26 branch is based on RALLY-27, not directly on main.
