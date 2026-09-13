// SkillStatistic model - tracks analytics for each evaluated skill
module.exports = (sequelize, DataTypes) => {
  const SkillStatistic = sequelize.define('SkillStatistic', {
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
    skill_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('technical', 'database', 'framework', 'language', 'devops', 'system_design', 'behavioral', 'soft'),
      allowNull: false,
    },
    // Usage statistics
    question_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    answer_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    average_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    highest_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lowest_score: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    // Performance details
    strengths_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    weaknesses_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    missing_concepts: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    // Current learning status
    status: {
      type: DataTypes.ENUM('mastered', 'proficient', 'learning', 'weak', 'unknown'),
      defaultValue: 'unknown',
    },
    last_evaluated_at: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'skill_statistics',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'skill_name'], unique: true },
      { fields: ['skill_name'] },
      { fields: ['category'] },
    ],
  });

  SkillStatistic.associate = (models) => {
    SkillStatistic.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return SkillStatistic;
};