// Career Validator - input validation for career endpoints
const { body, query, validationResult } = require('express-validator');

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

exports.startCareerAnalysis = [
  body('resumeId').optional().isUUID().withMessage('Invalid resumeId format'),
  body('targetRoles').optional().isArray().withMessage('targetRoles must be an array'),
  body('targetRoles.*').optional().isString().withMessage('Each role must be a string'),
  body('targetCompanies').optional().isArray().withMessage('targetCompanies must be an array'),
  body('targetCompanies.*').optional().isString().withMessage('Each company must be a string'),
  handleValidation,
];

exports.getCareerAnalysis = [
  handleValidation,
];

exports.getJobMatches = [
  handleValidation,
];

exports.getCompanyMatches = [
  handleValidation,
];

exports.generateLearningResources = [
  body('skills').optional().isArray().withMessage('skills must be an array'),
  body('skills.*').optional().isString().withMessage('Each skill must be a string'),
  body('skillGaps').optional().isArray().withMessage('skillGaps must be an array'),
  body('skillGaps.*').optional().isString().withMessage('Each skill gap must be a string'),
  body('preferredTypes').optional().isArray().withMessage('preferredTypes must be an array'),
  body('preferredTypes.*').optional().isIn(['article', 'video', 'course', 'book', 'platform', 'documentation', 'repository']).withMessage('Invalid resource type'),
  handleValidation,
];

exports.generatePreparationPlan = [
  handleValidation,
];

exports.getActivePreparationPlan = [
  handleValidation,
];

exports.updatePreparationPlanProgress = [
  body('planId').isUUID().withMessage('Valid planId is required'),
  body('completedItems').optional().isArray().withMessage('completedItems must be an array'),
  handleValidation,
];

exports.getAchievements = [
  handleValidation,
];

exports.getGoals = [
  handleValidation,
];