-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT
ALTER TABLE "profile_participations" ADD COLUMN "placement" INTEGER;
ALTER TABLE "profile_participations" ADD CONSTRAINT "profile_participations_placement_check"
  CHECK ("placement" IS NULL OR ("placement" > 0 AND "state" = 'COMPLETED'));
CREATE INDEX "profile_participations_user_id_state_ends_at_registration_id_idx"
  ON "profile_participations"("user_id", "state", "ends_at", "registration_id");
