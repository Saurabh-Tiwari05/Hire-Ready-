// Models index - initialize all models and associations
const { DataTypes } = require("sequelize");
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Resume = require('./resume.model');
const Interview = require('./interview.model');
const Report = require('./report.model');
const Notification = require('./notification.model');
const CandidateProfile = require('./candidateProfile.model');
const InterviewContext = require('./interviewContext.model');
const InterviewMessage = require('./interviewMessage.model');
const Evaluation = require('./evaluation.model');
const QuestionEvaluation = require('./questionEvaluation.model');
const DashboardStat = require('./dashboardStat.model');
const SkillStatistic = require('./skillStatistic.model');
const CompanyReadiness = require('./companyReadiness.model');
const RoleReadiness = require('./roleReadiness.model');
const LearningRoadmap = require('./learningRoadmap.model');
const ProgressHistory = require('./progressHistory.model');
const Achievement = require('./achievement.model');
const UserGoal = require('./userGoal.model');
const CareerAnalysis = require('./careerAnalysis.model');
const ATSScore = require('./atsScore.model');
const ResumeFeedback = require('./resumeFeedback.model');
const JobMatch = require('./jobMatch.model');
const CompanyMatch = require('./companyMatch.model');
const SkillGap = require('./skillGap.model');
const PreparationPlan = require('./preparationPlan.model');
const LearningResource = require('./learningResource.model');
const Education = require('./education.model');
const WorkExperience = require('./workExperience.model');
const Project = require('./project.model');
const Certification = require('./certification.model');
const Language = require('./language.model');
const SocialLink = require('./socialLink.model');
const ProfileSetting = require('./profileSetting.model');
const ProfileCompletion = require('./profileCompletion.model');

const models = {
  User: User(sequelize, DataTypes),
  Resume: Resume(sequelize, DataTypes),
  Interview: Interview(sequelize, DataTypes),
  Report: Report(sequelize, DataTypes),
  Notification: Notification(sequelize, DataTypes),
  CandidateProfile: CandidateProfile(sequelize, DataTypes),
  InterviewContext: InterviewContext(sequelize, DataTypes),
  InterviewMessage: InterviewMessage(sequelize, DataTypes),
  Evaluation: Evaluation(sequelize, DataTypes),
  QuestionEvaluation: QuestionEvaluation(sequelize, DataTypes),
  DashboardStat: DashboardStat(sequelize, DataTypes),
  SkillStatistic: SkillStatistic(sequelize, DataTypes),
  CompanyReadiness: CompanyReadiness(sequelize, DataTypes),
  RoleReadiness: RoleReadiness(sequelize, DataTypes),
  LearningRoadmap: LearningRoadmap(sequelize, DataTypes),
  ProgressHistory: ProgressHistory(sequelize, DataTypes),
  Achievement: Achievement(sequelize, DataTypes),
  UserGoal: UserGoal(sequelize, DataTypes),
  CareerAnalysis: CareerAnalysis(sequelize, DataTypes),
  ATSScore: ATSScore(sequelize, DataTypes),
  ResumeFeedback: ResumeFeedback(sequelize, DataTypes),
  JobMatch: JobMatch(sequelize, DataTypes),
  CompanyMatch: CompanyMatch(sequelize, DataTypes),
  SkillGap: SkillGap(sequelize, DataTypes),
  PreparationPlan: PreparationPlan(sequelize, DataTypes),
  LearningResource: LearningResource(sequelize, DataTypes),
  Education: Education(sequelize, DataTypes),
  WorkExperience: WorkExperience(sequelize, DataTypes),
  Project: Project(sequelize, DataTypes),
  Certification: Certification(sequelize, DataTypes),
  Language: Language(sequelize, DataTypes),
  SocialLink: SocialLink(sequelize, DataTypes),
  ProfileSetting: ProfileSetting(sequelize, DataTypes),
  ProfileCompletion: ProfileCompletion(sequelize, DataTypes),
};

// Set up associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

// User associations
// All User.hasMany associations are defined in user.model.js
// The commented-out lines below are for reference only and should not be uncommented.

// models.User.hasMany(models.Resume, {
//   foreignKey: 'user_id',
//   as: 'resumes',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.Interview, {
//   foreignKey: 'user_id',
//   as: 'interviews',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.Report, {
//   foreignKey: 'user_id',
//   as: 'reports',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.Notification, {
//   foreignKey: 'user_id',
//   as: 'notifications',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.Evaluation, {
//   foreignKey: 'user_id',
//   as: 'evaluations',
//   onDelete: 'CASCADE',
// });

// models.Interview.hasMany(models.Evaluation, {
//   foreignKey: 'interview_id',
//   as: 'evaluations',
//   onDelete: 'CASCADE',
// });

// models.Evaluation.hasMany(models.QuestionEvaluation, {
//   foreignKey: 'evaluation_id',
//   as: 'questionEvaluations',
//   onDelete: 'CASCADE',
// });

// models.Interview.hasMany(models.QuestionEvaluation, {
//   foreignKey: 'interview_id',
//   as: 'question_evaluations',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.DashboardStat, {
//   foreignKey: 'user_id',
//   as: 'dashboardStats',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.SkillStatistic, {
//   foreignKey: 'user_id',
//   as: 'skillStatistics',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.CompanyReadiness, {
//   foreignKey: 'user_id',
//   as: 'companyReadiness',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.RoleReadiness, {
//   foreignKey: 'user_id',
//   as: 'roleReadiness',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.LearningRoadmap, {
//   foreignKey: 'user_id',
//   as: 'learningRoadmaps',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.ProgressHistory, {
//   foreignKey: 'user_id',
//   as: 'progressHistory',
//   onDelete: 'CASCADE',
// });

// Achievement is now linked via CandidateProfile (Process 14)
// models.User.hasMany(models.Achievement, { foreignKey: 'user_id', as: 'achievements' });

// models.User.hasMany(models.UserGoal, {
//   foreignKey: 'user_id',
//   as: 'goals',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.CareerAnalysis, {
//   foreignKey: 'user_id',
//   as: 'careerAnalyses',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.ATSScore, {
//   foreignKey: 'user_id',
//   as: 'atsScores',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.ResumeFeedback, {
//   foreignKey: 'user_id',
//   as: 'resumeFeedback',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.JobMatch, {
//   foreignKey: 'user_id',
//   as: 'jobMatches',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.CompanyMatch, {
//   foreignKey: 'user_id',
//   as: 'companyMatches',
//   onDelete: 'CASCADE',
// });

// models.User.hasMany(models.LearningResource, {
//   foreignKey: 'user_id',
//   as: 'learningResources',
//   onDelete: 'CASCADE',
// });

module.exports = { models, sequelize, ...models };