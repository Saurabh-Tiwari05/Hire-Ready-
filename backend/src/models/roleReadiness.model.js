// RoleReadiness model - stores predicted readiness scores for specific job roles
module.exports = (sequelize, DataTypes) => {
  const RoleReadiness = sequelize.define('RoleReadiness', {
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
    role_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    behavioral_readiness: {
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
    career_path_suggestions: {
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
    tableName: 'role_readiness',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'role_name'], unique: true },
      { fields: ['role_name'] },
    ],
  });

  RoleReadiness.associate = (models) => {
    RoleReadiness.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return RoleReadiness;
};