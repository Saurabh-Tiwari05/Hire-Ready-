// Candidate Profile model - stores parsed and verified resume data
module.exports = (sequelize, DataTypes) => {
  const CandidateProfile = sequelize.define('CandidateProfile', {
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
      unique: true, // One profile per user
    },
    resume_id: {
      type: DataTypes.UUID,
      references: {
        model: 'Resumes',
        key: 'id',
      },
      allowNull: true,
    },
    // Personal information
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    github_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    portfolio_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Professional summary
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Experience (JSONB array)
    experience: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Education (JSONB array)
    education: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Skills (JSONB object with categories)
    skills: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        technical: [],
        languages: [],
        frameworks: [],
        tools: [],
        soft: [],
      },
    },
    // Projects (JSONB array)
    projects: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Certifications (JSONB array)
    certifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // Languages (JSONB array)
    languages: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    // AI Analysis results
    analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        totalYearsExperience: 0,
        seniorityLevel: 'Mid',
        primaryRole: '',
        strongAreas: [],
        weakAreas: [],
        recommendedRoles: [],
        skillGaps: [],
        interviewFocusAreas: [],
      },
    },
    // Status
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Raw parsed data for debugging
    raw_parsed_data: {
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
    tableName: 'candidate_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'], unique: true },
      { fields: ['resume_id'] },
      { fields: ['is_verified'] },
      { fields: ['is_complete'] },
    ],
  });

  CandidateProfile.associate = (models) => {
    CandidateProfile.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    CandidateProfile.belongsTo(models.Resume, {
      foreignKey: 'resume_id',
      as: 'resume',
    });
  };

  return CandidateProfile;
};