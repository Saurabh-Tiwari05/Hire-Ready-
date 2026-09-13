CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,2),
    technical_score NUMERIC(5,2),
    communication_score NUMERIC(5,2),
    confidence_score NUMERIC(5,2),
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    interview_context JSONB,
    evaluation_json JSONB,
    summary_report JSONB,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evaluations_interview_id ON evaluations(interview_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);

CREATE TABLE IF NOT EXISTS question_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    message_id UUID REFERENCES interview_messages(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    question_id VARCHAR(50),
    answer_text TEXT,
    technical_accuracy NUMERIC(5,2),
    communication NUMERIC(5,2),
    problem_solving NUMERIC(5,2),
    clarity NUMERIC(5,2),
    confidence NUMERIC(5,2),
    completeness NUMERIC(5,2),
    relevance NUMERIC(5,2),
    grammar NUMERIC(5,2),
    overall_score NUMERIC(5,2),
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    missing_concepts JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    keywords JSONB DEFAULT '[]'::jsonb,
    next_difficulty VARCHAR(20),
    next_question_focus VARCHAR(255),
    evaluation_json JSONB,
    response_duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_eval_evaluation_id ON question_evaluations(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_question_eval_interview_id ON question_evaluations(interview_id);
CREATE INDEX IF NOT EXISTS idx_question_eval_message_id ON question_evaluations(message_id);
