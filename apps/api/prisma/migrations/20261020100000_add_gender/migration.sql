-- AlterTable
ALTER TABLE "users" ADD COLUMN "gender" TEXT;

-- AddConstraint
ALTER TABLE "users"
ADD CONSTRAINT "users_gender_check"
CHECK ("gender" IS NULL OR "gender" IN ('male', 'female'));
