// Interview Validator - input validation for interview endpoints
const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/**
 * Validation rules for starting an interview
 */
exports.startInterview = [
  body('company').trim().notEmpty().withMessage('Company is required').isLength({ max: 255 }).withMessage('Company name too long'),
  body('role').trim().notEmpty().withMessage('Role is required').isLength({ max: 255 }).withMessage('Role too long'),
  body('interviewType').isIn(['technical', 'behavioral', 'system_design', 'coding', 'mixed', 'screening']).withMessage('Invalid interview type'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty level'),
  body('interviewDuration').isInt({ min: 15, max: 180 }).withMessage('Duration must be between 15 and 180 minutes'),
  body('resumeId').optional().isUUID().withMessage('Invalid resume ID format'),
  handleValidation,
];

/**
 * Validation rules for getting next question
 */
exports.getNextQuestion = [
  body('contextId').isUUID().withMessage('Valid context ID is required'),
  handleValidation,
];

/**
 * Validation rules for submitting an answer
 */
exports.submitAnswer = [
  body('messageId').isUUID().withMessage('Valid message ID is required'),
  body('answer').trim().notEmpty().withMessage('Answer is required').isLength({ max: 10000 }).withMessage('Answer too long'),
  handleValidation,
];

/**
 * Validation rules for ending interview
 */
exports.endInterview = [
  body('contextId').isUUID().withMessage('Valid context ID is required'),
  handleValidation,
];

/**
 * Validation for interview ID param
 */
exports.interviewId = [
  param('id').isUUID().withMessage('Valid interview ID is required'),
  handleValidation,
];

/**
 * Validation for timer query
 */
exports.timerQuery = [
  query('contextId').optional().isUUID().withMessage('Valid context ID required'),
  handleValidation,
];