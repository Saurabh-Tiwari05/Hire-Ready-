// Evaluation Service - core AI feedback & evaluation engine using Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');
const EvaluationRepository = require('../repositories/evaluation.repository');
const InterviewMessageRepository = require('../repositories/interview-message.repository');
const { initializeGemini, withRetry } = require('./gemini.service');

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

class EvaluationService {
  /**
   * Evaluate a single answer in-depth
   */
  async evaluateAnswer({
    questionText,
    answerText,
    company,
    role,
    difficulty,
    candidateContext,
    messageId,
    interviewId,
    evaluationId,
  }) {
    const aiModel = getModel();
    if (!aiModel) {
      throw new Error('Gemini API not initialized');
    }

    const prompt = this._buildAnswerEvaluationPrompt({
      questionText,
      answerText,
      company,
      role,
      difficulty,
      candidateContext,
    });

    const result = await withRetry(async () => {
      return aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });
    });

    const response = await result.response;
    const text = response.text();
    const evaluation = JSON.parse(text);

    // Normalize output values
    const normalized = this._normalizeAnswerEvaluation(evaluation);

    // If an evaluationId exists, store this question evaluation
    if (evaluationId && interviewId) {
      await EvaluationRepository.createQuestionEvaluation({
        evaluation_id: evaluationId,
        interview_id: interviewId,
        message_id: messageId || null,
        question_text: questionText,
        answer_text: answerText,
        technical_accuracy: normalized.technicalAccuracy,
        communication: normalized.communication,
        problem_solving: normalized.problemSolving,
        clarity: normalized.clarity,
        confidence: normalized.confidence,
        completeness: normalized.completeness,
        relevance: normalized.relevance,
        grammar: normalized.grammar,
        overall_score: normalized.overallScore,
        strengths: normalized.strengths,
        weaknesses: normalized.weaknesses,
        missing_concepts: normalized.missingConcepts,
        recommendations: normalized.recommendations,
        keywords: normalized.keywords,
        next_difficulty: normalized.nextDifficulty,
        next_question_focus: normalized.nextQuestionFocus,
        evaluation_json: normalized,
      });
    }

    return normalized;
  }

  /**
   * Generate comprehensive final evaluation & report
   */
  async generateFinalReport(interviewId, userId, interviewContext) {
    const aiModel = getModel();
    if (!aiModel) {
      throw new Error('Gemini API not initialized');
    }

    // Get all messages/QAs for this interview
    const messages = await InterviewMessageRepository.findByInterviewId(interviewId);
    const qaPairs = messages.filter(m => m.message_type === 'answer' || m.message_type === 'question');

    const prompt = this._buildFinalReportPrompt(interviewContext, qaPairs);

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
    const reportJson = JSON.parse(response.text());

    // Generate personalized improvement roadmap
    const roadmapPrompt = this._buildRoadmapPrompt(reportJson);
    const roadmapResult = await withRetry(async () => {
      return aiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: roadmapPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      });
    });

    const roadmap = JSON.parse(roadmapResult.response.text());

    const finalReportData = {
      ...reportJson,
      improvementRoadmap: roadmap.weeks || [],
    };

    // Save/update Evaluation record
    let evaluation = await EvaluationRepository.findByInterviewId(interviewId);
    const evalPayload = {
      interview_id: interviewId,
      user_id: userId,
      overall_score: reportJson.overallScore || 0,
      technical_score: reportJson.technicalScore || 0,
      communication_score: reportJson.communicationScore || 0,
      confidence_score: reportJson.confidenceScore || 0,
      strengths: reportJson.strengths || [],
      weaknesses: reportJson.weaknesses || [],
      recommendations: reportJson.recommendations || [],
      missing_concepts: reportJson.missingConcepts || [],
      interview_context: interviewContext,
      evaluation_json: finalReportData,
      summary_report: finalReportData,
      is_complete: true,
    };

    if (evaluation) {
      evaluation = await EvaluationRepository.update(evaluation.id, evalPayload);
    } else {
      evaluation = await EvaluationRepository.create(evalPayload);
    }

    return evaluation;
  }

  /**
   * Helper: build prompt for evaluating a single answer
   */
  _buildAnswerEvaluationPrompt({ questionText, answerText, company, role, difficulty, candidateContext }) {
    return `You are an expert interviewer evaluating a candidate's response.

QUESTION: ${questionText}
CANDIDATE ANSWER: ${answerText || 'No answer provided'}

CONTEXT:
- Company: ${company || 'General'}
- Role: ${role || 'Developer'}
- Target Difficulty: ${difficulty || 'medium'}
- Candidate Experience: ${candidateContext?.yearsOfExperience || 'Unknown'} years
- Weak Areas to watch: ${candidateContext?.weakAreas?.join(', ') || 'None'}

Evaluate the answer thoroughly across multiple dimensions. Return ONLY valid JSON matching this schema:
{
  "technicalAccuracy": number (0-100),
  "communication": number (0-100),
  "problemSolving": number (0-100),
  "clarity": number (0-100),
  "confidence": number (0-100),
  "completeness": number (0-100),
  "relevance": number (0-100),
  "grammar": number (0-100),
  "overallScore": number (0-100),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingConcepts": ["string"],
  "recommendations": ["string"],
  "keywords": ["string"],
  "nextDifficulty": "easy" | "medium" | "hard" | "expert",
  "nextQuestionFocus": "string (topic or concept to explore next)"
}

Rules:
- Be strict but fair. A 100/100 requires exceptional depth and zero missing concepts.
- Identify exact technical keywords used (e.g. "indexing", "B-Tree", "replication").
- Identify essential concepts that were omitted in 'missingConcepts'.
- Set 'nextDifficulty' higher if performance is high, or lower/same if struggling.`;
  }

  /**
   * Helper: build prompt for final interview report
   */
  _buildFinalReportPrompt(interviewContext, qaPairs) {
    const formattedQA = qaPairs.map((m, idx) => `Q${idx + 1}: ${m.content}\nA${idx + 1}: ${m.answer || 'No answer'}`).join('\n\n');

    return `Generate a comprehensive final interview evaluation report.

COMPANY: ${interviewContext?.company}
ROLE: ${interviewContext?.role}
DIFFICULTY: ${interviewContext?.difficulty}

INTERVIEW TRANSCRIPT:
${formattedQA}

Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "technicalScore": number (0-100),
  "communicationScore": number (0-100),
  "confidenceScore": number (0-100),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missingConcepts": ["string"],
  "recommendations": ["string"],
  "companyReadiness": "High" | "Medium" | "Low",
  "roleReadiness": "High" | "Medium" | "Low",
  "topicsCovered": ["string"],
  "topicsMissed": ["string"],
  "summary": "string (3-4 paragraph detailed summary)"
}`;
  }

  /**
   * Helper: build roadmap prompt
   */
  _buildRoadmapPrompt(reportJson) {
    return `Based on these weaknesses and missing concepts, generate a 4-week improvement plan:
Weaknesses: ${JSON.stringify(reportJson.weaknesses)}
Missing Concepts: ${JSON.stringify(reportJson.missingConcepts)}

Return ONLY valid JSON:
{
  "weeks": [
    {
      "week": 1,
      "topic": "string",
      "focus": "string",
      "actionItems": ["string"],
      "resources": ["string"]
    }
  ]
}`;
  }

  /**
   * Helper: clamp scores and ensure fields
   */
  _normalizeAnswerEvaluation(evalJson) {
    const clamp = (val) => Math.max(0, Math.min(100, Math.round(Number(val) || 0)));

    return {
      technicalAccuracy: clamp(evalJson.technicalAccuracy),
      communication: clamp(evalJson.communication),
      problemSolving: clamp(evalJson.problemSolving),
      clarity: clamp(evalJson.clarity),
      confidence: clamp(evalJson.confidence),
      completeness: clamp(evalJson.completeness),
      relevance: clamp(evalJson.relevance),
      grammar: clamp(evalJson.grammar),
      overallScore: clamp(evalJson.overallScore),
      strengths: Array.isArray(evalJson.strengths) ? evalJson.strengths : [],
      weaknesses: Array.isArray(evalJson.weaknesses) ? evalJson.weaknesses : [],
      missingConcepts: Array.isArray(evalJson.missingConcepts) ? evalJson.missingConcepts : [],
      recommendations: Array.isArray(evalJson.recommendations) ? evalJson.recommendations : [],
      keywords: Array.isArray(evalJson.keywords) ? evalJson.keywords : [],
      nextDifficulty: evalJson.nextDifficulty || 'medium',
      nextQuestionFocus: evalJson.nextQuestionFocus || 'general',
    };
  }
}

module.exports = new EvaluationService();
