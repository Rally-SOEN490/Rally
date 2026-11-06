-- Tournaments and their divisions (RALLY-48, RALLY-49, RALLY-51).

-- CreateEnum
CREATE TYPE "tournament_status" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "division_format" AS ENUM ('2v2', '3v3', '4v4', '6v6', '9v9');

-- CreateEnum
CREATE TYPE "division_type" AS ENUM ('COED', 'MEN', 'WOMEN');

-- CreateEnum
CREATE TYPE "division_level" AS ENUM ('C-', 'C', 'C+', 'B', 'B+', 'A', 'OPEN', 'ELITE');

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "status" "tournament_status" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "location" TEXT,
    "courts" INTEGER,
    "description" TEXT,
    "starts_at" TIMESTAMPTZ,
    "ends_at" TIMESTAMPTZ,
    "registration_opens_at" TIMESTAMPTZ,
    "registration_closes_at" TIMESTAMPTZ,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "format" "division_format" NOT NULL,
    "type" "division_type" NOT NULL,
    "levels" "division_level"[],
    "max_teams" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournaments_organizer_id_created_at_idx" ON "tournaments"("organizer_id", "created_at");

-- CreateIndex
CREATE INDEX "tournaments_status_starts_at_idx" ON "tournaments"("status", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_tournament_id_name_key" ON "divisions"("tournament_id", "name");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Written by hand (Prisma can't describe checks). The API checks the same
-- rules; these keep the data valid even if a bug or a manual edit slips past it.
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_courts_check"
    CHECK ("courts" IS NULL OR "courts" BETWEEN 1 AND 50);
-- A published tournament has every field filled in.
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_published_complete_check"
    CHECK ("status" <> 'PUBLISHED' OR (
        "location" IS NOT NULL AND "courts" IS NOT NULL AND "starts_at" IS NOT NULL
        AND "ends_at" IS NOT NULL AND "registration_opens_at" IS NOT NULL
        AND "registration_closes_at" IS NOT NULL AND "published_at" IS NOT NULL));
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_max_teams_check"
    CHECK ("max_teams" BETWEEN 2 AND 64);
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_price_cents_check"
    CHECK ("price_cents" BETWEEN 0 AND 1000000);
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_levels_check"
    CHECK (cardinality("levels") >= 1);
