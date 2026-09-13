// Dashboard API routes
const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', dashboardController.getDashboard);

router.put('/notifications/:notificationId/read', dashboardController.markNotificationRead);
router.put('/notifications/read-all', dashboardController.markAllNotificationsRead);
router.put('/notifications/:notificationId/archive', dashboardController.archiveNotification);

module.exports = router;