// SkillGap model - stores individual skill gap analysis items
module.exports = (sequelize, DataTypes) => {
  const SkillGap = sequelize.define('SkillGap', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: { model: 'Users', key: 'id' },
      allowNull: false,
    },
    skill_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('technical', 'database', 'framework', 'language', 'devops', 'system_design', 'behavioral', 'soft'),
      allowNull: true,
    },
    current_level: {
      type: DataTypes.INTEGER, // 0-5 scale
      allowNull: true,
    },
    required_level: {
      type: DataTypes.INTEGER, // 0-5 scale
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('high', 'medium', 'low'),
      defaultValue: 'medium',
    },
    recommended_resources: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    related_to_roles: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    related_to_companies: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'skill_gaps',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['user_id', 'skill_name'], unique: true },
      { fields: ['priority'] },
      { fields: ['category'] },
    ],
  });

  SkillGap.associate = (models) => {
    SkillGap.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return SkillGap;
};