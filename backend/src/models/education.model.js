// Education model - stores candidate education history
module.exports = (sequelize, DataTypes) => {
  const Education = sequelize.define('Education', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    candidate_profile_id: {
      type: DataTypes.UUID,
      references: { model: 'CandidateProfiles', key: 'id' },
      allowNull: false,
    },
    school: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    college: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    university: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    degree: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    marks: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cgpa: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    achievements: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'education',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
    ],
  });

  Education.associate = (models) => {
    Education.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return Education;
};