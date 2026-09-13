// Interview Context Service - builds and manages interview context objects
const { InterviewContext, CandidateProfile, Interview, User, InterviewMessage } = require('../models');
const { Op } = require('sequelize');

/**
 * Build interview context from candidate profile and interview configuration
 * @param {string} userId - User ID
 * @param {Object} interviewConfig - Interview configuration
 * @returns {Promise<Object>} Complete interview context
 */
exports.buildContext = async (userId, interviewConfig) => {
  const {
    company,
    role,
    difficulty = 'medium',
    type = 'mixed',
    durationMinutes = 60,
    interviewId = null,
  } = interviewConfig;

  // Get candidate profile
  const candidateProfile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  if (!candidateProfile) {
    throw new Error('Candidate profile not found. Please upload and parse a resume first.');
  }

  // Get previous interview history
  const previousInterviews = await Interview.findAll({
    where: {
      user_id: userId,
      status: 'completed',
    },
    order: [['completed_at', 'DESC']],
    limit: 10,
    attributes: [
      'id', 'company', 'role', 'stage', 'score', 'feedback',
      'completed_at', 'duration_minutes',
    ],
  });

  // Build candidate summary
  const candidateSummary = {
    name: candidateProfile.full_name,
    email: candidateProfile.email,
    seniorityLevel: candidateProfile.analysis?.seniorityLevel || 'Mid',
    primaryRole: candidateProfile.analysis?.primaryRole || role,
    totalYearsExperience: candidateProfile.analysis?.totalYearsExperience || 0,
    skills: flattenSkills(candidateProfile.skills),
    topTechnologies: getTopTechnologies(candidateProfile.experience, candidateProfile.skills),
    experienceCount: candidateProfile.experience?.length || 0,
    educationCount: candidateProfile.education?.length || 0,
  };

  // Build previous interviews summary
  const previousInterviewsSummary = buildPreviousInterviewsSummary(previousInterviews);

  // Create or update interview context
  let context = await InterviewContext.findOne({
    where: {
      user_id: userId,
      interview_id: interviewId,
    },
  });

  const contextData = {
    user_id: userId,
    interview_id: interviewId,
    candidate_profile_id: candidateProfile.id,
    company,
    role,
    difficulty,
    type,
    duration_minutes: durationMinutes,
    candidate_summary: candidateSummary,
    strong_areas: candidateProfile.analysis?.strongAreas || [],
    weak_areas: candidateProfile.analysis?.weakAreas || [],
    skill_gaps: candidateProfile.analysis?.skillGaps || [],
    interview_focus_areas: candidateProfile.analysis?.interviewFocusAreas || [],
    previous_interviews_summary: previousInterviewsSummary,
    is_active: true,
  };

  if (context) {
    await context.update(contextData);
  } else {
    context = await InterviewContext.create(contextData);
  }

  return context.toJSON();
};

/**
 * Get interview context by ID
 * @param {string} contextId - Context ID
 * @returns {Promise<Object|null>} Context or null
 */
exports.getContextById = async (contextId) => {
  const context = await InterviewContext.findByPk(contextId, {
    include: [
      { model: CandidateProfile, as: 'candidateProfile' },
      { model: Interview, as: 'interview' },
    ],
  });

  return context ? context.toJSON() : null;
};

/**
 * Get active interview context for user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Active context or null
 */
exports.getActiveContext = async (userId) => {
  const context = await InterviewContext.findOne({
    where: { user_id: userId, is_active: true },
    order: [['created_at', 'DESC']],
  });

  return context ? context.toJSON() : null;
};

/**
 * Update context with generated questions
 * @param {string} contextId - Context ID
 * @param {Array} questions - Generated questions
 * @returns {Promise<Object>} Updated context
 */
exports.updateGeneratedQuestions = async (contextId, questions) => {
  const context = await InterviewContext.findByPk(contextId);
  if (!context) {
    throw new Error('Interview context not found');
  }

  context.generated_questions = questions;
  await context.save();

  return context.toJSON();
};

/**
 * Get context for interview session (used by question generator)
 * @param {string} contextId - Context ID
 * @returns {Promise<Object>} Formatted context for session
 */
