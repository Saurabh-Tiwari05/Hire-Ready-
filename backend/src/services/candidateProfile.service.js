// Candidate Profile Service - manages candidate profile creation, updates, and retrieval
const { CandidateProfile, User, Resume, Interview } = require('../models');
const { Op } = require('sequelize');

/**
 * Create or update candidate profile from parsed resume data
 * @param {string} userId - User ID
 * @param {Object} parsedData - Parsed resume data from Gemini
 * @param {string} resumeId - Resume ID (optional)
 * @returns {Promise<Object>} Created/updated profile
 */
exports.createOrUpdateProfile = async (userId, parsedData, resumeId = null) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return null; // Return null instead of throwing
  }

  // Check if profile exists
  let profile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  const profileData = {
    user_id: userId,
    resume_id: resumeId,
    full_name: parsedData.personal?.fullName || user.full_name,
    email: parsedData.personal?.email || user.email,
    phone: parsedData.personal?.phone || null,
    location: parsedData.personal?.location || null,
    linkedin_url: parsedData.personal?.linkedin || user.linkedin_url,
    github_url: parsedData.personal?.github || user.github_url,
    portfolio_url: parsedData.personal?.portfolio || null,
    summary: parsedData.summary || null,
    experience: parsedData.experience || [],
    education: parsedData.education || [],
    skills: parsedData.skills || {
      technical: [],
      languages: [],
      frameworks: [],
      tools: [],
      soft: [],
    },
    projects: parsedData.projects || [],
    certifications: parsedData.certifications || [],
    languages: parsedData.languages || [],
    analysis: parsedData.analysis || {
      totalYearsExperience: 0,
      seniorityLevel: 'Mid',
      primaryRole: '',
      strongAreas: [],
      weakAreas: [],
      recommendedRoles: [],
      skillGaps: [],
      interviewFocusAreas: [],
    },
    raw_parsed_data: parsedData,
    is_complete: true,
  };

  if (profile) {
    // Update existing
    await profile.update(profileData);
  } else {
    // Create new
    profile = await CandidateProfile.create(profileData);
  }

  return profile.toJSON();
};

/**
 * Get candidate profile by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Profile or null
 */
exports.getProfileByUserId = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
    include: [
      { model: Resume, as: 'resume', attributes: ['id', 'title', 'file_url', 'version'] },
    ],
  });

  return profile ? profile.toJSON() : null;
};

/**
 * Update specific fields of candidate profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
exports.updateProfile = async (userId, updateData) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  if (!profile) {
    return null; // Return null instead of throwing
  }

  // Fields that can be updated
  const allowedFields = [
    'full_name', 'email', 'phone', 'location',
    'linkedin_url', 'github_url', 'portfolio_url',
    'summary', 'experience', 'education', 'skills',
    'projects', 'certifications', 'languages',
    'analysis', 'is_verified',
  ];

  const filteredData = {};
  for (const key of allowedFields) {
    if (updateData[key] !== undefined) {
      filteredData[key] = updateData[key];
    }
  }

  await profile.update(filteredData);
  return profile.toJSON();
};

/**
 * Mark profile as verified (user has reviewed and approved)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated profile
 */
exports.verifyProfile = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  if (!profile) {
    return null; // Return null instead of throwing
  }

  profile.is_verified = true;
  await profile.save();

  return profile.toJSON();
};

/**
 * Get profile completion status
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Completion status
 */
exports.getCompletionStatus = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
  });

  if (!profile) {
    return {
      exists: false,
      isComplete: false,
      isVerified: false,
      missingFields: ['profile_not_created'],
    };
  }

  const requiredFields = [
    'full_name', 'email', 'summary',
    'experience', 'education', 'skills',
  ];

  const missingFields = requiredFields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return !value || value === '';
  });

  return {
    exists: true,
    isComplete: profile.is_complete,
    isVerified: profile.is_verified,
    missingFields,
    profile,
  };
};

/**
 * Get all skills as flat array
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} All skills
 */
exports.getAllSkills = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
    attributes: ['skills'],
  });

  if (!profile || !profile.skills) return [];

  const allSkills = [];
  for (const category of Object.values(profile.skills)) {
    if (Array.isArray(category)) {
      allSkills.push(...category);
    }
  }

  return [...new Set(allSkills)];
};

/**
 * Get experience summary
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Experience summary
 */
exports.getExperienceSummary = async (userId) => {
  const profile = await CandidateProfile.findOne({
    where: { user_id: userId },
    attributes: ['experience', 'analysis'],
  });

  if (!profile) return { totalYears: 0, companies: [], roles: [] };

  const experience = profile.experience || [];
  const companies = [...new Set(experience.map(e => e.company).filter(Boolean))];
  const roles = [...new Set(experience.map(e => e.title).filter(Boolean))];

  return {
    totalYears: profile.analysis?.totalYearsExperience || 0,
    companies,
    roles,
    count: experience.length,
    seniorityLevel: profile.analysis?.seniorityLevel || 'Mid',
  };
};