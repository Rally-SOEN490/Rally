# Profile message

The editable short message is separate from the longer profile bio (RALLY-22),
interests (RALLY-23) and looking-for-team flag (RALLY-25). Its proposed 280 Unicode
character limit follows the refined story #228 and remains a product refinement choice.

`profile_messages` belongs to the profile module and cascades on account deletion.
GET/PATCH `/profiles/me/message` verify Firebase identity and resolve the owner's
Rally account; neither endpoint accepts another player's ID. Only `{ message }`
is returned. Empty or whitespace-only input removes the displayed message.
Responses are not cached. Routes validate, services apply ownership, repositories
access PostgreSQL. The client preserves a failed draft and isolates state by UID.

This branch does not depend on closed/unmerged privacy or visitor-profile PRs
#223/#224. No public read endpoint is added. When player viewing is approved,
its projection must explicitly decide whether to include the message.

Mockup: https://github.com/Rally-SOEN490/Rally/wiki/Mockups#profile-page
The message bubble was requested in the newer team discussion and October 7 notes;
it intentionally augments the older mockup beneath the player name.

AI-use acknowledgment: OpenAI Codex assisted with implementation, tests and documentation.
