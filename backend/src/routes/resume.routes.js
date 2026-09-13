// Resume API routes
const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect);

// Resume upload and management
router.post('/upload', upload.single('resume'), resumeController.uploadResume);
router.get('/', resumeController.getAllResumes);
router.get('/current', resumeController.getResume);
router.get('/:resumeId', resumeController.getResume);
router.delete('/:resumeId', resumeController.deleteResume);
router.put('/:resumeId/current', resumeController.setCurrentResume);

// Resume parsing and analysis
router.post('/:resumeId/parse', resumeController.parseResume);
router.post('/:resumeId/analyze', resumeController.analyzeResume);

// Candidate profile
router.get('/profile/me', resumeController.getCandidateProfile);
router.put('/profile/me', resumeController.updateCandidateProfile);
router.put('/profile/me/verify', resumeController.verifyCandidateProfile);
router.get('/profile/me/status', resumeController.getProfileCompletionStatus);

module.exports = router;