// Career Analysis Repository - handles database operations for career analysis
const {
  CareerAnalysis,
  ATSScore,
  ResumeFeedback,
  JobMatch,
  CompanyMatch,
  SkillGap,
  PreparationPlan,
  LearningResource,
  CandidateProfile,
  Interview,
  Achievement,
  UserGoal,
} = require('../models');

class CareerRepository {
  // Career Analysis
  async createCareerAnalysis(data) {
    return CareerAnalysis.create(data);
  }

  async findCareerAnalysisByUserId(userId) {
    return CareerAnalysis.findOne({ where: { user_id: userId } });
  }

  async updateCareerAnalysis(userId, data) {
    const analysis = await CareerAnalysis.findOne({ where: { user_id: userId } });
    if (!analysis) return null;
    await analysis.update(data);
    return analysis;
  }

  // ATS Score
  async createATSScore(data) {
    return ATSScore.create(data);
  }

  async findLatestATSScoreByUserId(userId) {
    return ATSScore.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async findATSScoresByUserId(userId) {
    return ATSScore.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  // Resume Feedback
  async createResumeFeedback(data) {
    return ResumeFeedback.create(data);
  }

  async findResumeFeedbackByUserId(userId) {
    return ResumeFeedback.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  // Job Matches
  async createJobMatch(data) {
    return JobMatch.create(data);
  }

  async bulkCreateJobMatches(matches) {
    return JobMatch.bulkCreate(matches);
  }

  async findJobMatchesByUserId(userId) {
    return JobMatch.findAll({
      where: { user_id: userId },
      order: [['match_score', 'DESC']],
    });
  }

  async deleteJobMatchesByUserId(userId) {
    return JobMatch.destroy({ where: { user_id: userId } });
  }

  // Company Matches
  async createCompanyMatch(data) {
    return CompanyMatch.create(data);
  }

  async bulkCreateCompanyMatches(matches) {
    return CompanyMatch.bulkCreate(matches);
  }

  async findCompanyMatchesByUserId(userId) {
    return CompanyMatch.findAll({
      where: { user_id: userId },
      order: [['match_score', 'DESC']],
    });
  }

  async deleteCompanyMatchesByUserId(userId) {
    return CompanyMatch.destroy({ where: { user_id: userId } });
  }

  // Skill Gaps
  async createSkillGap(data) {
    return SkillGap.create(data);
  }

  async bulkCreateSkillGaps(gaps) {
    return SkillGap.bulkCreate(gaps);
  }

  async findSkillGapsByUserId(userId) {
    return SkillGap.findAll({
      where: { user_id: userId },
      order: [
        ['priority', 'DESC'],
        ['skill_name', 'ASC'],
      ],
    });
  }

  async deleteSkillGapsByUserId(userId) {
    return SkillGap.destroy({ where: { user_id: userId } });
  }

  // Preparation Plans
  async createPreparationPlan(data) {
    return PreparationPlan.create(data);
  }

  async findActivePreparationPlanByUserId(userId) {
    return PreparationPlan.findOne({
      where: { user_id: userId, is_active: true },
      order: [['created_at', 'DESC']],
    });
  }

  async findPreparationPlansByUserId(userId) {
    return PreparationPlan.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async updatePreparationPlan(planId, data) {
    const plan = await PreparationPlan.findByPk(planId);
    if (!plan) return null;
    await plan.update(data);
    return plan;
  }

  // Learning Resources
  async createLearningResource(data) {
    return LearningResource.create(data);
  }

  async bulkCreateLearningResources(resources) {
    return LearningResource.bulkCreate(resources);
  }

  async findLearningResourcesByUserId(userId, options = {}) {
    const { completed, skill, type, limit } = options;
    const where = { user_id: userId };
    if (completed !== undefined) where.is_completed = completed;
    if (skill) where.related_skills = { [require('sequelize').Op.contains]: [skill] };
    if (type) where.resource_type = type;

    return LearningResource.findAll({
      where,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      limit,
    });
  }

  async deleteLearningResourcesByUserId(userId) {
    return LearningResource.destroy({ where: { user_id: userId } });
  }

  // Missing methods for career controller
  async clearJobMatchesByUserId(userId) {
    return JobMatch.destroy({ where: { user_id: userId } });
  }

  async clearCompanyMatchesByUserId(userId) {
    return CompanyMatch.destroy({ where: { user_id: userId } });
  }

  async getCandidateProfileByUserId(userId) {
    const { CandidateProfile } = require('../models');
    return CandidateProfile.findOne({ where: { user_id: userId } });
  }

  async getInterviewScoresByUserId(userId) {
    return Interview.findAll({
      where: { user_id: userId, status: 'completed' },
      attributes: ['score', 'company', 'role', 'completed_at'],
    });
  }

  async getAchievementsByUserId(userId) {
    const { Achievement } = require('../models');
    return Achievement.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async getGoalsByUserId(userId) {
    const { UserGoal } = require('../models');
    return UserGoal.findAll({
      where: { user_id: userId, status: 'active' },
      order: [['created_at', 'DESC']],
    });
  }

  async getPlanTotalItems(planId) {
    const plan = await PreparationPlan.findByPk(planId);
    return plan?.total_items || 0;
  }
}

module.exports = new CareerRepository();