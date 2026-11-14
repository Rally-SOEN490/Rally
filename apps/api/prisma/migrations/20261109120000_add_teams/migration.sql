-- Teams signed up in a tournament's divisions (RALLY-36).

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "division_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_key" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "team_id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("team_id","user_id")
);

-- CreateIndex
CREATE INDEX "teams_division_id_idx" ON "teams"("division_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_tournament_id_name_key_key" ON "teams"("tournament_id", "name_key");

-- CreateIndex
CREATE UNIQUE INDEX "teams_id_tournament_id_key" ON "teams"("id", "tournament_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_tournament_id_user_id_key" ON "team_members"("tournament_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_id_tournament_id_key" ON "divisions"("id", "tournament_id");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_division_id_tournament_id_fkey" FOREIGN KEY ("division_id", "tournament_id") REFERENCES "divisions"("id", "tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_tournament_id_fkey" FOREIGN KEY ("team_id", "tournament_id") REFERENCES "teams"("id", "tournament_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Written by hand (Prisma can't describe checks). The API checks the same
-- rule; this keeps the data valid even if a bug or a manual edit slips past it.
ALTER TABLE "teams" ADD CONSTRAINT "teams_name_check"
    CHECK (char_length("name") BETWEEN 1 AND 40 AND "name" = btrim("name"));
