// Profile Repository - handles database operations for candidate profiles and related entities
const {
  CandidateProfile,
  Resume,
  Education,
  WorkExperience,
  Project,
  Certification,
  Achievement,
  Language,
  SocialLink,
  ProfileSetting,
  ProfileCompletion,
  Interview,
  Report,
} = require('../models');
const { Op } = require('sequelize');

class ProfileRepository {
  // === Candidate Profile ===
  async getCandidateProfile(userId) {
    return CandidateProfile.findOne({
      where: { user_id: userId },
      include: [
        { model: Resume, as: 'resume' },
        { model: Education, as: 'education', order: [['start_date', 'DESC']] },
        { model: WorkExperience, as: 'workExperiences', order: [['start_date', 'DESC']] },
        { model: Project, as: 'projects', where: { is_featured: true }, required: false },
        { model: Project, as: 'allProjects', required: false },
        { model: Certification, as: 'certifications', order: [['date', 'DESC']] },
        { model: Achievement, as: 'achievements', order: [['date', 'DESC']] },
        { model: Language, as: 'languages', where: { is_primary: true }, required: false },
        { model: Language, as: 'allLanguages', required: false },
        { model: SocialLink, as: 'socialLinks' },
        { model: ProfileSetting, as: 'settings' },
        { model: ProfileCompletion, as: 'completion' },
      ],
    });
  }

  async getCandidateProfileByResumeId(resumeId) {
    return CandidateProfile.findOne({ where: { resume_id: resumeId } });
  }

  async updateCandidateProfile(userId, updates) {
    const profile = await CandidateProfile.findOne({ where: { user_id: userId } });
    if (!profile) return null;
    await profile.update(updates);
    return profile;
  }

  async updateOrCreateCandidateProfile(userId, updates) {
    const [profile, created] = await CandidateProfile.upsert({
      user_id: userId,
      ...updates,
    }, {
      returning: true,
    });
    return profile;
  }

  async updateProfilePicture(userId, pictureUrl) {
    const profile = await CandidateProfile.findOne({ where: { user_id: userId } });
    if (!profile) return null;
    profile.profile_picture_url = pictureUrl;
    await profile.save();
    return profile;
  }

  async deleteProfilePicture(userId) {
    const profile = await CandidateProfile.findOne({ where: { user_id: userId } });
    if (!profile) return false;
    profile.profile_picture_url = null;
    await profile.save();
    return true;
  }

  // === Education ===
  async addEducation(userId, educationData) {
    const profile = await this._getProfile(userId);
    return Education.create({ candidate_profile_id: profile.id, ...educationData });
  }

