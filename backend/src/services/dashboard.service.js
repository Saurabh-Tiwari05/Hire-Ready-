// Dashboard service - aggregates all user-specific data
const { Op } = require('sequelize');
const { User, Resume, Interview, Report, Notification, sequelize } = require('../models');

exports.getDashboardData = async (userId) => {
  // Fetch user profile (excluding sensitive fields)
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password_hash', 'reset_token', 'reset_expires', 'verification_token', 'verify_expires'],
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch current resume (is_current = true)
  const currentResume = await Resume.findOne({
    where: { user_id: userId, is_current: true },
    order: [['created_at', 'DESC']],
    attributes: ['id', 'title', 'file_path', 'file_url', 'file_size', 'mime_type', 'original_filename', 'parsed_data', 'version', 'created_at'],
  });

  // Fetch interview statistics
  const totalInterviews = await Interview.count({ where: { user_id: userId } });
  const completedInterviews = await Interview.count({ where: { user_id: userId, status: 'completed' } });
  const upcomingInterviews = await Interview.count({
    where: {
      user_id: userId,
      status: { [Op.in]: ['scheduled', 'in_progress'] },
      scheduled_at: { [Op.gte]: new Date() },
    },
  });
  const scheduledInterviews = await Interview.count({
    where: {
      user_id: userId,
      status: 'scheduled',
      scheduled_at: { [Op.gte]: new Date() },
    },
  });

  // Average score across completed interviews
  const avgScoreResult = await Interview.findOne({
    where: { user_id: userId, status: 'completed', score: { [Op.ne]: null } },
    attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avgScore']],
    raw: true,
  });
  const averageScore = avgScoreResult?.avgScore ? Math.round(parseFloat(avgScoreResult.avgScore)) : null;

  // Fetch latest interview (most recent by scheduled_at or created_at)
  const latestInterview = await Interview.findOne({
    where: { user_id: userId },
    order: [
      ['scheduled_at', 'DESC NULLS LAST'],
      ['created_at', 'DESC'],
    ],
    attributes: [
      'id', 'company', 'role', 'stage', 'status', 'scheduled_at', 'completed_at',
      'duration_minutes', 'score', 'feedback', 'interviewer_name', 'meeting_link', 'created_at',
    ],
  });

  // Fetch recent reports (last 5)
  const recentReports = await Report.findAll({
    where: { user_id: userId, is_archived: false },
    order: [['created_at', 'DESC']],
    limit: 5,
    attributes: ['id', 'type', 'title', 'summary', 'scores', 'strengths', 'improvements', 'created_at'],
  });

  // Fetch unread notifications count
  const unreadNotificationsCount = await Notification.count({
    where: { user_id: userId, is_read: false, is_archived: false },
  });

  // Fetch latest notifications (last 10)
  const latestNotifications = await Notification.findAll({
    where: { user_id: userId, is_archived: false },
    order: [['created_at', 'DESC']],
    limit: 10,
    attributes: ['id', 'type', 'title', 'message', 'data', 'is_read', 'priority', 'created_at'],
  });

  // Skill breakdown from latest report
  let skillBreakdown = null;
  if (recentReports.length > 0 && recentReports[0].scores) {
    skillBreakdown = recentReports[0].scores;
  }

  // Interview timeline (upcoming + recent completed)
  const upcomingInterviewsList = await Interview.findAll({
    where: {
      user_id: userId,
      status: { [Op.in]: ['scheduled', 'in_progress'] },
      scheduled_at: { [Op.gte]: new Date() },
    },
    order: [['scheduled_at', 'ASC']],
    limit: 5,
    attributes: ['id', 'company', 'role', 'stage', 'status', 'scheduled_at', 'meeting_link'],
  });

  const recentCompletedInterviews = await Interview.findAll({
    where: { user_id: userId, status: 'completed' },
    order: [['completed_at', 'DESC NULLS LAST'], ['created_at', 'DESC']],
    limit: 5,
    attributes: ['id', 'company', 'role', 'stage', 'status', 'scheduled_at', 'completed_at', 'score'],
  });

  // Combine and sort timeline
  const timeline = [
    ...upcomingInterviewsList.map(i => ({ ...i.toJSON(), type: 'upcoming' })),
    ...recentCompletedInterviews.map(i => ({ ...i.toJSON(), type: 'completed' })),
  ].sort((a, b) => {
    const dateA = a.scheduled_at || a.created_at;
    const dateB = b.scheduled_at || b.created_at;
    return new Date(dateB) - new Date(dateA);
  }).slice(0, 10);

  // Quick actions based on user state
  const quickActions = [];
  if (!currentResume) {
    quickActions.push({ key: 'upload_resume', label: 'Upload Resume', icon: 'upload', priority: 'high' });
  }
  if (upcomingInterviews === 0 && completedInterviews < 3) {
    quickActions.push({ key: 'schedule_mock', label: 'Schedule Mock Interview', icon: 'calendar', priority: 'high' });
  }
  if (recentReports.length === 0) {
    quickActions.push({ key: 'generate_report', label: 'Generate Skill Report', icon: 'file-text', priority: 'medium' });
  }
  quickActions.push(
    { key: 'update_profile', label: 'Update Profile', icon: 'user', priority: 'low' },
    { key: 'settings', label: 'Notification Settings', icon: 'bell', priority: 'low' }
  );

  return {
    user: user.toJSON(),
    currentResume: currentResume ? currentResume.toJSON() : null,
    stats: {
      totalInterviews,
      completedInterviews,
      upcomingInterviews,
      scheduledInterviews,
      averageScore,
      unreadNotifications: unreadNotificationsCount,
    },
    latestInterview: latestInterview ? latestInterview.toJSON() : null,
    recentReports: recentReports.map(r => r.toJSON()),
    latestNotifications: latestNotifications.map(n => n.toJSON()),
    skillBreakdown,
    timeline,
    quickActions,
  };
};

// Mark notification as read
exports.markNotificationRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.is_read = true;
  notification.read_at = new Date();
  await notification.save();

  return notification.toJSON();
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (userId) => {
  await Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { user_id: userId, is_read: false, is_archived: false } }
  );
  return { success: true };
};

// Archive notification
exports.archiveNotification = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.is_archived = true;
  await notification.save();

  return notification.toJSON();
};