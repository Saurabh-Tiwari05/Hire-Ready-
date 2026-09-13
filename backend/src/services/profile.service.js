// Profile service with business logic
const bcrypt = require('bcryptjs');
const { User, Resume, sequelize } = require('../models');

exports.getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: {
      exclude: ['password_hash', 'reset_token', 'reset_expires', 'verification_token', 'verify_expires'],
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

exports.updateProfile = async (userId, updateData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    // Return null to indicate user not found
    return null;
  }

  const allowedFields = [
    'full_name',
    'email',
    'college',
    'branch',
    'graduation_year',
    'linkedin_url',
    'github_url',
    'profile_picture_url',
    'skills',
    'target_companies',
    'preferred_role',
    'email_notifications',
    'notification_preferences',
    'verified',
    'remember_token',
    'created_at',
    'updated_at',
    'id',
  ];

  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      user.set(key, updateData[key]);
    }
  }

  await user.save();

  return user;
};

exports.updatePassword = async (userId, passwordData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const { current_password, new_password } = passwordData;

  if (!current_password || !new_password) {
    throw new Error('Current password and new password are required');
  }

  const isMatch = await bcrypt.compare(current_password, user.password_hash);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(new_password, salt);

  user.password_hash = hashedPassword;
  await user.save();
};

exports.updatePreferences = async (userId, preferencesData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  const allowedPrefs = [
    'email_notifications',
    'notification_preferences',
  ];

  for (const key of allowedPrefs) {
    if (preferencesData[key] !== undefined) {
      user.set(key, preferencesData[key]);
    }
  }

  await user.save();

  return user;
};

exports.uploadResume = async (userId, file, bodyData) => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (!file) {
    throw new Error('Resume file is required');
  }

  const resume = await Resume.create({
    user_id: userId,
    title: bodyData.title || 'Resume',
    file_path: file.path || null,
    file_url: file.filename || null,
    parsed_data: bodyData.parsed_data || null,
    is_current: true,
  });

  // Mark previous resumes as not current
  await Resume.update(
    { is_current: false },
    { where: { user_id: userId, id: { [require('sequelize').Op.ne]: resume.id } } }
  );

  return resume;
};