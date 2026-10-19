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
