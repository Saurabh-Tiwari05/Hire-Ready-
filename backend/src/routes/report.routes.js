// Report API routes
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Report history
router.get('/history', reportController.getReportHistory);

// Generate report for interview
router.post('/generate/:interviewId', reportController.generateReport);

// Get specific report
router.get('/:id', reportController.getReport);

// Download PDF
router.get('/pdf/:id', reportController.downloadReportPdf);

// Email report
router.post('/email/:id', reportController.sendReportEmail);

module.exports = router;