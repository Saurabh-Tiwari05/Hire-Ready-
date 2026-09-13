// LearningRoadmap model - stores personalized learning roadmap per user
module.exports = (sequelize, DataTypes) => {
  const LearningRoadmap = sequelize.define('LearningRoadmap', {
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
    // Roadmap version tracking
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    // Roadmap content (JSONB weeks array)
    roadmap_data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    // Status tracking
    current_week: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    total_weeks: {
      type: DataTypes.INTEGER,
      defaultValue: 4,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Progress
    completed_weeks: {
      type: DataTypes.JSONB,
      defaultValue: [],
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
    tableName: 'learning_roadmaps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'is_active'] },
    ],
  });

  LearningRoadmap.associate = (models) => {
    LearningRoadmap.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LearningRoadmap;
};