// Evaluation API routes
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Answer evaluation
router.post('/answer', evaluationController.evaluateAnswer);

// Get evaluation for an interview
router.get('/interview/:id', evaluationController.getInterviewEvaluation);

// Get final report
router.get('/report/:id', evaluationController.getEvaluationReport);

// Get evaluation history
router.get('/history/:userId', evaluationController.getEvaluationHistory);

// Generate final report manually
router.post('/generate-report', evaluationController.generateReport);

module.exports = router;