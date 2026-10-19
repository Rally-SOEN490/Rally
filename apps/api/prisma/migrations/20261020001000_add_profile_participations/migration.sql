-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT
CREATE TYPE "ProfileParticipationState" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TABLE "profile_participations" (
  "user_id" UUID NOT NULL,
  "registration_id" UUID NOT NULL,
  "event_name" VARCHAR(140) NOT NULL,
  "tournament_name" VARCHAR(140) NOT NULL,
  "team_name" VARCHAR(140) NOT NULL,
  "format" VARCHAR(100) NOT NULL,
  "starts_at" TIMESTAMPTZ NOT NULL,
  "ends_at" TIMESTAMPTZ NOT NULL,
  "state" "ProfileParticipationState" NOT NULL DEFAULT 'CONFIRMED',
  PRIMARY KEY ("user_id", "registration_id"),
  CONSTRAINT "profile_participations_dates_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "profile_participations_user_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "profile_participations_user_id_state_starts_at_registration_id_idx"
  ON "profile_participations"("user_id", "state", "starts_at", "registration_id");
