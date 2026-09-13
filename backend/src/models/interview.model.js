// Interview model
module.exports = (sequelize, DataTypes) => {
  const Interview = sequelize.define('Interview', {
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
    resume_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    company: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    stage: {
      type: DataTypes.ENUM('screening', 'technical', 'system_design', 'behavioral', 'final', 'offer', 'rejected'),
      allowNull: false,
      defaultValue: 'screening',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    interview_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    interview_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    interviewer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    interviewer_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    meeting_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
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
    tableName: 'interviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'status'] },
      { fields: ['user_id', 'scheduled_at'] },
      { fields: ['user_id', 'completed_at'] },
    ],
  });

  Interview.associate = (models) => {
  Interview.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  Interview.hasMany(models.Report, {
    foreignKey: 'interview_id',
    as: 'reports',
    onDelete: 'SET NULL',
  });

  Interview.hasOne(models.InterviewContext, {
    foreignKey: 'interview_id',
    as: 'interviewContext',
  });
  Interview.hasMany(models.InterviewMessage, {
  foreignKey: 'interview_id',
  as: 'messages',
  onDelete: 'CASCADE',
});
};


  return Interview;
};
