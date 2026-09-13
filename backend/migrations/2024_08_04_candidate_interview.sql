-- Candidate profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    full_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    summary TEXT,
    experience JSONB DEFAULT '[]',
    education JSONB DEFAULT '[]',
    skills JSONB DEFAULT '{"technical": [], "languages": [], "frameworks": [], "tools": [], "soft": []}',
    projects JSONB DEFAULT '[]',
    certifications JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    analysis JSONB DEFAULT '{"totalYearsExperience": 0, "seniorityLevel": "Mid", "primaryRole": "", "strongAreas": [], "weakAreas": [], "recommendedRoles": [], "skillGaps": [], "interviewFocusAreas": []}',
    is_verified BOOLEAN DEFAULT false,
    is_complete BOOLEAN DEFAULT false,
    raw_parsed_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for candidate_profiles
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id ON candidate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume_id ON candidate_profiles(resume_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_verified ON candidate_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_complete ON candidate_profiles(is_complete);

-- Interview contexts table
CREATE TABLE IF NOT EXISTS interview_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES interviews(id) ON DELETE SET NULL,
    candidate_profile_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    type VARCHAR(50) NOT NULL DEFAULT 'mixed',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    candidate_summary JSONB,
    strong_areas JSONB DEFAULT '[]',
    weak_areas JSONB DEFAULT '[]',
    skill_gaps JSONB DEFAULT '[]',
    interview_focus_areas JSONB DEFAULT '[]',
    previous_interviews_summary JSONB DEFAULT '{"totalCount": 0, "completedCount": 0, "averageScore": null, "recentTopics": [], "improvementAreas": []}',
    generated_questions JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for interview_contexts
CREATE INDEX IF NOT EXISTS idx_interview_contexts_user_id ON interview_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_contexts_interview_id ON interview_contexts(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_contexts_candidate_profile_id ON interview_contexts(candidate_profile_id);
CREATE INDEX IF NOT EXISTS idx_interview_contexts_is_active ON interview_contexts(is_active);
CREATE INDEX IF NOT EXISTS idx_interview_contexts_company_role ON interview_contexts(company, role);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_candidate_profiles_updated_at ON candidate_profiles;
CREATE TRIGGER update_candidate_profiles_updated_at
    BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_contexts_updated_at ON interview_contexts;
CREATE TRIGGER update_interview_contexts_updated_at
    BEFORE UPDATE ON interview_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();