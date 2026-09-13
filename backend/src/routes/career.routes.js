// Career API routes - AI Job Matching & Career Guidance
const express = require('express');
const router = express.Router();
const careerController = require('../controllers/career.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Comprehensive Analysis
router.post('/start-analysis', careerController.startCareerAnalysis);
router.get('/analysis', careerController.getCareerAnalysis);

// Job & Company Matching
router.get('/job-matches', careerController.getJobMatches);
router.get('/company-matches', careerController.getCompanyMatches);

// Learning Resources & Preparation Plan
router.post('/generate-learning-resources', careerController.generateLearningResources);
router.post('/preparation-plan', careerController.generatePreparationPlan);
router.get('/preparation-plan', careerController.getActivePreparationPlan);
router.post('/preparation-plan/progress', careerController.updatePreparationPlanProgress);

// Achievements & Goals
router.get('/achievements', careerController.getAchievements);
router.get('/goals', careerController.getGoals);

module.exports = router;