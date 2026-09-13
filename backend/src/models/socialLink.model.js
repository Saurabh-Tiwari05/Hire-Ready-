// SocialLink model - stores candidate social and coding profile links
module.exports = (sequelize, DataTypes) => {
  const SocialLink = sequelize.define('SocialLink', {
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
    platform: {
      type: DataTypes.ENUM('github', 'linkedin', 'portfolio', 'leetcode', 'hackerrank', 'codeforces', 'codechef', 'geeksforgeeks', 'website', 'other'),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_public: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'social_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['candidate_profile_id'] },
      { fields: ['platform'] },
    ],
  });

  SocialLink.associate = (models) => {
    SocialLink.belongsTo(models.CandidateProfile, { foreignKey: 'candidate_profile_id', as: 'candidateProfile' });
  };

  return SocialLink;
};