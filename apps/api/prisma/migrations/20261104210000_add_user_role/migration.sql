-- Account roles (RALLY-161). Every existing and new account starts as a player.

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('PLAYER', 'ORGANIZER', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "user_role" NOT NULL DEFAULT 'PLAYER';
