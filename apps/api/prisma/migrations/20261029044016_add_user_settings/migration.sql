-- AlterTable
ALTER TABLE "users" ADD COLUMN     "color_blind_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "color_theme" TEXT NOT NULL DEFAULT 'green',
ADD COLUMN     "dark_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'EN',
ADD COLUMN     "notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
