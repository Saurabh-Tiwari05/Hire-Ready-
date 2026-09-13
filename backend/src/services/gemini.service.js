// Gemini Service - AI interview engine using Google Generative AI
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

let genAI = null;
let model = null;

/**
 * Initialize Gemini client (singleton)
 */
function initializeGemini() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key') {
    console.warn('GEMINI_API_KEY not configured. AI features will not work.');
    return false;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }
  return true;
}

/**
 * Retry wrapper for Gemini calls - retries once on failure
 */
/**
 * Retry wrapper for Gemini calls
 *
 * - Do not immediately retry rate-limit errors (429).
 * - Retry temporary server errors (503) once.
 * - Let other errors fail immediately.
 */
async function withRetry(fn, maxRetries = 1) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const status = error?.status;

      // Gemini quota/rate-limit error.
      // Retrying immediately only makes the situation worse.
      if (status === 429) {
        console.warn(
          'Gemini rate limit reached. Not retrying immediately.'
        );
        throw error;
      }

      // Retry temporary Gemini server errors once.
      if (status === 503 && attempt < maxRetries) {
        console.warn(
          `Gemini service unavailable (attempt ${attempt + 1}), retrying once...`
        );

        // Small delay before retry.
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }

      // Any other error: don't blindly retry.
      throw error;
    }
  }

  throw lastError;
}

/**
 * Generate system prompt for the interview
 */
function buildSystemPrompt(context) {
  const {
    company,
    role,
    difficulty,
    interviewType,
    candidateSummary,
    strongAreas,
    weakAreas,
    projects,
    skills,
    previousInterviews,
    resumeSummary,
    yearsOfExperience,
  } = context;

  return `You are a Senior Technical Recruiter conducting a real interview for ${company} as a ${role}.

INTERVIEW CONFIGURATION:
- Company: ${company}
- Role: ${role}
- Difficulty: ${difficulty}
- Interview Type: ${interviewType}
- Years of Experience: ${yearsOfExperience}

CANDIDATE PROFILE:
- Name: ${candidateSummary?.name || 'Unknown'}
- Resume Summary: ${resumeSummary || 'Not available'}
- Skills: ${Array.isArray(skills) ? skills.join(', ') : 'Not specified'}
- Projects: ${Array.isArray(projects) ? projects.map(p => p.name).join(', ') : 'Not specified'}
- Strong Areas: ${Array.isArray(strongAreas) ? strongAreas.join(', ') : 'None identified'}
- Weak Areas: ${Array.isArray(weakAreas) ? weakAreas.join(', ') : 'None identified'}
- Previous Interview Scores: ${previousInterviews?.averageScore ? `Average: ${previousInterviews.averageScore}` : 'No previous interviews'}

RULES:
1. You are a Senior Technical Recruiter conducting a real interview.
2. Never ask random questions. Every question must depend on Resume, Projects, Skills, Previous answer, Candidate performance, Company, Role, and Difficulty.
3. Never repeat questions.
4. Gradually increase difficulty as the interview progresses.
5. Behave naturally and professionally.
6. Only ask one question at a time.
7. If the candidate gives a weak answer, ask a follow-up to probe deeper.
8. If the candidate gives a strong answer, move to the next topic.
9. Focus on weak areas and skill gaps identified from the resume.
10. Adapt difficulty based on candidate performance.
11. Return only the question text, no extra commentary.`;
}

/**
 * Generate the first interview question
 */
async function generateFirstQuestion(context) {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  const systemPrompt = buildSystemPrompt(context);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 500,
      },
    });
  });

  const response = await result.response;
  const question = response.text().trim();

  return {
    id: generateQuestionId(),
    type: 'first',
    question,
    topic: extractTopic(question),
    difficulty: context.difficulty || 'medium',
    timeEstimate: estimateTime(question),
  };
}

/**
 * Generate the next follow-up question based on previous conversation
 */
async function generateNextQuestion(context) {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  const systemPrompt = buildSystemPrompt(context);

  // Build conversation history as context
  const conversationHistory = buildConversationHistory(context.messages || []);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: `PREVIOUS CONVERSATION:\n${conversationHistory}\n\nBased on the candidate's previous answers, ask the next question. Only ask one question.` }] },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 500,
      },
    });
  });

  const response = await result.response;
  const question = response.text().trim();

  return {
    id: generateQuestionId(),
    type: 'follow-up',
    question,
    topic: extractTopic(question),
    difficulty: context.difficulty || 'medium',
    timeEstimate: estimateTime(question),
  };
}

/**
 * Evaluate a candidate's answer
 */
