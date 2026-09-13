-- Dashboard statistics table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    total_interviews INTEGER DEFAULT 0,
    completed_interviews INTEGER DEFAULT 0,
    scheduled_interviews INTEGER DEFAULT 0,

    average_score NUMERIC(5,2) DEFAULT 0,
    total_reports INTEGER DEFAULT 0,
    total_notifications INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_user_id
ON dashboard_stats(user_id);

-- Trigger
DROP TRIGGER IF EXISTS update_dashboard_stats_updated_at
ON dashboard_stats;

CREATE TRIGGER update_dashboard_stats_updated_at
BEFORE UPDATE ON dashboard_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();