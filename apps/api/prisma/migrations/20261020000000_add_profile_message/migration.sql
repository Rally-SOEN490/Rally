-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT
CREATE TABLE "profile_messages" (
  "user_id" UUID NOT NULL PRIMARY KEY,
  "text" VARCHAR(280) NOT NULL,
  CONSTRAINT "profile_messages_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
