-- Organizer applications and the email outbox (RALLY-140, RALLY-135).

-- CreateEnum
CREATE TYPE "organizer_application_status" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'EXPIRED');

-- CreateTable
CREATE TABLE "organizer_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pending_user_id" UUID,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "status" "organizer_application_status" NOT NULL DEFAULT 'PENDING',
    "deny_reason" TEXT,
    "review_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "decided_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizer_applications_pkey" PRIMARY KEY ("id"),
    -- Written by hand (Prisma can't describe checks): pending_user_id marks the
    -- one pending application per person, so it must be the applicant, and set
    -- exactly while the application is pending.
    CONSTRAINT "organizer_applications_pending_user_check"
        CHECK ("pending_user_id" IS NULL OR "pending_user_id" = "user_id"),
    CONSTRAINT "organizer_applications_pending_status_check"
        CHECK (("status" = 'PENDING') = ("pending_user_id" IS NOT NULL))
);

-- CreateTable
CREATE TABLE "email_outbox" (
    "id" UUID NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_until" TIMESTAMPTZ,
    "sent_at" TIMESTAMPTZ,
    "failed_at" TIMESTAMPTZ,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_applications_pending_user_id_key" ON "organizer_applications"("pending_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_applications_review_token_hash_key" ON "organizer_applications"("review_token_hash");

-- CreateIndex
CREATE INDEX "organizer_applications_user_id_created_at_idx" ON "organizer_applications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "email_outbox_next_attempt_at_idx" ON "email_outbox"("next_attempt_at");

-- AddForeignKey
ALTER TABLE "organizer_applications" ADD CONSTRAINT "organizer_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
