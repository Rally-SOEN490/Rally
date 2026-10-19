-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT

-- Optional profile data; existing accounts remain unchanged. Editing these
-- details belongs to RALLY-22–24, while RALLY-26 reads permitted sections.
CREATE TABLE "player_profiles" (
  "user_id" UUID NOT NULL,
  "photo_url" TEXT,
  "bio" TEXT,
  "status_message" TEXT,
  "interests" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "facebook_url" TEXT,
  "instagram_url" TEXT,
  CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "player_profiles_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
