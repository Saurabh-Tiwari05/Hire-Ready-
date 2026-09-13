// ResumeFeedback model - stores detailed resume improvement suggestions
module.exports = (sequelize, DataTypes) => {
  const ResumeFeedback = sequelize.define('ResumeFeedback', {
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
    category: {
      type: DataTypes.ENUM('summary', 'experience', 'projects', 'skills', 'education', 'keywords', 'formatting', 'achievements', 'overall'),
      allowNull: false,
    },
    suggestions: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    action_items: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      defaultValue: 'medium',
    },
    implemented: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'resume_feedback',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'resume_id'] },
      { fields: ['category'] },
      { fields: ['priority'] },
    ],
  });

  ResumeFeedback.associate = (models) => {
    ResumeFeedback.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ResumeFeedback.belongsTo(models.Resume, { foreignKey: 'resume_id', as: 'resume' });
  };

  return ResumeFeedback;
};