// Evaluation model - stores overall interview evaluation results
module.exports = (sequelize, DataTypes) => {
  const Evaluation = sequelize.define('Evaluation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    interview_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Interviews',
        key: 'id',
      },
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
      allowNull: false,
    },
    // Overall scores
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
    // Analysis arrays
    strengths: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    weaknesses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    recommendations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    missing_concepts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Interview context snapshot
    interview_context: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Full evaluation JSON from Gemini
    evaluation_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Summary report data
    summary_report: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Status
    is_complete: {
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
    tableName: 'evaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['interview_id'] },
      { fields: ['user_id'] },
      { fields: ['is_complete'] },
    ],
  });

  Evaluation.associate = (models) => {
    Evaluation.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    Evaluation.belongsTo(models.Interview, {
      foreignKey: 'interview_id',
      as: 'interview',
    });

    Evaluation.hasMany(models.QuestionEvaluation, {
      foreignKey: 'evaluation_id',
      as: 'questionEvaluations',
      onDelete: 'CASCADE',
    });
  };

  return Evaluation;
};