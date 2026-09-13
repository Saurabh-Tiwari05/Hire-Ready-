// Evaluation Validator - input validation for evaluation endpoints
const { body, param, validationResult } = require('express-validator');

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

exports.evaluateAnswer = [
  body('questionText').trim().notEmpty().withMessage('questionText is required').isLength({ max: 2000 }).withMessage('Question text too long'),
  body('answerText').trim().notEmpty().withMessage('answerText is required').isLength({ max: 10000 }).withMessage('Answer text too long'),
  body('company').optional().trim().isLength({ max: 255 }).withMessage('Company name too long'),
  body('role').optional().trim().isLength({ max: 255 }).withMessage('Role too long'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty'),
  body('candidateContext').optional().isObject().withMessage('candidateContext must be an object'),
  body('messageId').optional().isUUID().withMessage('Invalid messageId format'),
  body('interviewId').optional().isUUID().withMessage('Invalid interviewId format'),
  body('evaluationId').optional().isUUID().withMessage('Invalid evaluationId format'),
  handleValidation,
];

exports.getInterviewEvaluation = [
  param('id').isUUID().withMessage('Invalid interview ID format'),
  handleValidation,
];

exports.getEvaluationReport = [
  param('id').isUUID().withMessage('Invalid evaluation ID format'),
  handleValidation,
];

exports.getEvaluationHistory = [
  param('userId').isUUID().withMessage('Invalid userId format'),
  handleValidation,
];

exports.generateReport = [
  body('interviewId').isUUID().withMessage('Valid interviewId is required'),
  body('interviewContext').optional().isObject().withMessage('interviewContext must be an object'),
  handleValidation,
];