exports.getSessionContext = async (contextId) => {
  const context = await InterviewContext.findByPk(contextId, {
    include: [
      { model: CandidateProfile, as: 'candidateProfile' },
      {
        model: Interview,
        as: 'interview',
        include: [
          {
            model: InterviewMessage,
            as: 'messages',
            order: [['created_at', 'ASC']],
            required: false,
          },
        ],
        required: false,
      },
    ],
  });

  if (!context) {
    throw new Error('Interview context not found');
  }

  // Format for interview session
  return {
    id: context.id,
    interviewId: context.interview_id,
    interviewMessageId: context.interview?.messages?.length > 0
      ? context.interview.messages[context.interview.messages.length - 1].id
      : null,
    messages: context.interview?.messages || [],
    candidate: {
      profileId: context.candidate_profile_id,
      name: context.candidate_summary?.name,
      seniorityLevel: context.candidate_summary?.seniorityLevel,
      primaryRole: context.candidate_summary?.primaryRole,
      totalYearsExperience: context.candidate_summary?.totalYearsExperience,
      skills: context.candidate_summary?.skills,
      topTechnologies: context.candidate_summary?.topTechnologies,
    },
    interview: {
      company: context.company,
      role: context.role,
      difficulty: context.difficulty,
      type: context.type,
      durationMinutes: context.duration_minutes,
    },
    strongAreas: context.strong_areas,
    weakAreas: context.weak_areas,
    skillGaps: context.skill_gaps,
    interviewFocusAreas: context.interview_focus_areas,
    previousInterviews: context.previous_interviews_summary,
    generatedQuestions: context.generated_questions,
  };
};

/**
 * Deactivate context (when interview completes)
 * @param {string} contextId - Context ID
 * @returns {Promise<Object>} Updated context
 */
exports.deactivateContext = async (contextId) => {
  const context = await InterviewContext.findByPk(contextId);
  if (!context) {
    throw new Error('Interview context not found');
  }

  context.is_active = false;
  await context.save();

  return context.toJSON();
};

/**
 * Flatten skills object to array
 */
function flattenSkills(skills) {
  if (!skills) return [];
  const allSkills = [];
  for (const category of Object.values(skills)) {
    if (Array.isArray(category)) {
      allSkills.push(...category);
    }
  }
  return [...new Set(allSkills)];
}

/**
 * Extract top technologies from experience and skills
 */
function getTopTechnologies(experience, skills) {
  const techCount = {};

  // Count from experience technologies
  if (experience) {
    for (const exp of experience) {
      if (exp.technologies) {
        for (const tech of exp.technologies) {
          techCount[tech] = (techCount[tech] || 0) + 2; // Weight experience higher
        }
      }
    }
  }

  // Count from skills
  if (skills) {
    for (const category of Object.values(skills)) {
      if (Array.isArray(category)) {
        for (const skill of category) {
          techCount[skill] = (techCount[skill] || 0) + 1;
        }
      }
    }
  }

  // Return top 15
  return Object.entries(techCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tech]) => tech);
}

/**
 * Build previous interviews summary
 */
function buildPreviousInterviewsSummary(interviews) {
  if (!interviews || interviews.length === 0) {
    return {
      totalCount: 0,
      completedCount: 0,
      averageScore: null,
      recentTopics: [],
      improvementAreas: [],
    };
  }

  const completed = interviews.filter(i => i.status === 'completed');
  const scores = completed.map(i => i.score).filter(s => s !== null);

  // Extract topics from feedback
  const topics = [];
  const improvementAreas = [];

  for (const interview of completed) {
    if (interview.feedback) {
      // Simple keyword extraction from feedback
      const words = interview.feedback.toLowerCase().split(/\s+/);
      // In production, use NLP to extract topics
    }
  }

  return {
    totalCount: interviews.length,
    completedCount: completed.length,
    averageScore: scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    recentTopics: topics.slice(0, 10),
    improvementAreas: improvementAreas.slice(0, 5),
    recentCompanies: [...new Set(completed.slice(0, 5).map(i => i.company))],
    recentRoles: [...new Set(completed.slice(0, 5).map(i => i.role))],
  };
}