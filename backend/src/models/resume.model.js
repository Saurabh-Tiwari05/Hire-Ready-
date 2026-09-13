// Resume model
module.exports = (sequelize, DataTypes) => {
  const Resume = sequelize.define('Resume', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_url: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    parsed_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    original_filename: {
      type: DataTypes.STRING(255),
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
    tableName: 'resumes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Resume.associate = (models) => {
    Resume.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    Resume.hasOne(models.CandidateProfile, {
      foreignKey: 'resume_id',
      as: 'candidateProfile',
      onDelete: 'SET NULL',
    });
  };

  return Resume;
};