-- Process 12: AI Analytics Dashboard migrations

-- Skill statistics table
CREATE TABLE IF NOT EXISTS skill_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'technical',
    question_count INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,
    average_score FLOAT DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    lowest_score INTEGER DEFAULT 100,
    strengths_count INTEGER DEFAULT 0,
    weaknesses_count INTEGER DEFAULT 0,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'unknown',
    last_evaluated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_stats_user ON skill_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_stats_skill ON skill_statistics(skill_name);

-- Company readiness table
CREATE TABLE IF NOT EXISTS company_readiness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_size VARCHAR(50),
    company_type VARCHAR(100),
    overall_readiness INTEGER,
    technical_readiness INTEGER,
    communication_readiness INTEGER,
    culture_fit INTEGER,
    skill_gaps JSONB DEFAULT '[]'::jsonb,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    preparation_recommendations JSONB DEFAULT '[]'::jsonb,
    interview_focus_areas JSONB DEFAULT '[]'::jsonb,
    confidence_score INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, company_name)
);

CREATE INDEX IF NOT EXISTS idx_company_readiness_user ON company_readiness(user_id);

-- Role readiness table
CREATE TABLE IF NOT EXISTS role_readiness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(255) NOT NULL,
    overall_readiness INTEGER,
    technical_readiness INTEGER,
    communication_readiness INTEGER,
    behavioral_readiness INTEGER,
    skill_gaps JSONB DEFAULT '[]'::jsonb,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    preparation_recommendations JSONB DEFAULT '[]'::jsonb,
    career_path_suggestions JSONB DEFAULT '[]'::jsonb,
    confidence_score INTEGER DEFAULT 0,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_role_readiness_user ON role_readiness(user_id);

-- Learning roadmap table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    roadmap_data JSONB NOT NULL,
    current_week INTEGER DEFAULT 1,
    total_weeks INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    completed_weeks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_roadmap_user ON learning_roadmaps(user_id);

-- Progress history table
CREATE TABLE IF NOT EXISTS progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    company VARCHAR(255),
    role VARCHAR(255),
    interview_date TIMESTAMP,
    overall_score FLOAT,
    technical_score FLOAT,
    communication_score FLOAT,
    confidence_score FLOAT,
    problem_solving_score FLOAT,
    score_delta FLOAT,
    time_bucket VARCHAR(20),
    bucket_period VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_progress_history_user ON progress_history(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_interview ON progress_history(interview_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_time ON progress_history(time_bucket, bucket_period);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- User goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value INTEGER,
    target_company VARCHAR(255),
    target_role VARCHAR(255),
    target_skill VARCHAR(100),
    target_score INTEGER,
    target_days INTEGER,
    current_value INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    progress_percentage FLOAT DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_date TIMESTAMP,
    completed_at TIMESTAMP,
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_frequency VARCHAR(20) DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);

-- Add analytics fields to existing reports table
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;