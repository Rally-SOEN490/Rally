-- Give several local sample badges enough receipts to visibly reach Gold.
UPDATE "user_badges" AS ub
SET "received_count" = CASE bt."key"
    WHEN 'champion' THEN 25
    WHEN 'winner' THEN 22
    WHEN 'podium' THEN 20
    WHEN 'competitor' THEN 17
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
