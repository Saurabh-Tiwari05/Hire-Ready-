// JobMatch model - stores job/role matching analysis results
module.exports = (sequelize, DataTypes) => {
  const JobMatch = sequelize.define('JobMatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    job_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    job_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    match_score: {
      type: DataTypes.INTEGER, // 0-100
      allowNull: true,
    },
    technical_fit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    experience_fit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    skills_match: {
      type: DataTypes.JSONB,
      defaultValue: { matched: [], missing: [] },
    },
    strengths: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    gaps: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    preparation_needed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    readiness_status: {
      type: DataTypes.ENUM('ready', 'almost_ready', 'needs_preparation', 'not_ready'),
      defaultValue: 'needs_preparation',
    },
    estimated_prep_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    recommendation: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_target_role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'job_matches',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'job_title'] },
      { fields: ['match_score'] },
      { fields: ['readiness_status'] },
    ],
  });

  JobMatch.associate = (models) => {
    JobMatch.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return JobMatch;
};