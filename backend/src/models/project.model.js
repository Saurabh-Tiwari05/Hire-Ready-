// Project model - stores candidate project entries
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
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
    project_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    github_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    live_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    technology_stack: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    features: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ai_improved_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ai_suggestions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
      { fields: ['is_featured'] },
    ],
  });

  Project.associate = (models) => {
    Project.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return Project;
};