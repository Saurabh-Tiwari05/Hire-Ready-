-- Process 14: Advanced Candidate Profile Tables

-- Education table
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    school VARCHAR(255),
    college VARCHAR(255),
    university VARCHAR(255),
    degree VARCHAR(100),
    branch VARCHAR(100),
    marks VARCHAR(50),
    cgpa DECIMAL(3,2),
    graduation_year INTEGER,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    achievements JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_education_profile ON education(candidate_profile_id);

-- Work Experience table
CREATE TABLE IF NOT EXISTS work_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    responsibilities TEXT,
    achievements JSONB DEFAULT '[]'::jsonb,
    technology_stack JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_exp_profile ON work_experience(candidate_profile_id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    github_link VARCHAR(500),
    live_url VARCHAR(500),
    technology_stack JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    role VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    ai_improved_description TEXT,
    ai_suggestions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_profile ON projects(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured);

-- Certifications table
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(255),
    date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    verification_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_certifications_profile ON certifications(candidate_profile_id);

-- Achievements table
-- NOTE: 'achievements' may already exist (created by analytics migration keyed by user_id).
-- This section is additive: it adds candidate-profile-level columns to the existing table
-- and indexes what actually exists.
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50),
    candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    organization VARCHAR(255),
    date DATE,
    url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Additive columns for compatibility with both schemas
ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS achievement_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_achievements_profile ON achievements(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(type);

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    speaking VARCHAR(20) DEFAULT 'basic',
    reading VARCHAR(20) DEFAULT 'basic',
    writing VARCHAR(20) DEFAULT 'basic',
    proficiency VARCHAR(20) DEFAULT 'basic',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_languages_profile ON languages(candidate_profile_id);

-- Social Links table
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    platform VARCHAR(30) NOT NULL,
    url VARCHAR(500) NOT NULL,
    username VARCHAR(255),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_links_profile ON social_links(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_social_links_platform ON social_links(platform);

-- Profile Settings table
CREATE TABLE IF NOT EXISTS profile_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    profile_visibility VARCHAR(20) DEFAULT 'private',
    share_reports BOOLEAN DEFAULT FALSE,
    share_resume BOOLEAN DEFAULT FALSE,
    share_achievements BOOLEAN DEFAULT FALSE,
    allow_messages BOOLEAN DEFAULT TRUE,
    allow_interview_requests BOOLEAN DEFAULT TRUE,
    email_notifications JSONB DEFAULT '{"interviewUpdates": true, "reportReady": true, "newAchievements": true, "careerInsights": true, "weeklySummary": false}'::jsonb,
    push_notifications JSONB DEFAULT '{"interviewUpdates": true, "reportReady": true}'::jsonb,
    allow_data_analytics BOOLEAN DEFAULT TRUE,
    allow_profile_export BOOLEAN DEFAULT TRUE,
    settings_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile Completion table
CREATE TABLE IF NOT EXISTS profile_completion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personal_info INTEGER DEFAULT 0,
    education INTEGER DEFAULT 0,
    work_experience INTEGER DEFAULT 0,
    projects INTEGER DEFAULT 0,
    skills INTEGER DEFAULT 0,
    certifications INTEGER DEFAULT 0,
    achievements INTEGER DEFAULT 0,
    languages INTEGER DEFAULT 0,
    social_links INTEGER DEFAULT 0,
    summary INTEGER DEFAULT 0,
    overall_completion INTEGER DEFAULT 0,
    missing_fields JSONB DEFAULT '[]'::jsonb,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profile_completion_user ON profile_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_completion_overall ON profile_completion(overall_completion);