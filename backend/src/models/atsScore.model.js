// ATSScore model - stores ATS resume optimization scores and feedback
module.exports = (sequelize, DataTypes) => {
  const ATSScore = sequelize.define('ATSScore', {
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
    resume_id: {
      type: DataTypes.UUID,
      references: { model: 'Resumes', key: 'id' },
      allowNull: true,
    },
    overall_score: {
      type: DataTypes.INTEGER, // 0-100
      defaultValue: 0,
    },
    category_scores: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    // Breakdown by ATS categories
    keyword_optimization: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    formatting: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    projects_quality: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    education_completeness: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    grammar: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    action_verbs: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    section_ordering: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    missing_sections: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    strengths_keywords: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    missing_keywords: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    improvement_suggestions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    analyzed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'ats_scores',
    timestamps: true,
    createdAt: 'created_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'resume_id'] },
    ],
  });

  ATSScore.associate = (models) => {
    ATSScore.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ATSScore.belongsTo(models.Resume, { foreignKey: 'resume_id', as: 'resume' });
  };

  return ATSScore;
};