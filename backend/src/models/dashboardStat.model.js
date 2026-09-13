// DashboardStat model - stores aggregated dashboard statistics per user
module.exports = (sequelize, DataTypes) => {
  const DashboardStat = sequelize.define('DashboardStat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
      unique: true,
    },
    // Interview statistics
    total_interviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    completed_interviews: {
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
    average_technical_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    average_communication_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    average_confidence_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // Time statistics
    interview_hours: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    average_duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Career metrics
    companies_applied: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reports_generated: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Streaks
    current_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    longest_streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Career readiness summary JSON
    readiness_summary: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'dashboard_stats',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
    ],
  });

  DashboardStat.associate = (models) => {
    DashboardStat.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return DashboardStat;
};