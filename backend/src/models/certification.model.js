// Certification model - stores candidate certifications
module.exports = (sequelize, DataTypes) => {
  const Certification = sequelize.define('Certification', {
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
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    issuer: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    credential_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    verification_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'certifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
      { fields: ['is_verified'] },
      { fields: ['expiry_date'] },
    ],
  });

  Certification.associate = (models) => {
    Certification.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return Certification;
};