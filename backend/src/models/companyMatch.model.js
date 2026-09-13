// CompanyMatch model - stores company-specific readiness analysis
module.exports = (sequelize, DataTypes) => {
  const CompanyMatch = sequelize.define('CompanyMatch', {
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
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    match_score: {
      type: DataTypes.INTEGER, // 0-100
      allowNull: true,
    },
    technical_readiness: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    communication_readiness: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    culture_fit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    required_skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    matching_skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    missing_skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    preparation_recommendations: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    interview_focus_areas: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    confidence_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    estimated_prep_time: {
      type: DataTypes.STRING, // e.g., "2 weeks", "1 month"
      allowNull: true,
    },
    readiness_status: {
      type: DataTypes.ENUM('very_ready', 'ready', 'almost_ready', 'needs_preparation', 'not_ready'),
      defaultValue: 'needs_preparation',
    },
    interview_expectations: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'company_matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'company_name'] },
      { fields: ['match_score'] },
    ],
  });

  CompanyMatch.associate = (models) => {
    CompanyMatch.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return CompanyMatch;
};