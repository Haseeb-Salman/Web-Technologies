-- CAREPOINT ADMIN UPGRADE (run once on an existing database)
-- Adds an activation switch without deleting doctors or their appointment history.
USE doctor_appointment;

ALTER TABLE doctors
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER available_days;

-- Existing doctors remain active by default.
UPDATE doctors SET is_active = 1 WHERE is_active IS NULL;
