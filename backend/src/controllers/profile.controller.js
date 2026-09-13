// Profile controllers
const ProfileService = require('../services/profile.service');
const { catchAsync } = require('../utils/asyncHandler');
const { profileUpdateSchema, passwordUpdateSchema, preferencesSchema } = require('../validators/profile.validator');
const { validate } = require('../middlewares/validate.middleware');

exports.getProfile = catchAsync(async (req, res) => {
  const profile = await ProfileService.getProfile(req.user.id);
  if (!profile) {
    // Return a default profile object if user not found
    return res.json({ data: null });
  }
  res.json({ data: profile });
});

exports.updateProfile = catchAsync(async (req, res) => {
  const { error } = profileUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map((d) => d.message) });
  }

  const profile = await ProfileService.updateProfile(req.user.id, req.body);
  res.json({ data: profile });
});

exports.updatePassword = catchAsync(async (req, res) => {
  const { error } = passwordUpdateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map((d) => d.message) });
  }

  await ProfileService.updatePassword(req.user.id, req.body);
  res.json({ message: 'Password updated successfully' });
});

exports.updatePreferences = catchAsync(async (req, res) => {
  const { error } = preferencesSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map((d) => d.message) });
  }

  const prefs = await ProfileService.updatePreferences(req.user.id, req.body);
  if (!prefs) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ data: prefs });
});

exports.uploadResume = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Resume file is required' });
  }

  const resume = await ProfileService.uploadResume(req.user.id, req.file, req.body);
  res.json({ data: resume });
});