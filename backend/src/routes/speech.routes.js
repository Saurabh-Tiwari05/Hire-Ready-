// Speech API routes - Speech-to-Text integration
const express = require('express');
const router = express.Router();
const speechController = require('../controllers/speech.controller');
const { protect } = require('../middlewares/auth.middleware');

// Protect all speech routes
router.use(protect);

// Process final speech transcript
router.post('/transcript', speechController.processTranscript);

// Auto-save interim transcript (for recovery on crash/refresh)
router.post('/auto-save', speechController.autoSaveTranscript);

// Get all saved transcripts for an interview (recovery)
router.get('/transcripts/:interviewId', speechController.getTranscripts);

module.exports = router;