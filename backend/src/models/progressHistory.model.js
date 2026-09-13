// ProgressHistory model - tracks score progression across interviews
module.exports = (sequelize, DataTypes) => {
  const ProgressHistory = sequelize.define('ProgressHistory', {
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
    // Interview info snapshot
    company: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    interview_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Scores
    overall_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    technical_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    communication_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    confidence_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    problem_solving_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Delta from previous
    score_delta: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Timeline
    time_bucket: {
      type: DataTypes.STRING(20), // 'week', 'month', 'year', 'all'
      allowNull: true,
    },
    bucket_period: {
      type: DataTypes.STRING(20), // e.g. '2025-01' for month, 'week-3'
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'progress_history',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['interview_id'] },
      { fields: ['report_id'] },
      { fields: ['time_bucket'] },
      { fields: ['bucket_period'] },
      { fields: ['interview_date'] },
    ],
  });

  ProgressHistory.associate = (models) => {
    ProgressHistory.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ProgressHistory.belongsTo(models.Interview, { foreignKey: 'interview_id', as: 'interview' });
  };

  return ProgressHistory;
};