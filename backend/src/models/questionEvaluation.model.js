// Question Evaluation model - stores per-question evaluation results
module.exports = (sequelize, DataTypes) => {
  const QuestionEvaluation = sequelize.define('QuestionEvaluation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    evaluation_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Evaluations',
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
      allowNull: false,
    },
    message_id: {
      type: DataTypes.UUID,
      references: {
        model: 'InterviewMessages',
        key: 'id',
      },
      allowNull: true,
    },
    // Question details
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    question_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Answer
    answer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Individual dimension scores
    technical_accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    communication: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    problem_solving: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    clarity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    completeness: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    relevance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    grammar: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    overall_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Analysis
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
    missing_concepts: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    recommendations: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    keywords: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Next question strategy from Gemini
    next_difficulty: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    next_question_focus: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Full evaluation JSON
    evaluation_json: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Timing
    response_duration_seconds: {
      type: DataTypes.INTEGER,
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
    tableName: 'question_evaluations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['evaluation_id'] },
      { fields: ['interview_id'] },
      { fields: ['message_id'] },
    ],
  });

  QuestionEvaluation.associate = (models) => {
    QuestionEvaluation.belongsTo(models.Evaluation, {
      foreignKey: 'evaluation_id',
      as: 'evaluation',
    });

    QuestionEvaluation.belongsTo(models.Interview, {
      foreignKey: 'interview_id',
      as: 'interview',
    });

    QuestionEvaluation.belongsTo(models.InterviewMessage, {
      foreignKey: 'message_id',
      as: 'message',
    });
  };

  return QuestionEvaluation;
};