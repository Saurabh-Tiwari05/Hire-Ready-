// LearningResource model - stores recommended learning resources
module.exports = (sequelize, DataTypes) => {
  const LearningResource = sequelize.define('LearningResource', {
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
    resource_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    resource_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    resource_type: {
      type: DataTypes.ENUM('article', 'video', 'course', 'book', 'platform', 'documentation'),
      defaultValue: 'platform',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    related_skills: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    related_topics: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      defaultValue: 'medium',
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completed_at: {
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
    tableName: 'learning_resources',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['related_skills'] },
      { fields: ['resource_type'] },
      { fields: ['priority'] },
    ],
  });

  LearningResource.associate = (models) => {
    LearningResource.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return LearningResource;
};