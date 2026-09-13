// Dashboard controller
const DashboardService = require('../services/dashboard.service');
const { catchAsync } = require('../utils/asyncHandler');

exports.getDashboard = catchAsync(async (req, res) => {
  const dashboardData = await DashboardService.getDashboardData(req.user.id);
  res.json({ data: dashboardData });
});

exports.markNotificationRead = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await DashboardService.markNotificationRead(req.user.id, notificationId);
  res.json({ data: notification });
});

exports.markAllNotificationsRead = catchAsync(async (req, res) => {
  await DashboardService.markAllNotificationsRead(req.user.id);
  res.json({ message: 'All notifications marked as read' });
});

exports.archiveNotification = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await DashboardService.archiveNotification(req.user.id, notificationId);
  res.json({ data: notification });
});