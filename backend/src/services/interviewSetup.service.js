// Interview Setup Service - orchestrates the multi-step interview setup wizard
const { Interview, CandidateProfile, InterviewContext } = require('../models');
const InterviewContextService = require('./interviewContext.service');
const { Op } = require('sequelize');

const STEPS = {
  PROFILE_CHECK: 'profile_check',
  COMPANY_ROLE: 'company_role',
  INTERVIEW_CONFIG: 'interview_config',
  CONFIRMATION: 'confirmation',
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
const TYPES = ['technical', 'behavioral', 'system_design', 'coding', 'mixed', 'screening'];
const DURATIONS = [10,30, 45, 60, 90, 120];

/**
 * Check if user's profile is ready for interview setup
 */
exports.checkProfileReadiness = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  if (!profile) {
    return {
      exists: false,
      isVerified: false,
      isComplete: false,
      missingFields: ['profile_not_created'],
      profile: null,
    };
  }

  const requiredFields = [
    'full_name', 'email', 'summary',
    'experience', 'education', 'skills',
  ];

  const missingFields = requiredFields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return !value || value === '';
  });

  return {
    exists: true,
    isVerified: profile.is_verified,
    isComplete: profile.is_complete,
    missingFields,
    profile: profile.toJSON(),
  };
};

/**
 * Validate a wizard step
 */
exports.validateStep = async (userId, step, data) => {
  switch (step) {
    case STEPS.COMPANY_ROLE:
      return validateCompanyRoleStep(data);

    case STEPS.INTERVIEW_CONFIG:
      return validateInterviewConfigStep(data);

    case STEPS.CONFIRMATION:
      return { valid: true, errors: [] };

    default:
      return { valid: false, errors: ['Invalid step'] };
  }
};

function validateCompanyRoleStep(data) {
  const errors = [];

  if (!data.company || data.company.trim().length < 2) {
    errors.push('Company name is required (minimum 2 characters)');
  }

  if (!data.role || data.role.trim().length < 2) {
    errors.push('Role is required (minimum 2 characters)');
  }

  if (data.company && data.company.length > 255) {
    errors.push('Company name too long (max 255 characters)');
  }

  if (data.role && data.role.length > 255) {
    errors.push('Role too long (max 255 characters)');
  }

  return { valid: errors.length === 0, errors };
}

