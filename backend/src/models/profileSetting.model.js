// ProfileSetting model - stores candidate profile privacy and notification settings
module.exports = (sequelize, DataTypes) => {
  const ProfileSetting = sequelize.define('ProfileSetting', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidate_profile_id: {
      type: DataTypes.UUID,
      references: { model: 'CandidateProfiles', key: 'id' },
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    // Profile visibility
    profile_visibility: {
      type: DataTypes.ENUM('public', 'private', 'recruiters_only'),
      defaultValue: 'private',
    },
    // Sharing preferences
    share_reports: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    share_resume: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    share_achievements: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Communication
    allow_messages: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allow_interview_requests: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Notification preferences
    email_notifications: {
      type: DataTypes.JSONB,
      defaultValue: {
        interviewUpdates: true,
        reportReady: true,
        newAchievements: true,
        careerInsights: true,
        weeklySummary: false,
      },
    },
    push_notifications: {
      type: DataTypes.JSONB,
      defaultValue: {
        interviewUpdates: true,
        reportReady: true,
      },
    },
    // Data preferences
    allow_data_analytics: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allow_profile_export: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Metadata
    settings_metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'profile_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'], unique: true },
      { fields: ['user_id'], unique: true },
      { fields: ['profile_visibility'] },
    ],
  });

  ProfileSetting.associate = (models) => {
    ProfileSetting.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
    ProfileSetting.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ProfileSetting;
};