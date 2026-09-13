// PreparationPlan model - stores daily personalized interview preparation plan
module.exports = (sequelize, DataTypes) => {
  const PreparationPlan = sequelize.define('PreparationPlan', {
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
    plan_type: {
      type: DataTypes.ENUM('daily', 'weekly', 'custom', 'interview_prep'),
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
    weeks: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    items_completed: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    total_items: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    progress_percentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    target_completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    generated_from: {
      type: DataTypes.STRING(100),
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
    tableName: 'preparation_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'is_active'] },
      { fields: ['plan_type'] },
    ],
  });

  PreparationPlan.associate = (models) => {
    PreparationPlan.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return PreparationPlan;
};