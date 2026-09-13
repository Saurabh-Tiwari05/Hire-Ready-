// Interview Report model
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
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
    interview_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Interviews',
        key: 'id',
      },
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('interview_analysis', 'skill_assessment', 'progress_report', 'mock_feedback'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    scores: {
      type: DataTypes.JSONB,
      allowNull: true,
      // { communication: 82, technical: 76, behavior: 88, confidence: 69, coding: 91 }
    },
    strengths: {
      type: DataTypes.JSONB,
      allowNull: true,
      // array of strings
    },
    improvements: {
      type: DataTypes.JSONB,
      allowNull: true,
      // array of strings
    },
    recommendations: {
      type: DataTypes.JSONB,
      allowNull: true,
      // array of strings
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'type'] },
      { fields: ['user_id', 'created_at'] },
      { fields: ['interview_id'] },
    ],
  });

  Report.associate = (models) => {
    Report.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    Report.belongsTo(models.Interview, {
      foreignKey: 'interview_id',
      as: 'interview',
    });
  };

  return Report;
};