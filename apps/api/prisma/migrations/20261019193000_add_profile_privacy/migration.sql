-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT

CREATE TABLE "profile_privacy" (
  "user_id" UUID NOT NULL,
  "profile_visible" BOOLEAN NOT NULL DEFAULT false,
  "show_photo" BOOLEAN NOT NULL DEFAULT false,
  "show_bio" BOOLEAN NOT NULL DEFAULT false,
  "show_status" BOOLEAN NOT NULL DEFAULT false,
  "show_interests" BOOLEAN NOT NULL DEFAULT false,
  "show_social_links" BOOLEAN NOT NULL DEFAULT false,
  "show_badges" BOOLEAN NOT NULL DEFAULT false,
  "show_member_since" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "profile_privacy_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "profile_privacy_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
