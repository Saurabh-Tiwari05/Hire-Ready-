// Notification model - stores user notifications
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('interview_scheduled', 'interview_reminder', 'interview_completed', 'report_generated', 'resume_submitted', 'application_update', 'system_announcement', 'achievement_unlocked', 'goal_reminder', 'goal_completed'),
      allowNull: false,
      defaultValue: 'system_announcement',
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
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
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'is_read'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['type'] },
    ],
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return Notification;
};