  async updateEducation(userId, educationId, updates) {
    return Education.update(updates, { where: { id: educationId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteEducation(userId, educationId) {
    return Education.destroy({ where: { id: educationId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async getEducation(userId) {
    const profileId = await this._getProfileId(userId);
    return Education.findAll({ where: { candidate_profile_id: profileId }, order: [['graduation_year', 'DESC']] });
  }

  // === Work Experience ===
  async addWorkExperience(userId, workData) {
    const profile = await this._getProfile(userId);
    return WorkExperience.create({ candidate_profile_id: profile.id, ...workData });
  }

  async updateWorkExperience(userId, experienceId, updates) {
    return WorkExperience.update(updates, { where: { id: experienceId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteWorkExperience(userId, experienceId) {
    return WorkExperience.destroy({ where: { id: experienceId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async getWorkExperience(userId) {
    const profileId = await this._getProfileId(userId);
    return WorkExperience.findAll({ where: { candidate_profile_id: profileId }, order: [['start_date', 'DESC']] });
  }

  // === Projects ===
  async addProject(userId, projectData) {
    const profile = await this._getProfile(userId);
    return Project.create({ candidate_profile_id: profile.id, ...projectData });
  }

  async updateProject(userId, projectId, updates) {
    return Project.update(updates, { where: { id: projectId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteProject(userId, projectId) {
    return Project.destroy({ where: { id: projectId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async getProjects(userId) {
    const profileId = await this._getProfileId(userId);
    return Project.findAll({ where: { candidate_profile_id: profileId }, order: [['created_at', 'DESC']] });
  }

  // === Certifications ===
  async addCertification(userId, certData) {
    const profile = await this._getProfile(userId);
    return Certification.create({ candidate_profile_id: profile.id, ...certData });
  }

  async getCertifications(userId) {
    const profileId = await this._getProfileId(userId);
    return Certification.findAll({ where: { candidate_profile_id: profileId }, order: [['date', 'DESC']] });
  }

  async updateCertification(userId, certId, updates) {
    return Certification.update(updates, { where: { id: certId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteCertification(userId, certId) {
    return Certification.destroy({ where: { id: certId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  // === Achievements ===
  async addAchievement(userId, achievementData) {
    const profile = await this._getProfile(userId);
    return Achievement.create({ candidate_profile_id: profile.id, ...achievementData });
  }

  async getAchievements(userId) {
    const profileId = await this._getProfileId(userId);
    return Achievement.findAll({ where: { candidate_profile_id: profileId }, order: [['date', 'DESC']] });
  }

  async updateAchievement(userId, achievementId, updates) {
    return Achievement.update(updates, { where: { id: achievementId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteAchievement(userId, achievementId) {
    return Achievement.destroy({ where: { id: achievementId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  // === Languages ===
  async addLanguage(userId, langData) {
    const profile = await this._getProfile(userId);
    return Language.create({ candidate_profile_id: profile.id, ...langData });
  }

  async getLanguages(userId) {
    const profileId = await this._getProfileId(userId);
    return Language.findAll({ where: { candidate_profile_id: profileId }, order: [['is_primary', 'DESC'], ['name', 'ASC']] });
  }

  async updateLanguage(userId, langId, updates) {
    return Language.update(updates, { where: { id: langId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteLanguage(userId, langId) {
    return Language.destroy({ where: { id: langId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  // === Social Links ===
  async addSocialLink(userId, linkData) {
    const profile = await this._getProfile(userId);
    return SocialLink.create({ candidate_profile_id: profile.id, ...linkData });
  }

  async getSocialLinks(userId) {
    const profileId = await this._getProfileId(userId);
    return SocialLink.findAll({ where: { candidate_profile_id: profileId }, order: [['platform', 'ASC']] });
  }

  async updateSocialLink(userId, linkId, updates) {
    return SocialLink.update(updates, { where: { id: linkId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  async deleteSocialLink(userId, linkId) {
    return SocialLink.destroy({ where: { id: linkId, candidate_profile_id: (await this._getProfileId(userId)) } });
  }

  // === Profile Settings ===
  async getProfileSettings(userId) {
    const profileId = await this._getProfileId(userId);
    return ProfileSetting.findOne({ where: { candidate_profile_id: profileId } });
  }

  async updateProfileSettings(userId, settings) {
    const profileId = await this._getProfileId(userId);
    const [updated] = await ProfileSetting.update(settings, { where: { candidate_profile_id: profileId } });
    if (updated === 0) {
      return ProfileSetting.create({ candidate_profile_id: profileId, user_id: userId, ...settings });
    }
    return ProfileSetting.findOne({ where: { candidate_profile_id: profileId } });
  }

  // === Profile Completion ===
  async calculateCompletion(userId) {
    const profile = await this.getCandidateProfile(userId);
    if (!profile) return null;

    const sections = {
      personalInfo: this._calculatePersonalInfo(profile),
      education: await this._calculateSection(userId, Education, profile.id),
      workExperience: await this._calculateSection(userId, WorkExperience, profile.id),
      projects: await this._calculateSection(userId, Project, profile.id),
      skills: this._calculateSkills(profile),
      certifications: await this._calculateSection(userId, Certification, profile.id),
      achievements: await this._calculateSection(userId, Achievement, profile.id),
      languages: await this._calculateSection(userId, Language, profile.id),
      socialLinks: await this._calculateSection(userId, SocialLink, profile.id),
      summary: this._calculateSummary(profile),
    };

    const completionPercentage = Math.round(
      Object.values(sections).reduce((sum, val) => sum + val, 0) / (Object.keys(sections).length * 100) * 100
    );

    const missingFields = this._getMissingFields(sections, profile);

    // Update or create completion record
    const [completion, created] = await ProfileCompletion.upsert({
      candidate_profile_id: profile.id,
      user_id: userId,
      ...sections,
      overall_completion: completionPercentage,
      missing_fields: missingFields,
      last_calculated_at: new Date(),
    }, { returning: true });

    return completion;
  }

  // === Interview History ===
  async getInterviewHistory(userId, options = {}) {
    const where = { user_id: userId, status: 'completed' };
    if (options.limit) where.limit = options.limit;
    return Interview.findAll({
      where,
      order: [['completed_at', 'DESC']],
      attributes: ['id', 'company', 'role', 'score', 'completed_at', 'duration_minutes', 'feedback'],
      limit: options.limit || 50,
    });
  }

  // === Utility Methods ===
  async _getProfile(userId) {
    return CandidateProfile.findOne({ where: { user_id: userId } });
  }

  async _getProfileId(userId) {
    const profile = await this._getProfile(userId);
    if (!profile) throw new Error('Candidate profile not found');
    return profile.id;
  }

  async _calculateSection(userId, model, profileId) {
    const count = await model.count({ where: { candidate_profile_id: profileId } });
    if (count >= 3) return 100;
    if (count >= 1) return 50;
    return 0;
  }

  _calculatePersonalInfo(profile) {
    const fields = ['full_name', 'email', 'phone_number', 'location', 'date_of_birth', 'nationality'];
    const filled = fields.filter(f => profile[f]);
    return Math.round((filled.length / fields.length) * 100);
  }

  _calculateSkills(profile) {
    const skills = profile.skills || {};
    const total = Object.values(skills).flat().filter(s => s).length;
    if (total >= 8) return 100;
    if (total >= 4) return 60;
    if (total >= 1) return 40;
    return 0;
  }

  _calculateSummary(profile) {
    const filled = [profile.professional_summary, profile.career_objective, profile.about_me].filter(s => s && s.length > 50);
    return Math.round((filled.length / 3) * 100);
  }

  _getMissingFields(sections, profile) {
    const missing = [];
    if (sections.personalInfo < 100) missing.push('personal_info');
    if (sections.education < 50) missing.push('education');
    if (sections.workExperience < 50) missing.push('work_experience');
    if (sections.projects < 50) missing.push('projects');
    if (sections.skills < 100) missing.push('skills');
    if (sections.certifications < 50) missing.push('certifications');
    if (sections.languages < 50) missing.push('languages');
    if (sections.socialLinks < 50) missing.push('social_links');
    if (sections.summary < 100) missing.push('professional_summary');
    return missing;
  }
}

module.exports = new ProfileRepository();