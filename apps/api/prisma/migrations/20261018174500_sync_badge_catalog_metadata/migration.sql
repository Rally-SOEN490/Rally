-- Keep database metadata aligned with the file-based badge catalog.
UPDATE "badge_types"
SET
    "tier" = CASE "key"
        WHEN 'champion' THEN 'Gold'
        WHEN 'winner' THEN 'Gold'
        WHEN 'podium' THEN 'Bronze'
        WHEN 'competitor' THEN 'Silver'
    END,
    "image_url" = 'badge-placeholder'
WHERE "key" IN ('champion', 'winner', 'podium', 'competitor');
