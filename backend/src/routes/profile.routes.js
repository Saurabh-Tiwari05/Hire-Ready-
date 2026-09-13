// Profile API routes
const express = require('express');
const upload = require('../middlewares/upload.middleware');
const profileController = require('../controllers/profile.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', protect, profileController.getProfile);
router.put('/', protect, profileController.updateProfile);
router.put('/password', protect, profileController.updatePassword);
router.put('/preferences', protect, profileController.updatePreferences);
router.post('/upload-resume', protect, upload.single('resume'), profileController.uploadResume);

module.exports = router;