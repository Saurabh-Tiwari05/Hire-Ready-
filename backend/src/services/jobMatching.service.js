// JobMatchingService - matches candidates to job roles and companies
const { initializeGemini, withRetry } = require('./gemini.service');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

let genAI = null;
let model = null;

function getModel() {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }
  return model;
}

class JobMatchingService {
  /**
   * Match candidate to job roles
   */
  async matchJobRoles(candidateProfile, interviewScores) {
    const aiModel = getModel();
    if (!aiModel) {
      throw new Error('Gemini API not configured');
    }

    const prompt = this._buildJobMatchPrompt(candidateProfile, interviewScores);

    const result = await withRetry(async () => {
      return aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });
    });

    const response = await result.response;
    const data = JSON.parse(response.text());

    return data.jobMatches.map(job => ({
      jobTitle: job.title,
      jobCategory: job.category || 'Software Development',
      matchScore: this._clamp(job.matchScore, 0, 100),
      technicalFit: this._clamp(job.technicalFit, 0, 100),
      experienceFit: this._clamp(job.experienceFit, 0, 100),
      skillsMatch: {
        matched: Array.isArray(job.matchedSkills) ? job.matchedSkills : [],
        missing: Array.isArray(job.missingSkills) ? job.missingSkills : [],
      },
      strengths: Array.isArray(job.strengths) ? job.strengths : [],
      gaps: Array.isArray(job.gaps) ? job.gaps : [],
      preparationNeeded: job.preparationNeeded || '',
      readinessStatus: this._normalizeStatus(job.readiness || job.readinessStatus),
      estimatedPrepDays: job.estimatedPrepDays || 14,
      recommendation: job.recommendation || 'Practice more',
    }));
  }

  /**
   * Match candidate to specific companies
   */
  async matchCompanies(candidateProfile, interviewScores, targetCompanies = []) {
    const aiModel = getModel();
    if (!aiModel) {
      throw new Error('Gemini API not configured');
    }

    const prompt = this._buildCompanyMatchPrompt(candidateProfile, targetCompanies);

    const result = await withRetry(async () => {
      return aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      });
    });

    const response = await result.response;
    const data = JSON.parse(response.text());

    return data.companyMatches.map(company => ({
      companyName: company.name,
      companySize: company.size || '',
      companyType: company.type || '',
      matchScore: this._clamp(company.matchScore, 0, 100),
      technicalReadiness: this._clamp(company.technicalReadiness, 0, 100),
      communicationReadiness: this._clamp(company.communicationReadiness, 0, 100),
      cultureFit: this._clamp(company.cultureFit, 0, 100),
      requiredSkills: Array.isArray(company.requiredSkills) ? company.requiredSkills : [],
      matchingSkills: Array.isArray(company.matchingSkills) ? company.matchingSkills : [],
      missingSkills: Array.isArray(company.missingSkills) ? company.missingSkills : [],
      preparationRecommendations: Array.isArray(company.preparationRecommendations) ? company.preparationRecommendations : [],
      interviewFocusAreas: Array.isArray(company.interviewFocusAreas) ? company.interviewFocusAreas : [],
      confidenceScore: company.confidenceScore || 5,
      estimatedPrepTime: company.estimatedPrepTime || '2 weeks',
      readinessStatus: this._normalizeStatus(company.readinessStatus),
      interviewExpectations: company.interviewExpectations || {},
    }));
  }

  _buildJobMatchPrompt(candidateProfile, interviewScores) {
    return `Analyze this candidate's profile and interview history to match them with suitable job roles.

CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

INTERVIEW HISTORY:
${JSON.stringify(interviewScores, null, 2)}

Return ONLY valid JSON:
{
  "jobMatches": [
    {
      "title": "string (e.g., Backend Developer)",
      "category": "string",
      "matchScore": number (0-100),
      "technicalFit": number (0-100),
      "experienceFit": number (0-100),
      "matchedSkills": ["string"],
      "missingSkills": ["string"],
      "strengths": ["string"],
      "gaps": ["string"],
      "preparationNeeded": "string",
      "readinessStatus": "string",
      "estimatedPrepDays": number,
      "recommendation": "string"
    }
  ]
}

Provide at least 5 job role matches, sorted by matchScore descending.`;
  }

  _buildCompanyMatchPrompt(candidateProfile, targetCompanies) {
    const defaultCompanies = targetCompanies.length > 0 ? targetCompanies : [
      'Google', 'Microsoft', 'Amazon', 'Adobe', 'Meta', 'Apple', 'Netflix', 'Salesforce', 'TCS', 'Infosys'
    ];

    return `Analyze this candidate's profile and interview history to predict their readiness for these companies.

CANDIDATE PROFILE:
${JSON.stringify(candidateProfile, null, 2)}

TARGET COMPANIES: ${defaultCompanies.join(', ')}

Return ONLY valid JSON:
{
  "companyMatches": [
    {
      "name": "string",
      "size": "string",
      "type": "string",
      "matchScore": number (0-100),
      "technicalReadiness": number (0-100),
      "communicationReadiness": number (0-100),
      "cultureFit": number (0-100),
      "requiredSkills": ["string"],
      "matchingSkills": ["string"],
      "missingSkills": ["string"],
      "preparationRecommendations": ["string"],
      "interviewFocusAreas": ["string"],
      "confidenceScore": number (0-10),
      "estimatedPrepTime": "string",
      "readinessStatus": "string",
      "interviewExpectations": {
        "rounds": number,
        "difficulty": "string",
        "focusAreas": ["string"]
      }
    }
  ]
}

Provide all companies analyzed.`;
  }

  _clamp(val, min, max) {
    const n = Number(val);
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  _normalizeStatus(status) {
    const valid = ['ready', 'almost_ready', 'needs_preparation', 'not_ready'];
    return valid.includes(status) ? status : 'needs_preparation';
  }
}

module.exports = new JobMatchingService();
