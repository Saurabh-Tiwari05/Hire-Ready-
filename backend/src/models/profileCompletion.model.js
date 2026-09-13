// ProfileCompletion model - tracks candidate profile completeness across sections
module.exports = (sequelize, DataTypes) => {
  const ProfileCompletion = sequelize.define('ProfileCompletion', {
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
    // Section completeness (0-100)
    personal_info: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    education: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    work_experience: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    projects: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    skills: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    certifications: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    achievements: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    languages: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    social_links: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    summary: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Overall
    overall_completion: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Missing fields list
    missing_fields: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Completion metadata
    last_calculated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'profile_completion',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['overall_completion'] },
    ],
  });

  ProfileCompletion.associate = (models) => {
    ProfileCompletion.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
    ProfileCompletion.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ProfileCompletion;
};