// Gemini Resume Analysis Service - uses Gemini API to generate structured JSON from resume text
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 60_000);

let genAI = null;
let model = null;

/**
 * Initialize Gemini client
 */
function initializeGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set. AI analysis will not work.');
    return false;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
    console.info('[AI] Gemini client initialized', { model: MODEL_NAME });
  }
  return true;
}

/**
 * Generate structured candidate profile from resume text using Gemini
 * @param {string} resumeText - Cleaned resume text
 * @param {Object} options - Additional context options
 * @returns {Promise<Object>} Structured candidate profile
 */
exports.analyzeResume = async (resumeText, options = {}) => {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  if (!resumeText || !resumeText.trim()) {
    const error = new Error('No resume text is available for AI analysis.');
    error.statusCode = 422;
    throw error;
  }

  const prompt = buildAnalysisPrompt(resumeText, options);

  try {
    const result = await generateWithRetry(
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      },
      3
    );

    const response = await result.response;
    const text = response.text()?.trim();

    if (!text) {
      throw new Error(
        'Gemini returned an empty response. Please try again.'
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(stripJsonCodeFence(text));
    } catch (parseError) {
      console.error('[AI] Gemini returned invalid JSON', {
        responseLength: text.length,
      });

      throw new Error('AI returned invalid JSON');
    }

    return validateAndNormalizeProfile(parsed);

  } catch (error) {
    console.error('[AI] Resume analysis error:', error);

    const analysisError = new Error(
      `Resume analysis failed: ${error.message}`
    );

    analysisError.statusCode = error.statusCode || 502;

    throw analysisError;
  }
};

function withTimeout(promise, timeoutMs, message) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error(message);
      error.statusCode = 504;
      reject(error);
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}
async function generateWithRetry(request, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[AI] Gemini request attempt ${attempt + 1}/${maxRetries + 1}`
      );

      return await withTimeout(
        model.generateContent(request),
        GEMINI_TIMEOUT_MS,
        'Gemini analysis timed out. Please try again.'
      );

    } catch (error) {
      lastError = error;

      const errorMessage = error?.message || '';

      const isRetryable =
        errorMessage.includes('503') ||
        errorMessage.includes('UNAVAILABLE') ||
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('500');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(2000 * Math.pow(2, attempt), 10000);

      console.warn(
        `[AI] Gemini temporarily unavailable. ` +
        `Retrying in ${delay / 1000}s...`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripJsonCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

/**
 * Build the prompt for Gemini
 */
function buildAnalysisPrompt(resumeText, options) {
  return `You are an expert technical recruiter and resume analyzer. Extract structured information from the following resume text and return a JSON object matching the exact schema below.

RESUME TEXT:
${resumeText}

ADDITIONAL CONTEXT:
- Target Role: ${options.targetRole || 'Not specified'}
- Target Company: ${options.targetCompany || 'Not specified'}
- Experience Level: ${options.experienceLevel || 'Not specified'}

REQUIRED JSON SCHEMA:
{
  "personal": {
    "fullName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "string (2-3 sentences professional summary)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or 'Present'",
      "description": "string",
      "technologies": ["string"],
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "graduationYear": "YYYY",
      "gpa": "string (optional)",
      "honors": ["string"]
    }
  ],
  "skills": {
    "technical": ["string"],
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "soft": ["string"]
  },
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string (optional)",
      "role": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM",
      "expiryDate": "YYYY-MM (optional)",
      "credentialId": "string (optional)"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "Native | Fluent | Professional | Basic"
    }
  ],
  "analysis": {
    "totalYearsExperience": "number",
    "seniorityLevel": "Junior | Mid | Senior | Staff | Principal",
    "primaryRole": "string (e.g., 'Full Stack Developer', 'Backend Engineer')",
    "strongAreas": ["string"],
    "weakAreas": ["string"],
    "recommendedRoles": ["string"],
    "skillGaps": ["string"],
    "interviewFocusAreas": ["string"]
  }
}

