-- Assign the new sample badges to users that already exist.
INSERT INTO "user_badges" ("user_id", "badge_type_id")
SELECT "users"."id", "badge_types"."id"
FROM "users"
JOIN "badge_types" ON "badge_types"."auto_award" = true
WHERE "badge_types"."key" IN (
    'defender',
    'rally',
    'blocker',
    'server',
    'team-player',
    'streak',
    'rising-star',
    'clutch'
)
ON CONFLICT ("user_id", "badge_type_id") DO NOTHING;
