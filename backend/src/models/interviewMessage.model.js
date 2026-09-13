// Interview Message model - stores questions and answers during interviews
module.exports = (sequelize, DataTypes) => {
  const InterviewMessage = sequelize.define(
    "InterviewMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      interview_id: {
        type: DataTypes.UUID,
        references: {
          model: "Interviews",
          key: "id",
        },
        allowNull: false,
      },
      interview_context_id: {
        type: DataTypes.UUID,
        references: {
          model: "InterviewContexts",
          key: "id",
        },
        allowNull: true,
      },
      // Message content
      message_type: {
        type: DataTypes.ENUM("question", "answer", "system", "evaluated"),
        allowNull: false,
        defaultValue: "question",
      },
      role: {
        type: DataTypes.ENUM("assistant", "user", "system"),
        allowNull: false,
        defaultValue: "assistant",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Question/Answer specific fields
      question_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // Evaluation fields
      evaluation: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      confidence_score: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      mistakes: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      // Metadata
      topic: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      difficulty: {
        type: DataTypes.ENUM("easy", "medium", "hard"),
        allowNull: true,
      },
      estimated_time_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      actual_time_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      // Status
      is_correct: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      is_repeated: {
        type: DataTypes.BOOLEAN,
        field: "repeated",
        defaultValue: false,
      },
      // Timestamps
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "interview_messages",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { fields: ["interview_id"] },
        { fields: ["interview_context_id"] },
        { fields: ["question_id"] },
        { fields: ["message_type"] },
        { fields: ["created_at"] },
      ],
    },
  );

  InterviewMessage.associate = (models) => {
    InterviewMessage.belongsTo(models.Interview, {
      foreignKey: "interview_id",
      as: "interview",
    });

    InterviewMessage.belongsTo(models.InterviewContext, {
      foreignKey: "interview_context_id",
      as: "interviewContext",
    });
  };

  return InterviewMessage;
};