function validateInterviewConfigStep(data) {
  const errors = [];

  if (!DIFFICULTIES.includes(data.difficulty)) {
    errors.push(`Invalid difficulty. Must be one of: ${DIFFICULTIES.join(', ')}`);
  }

  if (!TYPES.includes(data.type)) {
    errors.push(`Invalid interview type. Must be one of: ${TYPES.join(', ')}`);
  }

  if (!DURATIONS.includes(data.durationMinutes)) {
    errors.push(`Invalid duration. Must be one of: ${DURATIONS.join(', ')} minutes`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create interview session with context
 */
exports.createInterviewSession = async (userId, config) => {
  const {
    company,
    role,
    difficulty = 'medium',
    type = 'mixed',
    durationMinutes = 60,
  } = config;

  // Create interview record
  const interview = await Interview.create({
    user_id: userId,
    company: company.trim(),
    role: role.trim(),
    stage: 'screening',
    status: 'scheduled',
    duration_minutes: durationMinutes,
    metadata: {
      difficulty,
      type,
      wizardCreated: true,
    },
  });

  // Build interview context
  const context = await InterviewContextService.buildContext(userId, {
    company: company.trim(),
    role: role.trim(),
    difficulty,
    type,
    durationMinutes,
    interviewId: interview.id,
  });

  // Update interview with context ID
  interview.metadata = {
    ...interview.metadata,
    contextId: context.id,
  };
  await interview.save();

  return {
    interview: interview.toJSON(),
    context: context,
  };
};

/**
 * Get interview session by ID
 */
exports.getInterviewSession = async (userId, sessionId) => {
  const interview = await Interview.findOne({
    where: { id: sessionId, user_id: userId },
    include: [
      { model: InterviewContext, as: 'interviewContext' },
    ],
  });

  return interview ? interview.toJSON() : null;
};

/**
 * Get all user interview sessions
 */
exports.getUserSessions = async (userId) => {
  const interviews = await Interview.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    include: [
      { model: InterviewContext, as: 'interviewContext', required: false },
    ],
  });

  return interviews.map(i => i.toJSON());
};

/**
 * Update interview session
 */
exports.updateSession = async (userId, sessionId, updates) => {
  const interview = await Interview.findOne({
    where: { id: sessionId, user_id: userId },
  });

  if (!interview) {
    throw new Error('Interview session not found');
  }

  // Only allow updates if not started
  if (interview.status !== 'scheduled') {
    throw new Error('Cannot update interview that has already started');
  }

  const allowedUpdates = ['company', 'role', 'scheduled_at', 'duration_minutes', 'metadata'];
  const filteredUpdates = {};

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  await interview.update(filteredUpdates);

  // If difficulty/type changed, update context
  if (updates.metadata?.difficulty || updates.metadata?.type) {
    const context = await InterviewContext.findOne({
      where: { interview_id: sessionId },
    });

    if (context) {
      context.difficulty = updates.metadata.difficulty || context.difficulty;
      context.type = updates.metadata.type || context.type;
      context.duration_minutes = updates.duration_minutes || context.duration_minutes;
      await context.save();
    }
  }

  return interview.toJSON();
};

/**
 * Delete interview session
 */
exports.deleteSession = async (userId, sessionId) => {
  const interview = await Interview.findOne({
    where: { id: sessionId, user_id: userId },
  });

  if (!interview) {
    throw new Error('Interview session not found');
  }

  // Only allow deletion if not completed
  if (interview.status === 'completed') {
    throw new Error('Cannot delete completed interview');
  }

  // Deactivate context
  const context = await InterviewContext.findOne({
    where: { interview_id: sessionId },
  });

  if (context) {
    context.is_active = false;
    await context.save();
  }

  await interview.destroy();

  return { success: true };
};

/**
 * Get wizard configuration options
 */
exports.getWizardOptions = () => {
  return {
    difficulties: DIFFICULTIES.map(d => ({
      value: d,
      label: d.charAt(0).toUpperCase() + d.slice(1),
      description: getDifficultyDescription(d),
    })),
    types: TYPES.map(t => ({
      value: t,
      label: t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      description: getTypeDescription(t),
    })),
    durations: DURATIONS.map(d => ({
      value: d,
      label: `${d} minutes`,
    })),
    steps: [
      { id: STEPS.PROFILE_CHECK, title: 'Profile Check', description: 'Verify your candidate profile' },
      { id: STEPS.COMPANY_ROLE, title: 'Company & Role', description: 'Enter target company and role' },
      { id: STEPS.INTERVIEW_CONFIG, title: 'Interview Config', description: 'Set difficulty, type, and duration' },
      { id: STEPS.CONFIRMATION, title: 'Confirmation', description: 'Review and create interview session' },
    ],
  };
};

function getDifficultyDescription(difficulty) {
  const descriptions = {
    easy: 'Entry-level questions, fundamental concepts',
    medium: 'Standard interview questions, practical problems',
    hard: 'Advanced questions, complex system design',
    expert: 'Expert-level, architecture & leadership focus',
  };
  return descriptions[difficulty] || '';
}

function getTypeDescription(type) {
  const descriptions = {
    technical: 'Core technical knowledge and problem solving',
    behavioral: 'Soft skills, teamwork, and past experiences',
    system_design: 'Architecture, scalability, and design patterns',
    coding: 'Live coding, algorithms, and data structures',
    mixed: 'Balanced mix of all question types',
    screening: 'Quick screening for basic qualification',
  };
  return descriptions[type] || '';
}