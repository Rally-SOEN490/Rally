CREATE TABLE "user_interests" (
    "user_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("user_id", "category", "key")
);

CREATE INDEX "user_interests_category_key_idx" ON "user_interests"("category", "key");

ALTER TABLE "user_interests"
ADD CONSTRAINT "user_interests_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
