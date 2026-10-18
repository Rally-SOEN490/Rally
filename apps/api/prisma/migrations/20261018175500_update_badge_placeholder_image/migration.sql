-- Point existing badge assignments at the current bundled placeholder artwork.
UPDATE "badge_types"
SET "image_url" = 'badge-gold-placeholder'
WHERE "key" IN ('champion', 'winner', 'podium', 'competitor');
