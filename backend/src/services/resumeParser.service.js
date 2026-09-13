// Resume Parser Service - extracts text from PDF/DOC files
const pdf = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
exports.parsePDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    if (!dataBuffer.length) {
      throw new Error('The uploaded PDF is empty');
    }
    const data = await pdf(dataBuffer);
    const text = (data.text || '').trim();
    if (!text) {
      const error = new Error('Unable to extract text from this PDF. Please upload a text-based PDF.');
      error.statusCode = 422;
      throw error;
    }
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    if (error.statusCode === 422) throw error;
    const parseError = new Error('Unable to read this PDF. Please upload a valid, text-based PDF.');
    parseError.statusCode = 422;
    throw parseError;
  }
};

/**
 * Extract text from DOC/DOCX file (basic implementation)
 * For production, consider using mammoth or similar library
 * @param {string} filePath - Path to the DOC/DOCX file
 * @returns {Promise<string>} Extracted text content
 */
exports.parseDoc = async (filePath) => {
  // For DOCX, we can use a simple approach or integrate mammoth
  // This is a placeholder - in production use mammoth or similar
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.docx') {
    // Would use mammoth here: const mammoth = require('mammoth');
    // const result = await mammoth.extractRawText({ path: filePath });
    // return result.value;
    throw new Error('DOCX parsing not implemented. Please use PDF format.');
  }

  if (ext === '.doc') {
    throw new Error('DOC format not supported. Please convert to PDF.');
  }

  throw new Error('Unsupported document format');
};

/**
 * Main parse function - routes to appropriate parser based on file extension
 * @param {string} filePath - Path to the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Extracted text content
 */
exports.parseResume = async (filePath, mimeType) => {
  try {
    await fs.access(filePath);
  } catch {
    const error = new Error('The uploaded resume file could not be found. Please upload it again.');
    error.statusCode = 404;
    throw error;
  }

  const ext = path.extname(filePath).toLowerCase();

  switch (mimeType) {
    case 'application/pdf':
      return exports.parsePDF(filePath);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return exports.parseDoc(filePath);
    case 'application/msword':
      return exports.parseDoc(filePath);
    default:
      // Try by extension as fallback
      if (ext === '.pdf') return exports.parsePDF(filePath);
      if (ext === '.docx' || ext === '.doc') return exports.parseDoc(filePath);
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
};

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} Cleaned text
 */
exports.cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/**
 * Extract sections from resume text using heuristics
 * @param {string} text - Cleaned resume text
 * @returns {Object} Structured sections
 */
exports.extractSections = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const sections = {
    personal: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    other: [],
  };

  let currentSection = 'other';
  const sectionKeywords = {
    experience: ['experience', 'employment', 'work history', 'professional experience', 'career'],
    education: ['education', 'academic', 'qualifications', 'degrees'],
    skills: ['skills', 'technical skills', 'competencies', 'technologies', 'tools'],
    projects: ['projects', 'personal projects', 'key projects', 'portfolio'],
    certifications: ['certifications', 'certificates', 'licenses', 'credentials'],
    languages: ['languages', 'language proficiency'],
    summary: ['summary', 'profile', 'objective', 'about me', 'professional summary'],
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if line is a section header
    let matchedSection = null;
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(k => lowerLine.includes(k)) && line.length < 50) {
        matchedSection = section;
        break;
      }
    }

    if (matchedSection) {
      currentSection = matchedSection;
      continue;
    }

    // Add content to current section
    if (currentSection === 'summary' && !sections.summary) {
      sections.summary = line;
    } else if (currentSection === 'experience') {
      sections.experience.push(line);
    } else if (currentSection === 'education') {
      sections.education.push(line);
    } else if (currentSection === 'skills') {
      // Split skills by common delimiters
      const skills = line.split(/[,;|•]/).map(s => s.trim()).filter(s => s.length > 1);
      sections.skills.push(...skills);
    } else if (currentSection === 'projects') {
      sections.projects.push(line);
    } else if (currentSection === 'certifications') {
      sections.certifications.push(line);
    } else if (currentSection === 'languages') {
      sections.languages.push(line);
    } else if (currentSection === 'personal' || !sections.personal.name) {
      // Try to extract name, email, phone from first few lines
      if (!sections.personal.email && line.includes('@')) {
        sections.personal.email = line.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
      } else if (!sections.personal.phone && /[\d\s\-+()]{10,}/.test(line)) {
        sections.personal.phone = line;
      } else if (!sections.personal.name && line.length < 50 && !line.includes('@')) {
        sections.personal.name = line;
      }
    }
  }

  // Deduplicate skills
  sections.skills = [...new Set(sections.skills.map(s => s.toLowerCase()))]
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  return sections;
};
