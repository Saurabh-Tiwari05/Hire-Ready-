-- Sync interviews table to match the model (add missing columns)
-- Run this migration to add columns that were added in Process 8 but missing from the original migration

-- Add missing columns if they don't exist
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20),
  ADD COLUMN IF NOT EXISTS interview_duration INTEGER,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS interviewer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS interviewer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS stage VARCHAR(50),
  ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50);

-- Backfill scheduled_at from started_at for existing rows
UPDATE interviews
SET scheduled_at = started_at
WHERE scheduled_at IS NULL AND started_at IS NOT NULL;

-- Backfill stage for existing rows (default to 'screening')
UPDATE interviews
SET stage = 'screening'
WHERE stage IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_interviews_user_scheduled ON interviews(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status_scheduled ON interviews(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_user_status ON interviews(user_id, status);