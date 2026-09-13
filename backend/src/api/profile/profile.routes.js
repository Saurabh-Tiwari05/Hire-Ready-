// Profile API routes
const router = require('express').Router();
const profileController = require('../../controllers/profile.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.get('/', protect, profileController.getProfile);
router.put('/', protect, profileController.updateProfile);
router.put('/password', protect, profileController.updatePassword);
router.put('/preferences', protect, profileController.updatePreferences);
router.post('/upload-resume', protect, profileController.uploadResume);

module.exports = router;