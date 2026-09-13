// CareerController - handles all career analysis and job matching endpoints
const CareerRepository = require('../repositories/career.repository');
const ATSService = require('../services/ats.service');
const JobMatchingService = require('../services/jobMatching.service');
const SkillGapService = require('../services/skillGap.service');
const LearningResourceService = require('../services/learningResource.service');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

let aiModel = null;
function getGeminiModel() {
  if (!aiModel && GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    aiModel = genAI.getGenerativeModel({ model: MODEL_NAME });
  }
  return aiModel;
}

/**
 * POST /api/career/start-analysis
 * Start comprehensive career analysis
 */
exports.startCareerAnalysis = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const { resumeId, targetRoles = [], targetCompanies = [] } = req.body;

  const candidateProfile = await CareerRepository.getCandidateProfileByUserId(userId);
  if (!candidateProfile) {
    return next(new AppError('Candidate profile not found', 404));
  }

  const interviewScores = await CareerRepository.getInterviewScoresByUserId(userId);

  const atsScore = await ATSService.calculateATSScore(candidateProfile.resume, candidateProfile, {
    company: targetCompanies[0] || '',
    role: targetRoles[0] || '',
    targetSkills: ['Node.js', 'React', 'SQL'],
  });

  const skillGaps = await SkillGapService.analyzeSkillGaps(candidateProfile, targetRoles, interviewScores);
  await SkillGapService.storeSkillGaps(userId, skillGaps);

  const jobMatches = await JobMatchingService.matchJobRoles(candidateProfile, interviewScores);
  await CareerRepository.clearJobMatchesByUserId(userId);
  await CareerRepository.bulkCreateJobMatches(userId, jobMatches);

  const companyMatches = await JobMatchingService.matchCompanies(candidateProfile, targetCompanies || []);
  await CareerRepository.clearCompanyMatchesByUserId(userId);
  await CareerRepository.bulkCreateCompanyMatches(userId, companyMatches);

  // Generate AI insights
  const model = getGeminiModel();
  let careerInsights = [];
  if (model) {
    const insightPrompt = `You are a career coach analyzing an interview candidate. Generate 3-5 actionable, personalized career insights based on the following data:

ATS Score: ${atsScore.overallScore}
Interview Scores: ${JSON.stringify(interviewScores)}
Candidate Skills: ${JSON.stringify(candidateProfile.skills || {})}
Skill Gaps: ${JSON.stringify(skillGaps.map(g => g.skillName))}
Job Matches: ${JSON.stringify(jobMatches.map(j => ({ title: j.jobTitle, matchScore: j.matchScore }))) || '[]'}
Target Roles: ${JSON.stringify(targetRoles)}

Return ONLY valid JSON array of 3-5 insight strings.`;

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: insightPrompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      });
      careerInsights = JSON.parse(result.response.text());
    } catch (parseError) {
      careerInsights = [
        'Your resume aligns well with backend development roles.',
        'Focus on improving system design concepts for senior roles.',
        'Practice behavioral questions to improve communication scores.',
      ];
    }
  }

  const readinessScore = Math.round(
    (atsScore.overallScore * 0.35) +
    (jobMatches.reduce((sum, job) => sum + job.matchScore, 0) / (jobMatches.length || 1) * 0.4) +
    (Math.min(skillGaps.length * 5, 50) * -1 + 50) * 0.25
  );

  const careerAnalysis = await CareerRepository.createCareerAnalysis({
    userId,
    overallCareerReadiness: readinessScore,
    breakdownScores: {
      resumeQuality: atsScore.keywordOptimization,
      technicalFit: jobMatches.reduce((sum, job) => sum + job.technicalFit, 0) / (jobMatches.length || 1) || 0,
      communicationFit: atsScore.communication || 0,
      preparationLevel: skillGaps.length > 3 ? 30 : 70,
    },
    careerInsights,
    recommendedNextInterview: skillGaps.length > 2 ? 'System Design' : 'Behavioral',
  });

  await CareerRepository.createATSScore({
    userId,
    resumeId: resumeId || candidateProfile.resume_id,
    overallScore: atsScore.overallScore,
    categoryScores: {
      keywordOptimization: atsScore.keywordOptimization,
      formatting: atsScore.formatting,
      projectsQuality: atsScore.projectsQuality,
      educationCompleteness: atsScore.educationCompleteness,
      grammar: atsScore.grammar,
      actionVerbs: atsScore.actionVerbs,
      sectionOrdering: atsScore.sectionOrdering,
    },
    keywordOptimization: atsScore.keywordOptimization,
    formatting: atsScore.formatting,
    projectsQuality: atsScore.projectsQuality,
    educationCompleteness: atsScore.educationCompleteness,
    grammar: atsScore.grammar,
    actionVerbs: atsScore.actionVerbs,
    sectionOrdering: atsScore.sectionOrdering,
    missingSections: atsScore.missingSections,
    strengthsKeywords: atsScore.strengthsKeywords,
    missingKeywords: atsScore.missingKeywords,
    improvementSuggestions: atsScore.improvementSuggestions,
  });

  res.status(201).json({
    status: 'success',
    data: {
      careerAnalysis,
      atsScore,
      skillGaps,
      jobMatches,
      companyMatches,
    },
  });
});

