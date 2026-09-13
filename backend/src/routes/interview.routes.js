// Interview API routes - AI Interview Engine
const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Interview session lifecycle
router.post('/start', interviewController.startInterview);
router.post('/question', interviewController.getNextQuestion);
router.post('/answer', interviewController.submitAnswer);
router.post('/end', interviewController.endInterview);
router.get('/:id', interviewController.getInterview);
router.get('/:id/timer', interviewController.getRemainingTime);

module.exports = router;