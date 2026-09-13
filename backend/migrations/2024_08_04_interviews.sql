-- Interviews table
-- Base interview schema matching src/models/interview.model.js

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    resume_id UUID,

    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,

    stage VARCHAR(50) NOT NULL DEFAULT 'screening'
        CHECK (stage IN (
            'screening',
            'technical',
            'system_design',
            'behavioral',
            'final',
            'offer',
            'rejected'
        )),

    status VARCHAR(50) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN (
            'scheduled',
            'in_progress',
            'completed',
            'cancelled',
            'rescheduled'
        )),

    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,

    duration_minutes INTEGER,

    interview_type VARCHAR(50),
    difficulty VARCHAR(20),
    interview_duration INTEGER,

    start_time TIMESTAMP,
    end_time TIMESTAMP,

    score INTEGER,

    feedback TEXT,
    notes TEXT,

    interviewer_name VARCHAR(255),
    interviewer_email VARCHAR(255),
    meeting_link VARCHAR(500),

    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interviews_user_id
    ON interviews(user_id);

CREATE INDEX IF NOT EXISTS idx_interviews_user_status
    ON interviews(user_id, status);

CREATE INDEX IF NOT EXISTS idx_interviews_user_scheduled
    ON interviews(user_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_interviews_user_completed
    ON interviews(user_id, completed_at);