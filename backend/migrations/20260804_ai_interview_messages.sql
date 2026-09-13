CREATE TABLE IF NOT EXISTS interview_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    interview_context_id UUID REFERENCES interview_contexts(id) ON DELETE SET NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'question',
    role VARCHAR(10) NOT NULL DEFAULT 'assistant',
    content TEXT NOT NULL,
    question_id VARCHAR(50),
    answer TEXT,
    evaluation JSONB,
    confidence_score NUMERIC(5,2),
    mistakes JSONB,
    topic VARCHAR(255),
    difficulty VARCHAR(10),
    estimated_time_minutes INT,
    actual_time_seconds INT,
    is_correct BOOLEAN DEFAULT false,
    repeated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interview_id ON interview_messages(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_context_id ON interview_messages(interview_context_id);
CREATE INDEX IF NOT EXISTS idx_message_type ON interview_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_created_at ON interview_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_is_correct ON interview_messages(is_correct);