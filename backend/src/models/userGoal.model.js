// UserGoal model - stores user-defined goals and progress tracking
module.exports = (sequelize, DataTypes) => {
  const UserGoal = sequelize.define('UserGoal', {
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
    // Goal definition
    goal_type: {
      type: DataTypes.ENUM(
        'interview_count',
        'target_company',
        'target_score',
        'practice_streak',
        'skill_mastery',
        'report_generation',
        'custom',
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Target values
    target_value: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    target_company: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    target_role: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    target_skill: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    target_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    target_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Current progress
    current_value: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Status
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
      defaultValue: 'active',
    },
    // Progress tracking
    progress_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // Dates
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    target_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Reminders
    reminder_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    reminder_frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      defaultValue: 'weekly',
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
    tableName: 'user_goals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'status'] },
      { fields: ['goal_type'] },
    ],
  });

  UserGoal.associate = (models) => {
    UserGoal.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return UserGoal;
};