/**
 * GET /api/career/analysis
 * Get user's career analysis
 */
exports.getCareerAnalysis = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;

  const careerAnalysis = await CareerRepository.getCareerAnalysisByUserId(userId);
  const atsScore = await CareerRepository.getLatestATSScoreByUserId(userId);
  const skillGaps = await CareerRepository.getSkillGapsByUserId(userId);
  const jobMatches = await CareerRepository.getJobMatchesByUserId(userId);
  const companyMatches = await CareerRepository.getCompanyMatchesByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: {
      careerAnalysis: careerAnalysis || null,
      atsScore: atsScore || null,
      skillGaps: skillGaps || [],
      jobMatches: jobMatches || [],
      companyMatches: companyMatches || [],
    },
  });
});

/**
 * GET /api/career/job-matches
 * Get job matches for user
 */
exports.getJobMatches = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const jobMatches = await CareerRepository.getJobMatchesByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: jobMatches || [],
  });
});

/**
 * GET /api/career/company-matches
 * Get company matches for user
 */
exports.getCompanyMatches = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const companyMatches = await CareerRepository.getCompanyMatchesByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: companyMatches || [],
  });
});

/**
 * POST /api/career/generate-learning-resources
 * Generate personalized learning resources
 */
exports.generateLearningResources = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const { skills, skillGaps, preferredTypes } = req.body;

  const resources = await LearningResourceService.recommendResources(skills, skillGaps || [], preferredTypes);

  res.status(200).json({
    status: 'success',
    data: {
      resources,
      total: resources.length,
      highPriority: resources.filter(r => r.priority === 'high'),
      byType: {
        article: resources.filter(r => r.type === 'article'),
        course: resources.filter(r => r.type === 'course'),
        documentation: resources.filter(r => r.type === 'documentation'),
        platform: resources.filter(r => r.type === 'platform'),
        video: resources.filter(r => r.type === 'video'),
        repository: resources.filter(r => r.type === 'repository'),
        book: resources.filter(r => r.type === 'book'),
      },
    },
  });
});

/**
 * POST /api/career/preparation-plan
 * Generate personalized preparation plan
 */
exports.generatePreparationPlan = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;

  const skillGaps = await CareerRepository.getSkillGapsByUserId(userId);
  const jobMatches = await CareerRepository.getJobMatchesByUserId(userId);

  const plan = {
    userId,
    planType: 'daily',
    title: `Interview Preparation Plan - ${skillGaps.length > 2 ? 'Advanced' : 'Intermediate'} Level`,
    description: `Personalized interview preparation plan based on current skills and interview performance. Focus on ${skillGaps.length} critical areas to improve.`,
    weeks: _generateWeeks(skillGaps, jobMatches),
    totalItems: _calculateTotalItems(skillGaps),
    progressPercentage: 0,
    startDate: new Date().toISOString(),
    targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  await CareerRepository.createPreparationPlan(plan);

  res.status(201).json({
    status: 'success',
    data: plan,
  });
});

/**
 * GET /api/career/preparation-plan
 * Get user's active preparation plan
 */
exports.getActivePreparationPlan = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;

  const plan = await CareerRepository.findActivePreparationPlanByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: plan || null,
  });
});

