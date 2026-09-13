// Email API routes
const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect);

// Send welcome email (admin/internal use)
router.post('/welcome', emailController.sendWelcomeEmail);

// Send password reset
router.post('/reset-password', emailController.sendPasswordReset);

module.exports = router;