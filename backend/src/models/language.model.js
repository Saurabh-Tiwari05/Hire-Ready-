// Language model - stores candidate language proficiencies
module.exports = (sequelize, DataTypes) => {
  const Language = sequelize.define('Language', {
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    speaking: {
      type: DataTypes.ENUM('native', 'fluent', 'professional', 'basic'),
      defaultValue: 'basic',
    },
    reading: {
      type: DataTypes.ENUM('fluent', 'professional', 'intermediate', 'basic'),
      defaultValue: 'basic',
    },
    writing: {
      type: DataTypes.ENUM('fluent', 'professional', 'intermediate', 'basic'),
      defaultValue: 'basic',
    },
    proficiency: {
      type: DataTypes.ENUM('native', 'fluent', 'professional', 'basic'),
      defaultValue: 'basic',
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'languages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
      { fields: ['candidate_profile_id', 'is_primary'], unique: true },
    ],
  });

  Language.associate = (models) => {
    Language.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return Language;
};