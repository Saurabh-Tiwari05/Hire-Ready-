// Main API routes
const express = require('express');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const dashboardRoutes = require('./dashboard.routes');
const resumeRoutes = require('./resume.routes');
const interviewSetupRoutes = require('./interviewSetup.routes');
const interviewRoutes = require('./interview.routes');
const speechRoutes = require('./speech.routes');
const evaluationRoutes = require('./evaluation.routes');
const reportRoutes = require('./report.routes');
const emailRoutes = require('./email.routes');
const careerRoutes = require('./career.routes');

const router = express.Router();

// Mount all API routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/resume', resumeRoutes);
router.use('/interview-setup', interviewSetupRoutes);
router.use('/interview', interviewRoutes);
router.use('/speech', speechRoutes);
router.use('/evaluation', evaluationRoutes);
router.use('/report', reportRoutes);
router.use('/email', emailRoutes);
router.use('/career', careerRoutes);

module.exports = router;