// Achievement model - tracks user achievements and milestones
module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define('Achievement', {
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
    achievement_type: {
      type: DataTypes.ENUM(
        'first_interview',
        'streak_7',
        'streak_30',
        'score_90',
        'score_80',
        'score_70',
        'interview_count_10',
        'interview_count_25',
        'interview_count_50',
        'interview_count_100',
        'company_applied_5',
        'company_applied_10',
        'company_applied_20',
        'skill_mastered',
        'report_generated',
        'streak_completed',
        'perfect_score',
        'improvement_20',
        'improvement_30',
        'improvement_50',
      ),
      allowNull: false,
    },
    // Achievement details
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    // Reference to the interview/report that triggered this achievement
    interview_id: {
      type: DataTypes.UUID,
      references: { model: 'Interviews', key: 'id' },
      allowNull: true,
    },
    report_id: {
      type: DataTypes.UUID,
      references: { model: 'Reports', key: 'id' },
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'achievements',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'achievement_type'] },
      { fields: ['achievement_type'] },
    ],
  });

  Achievement.associate = (models) => {
    Achievement.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Achievement;
};