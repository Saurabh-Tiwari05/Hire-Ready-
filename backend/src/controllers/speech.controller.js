// Speech Controller - handles speech transcription and auto-save APIs
const speechService = require('../services/speech.service');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

/**
 * Process final speech transcript and submit for evaluation
 * POST /api/speech/transcript
 */
exports.processTranscript = catchAsync(async (req, res, next) => {
  const {
    interviewId,
    contextId,
    questionId,
    transcript,
    startTime,
    endTime,
    responseDuration,
    wordCount,
    topic,
    difficulty,
  } = req.body;

  // Validate required inputs
  if (!interviewId || !transcript) {
    return next(new AppError('interviewId and transcript are required', 400));
  }

  // Check for meaningful content
  if (!speechService.hasMeaningfulContent(transcript)) {
    return next(new AppError('Transcript has no meaningful speech. Please try speaking again.', 400));
  }

  const calculatedWordCount = wordCount || speechService.calculateWordCount(transcript);

  const result = await speechService.processTranscript({
    interviewId,
    contextId,
    questionId,
    transcript,
    startTime: startTime || new Date().toISOString(),
    endTime: endTime || new Date().toISOString(),
    responseDuration: responseDuration || 0,
    wordCount: calculatedWordCount,
    topic,
    difficulty,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Auto-save interim transcript (called every few seconds by frontend)
 * POST /api/speech/auto-save
 */
exports.autoSaveTranscript = catchAsync(async (req, res, next) => {
  const {
    interviewId,
    contextId,
    questionId,
    transcript,
    isFinal = false,
    startTime,
  } = req.body;

  if (!interviewId || !transcript) {
    return next(new AppError('interviewId and transcript are required', 400));
  }

  const result = await speechService.saveInterimTranscript({
    interviewId,
    contextId,
    questionId,
    transcript,
    isFinal,
    startTime: startTime || new Date().toISOString(),
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
});

/**
 * Get saved transcripts for an interview session
 * GET /api/speech/transcripts/:interviewId
 */
exports.getTranscripts = catchAsync(async (req, res, next) => {
  const { interviewId } = req.params;

  if (!interviewId) {
    return next(new AppError('interviewId is required', 400));
  }

  const transcripts = await speechService.getInterviewTranscripts(interviewId);

  res.status(200).json({
    status: 'success',
    data: transcripts,
  });
});