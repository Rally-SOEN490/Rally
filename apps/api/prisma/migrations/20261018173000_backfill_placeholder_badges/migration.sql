-- Give existing users the default badges introduced with the badge catalog.
INSERT INTO "user_badges" ("user_id", "badge_type_id")
SELECT "users"."id", "badge_types"."id"
FROM "users"
CROSS JOIN "badge_types"
WHERE "badge_types"."auto_award" = true
ON CONFLICT ("user_id", "badge_type_id") DO NOTHING;
