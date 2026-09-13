// ATS Service - evaluates resumes against Applicant Tracking System criteria
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

class ATSService {
  /**
   * Calculate ATS score for a resume
   */
  async calculateATSScore(resumeData, candidateProfile, interviewContext = {}) {
    const aiModel = getModel();
    if (!aiModel) {
      throw new Error('Gemini API not configured');
    }

    const prompt = this._buildATSPrompt(resumeData, interviewContext);

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
    let evaluation;
    try {
      evaluation = JSON.parse(response.text());
    } catch (parseError) {
      console.error('ATS evaluation parse error:', response.text());
      throw new Error('AI returned invalid JSON for ATS evaluation');
    }

    return {
      overallScore: this._clamp(evaluation.overallScore || evaluation.overall, 0, 100),
      categoryScores: evaluation.categoryScores || {},
      keywordOptimization: this._clamp(evaluation.keywordOptimization, 0, 100),
      formatting: this._clamp(evaluation.formatting, 0, 100),
      projectsQuality: this._clamp(evaluation.projectQuality || evaluation.projectsQuality, 0, 100),
      educationCompleteness: this._clamp(evaluation.educationCompleteness || evaluation.educationQuality, 0, 100),
      grammar: this._clamp(evaluation.grammar, 0, 100),
      actionVerbs: this._clamp(evaluation.actionVerbs || evaluation.actionVerbsScore, 0, 100),
      sectionOrdering: this._clamp(evaluation.sectionOrdering, 0, 100),
      missingSections: Array.isArray(evaluation.missingSections) ? evaluation.missingSections : [],
      strengthsKeywords: Array.isArray(evaluation.strengthKeywords || evaluation.strengthsKeywords)
        ? (evaluation.strengthKeywords || evaluation.strengthsKeywords)
        : [],
      missingKeywords: Array.isArray(evaluation.missingKeywords) ? evaluation.missingKeywords : [],
      improvementSuggestions: Array.isArray(evaluation.improvementSuggestions) ? evaluation.improvementSuggestions : [],
      analyzedAt: new Date().toISOString(),
    };
  }

  _buildATSPrompt(resumeData, interviewContext) {
    return `Analyze this resume for ATS (Applicant Tracking System) compatibility.

RESUME DATA:
${JSON.stringify(resumeData, null, 2)}

TARGET COMPANY: ${interviewContext.company || 'General'}
TARGET ROLE: ${interviewContext.role || 'General'}
TARGET SKILLS: ${interviewContext.targetSkills || 'Not specified'}

Return ONLY valid JSON:
{
  "overallScore": number (0-100),
  "categoryScores": {
    "keywordOptimization": number,
    "formatting": number,
    "projectsQuality": number,
    "educationCompleteness": number,
    "grammar": number,
    "actionVerbsScore": number,
    "sectionOrdering": number
  },
  "keywordOptimization": number,
  "formatting": number,
  "projectsQuality": number,
  "educationCompleteness": number,
  "grammar": number,
  "actionVerbsScore": number,
  "sectionOrdering": number,
  "missingSections": ["string"],
  "strengthsKeywords": ["string"],
  "missingKeywords": ["string"],
  "improvementSuggestions": ["string"]
}`;
  }

  _clamp(val, min, max) {
    const n = Number(val);
    if (isNaN(n)) return min;
    return Math.max(min, Math.min(max, Math.round(n)));
  }
}

module.exports = new ATSService();
