// CareerAnalysis model - stores high-level career analysis and overall career readiness
module.exports = (sequelize, DataTypes) => {
  const CareerAnalysis = sequelize.define('CareerAnalysis', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
      unique: true,
    },
    overall_career_readiness: {
      type: DataTypes.INTEGER, // 0-100
      defaultValue: 0,
    },
    breakdown_scores: {
      type: DataTypes.JSONB,
      defaultValue: {
        resume: 0,
        technical: 0,
        communication: 0,
        confidence: 0,
        behavioral: 0,
      },
    },
    career_insights: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    recommended_next_interview: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_analyzed_at: {
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
    tableName: 'career_analysis',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'], unique: true },
    ],
  });

  CareerAnalysis.associate = (models) => {
    CareerAnalysis.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return CareerAnalysis;
};