/**
 * POST /api/career/preparation-plan/progress
 * Update preparation plan progress
 */
exports.updatePreparationPlanProgress = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const { planId, completedItems } = req.body;

  if (!planId) {
    return next(new AppError('planId is required', 400));
  }

  const plan = await CareerRepository.updatePreparationPlan(planId, {
    itemsCompleted: completedItems,
    progressPercentage: Math.min(100, (completedItems?.length || 0) * 5),
  });

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

/**
 * GET /api/career/achievements
 * Get user's achievements
 */
exports.getAchievements = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const achievements = await CareerRepository.getAchievementsByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: achievements || [],
  });
});

/**
 * GET /api/career/goals
 * Get user's goals
 */
exports.getGoals = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;
  const goals = await CareerRepository.getGoalsByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: goals || [],
  });
});

// Helper functions (not exported - internal use)
function _generateWeeks(skillGaps, jobMatches) {
  const weekPlans = [];
  const targetRole = (jobMatches.length > 0 && jobMatches[0].title) ? jobMatches[0].title : 'Software Engineer';

  // Week 1: Fundamentals
  weekPlans.push({
    week: 1,
    title: 'Foundation & Fundamentals',
    focus: 'Strengthen core concepts and review essential topics',
    actionItems: [
      'Complete ' + (skillGaps.length > 5 ? '5' : '3') + ' fundamental programming exercises',
      'Review ' + targetRole + ' basics and expectations',
      'Practice technical problem-solving daily',
      'Set up development environment and tools',
    ],
    resources: [
      { name: 'Learn Python basics', url: 'https://www.python.org/doc/intro/', type: 'course' },
      { name: 'Git version control', url: 'https://github.com/', type: 'documentation' },
      { name: 'Data structures basics', url: 'https://www.cs.princeton.edu/courses/archive/spring18/cos226/assignments/', type: 'course' },
    ],
  });

  // Week 2: Skill Development
  weekPlans.push({
    week: 2,
    title: 'Skill Development',
    focus: 'Develop skills relevant to target role',
    actionItems: [
      'Build projects using ' + (targetRole.toLowerCase().includes('backend') ? 'Node.js/Express' : targetRole.toLowerCase().includes('frontend') ? 'React/Vue' : 'relevant technologies') + ' (2-3 projects),',
      'Implement ' + (skillGaps.filter(gap => gap.priority === 'high').length) + ' priority skills',
      'Create portfolio showcasing relevant work',
      'Join relevant communities/online forums',
    ],
    resources: [
      { name: 'Project template repository', url: 'https://github.com/topics/backend-project', type: 'repository' },
      { name: 'Interview preparation guide', url: 'https://interviewing.io/', type: 'article' },
    ],
  });

  // Week 3: Mock Interviews
  weekPlans.push({
    week: 3,
    title: 'Mock Interviews & Feedback',
    focus: 'Practice interviews and get feedback',
    actionItems: [
      'Schedule mock interviews (2-3 sessions)',
      'Review and analyze interview recordings',
      'Identify weak areas and improve',
      'Seek mentorship feedback',
    ],
    resources: [
      { name: 'Mock interview platforms', url: 'https://interviewing.io/', type: 'platform' },
    ],
  });

  // Week 4: Final Preparation
  weekPlans.push({
    week: 4,
    title: 'Final Preparation',
    focus: 'Refine skills and prepare for interviews',
    actionItems: [
      'Review all weak areas and weak skills',
      'Practice coding challenges',
      'Prepare STAR stories for behavioral questions',
      'Set up interview schedule',
    ],
    resources: [
      { name: 'Behavioral interview tips', url: 'https://www.themuse.com/advice/behavioral-interview-questions', type: 'article' },
      { name: 'Technical interview prep', url: 'https://leetcode.com/explore/interview-course/', type: 'course' },
    ],
  });

  return weekPlans;
}

function _calculateTotalItems(skillGaps) {
  const highPriorityCount = skillGaps.filter(gap => gap.priority === 'high').length;
  const mediumPriorityCount = skillGaps.filter(gap => gap.priority === 'medium').length;
  const lowPriorityCount = skillGaps.filter(gap => gap.priority === 'low').length;

  return highPriorityCount * 5 + mediumPriorityCount * 3 + lowPriorityCount * 1;
}
