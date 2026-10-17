-- Copyright (c) 2026 Rally contributors
-- SPDX-License-Identifier: MIT

-- Runs once, the first time the Postgres container starts with an empty volume.
-- Tests wipe this database, so they never touch your development data.
CREATE DATABASE rally_test OWNER rally;
