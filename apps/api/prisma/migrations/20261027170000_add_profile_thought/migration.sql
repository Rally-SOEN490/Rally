-- Add the optional public thought shown beside a profile picture.
ALTER TABLE "users"
ADD COLUMN "thought_text" TEXT;
