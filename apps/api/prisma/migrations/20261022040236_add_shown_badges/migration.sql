-- AlterTable
ALTER TABLE "users" ADD COLUMN     "shown_badges" TEXT[] DEFAULT ARRAY[]::TEXT[];