RULES:
1. Return ONLY valid JSON - no markdown, no explanations
2. If information is missing, use empty string "" or empty array []
3. Infer seniority from experience years and role complexity
4. Extract specific technologies from experience descriptions
5. Identify 3-5 strong areas and 2-4 weak areas based on resume
6. Suggest 3-5 interview focus areas relevant to target role
7. Normalize dates to YYYY-MM format
8. Deduplicate skills across categories
9. For achievements, extract quantifiable results (%, $, scale, etc.)
10. Proficiency levels: Native, Fluent, Professional, Basic`;
}

/**
 * Validate and normalize the parsed profile
 */
function validateAndNormalizeProfile(profile) {
  const normalized = {
    personal: {
      fullName: profile.personal?.fullName || '',
      email: profile.personal?.email || '',
      phone: profile.personal?.phone || '',
      location: profile.personal?.location || '',
      linkedin: profile.personal?.linkedin || '',
      github: profile.personal?.github || '',
      portfolio: profile.personal?.portfolio || '',
    },
    summary: profile.summary || '',
    experience: Array.isArray(profile.experience) ? profile.experience.map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      description: exp.description || '',
      technologies: Array.isArray(exp.technologies) ? exp.technologies : [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    })) : [],
    education: Array.isArray(profile.education) ? profile.education.map(edu => ({
      degree: edu.degree || '',
      field: edu.field || '',
      institution: edu.institution || '',
      location: edu.location || '',
      graduationYear: edu.graduationYear || '',
      gpa: edu.gpa || '',
      honors: Array.isArray(edu.honors) ? edu.honors : [],
    })) : [],
    skills: {
      technical: Array.isArray(profile.skills?.technical) ? profile.skills.technical : [],
      languages: Array.isArray(profile.skills?.languages) ? profile.skills.languages : [],
      frameworks: Array.isArray(profile.skills?.frameworks) ? profile.skills.frameworks : [],
      tools: Array.isArray(profile.skills?.tools) ? profile.skills.tools : [],
      soft: Array.isArray(profile.skills?.soft) ? profile.skills.soft : [],
    },
    projects: Array.isArray(profile.projects) ? profile.projects.map(proj => ({
      name: proj.name || '',
      description: proj.description || '',
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      url: proj.url || '',
      role: proj.role || '',
    })) : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications.map(cert => ({
      name: cert.name || '',
      issuer: cert.issuer || '',
      date: cert.date || '',
      expiryDate: cert.expiryDate || '',
      credentialId: cert.credentialId || '',
    })) : [],
    languages: Array.isArray(profile.languages) ? profile.languages.map(lang => ({
      language: lang.language || '',
      proficiency: lang.proficiency || 'Professional',
    })) : [],
    analysis: {
      totalYearsExperience: typeof profile.analysis?.totalYearsExperience === 'number'
        ? profile.analysis.totalYearsExperience
        : 0,
      seniorityLevel: profile.analysis?.seniorityLevel || 'Mid',
      primaryRole: profile.analysis?.primaryRole || '',
      strongAreas: Array.isArray(profile.analysis?.strongAreas) ? profile.analysis.strongAreas : [],
      weakAreas: Array.isArray(profile.analysis?.weakAreas) ? profile.analysis.weakAreas : [],
      recommendedRoles: Array.isArray(profile.analysis?.recommendedRoles) ? profile.analysis.recommendedRoles : [],
      skillGaps: Array.isArray(profile.analysis?.skillGaps) ? profile.analysis.skillGaps : [],
      interviewFocusAreas: Array.isArray(profile.analysis?.interviewFocusAreas) ? profile.analysis.interviewFocusAreas : [],
    },
  };

  // Deduplicate all skill arrays
  for (const key of Object.keys(normalized.skills)) {
    normalized.skills[key] = [...new Set(normalized.skills[key].map(s => s.toLowerCase()))]
      .map(s => s.charAt(0).toUpperCase() + s.slice(1));
  }

  return normalized;
}

/**
 * Generate interview questions based on candidate profile and context
 */
exports.generateInterviewQuestions = async (candidateProfile, interviewContext) => {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  const prompt = buildQuestionsPrompt(candidateProfile, interviewContext);

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Question generation error:', error);
    throw new Error(`Question generation failed: ${error.message}`);
  }
};

function buildQuestionsPrompt(candidateProfile, interviewContext) {
  return `Generate interview questions for the following candidate and interview context.

CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

INTERVIEW CONTEXT:
- Company: ${interviewContext.company}
- Role: ${interviewContext.role}
- Difficulty: ${interviewContext.difficulty}
- Type: ${interviewContext.type}
- Duration: ${interviewContext.duration} minutes
- Strong Areas: ${interviewContext.strongAreas?.join(', ') || 'Not specified'}
- Weak Areas: ${interviewContext.weakAreas?.join(', ') || 'Not specified'}

Return JSON with this schema:
{
  "questions": [
    {
      "id": "string",
      "type": "technical | behavioral | system_design | coding | situational",
      "difficulty": "easy | medium | hard",
      "question": "string",
      "expectedAnswer": "string",
      "evaluationCriteria": ["string"],
      "followUpQuestions": ["string"],
      "timeEstimateMinutes": number,
      "skillsTested": ["string"]
    }
  ],
  "totalQuestions": number,
  "estimatedDurationMinutes": number
}

Rules:
- Generate ${Math.ceil(interviewContext.duration / 5)} questions
- Match difficulty: easy=30%, medium=50%, hard=20%
- Include at least 1 coding, 1 system design, 1 behavioral
- Focus on weak areas and skill gaps
- Questions should be specific to the company/role when possible`;
}
