// Report Validator - input validation for report and email endpoints
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

exports.generateReport = [
  param('interviewId').isUUID().withMessage('Valid interviewId is required'),
  handleValidation,
];

exports.getReport = [
  param('id').isUUID().withMessage('Valid report ID is required'),
  handleValidation,
];

exports.downloadReportPdf = [
  param('id').isUUID().withMessage('Valid report ID is required'),
  handleValidation,
];

exports.sendReportEmail = [
  param('id').isUUID().withMessage('Valid report ID is required'),
  handleValidation,
];

exports.sendWelcomeEmail = [
  body('userId').isUUID().withMessage('Valid userId is required'),
  handleValidation,
];

exports.sendPasswordReset = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('resetToken').isString().isLength({ min: 6 }).withMessage('Valid reset token is required'),
  handleValidation,
];