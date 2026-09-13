// User model - updated with profile management fields
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    college: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    github_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profile_picture_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    target_companies: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    preferred_role: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email_notifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        resume_submission: true,
        interview_invite: true,
      },
    },
    notification_preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {
        email: true,
        push: true,
      },
    },
    reset_token: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verification_token: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    verify_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    remember_token: {
      type: DataTypes.STRING(64),
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  User.associate = (models) => {
    User.hasMany(models.Resume, {
      foreignKey: 'user_id',
      as: 'resumes',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Interview, {
      foreignKey: 'user_id',
      as: 'interviews',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Report, {
      foreignKey: 'user_id',
      as: 'reports',
      onDelete: 'CASCADE',
    });

    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications',
      onDelete: 'CASCADE',
    });
  };

  return User;
};