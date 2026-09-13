// CompanyReadiness model - stores predicted readiness scores for specific companies
module.exports = (sequelize, DataTypes) => {
  const CompanyReadiness = sequelize.define('CompanyReadiness', {
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
    company_size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    company_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Readiness scores
    overall_readiness: {
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
    // Gap analysis
    skill_gaps: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    missing_concepts: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Recommendations
    preparation_recommendations: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    interview_focus_areas: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Confidence and metadata
    confidence_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_calculated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
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
    tableName: 'company_readiness',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'company_name'], unique: true },
      { fields: ['company_name'] },
    ],
  });

  CompanyReadiness.associate = (models) => {
    CompanyReadiness.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return CompanyReadiness;
};