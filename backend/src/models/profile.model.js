// Profile model – extends users table with additional profile fields
module.exports = (sequelize, DataTypes) => {
  const Profile = sequelize.define('Profile', {
    // Existing user columns are in users table; this model adds profile-specific fields
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
    // Skills stored as JSONB array
    skills: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Example: ["React", "Node.js", "AWS", "TypeScript"]
    },
    target_companies: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    preferred_role: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Resume reference (optional)
    resume_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    // Password change (hash) – optional if password stored in users table
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Email preferences
    email_notifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Example: { "resume_submission": true, "interview_invite": true }
    },
    // Notification preferences (push/email)
    notification_preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Example: { "email": true, "push": false }
    },
    // Timestamps
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });

  return Profile;
};