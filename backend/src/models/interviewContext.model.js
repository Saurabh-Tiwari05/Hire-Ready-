// Interview Context model - stores the complete interview context for a session
module.exports = (sequelize, DataTypes) => {
  const InterviewContext = sequelize.define('InterviewContext', {
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
    candidate_profile_id: {
      type: DataTypes.UUID,
      references: {
        model: 'CandidateProfiles',
        key: 'id',
      },
      allowNull: true,
    },
    // Interview configuration
    company: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'),
      allowNull: false,
      defaultValue: 'medium',
    },
    type: {
      type: DataTypes.ENUM('technical', 'behavioral', 'system_design', 'coding', 'mixed', 'screening'),
      allowNull: false,
      defaultValue: 'mixed',
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    // Derived context from candidate profile
    candidate_summary: {
      type: DataTypes.JSONB,
      allowNull: true,
      // { name, seniorityLevel, primaryRole, totalYearsExperience, skills: [] }
    },
    strong_areas: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    weak_areas: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    skill_gaps: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    interview_focus_areas: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Previous interview history summary
    previous_interviews_summary: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        totalCount: 0,
        completedCount: 0,
        averageScore: null,
        recentTopics: [],
        improvementAreas: [],
      },
    },
    // Generated questions (cached)
    generated_questions: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    // Context metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    // Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'interview_contexts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['interview_id'] },
      { fields: ['candidate_profile_id'] },
      { fields: ['is_active'] },
      { fields: ['company', 'role'] },
    ],
  });

  InterviewContext.associate = (models) => {
    InterviewContext.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    InterviewContext.belongsTo(models.Interview, {
      foreignKey: 'interview_id',
      as: 'interview',
    });

    InterviewContext.belongsTo(models.CandidateProfile, {
      foreignKey: 'candidate_profile_id',
      as: 'candidateProfile',
    });
  };

  return InterviewContext;
};