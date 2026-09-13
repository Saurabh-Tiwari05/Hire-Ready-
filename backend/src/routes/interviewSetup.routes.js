// Interview Setup API routes
const express = require('express');
const router = express.Router();
const interviewSetupController = require('../controllers/interviewSetup.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Wizard steps
router.get('/wizard/start', interviewSetupController.startWizard);
router.post('/wizard/validate-step', interviewSetupController.validateStep);
router.get('/wizard/options', interviewSetupController.getWizardOptions);

// Interview sessions
router.post('/sessions', interviewSetupController.createInterviewSession);
router.get('/sessions', interviewSetupController.getUserInterviewSessions);
router.get('/sessions/:sessionId', interviewSetupController.getInterviewSession);
router.put('/sessions/:sessionId', interviewSetupController.updateInterviewSession);
router.delete('/sessions/:sessionId', interviewSetupController.deleteInterviewSession);

module.exports = router;