async function evaluateAnswer(message, answer) {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  const prompt = buildEvaluationPrompt(message, answer);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });
  });

  const response = await result.response;
  const text = response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini evaluation response:', text);
    throw new Error('AI evaluation returned invalid JSON');
  }

  return {
    score: clampScore(parsed.score),
    confidence: clampConfidence(parsed.confidence),
    isCorrect: parsed.isCorrect || false,
    feedback: parsed.feedback || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    actualTime: parsed.actualTime || null,
  };
}

/**
 * Generate final interview report
 */
async function generateFinalReport(context) {
  if (!initializeGemini()) {
    throw new Error('Gemini API not configured');
  }

  const prompt = buildFinalReportPrompt(context);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });
  });

  const response = await result.response;
  const text = response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error('Failed to parse Gemini final report response:', text);
    throw new Error('AI report generation returned invalid JSON');
  }

  return {
    overallScore: clampScore(parsed.overallScore),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    summary: parsed.summary || '',
    questions: Array.isArray(parsed.questions) ? parsed.questions : [],
  };
}

/**
 * Build evaluation prompt for Gemini
 */
function buildEvaluationPrompt(message, answer) {
  return `Evaluate the following candidate answer for an interview question.

QUESTION: ${message.content}

CANDIDATE ANSWER: ${answer}

TOPIC: ${message.topic || 'General'}
DIFFICULTY: ${message.difficulty || 'medium'}

Return JSON with this schema:
{
  "score": number (0-100),
  "confidence": number (0-1),
  "isCorrect": boolean,
  "feedback": "string",
  "strengths": ["string"],
  "mistakes": ["string"],
  "suggestions": ["string"]
}

Rules:
- Score 0-100 based on accuracy, completeness, and relevance
- Confidence 0-1 based on how clear the evaluation is
- Identify specific mistakes in the answer
- Provide actionable suggestions for improvement
- Be fair and professional`;
}

/**
 * Build final report prompt
 */
function buildFinalReportPrompt(context) {
  const messages = context.messages || [];
  const qaPairs = messages.map(m => `Q: ${m.content}\nA: ${m.answer || 'No answer'}\nEvaluation: ${JSON.stringify(m.evaluation)}`).join('\n---\n');

  return `Generate a final interview report based on the complete interview conversation.

INTERVIEW CONTEXT:
- Company: ${context.company}
- Role: ${context.role}
- Difficulty: ${context.difficulty}
- Type: ${context.interviewType}
- Duration: ${context.durationMinutes} minutes

CANDIDATE:
- Name: ${context.candidateSummary?.name}
- Experience: ${context.candidateSummary?.totalYearsExperience} years
- Strong Areas: ${context.strongAreas?.join(', ') || 'None'}
- Weak Areas: ${context.weakAreas?.join(', ') || 'None'}

CONVERSATION:
${qaPairs}

Return JSON with this schema:
{
  "overallScore": number (0-100),
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "summary": "string (2-3 paragraph summary)",
  "questions": [
    {
      "question": "string",
      "answer": "string",
      "score": number,
      "feedback": "string"
    }
  ]
}`;
}

/**
 * Build conversation history string
 */
function buildConversationHistory(messages) {
  return messages
    .flatMap(m => {
      const entries = [];
      if (m.role === 'assistant') entries.push(`Interviewer: ${m.content}`);
      if (m.role === 'user') entries.push(`Candidate: ${m.content}`);
      // The existing answer endpoint persists an answer on its question row.
      if (m.answer) entries.push(`Candidate: ${m.answer}`);
      if (m.evaluation?.feedback) entries.push(`Evaluation focus: ${m.evaluation.feedback}`);
      return entries;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Generate a unique question ID
 */
function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Extract topic from question text
 */
function extractTopic(question) {
  const keywords = ['javascript', 'python', 'java', 'react', 'node', 'database', 'sql', 'system design', 'algorithm', 'data structure', 'api', 'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'security', 'authentication', 'authorization'];
  const lower = question.toLowerCase();
  for (const keyword of keywords) {
    if (lower.includes(keyword)) return keyword;
  }
  return 'general';
}

/**
 * Estimate time needed for a question
 */
function estimateTime(question) {
  const length = question.length;
  if (length > 300) return 10;
  if (length > 150) return 7;
  return 5;
}

/**
 * Clamp score to 0-100
 */
function clampScore(score) {
  if (typeof score !== 'number' || isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Clamp confidence to 0-1
 */
function clampConfidence(confidence) {
  if (typeof confidence !== 'number' || isNaN(confidence)) return 0;
  return Math.max(0, Math.min(1, confidence));
}

module.exports = {
  generateFirstQuestion,
  generateNextQuestion,
  evaluateAnswer,
  generateFinalReport,
  initializeGemini,
  withRetry,
};
