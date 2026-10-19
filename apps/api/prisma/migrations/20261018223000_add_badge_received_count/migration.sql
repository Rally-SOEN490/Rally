-- Store how many times each player has received each badge type.
ALTER TABLE "user_badges"
ADD COLUMN "received_count" INTEGER NOT NULL DEFAULT 1;
