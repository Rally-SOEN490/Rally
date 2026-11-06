-- Copyright (c) 2026 Rally. All rights reserved.
-- AI contribution: 50% or more AI-generated

-- Division levels can't be missing or hold a blank entry (PR #315 review).
-- The first version of this check let both through: a check passes when it
-- works out to NULL, and cardinality(NULL) is NULL. The API already rejects
-- both; this keeps the data valid if a bug or a manual edit gets past it.
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_levels_check";
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_levels_check"
    CHECK ("levels" IS NOT NULL
        AND cardinality("levels") >= 1
        AND array_position("levels", NULL) IS NULL);
