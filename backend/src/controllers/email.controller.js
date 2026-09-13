// Email Controller - handles manual email operations
const EmailService = require('../services/email.service');
const { User } = require('../models');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

/**
 * POST /api/email/welcome
 * Send welcome email to a user
 */
exports.sendWelcomeEmail = catchAsync(async (req, res, next) => {
  const { userId } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  await EmailService.sendWelcomeEmail(user.email, {
    fullName: user.full_name,
  });

  res.json({
    status: 'success',
    data: { message: 'Welcome email sent' },
  });
});

/**
 * POST /api/email/reset-password
 * Send password reset email
 */
exports.sendPasswordReset = catchAsync(async (req, res, next) => {
  const { email, resetToken } = req.body;

  if (!email || !resetToken) {
    return next(new AppError('Email and resetToken are required', 400));
  }

  await EmailService.sendPasswordReset(email, resetToken);

  res.json({
    status: 'success',
    data: { message: 'Password reset email sent' },
  });
});