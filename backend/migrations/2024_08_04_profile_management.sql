-- Add profile management columns to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS college VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS branch VARCHAR(50);

ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_url VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB;

ALTER TABLE users ADD COLUMN IF NOT EXISTS target_companies JSONB;

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_role VARCHAR(100);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications JSONB
    DEFAULT '{"resume_submission": true, "interview_invite": true}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    DEFAULT '{"email": true, "push": true}';