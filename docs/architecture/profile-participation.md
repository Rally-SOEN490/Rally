# Profile participation read model

This is a profile-owned PostgreSQL projection, not a new team/registration system.
It does not resolve team lifetime (#180), calculate standings or define roster
appearance credit (#182). Each row is keyed by Rally user ID and stable source
registration UUID. Event, tournament, format and team names are tournament-time
snapshots; editing a current team must not rewrite completed participation.

## Producer contract

A future trusted registration module calls `createParticipationService(
createParticipationRepository(tx)).syncRegistration(snapshot)` inside its existing
Prisma transaction. Input contains the account ID, stable registration UUID,
event/tournament/team names, format, start/end timestamps, and CONFIRMED/CANCELLED
state. Repeated delivery updates that participation. COMPLETED rows resist late
registration updates. Updates must be delivered in source order; there is no
asynchronous event bus or revision protocol in this implementation.

Only registration code decides whether a roster is confirmed. There is no HTTP
endpoint through which a player can claim a team, participation or placement.
The schema uses no fabricated foreign keys to team/tournament models that do not
exist. Its source registration UUID is an integration key, not proof of membership.
Future registration code owns that proof and must remove/reassign affected rows
when its identity mapping changes. The transaction rollback case is tested.

## Consumer contract

GET `/profiles/me/upcoming` resolves the signed-in owner and returns confirmed
participation with start > current time, ordered by start then registration UUID.
It returns only the fields needed by the banner and list. Responses are no-store.
The mobile profile is keyed by Firebase UID and shows loading, error/retry and
empty states. The banner follows the published profile mockup; +N opens all entries.

## Remaining integration

The repository currently has no registration/tournament producer. Real accounts
show empty states until those modules call this contract. Local fixtures test
populated behavior. This PR delivers storage, internal write contract, read API
and UI; it does not claim automatic population from a live tournament workflow.
Coordinate this proposed contract with the module owners before adopting it.
Account deletion currently cascades profile projection rows; authoritative
anonymized competition history must remain with the future competition module.

Related: #229, #25, #180. Mockup:
https://github.com/Rally-SOEN490/Rally/wiki/Mockups#profile-page

AI-use acknowledgment: OpenAI Codex assisted with implementation, tests and documentation.

## Confirmed results (#230; profile slice of #52)

The results producer uses `finalizeResult(userId, registrationId, placement, now)`
inside its tournament-close/correction transaction. It must authorize staff and
verify official standings before calling this internal function. Only an existing
confirmed/completed participation with end <= now can be finalized. Cancelled,
missing and future participations are refused; placements must be positive
PostgreSQL integers. Retrying the same placement is safe. Trusted corrections can
change the placement, but never the tournament-time event/team/name snapshots.
The authoritative producer remains responsible for its score revision/audit log.
There is no player-write result endpoint and no derived match/statistics totals.

GET `/profiles/me/results` returns completed rows with a non-null placement and
end <= now, newest first then registration UUID. It is owner-only and no-store.
The profile previews three results and expands all on request. Until the results
producer is implemented/connected, real profiles show no results. Future
anonymized competition history belongs to the competition module, not this
account-owned projection. This change does not close the broader RALLY-30 (#52).
