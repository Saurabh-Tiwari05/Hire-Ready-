// Report Controller - handles report API endpoints
const ReportService = require('../services/report.service');
const EvaluationRepository = require('../repositories/evaluation.repository');
const { Report, Interview } = require('../models');
const { catchAsync } = require('../utils/asyncHandler');
const AppError = require('../utils/appError');

/**
 * GET /api/report/history
 * Get user's report history
 */
exports.getReportHistory = catchAsync(async (req, res, next) => {
  const { userId } = req.user;

  const reports = await Report.findAll({
    where: { user_id: userId },
    include: [{ model: Interview, as: 'interview' }],
    order: [['created_at', 'DESC']],
  });

  res.json({
    status: 'success',
    data: reports,
  });
});

/**
 * GET /api/report/:id
 * Get a specific report
 */
exports.getReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const report = await Report.findOne({
    where: { id, user_id: userId },
    include: [{ model: Interview, as: 'interview' }],
  });

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  // Get question evaluations if available
  const evaluation = await EvaluationRepository.findByInterviewId(report.interview_id);

  res.json({
    status: 'success',
    data: {
      ...report.toJSON(),
      evaluation: evaluation || null,
    },
  });
});

/**
 * GET /api/report/pdf/:id
 * Download report as PDF (serves file)
 */
exports.downloadReportPdf = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const report = await Report.findOne({
    where: { id, user_id: userId },
  });

  if (!report || !report.pdf_path) {
    return next(new AppError('Report or PDF not found', 404));
  }

  res.download(report.pdf_path, report.pdf_filename);
});

/**
 * POST /api/report/email/:id
 * Send report via email
 */
exports.sendReportEmail = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  const report = await Report.findOne({
    where: { id, user_id: userId },
    include: [{ model: Interview, as: 'interview' }],
  });

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  // Send email
  await ReportService.sendReportEmail(report);

  res.json({
    status: 'success',
    data: { message: 'Report emailed successfully' },
  });
});

/**
 * POST /api/report/generate/:interviewId
 * Generate report for completed interview
 */
exports.generateReport = catchAsync(async (req, res, next) => {
  const { interviewId } = req.params;
  const { userId } = req.user;

  const report = await ReportService.generateInterviewReport(interviewId, userId);

  res.status(201).json({
    status: 'success',
    data: report,
  });
});