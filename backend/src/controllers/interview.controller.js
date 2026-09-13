// Interview Controller - handles all interview API endpoints
const InterviewService = require('../services/interview.service');
const InterviewContextService = require('../services/interview-context.service');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

const interviewService = new InterviewService(
  require('../repositories/interview.repository'),
  require('../repositories/interview-message.repository'),
  InterviewContextService
);

/**
 * POST /api/interview/start
 * Start a new interview session
 */
exports.startInterview = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const {
    company,
    role,
    interviewType,
    difficulty,
    interviewDuration,
    resumeId,
  } = req.body;

  // Validate required fields
  if (!company || !role || !interviewType || !difficulty || !interviewDuration) {
    return next(new AppError('Missing required fields: company, role, interviewType, difficulty, interviewDuration', 400));
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  if (!validDifficulties.includes(difficulty)) {
    return next(new AppError(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`, 400));
  }

  // Validate interview type
  const validTypes = ['technical', 'behavioral', 'system_design', 'coding', 'mixed', 'screening'];
  if (!validTypes.includes(interviewType)) {
    return next(new AppError(`Invalid interview type. Must be one of: ${validTypes.join(', ')}`, 400));
  }

  const interviewConfig = {
    company,
    role,
    interviewType,
    difficulty,
    interviewDuration,
    resumeId,
  };

  const result = await interviewService.startInterview(userId, interviewConfig);

  res.status(201).json({
    status: 'success',
    data: result,
  });
});

/**
 * POST /api/interview/question
 * Get the next interview question
 */
exports.getNextQuestion = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { contextId } = req.body;

  if (!contextId) {
    return next(new AppError('Context ID is required', 400));
  }

  const question = await interviewService.getNextQuestion(contextId, userId);

  res.json({
    status: 'success',
    data: question,
  });
});

/**
 * POST /api/interview/answer
 * Submit an answer and get evaluation
 */
exports.submitAnswer = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { messageId, answer } = req.body;

  if (!messageId || !answer) {
    return next(new AppError('Message ID and answer are required', 400));
  }

  const evaluation = await interviewService.evaluateAnswer(messageId, answer, userId);

  res.json({
    status: 'success',
    data: evaluation,
  });
});

/**
 * POST /api/interview/end
 * End the interview and generate final report
 */
exports.endInterview = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { contextId } = req.body;

  if (!contextId) {
    return next(new AppError('Context ID is required', 400));
  }

  const report = await interviewService.endInterview(contextId, userId);

  res.json({
    status: 'success',
    data: report,
  });
});

/**
 * GET /api/interview/:id
 * Get interview session details with messages
 */
exports.getInterview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const interview = await interviewService.getInterviewWithMessages(id, userId);

  if (!interview) {
    return next(new AppError('Interview not found', 404));
  }

  // Verify ownership
  if (interview.user_id !== userId) {
    return next(new AppError('Unauthorized', 403));
  }

  res.json({
    status: 'success',
    data: interview,
  });
});

/**
 * GET /api/interview/:id/timer
 * Get remaining interview time
 */
exports.getRemainingTime = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const interview = await interviewService.getInterviewWithMessages(id, userId);

  if (!interview) {
    return next(new AppError('Interview not found', 404));
  }

  const remaining = interviewService.getRemainingTime(interview);

  res.json({
    status: 'success',
    data: { remainingTime: remaining },
  });
});
