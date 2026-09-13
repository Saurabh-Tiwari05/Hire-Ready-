// File upload middleware using Multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const resumesDir = path.join(uploadsDir, 'resumes');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(resumesDir, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter - allow documents and images
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase() === '.pdf';
  const mime = file.mimetype === 'application/pdf';

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only text-based PDF resume files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

module.exports = upload;
