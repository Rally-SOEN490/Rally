-- CreateTable
CREATE TABLE "badge_types" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "image_url" TEXT,
    "auto_award" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "user_id" UUID NOT NULL,
    "badge_type_id" UUID NOT NULL,
    "awarded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("user_id","badge_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "badge_types_key_key" ON "badge_types"("key");

-- CreateIndex
CREATE INDEX "user_badges_badge_type_id_idx" ON "user_badges"("badge_type_id");

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_type_id_fkey"
    FOREIGN KEY ("badge_type_id") REFERENCES "badge_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed placeholder badge definitions until the final badge catalog is designed.
INSERT INTO "badge_types" ("id", "key", "name", "tier", "description", "icon", "auto_award")
VALUES
    ('00000000-0000-0000-0000-000000000001', 'champion', 'Champion', 'gold', 'Placeholder championship badge', '🏆', true),
    ('00000000-0000-0000-0000-000000000002', 'winner', 'Winner', 'gold', 'Placeholder first-place badge', '🥇', true),
    ('00000000-0000-0000-0000-000000000003', 'podium', 'Podium', 'bronze', 'Placeholder podium badge', '🥉', true),
    ('00000000-0000-0000-0000-000000000004', 'competitor', 'Competitor', 'silver', 'Placeholder participation badge', '🎖️', true);
