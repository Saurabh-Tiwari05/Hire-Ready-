// Resume Upload Service - handles secure file upload with validation
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const { Resume, User } = require('../models');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(new Error('Invalid MIME type'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

// Upload resume file
exports.uploadResumeFile = upload.single('resume');

// Process and save resume record
exports.processResumeUpload = async (userId, file, title = 'Resume') => {
  if (!file) {
    throw new Error('No file provided');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get current version number for this user
  const lastResume = await Resume.findOne({
    where: { user_id: userId },
    order: [['version', 'DESC']],
    attributes: ['version'],
  });

  const nextVersion = (lastResume?.version || 0) + 1;

  // Mark previous current resume as not current
  await Resume.update(
    { is_current: false },
    { where: { user_id: userId, is_current: true } }
  );

  // Create new resume record
  const resume = await Resume.create({
    user_id: userId,
    title,
    file_path: file.path,
    file_url: `/uploads/resumes/${file.filename}`,
    file_size: file.size,
    mime_type: file.mimetype,
    original_filename: file.originalname,
    is_current: true,
    version: nextVersion,
  });

  return resume.toJSON();
};

// Get user's resumes
exports.getUserResumes = async (userId) => {
  return Resume.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    attributes: [
      'id', 'title', 'file_path', 'file_url', 'file_size', 'mime_type',
      'original_filename', 'parsed_data', 'is_current', 'version', 'created_at'
    ],
  });
};

// Get current resume
exports.getCurrentResume = async (userId) => {
  return Resume.findOne({
    where: { user_id: userId, is_current: true },
    order: [['version', 'DESC']],
  });
};
// Get a specific resume belonging to the user
exports.getResumeById = async (userId, resumeId) => {
  return Resume.findOne({
    where: {
      id: resumeId,
      user_id: userId,
    },
  });
};
// Delete resume
exports.deleteResume = async (userId, resumeId) => {
  const resume = await Resume.findOne({
    where: { id: resumeId, user_id: userId },
  });

  if (!resume) {
    throw new Error('Resume not found');
  }

  // Delete file from disk
  try {
    await fs.unlink(resume.file_path);
  } catch (error) {
    console.warn('Could not delete resume file:', error.message);
  }

  const wasCurrent = resume.is_current;
  await resume.destroy();

  // If deleted was current, make latest resume current
  if (wasCurrent) {
    const latest = await Resume.findOne({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
    if (latest) {
      latest.is_current = true;
      await latest.save();
    }
  }

  return { success: true };
};

// Set resume as current
exports.setCurrentResume = async (userId, resumeId) => {
  const resume = await Resume.findOne({
    where: { id: resumeId, user_id: userId },
  });

  if (!resume) {
    throw new Error('Resume not found');
  }

  await Resume.update(
    { is_current: false },
    { where: { user_id: userId, is_current: true } }
  );

  resume.is_current = true;
  await resume.save();

  return resume.toJSON();
};