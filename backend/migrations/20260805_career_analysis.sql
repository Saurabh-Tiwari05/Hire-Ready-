-- Process 13: Career Analysis Tables

CREATE TABLE IF NOT EXISTS career_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_career_readiness INTEGER DEFAULT 0,
    breakdown_scores JSONB DEFAULT '{}'::jsonb,
    career_insights JSONB DEFAULT '[]'::jsonb,
    recommended_next_interview VARCHAR(100),
    last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS ats_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score INTEGER DEFAULT 0,
    category_scores JSONB DEFAULT '{}'::jsonb,
    keyword_optimization INTEGER DEFAULT 0,
    formatting INTEGER DEFAULT 0,
    projects_quality INTEGER DEFAULT 0,
    education_completeness INTEGER DEFAULT 0,
    grammar INTEGER DEFAULT 0,
    action_verbs INTEGER DEFAULT 0,
    section_ordering INTEGER DEFAULT 0,
    missing_sections JSONB DEFAULT '[]'::jsonb,
    strengths_keywords JSONB DEFAULT '[]'::jsonb,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resume_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    suggestions JSONB DEFAULT '[]'::jsonb,
    action_items JSONB DEFAULT '[]'::jsonb,
    priority VARCHAR(10) DEFAULT 'medium',
    implemented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    job_category VARCHAR(100),
    match_score INTEGER,
    technical_fit INTEGER,
    experience_fit INTEGER,
    skills_match JSONB DEFAULT '{"matched": [], "missing": []}'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    gaps JSONB DEFAULT '[]'::jsonb,
    preparation_needed TEXT,
    readiness_status VARCHAR(50) DEFAULT 'needs_preparation',
    estimated_prep_days INTEGER,
    recommendation VARCHAR(50),
    is_target_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_size VARCHAR(50),
    company_type VARCHAR(100),
    overall_readiness INTEGER,
    technical_readiness INTEGER,
    communication_readiness INTEGER,
    culture_fit INTEGER,
    required_skills JSONB DEFAULT '[]'::jsonb,
    matching_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    preparation_recommendations JSONB DEFAULT '[]'::jsonb,
    interview_focus_areas JSONB DEFAULT '[]'::jsonb,
    confidence_score INTEGER DEFAULT 0,
    estimated_prep_time VARCHAR(100),
    readiness_status VARCHAR(50) DEFAULT 'needs_preparation',
    interview_expectations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skill_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    category VARCHAR(30),
    current_level INTEGER,
    required_level INTEGER,
    priority VARCHAR(10) DEFAULT 'medium',
    recommended_resources JSONB DEFAULT '[]'::jsonb,
    related_to_roles JSONB DEFAULT '[]'::jsonb,
    related_to_companies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS preparation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    weeks JSONB NOT NULL,
    items_completed JSONB DEFAULT '[]'::jsonb,
    total_items INTEGER DEFAULT 0,
    progress_percentage FLOAT DEFAULT 0,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_completion_date TIMESTAMP,
    completed_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    generated_from VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    resource_url VARCHAR(500) NOT NULL,
    resource_type VARCHAR(50),
    description TEXT,
    related_skills JSONB DEFAULT '[]'::jsonb,
    related_topics JSONB DEFAULT '[]'::jsonb,
    source VARCHAR(100),
    priority VARCHAR(10) DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);