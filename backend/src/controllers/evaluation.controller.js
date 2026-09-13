// Evaluation Controller - handles evaluation API endpoints
const EvaluationService = require('../services/evaluation.service');
const EvaluationRepository = require('../repositories/evaluation.repository');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

/**
 * POST /api/evaluation/answer
 * Evaluate a single answer
 */
exports.evaluateAnswer = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const {
    questionText,
    answerText,
    company,
    role,
    difficulty,
    candidateContext,
    messageId,
    interviewId,
    evaluationId,
  } = req.body;

  if (!questionText || !answerText) {
    return next(new AppError('questionText and answerText are required', 400));
  }

  const evaluation = await EvaluationService.evaluateAnswer({
    questionText,
    answerText,
    company,
    role,
    difficulty,
    candidateContext,
    messageId,
    interviewId,
    evaluationId,
    userId,
  });

  res.status(200).json({
    status: 'success',
    data: evaluation,
  });
});

/**
 * GET /api/evaluation/interview/:id
 * Get evaluation for an interview
 */
exports.getInterviewEvaluation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const evaluation = await EvaluationRepository.findByInterviewId(id);

  if (!evaluation) {
    return next(new AppError('Evaluation not found for this interview', 404));
  }

  // Verify ownership
  if (evaluation.user_id !== userId) {
    return next(new AppError('Unauthorized access to this evaluation', 403));
  }

  res.status(200).json({
    status: 'success',
    data: evaluation,
  });
});

/**
 * GET /api/evaluation/report/:id
 * Get final evaluation report for an interview
 */
exports.getEvaluationReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const evaluation = await EvaluationRepository.findById(id);

  if (!evaluation) {
    return next(new AppError('Evaluation not found', 404));
  }

  // Verify ownership
  if (evaluation.user_id !== userId) {
    return next(new AppError('Unauthorized access to this report', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ...evaluation.toJSON(),
      report: evaluation.summary_report || evaluation.evaluation_json,
    },
  });
});

/**
 * GET /api/evaluation/history/:userId
 * Get evaluation history for a user
 */
exports.getEvaluationHistory = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { userId: authUserId } = req.user;

  // Users can only access their own history
  if (userId !== authUserId) {
    return next(new AppError('Unauthorized access to evaluation history', 403));
  }

  const evaluations = await EvaluationRepository.findByUserId(userId);

  res.status(200).json({
    status: 'success',
    data: evaluations,
  });
});

/**
 * POST /api/evaluation/generate-report
 * Generate final report for an interview (manual trigger)
 */
exports.generateReport = catchAsync(async (req, res, next) => {
  const { userId } = req.user;
  const { interviewId, interviewContext } = req.body;

  if (!interviewId) {
    return next(new AppError('interviewId is required', 400));
  }

  const report = await EvaluationService.generateFinalReport(interviewId, userId, interviewContext);

  res.status(201).json({
    status: 'success',
    data: report,
  });
});