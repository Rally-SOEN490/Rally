ALTER TABLE "users" ADD COLUMN "skill_level" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_skill_level_check"
  CHECK ("skill_level" IS NULL OR "skill_level" IN ('C', 'C+', 'B-', 'B'));
