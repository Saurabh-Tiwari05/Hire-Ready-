// WorkExperience model - stores candidate work experience entries
module.exports = (sequelize, DataTypes) => {
  const WorkExperience = sequelize.define('WorkExperience', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidate_profile_id: {
      type: DataTypes.UUID,
      references: { model: 'CandidateProfiles', key: 'id' },
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    responsibilities: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    achievements: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    technology_stack: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    projects: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'work_experience',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
      { fields: ['company'] },
    ],
  });

  WorkExperience.associate = (models) => {
    WorkExperience.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return WorkExperience;
};