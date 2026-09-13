// Profile validation schemas
const Joi = require('joi');

const profileUpdateSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).trim(),
  college: Joi.string().max(100).trim().allow('', null),
  branch: Joi.string().max(50).trim().allow('', null),
  graduation_year: Joi.number().integer().min(1980).max(2100).allow(null),
  linkedin_url: Joi.string().uri().trim().allow('', null),
  github_url: Joi.string().uri().trim().allow('', null),
  profile_picture_url: Joi.string().uri().trim().allow('', null),
  skills: Joi.array().items(Joi.string().max(50)).allow(null),
  target_companies: Joi.array().items(Joi.string().max(100)).allow(null),
  preferred_role: Joi.string().max(100).trim().allow('', null),
  email_notifications: Joi.object().allow(null),
  notification_preferences: Joi.object().allow(null),
}).unknown(true); // Allow unknown fields to prevent validation errors

const passwordUpdateSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required(),
});

const preferencesSchema = Joi.object({
  email_notifications: Joi.object().allow(null),
  notification_preferences: Joi.object().allow(null),
}).unknown(true); // Allow unknown fields

module.exports = {
  profileUpdateSchema,
  passwordUpdateSchema,
  preferencesSchema,
};