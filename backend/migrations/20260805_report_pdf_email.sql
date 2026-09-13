-- Enhance reports table with PDF and email delivery fields
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS pdf_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_error TEXT;

-- Create index for faster report lookups
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_interview_id ON reports(interview_id);
CREATE INDEX IF NOT EXISTS idx_reports_email_status ON reports(email_status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);