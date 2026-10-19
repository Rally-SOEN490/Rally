-- Add sample badges so the profile's horizontal awards scroller can be tested.
INSERT INTO "badge_types" ("id", "key", "name", "tier", "description", "icon", "image_url", "auto_award")
VALUES
    ('00000000-0000-0000-0000-000000000005', 'defender', 'Defender', 'bronze', 'Placeholder defensive effort medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000006', 'rally', 'Rally', 'bronze', 'Placeholder long-rally medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000007', 'blocker', 'Blocker', 'silver', 'Placeholder blocking medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000008', 'server', 'Server', 'silver', 'Placeholder serving medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000009', 'team-player', 'Team Player', 'bronze', 'Placeholder teamwork medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000010', 'streak', 'Streak', 'gold', 'Placeholder winning-streak medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000011', 'rising-star', 'Rising Star', 'silver', 'Placeholder rising-player medal', '⭐', 'badge-gold-placeholder', true),
    ('00000000-0000-0000-0000-000000000012', 'clutch', 'Clutch', 'gold', 'Placeholder clutch-play medal', '⭐', 'badge-gold-placeholder', true)
ON CONFLICT ("key") DO NOTHING;
