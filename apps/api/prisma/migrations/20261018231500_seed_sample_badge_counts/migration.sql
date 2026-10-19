-- Give the local sample badges different counts so descending ordering is visible.
UPDATE "user_badges" AS ub
SET "received_count" = CASE bt."key"
    WHEN 'champion' THEN 12
    WHEN 'winner' THEN 10
    WHEN 'podium' THEN 8
    WHEN 'competitor' THEN 7
    WHEN 'defender' THEN 6
    WHEN 'rally' THEN 5
    WHEN 'blocker' THEN 4
    WHEN 'server' THEN 3
    WHEN 'team-player' THEN 2
    WHEN 'streak' THEN 1
    WHEN 'rising-star' THEN 1
    WHEN 'clutch' THEN 1
    ELSE ub."received_count"
END
FROM "badge_types" AS bt
WHERE ub."badge_type_id" = bt."id"
  AND bt."key" IN (
    'champion', 'winner', 'podium', 'competitor', 'defender', 'rally',
    'blocker', 'server', 'team-player', 'streak', 'rising-star', 'clutch'
  );
