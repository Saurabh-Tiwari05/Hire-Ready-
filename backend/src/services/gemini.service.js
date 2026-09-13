// Gemini Service - AI interview engine using Google Generative AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-flash-latest";

let genAI = null;
let model = null;

/**
 * Initialize Gemini client (singleton)
 */
function initializeGemini() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your-gemini-api-key") {
    console.warn("GEMINI_API_KEY not configured. AI features will not work.");
    return false;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  return true;
}

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
      if (status === 429) {
        console.warn("Gemini rate limit reached. Not retrying immediately.");
        throw error;
      }

      // Retry temporary Gemini server errors once.
      if (status === 503 && attempt < maxRetries) {
        console.warn(
          `Gemini service unavailable (attempt ${attempt + 1}), retrying once...`,
        );

        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }

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
- Name: ${candidateSummary?.name || "Unknown"}
- Resume Summary: ${resumeSummary || "Not available"}
- Skills: ${Array.isArray(skills) ? skills.join(", ") : "Not specified"}
- Projects: ${
    Array.isArray(projects)
      ? projects.map((p) => p.name).join(", ")
      : "Not specified"
  }
- Strong Areas: ${
    Array.isArray(strongAreas) ? strongAreas.join(", ") : "None identified"
  }
- Weak Areas: ${
    Array.isArray(weakAreas) ? weakAreas.join(", ") : "None identified"
  }
- Previous Interview Scores: ${
    previousInterviews?.averageScore
      ? `Average: ${previousInterviews.averageScore}`
      : "No previous interviews"
  }

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
    throw new Error("Gemini API not configured");
  }

  const systemPrompt = buildSystemPrompt(context);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
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
    type: "first",
    question,
    topic: extractTopic(question),
    difficulty: context.difficulty || "medium",
    timeEstimate: estimateTime(question),
  };
}

/**
 * Generate the next follow-up question based on previous conversation
 */
async function generateNextQuestion(context) {
  if (!initializeGemini()) {
    throw new Error("Gemini API not configured");
  }

  const systemPrompt = buildSystemPrompt(context);

  const conversationHistory = buildConversationHistory(context.messages || []);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "user",
          parts: [
            {
              text: `PREVIOUS CONVERSATION:
${conversationHistory}

Based on the candidate's previous answers, ask the next question. Only ask one question.`,
            },
          ],
        },
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
    type: "follow-up",
    question,
    topic: extractTopic(question),
    difficulty: context.difficulty || "medium",
    timeEstimate: estimateTime(question),
  };
}

/**
 * Evaluate a candidate's answer
 */
async function evaluateAnswer(message, answer) {
  if (!initializeGemini()) {
    throw new Error("Gemini API not configured");
  }

  const prompt = buildEvaluationPrompt(message, answer);

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    });
  });

  const response = await result.response;
  const text = response.text();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse Gemini evaluation response:", text);

    throw new Error("AI evaluation returned invalid JSON");
  }

  return {
    score: clampScore(parsed.score),

    confidence: clampConfidence(parsed.confidence),

    isCorrect: parsed.isCorrect === true,

    technicalAccuracy: clampScore(parsed.technicalAccuracy),
    completeness: clampScore(parsed.completeness),
    relevance: clampScore(parsed.relevance),

    feedback: parsed.feedback || "",

    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],

    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],

    missingConcepts: Array.isArray(parsed.missingConcepts)
      ? parsed.missingConcepts
      : [],

    communication: {
      clarity: clampScore(parsed.communication?.clarity),
      articulation: clampScore(parsed.communication?.articulation),
      grammar: clampScore(parsed.communication?.grammar),
      structure: clampScore(parsed.communication?.structure),
    },

    sentenceAnalysis: Array.isArray(parsed.sentenceAnalysis)
      ? parsed.sentenceAnalysis.map((item) => ({
          original: item?.original || "",
          corrected: item?.corrected || "",
          issue: item?.issue || "",
          explanation: item?.explanation || "",
        }))
      : [],

    betterAnswer: parsed.betterAnswer || "",

    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],

    actualTime: parsed.actualTime || null,
  };
}

function buildInterviewMetrics(qaPairs) {
  const answeredPairs = qaPairs.filter(
    (pair) => pair.evaluation && typeof pair.evaluation === "object",
  );

  if (!answeredPairs.length) {
    return {
      totalQuestions: qaPairs.length,
      answeredQuestions: 0,
      totalAttempts: 0,

      overallScore: 0,
      technicalAccuracy: 0,
      completeness: 0,
      relevance: 0,
      communication: 0,
      confidence: 0,

      performanceByDifficulty: {},

      performanceTrend: {
        firstHalf: 0,
        secondHalf: 0,
      },
    };
  }

  const totalAttempts = answeredPairs.reduce(
    (total, pair) => total + (pair.attempts?.length || 1),
    0,
  );

  const average = (values) => {
    const valid = values.filter(
      (value) => typeof value === "number" && Number.isFinite(value),
    );

    if (!valid.length) return 0;

    return Math.round(
      valid.reduce((sum, value) => sum + value, 0) / valid.length,
    );
  };

  // ---------------------------------------------------------
  // Core scores
  // ---------------------------------------------------------

  const scores = answeredPairs.map((pair) => pair.evaluation?.score);

  const technicalAccuracy = average(
    answeredPairs.map((pair) => pair.evaluation?.technicalAccuracy),
  );

  const completeness = average(
    answeredPairs.map((pair) => pair.evaluation?.completeness),
  );

  const relevance = average(
    answeredPairs.map((pair) => pair.evaluation?.relevance),
  );

  // ---------------------------------------------------------
  // Communication
  // ---------------------------------------------------------

  const communicationScores = answeredPairs
    .map((pair) => pair.evaluation?.communication)
    .filter(Boolean);

  const communication = average(
    communicationScores.flatMap((item) => [
      item.clarity,
      item.articulation,
      item.grammar,
      item.structure,
    ]),
  );

  // ---------------------------------------------------------
  // Evaluation confidence
  //
  // This is confidence in the AI's evaluation of the answer.
  // It is NOT candidate psychological confidence.
  // ---------------------------------------------------------

  const confidence = Math.round(
    average(
      answeredPairs.map((pair) => (pair.evaluation?.confidence ?? 0) * 100),
    ),
  );

  const overallScore = average(scores);

  // ---------------------------------------------------------
  // Performance by difficulty
  // ---------------------------------------------------------

  const difficultyGroups = {};

  for (const pair of answeredPairs) {
    const difficulty = pair.difficulty || "unknown";

    if (!difficultyGroups[difficulty]) {
      difficultyGroups[difficulty] = [];
    }

    difficultyGroups[difficulty].push(pair.evaluation?.score);
  }

  const performanceByDifficulty = {};

  for (const [difficulty, values] of Object.entries(difficultyGroups)) {
    performanceByDifficulty[difficulty] = average(values);
  }

  // ---------------------------------------------------------
  // Performance progression
  // ---------------------------------------------------------

  const midpoint = Math.ceil(answeredPairs.length / 2);

  const firstHalf = answeredPairs.slice(0, midpoint);
  const secondHalf = answeredPairs.slice(midpoint);

  const performanceTrend = {
    firstHalf: average(firstHalf.map((pair) => pair.evaluation?.score)),

    secondHalf: secondHalf.length
      ? average(secondHalf.map((pair) => pair.evaluation?.score))
      : average(firstHalf.map((pair) => pair.evaluation?.score)),
  };

  return {
    totalQuestions: qaPairs.length,
    answeredQuestions: answeredPairs.length,
    totalAttempts,

    overallScore,

    technicalAccuracy,
    completeness,
    relevance,
    communication,
    confidence,

    performanceByDifficulty,

    performanceTrend,
  };
}

function buildInterviewInsights(qaPairs) {
  const evaluations = qaPairs.flatMap((pair) => {
    if (!pair.evaluation) return [];

    return [
      {
        questionNumber: pair.questionNumber,
        topic: pair.topic,
        difficulty: pair.difficulty,
        score: pair.evaluation.score,
        strengths: pair.evaluation.strengths || [],
        mistakes: pair.evaluation.mistakes || [],
        missingConcepts: pair.evaluation.missingConcepts || [],
        suggestions: pair.evaluation.suggestions || [],
      },
    ];
  });

  const collectFrequency = (items) => {
    const frequency = new Map();

    for (const item of items) {
      if (!item) continue;

      const normalized = String(item).trim();

      if (!normalized) continue;

      const key = normalized.toLowerCase();

      const existing = frequency.get(key);

      if (existing) {
        existing.count += 1;
      } else {
        frequency.set(key, {
          text: normalized,
          count: 1,
        });
      }
    }

    return [...frequency.values()]
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        text: item.text,
        occurrences: item.count,
      }));
  };

  return {
    recurringStrengths: collectFrequency(
      evaluations.flatMap((item) => item.strengths),
    ).slice(0, 10),

    recurringMistakes: collectFrequency(
      evaluations.flatMap((item) => item.mistakes),
    ).slice(0, 10),

    recurringMissingConcepts: collectFrequency(
      evaluations.flatMap((item) => item.missingConcepts),
    ).slice(0, 10),

    recurringSuggestions: collectFrequency(
      evaluations.flatMap((item) => item.suggestions),
    ).slice(0, 10),

    topicPerformance: buildTopicPerformance(evaluations),
  };
}

function buildTopicPerformance(evaluations) {
  const topics = {};

  for (const item of evaluations) {
    const topic = item.topic || "general";

    if (!topics[topic]) {
      topics[topic] = [];
    }

    if (typeof item.score === "number" && Number.isFinite(item.score)) {
      topics[topic].push(item.score);
    }
  }

  const result = {};

  for (const [topic, scores] of Object.entries(topics)) {
    if (!scores.length) continue;

    result[topic] = Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length,
    );
  }

  return result;
}

/**
 * Generate final interview report
 *
 * IMPORTANT:
 * The database stores questions and answers as separate messages.
 * This function first builds real Q/A pairs before sending anything
 * to Gemini.
 */
async function generateFinalReport(context) {
  if (!initializeGemini()) {
    throw new Error("Gemini API not configured");
  }

  const qaPairs = buildInterviewQAPairs(context.messages || []);

  console.log("[FINAL REPORT] Q/A pairs prepared:", qaPairs.length);

  console.log(
    "[FINAL REPORT] Q/A summary:",
    qaPairs.map((item) => ({
      questionNumber: item.questionNumber,
      questionId: item.questionId,
      totalAttempts: item.totalAttempts,
      finalAttemptNumber: item.finalAttemptNumber,
      attempts: item.attempts.map((attempt) => ({
        attemptNumber: attempt.attemptNumber,
        answerId: attempt.answerId,
        score: attempt.score,
      })),
      finalScore: item.score,
      topic: item.topic,
      difficulty: item.difficulty,
    })),
  );

  if (!qaPairs.length) {
    throw new Error(
      "Cannot generate final report: no interview questions were found",
    );
  }

  // ---------------------------------------------------------
  // 1. Calculate deterministic metrics locally.
  // ---------------------------------------------------------

  const metrics = buildInterviewMetrics(qaPairs);

  // ---------------------------------------------------------
  // 2. Extract recurring patterns from stored evaluations.
  // ---------------------------------------------------------

  const insights = buildInterviewInsights(qaPairs);

  console.log("[FINAL REPORT] Metrics:", metrics);

  console.log("[FINAL REPORT] Insights:", {
    recurringStrengths: insights.recurringStrengths,
    recurringMistakes: insights.recurringMistakes,
    recurringMissingConcepts: insights.recurringMissingConcepts,
    topicPerformance: insights.topicPerformance,
  });

  // ---------------------------------------------------------
  // 3. Send ONLY compact aggregate data to Gemini.
  // ---------------------------------------------------------

  const prompt = buildFinalReportPrompt({
    context,
    metrics,
    insights,
  });

  const result = await withRetry(async () => {
    return model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],

      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,

        // Final report is now intentionally compact.
        maxOutputTokens: 4096,

        responseMimeType: "application/json",
      },
    });
  });

  const response = await result.response;
  const text = response.text();

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    console.error("[FINAL REPORT] Failed to parse Gemini response:", text);

    throw new Error("AI report generation returned invalid JSON");
  }

  // ---------------------------------------------------------
  // 4. Combine deterministic data + Gemini analysis.
  // ---------------------------------------------------------

  return normalizeFinalReport(
    {
      ...parsed,

      overallScore: metrics.overallScore ?? parsed.overallScore ?? 0,

      scores: {
        ...(parsed.scores || {}),

        overall: metrics.overallScore,
        technicalAccuracy: metrics.technicalAccuracy,
        completeness: metrics.completeness,
        relevance: metrics.relevance,
        communication: metrics.communication,
      },

      questionAnalysis: qaPairs.map((pair) => ({
        questionNumber: pair.questionNumber,
        questionId: pair.questionId,
        question: pair.question,

        candidateAnswer: pair.candidateAnswer,

        score: pair.score,

        topic: pair.topic,
        difficulty: pair.difficulty,

        totalAttempts: pair.totalAttempts,
        finalAttemptNumber: pair.finalAttemptNumber,

        attempts: pair.attempts,

        evaluation: pair.evaluation,
      })),

      metrics,
      insights,
    },
    qaPairs,
  );
}

/**
 * Build proper Question -> Answer pairs.
 *
 * Expected database structure:
 *
 * Question:
 *   message_type = question
 *   role = assistant
 *   id = Q1
 *
 * Answer:
 *   message_type = answer
 *   role = user
 *   question_id = Q1
 *
 * The answer may also contain evaluation data.
 */
function buildInterviewQAPairs(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const questions = new Map();
  const questionOrder = [];

  // First collect all assistant-generated questions
  for (const message of messages) {
    const type = message.message_type;
    const role = message.role;

    if (type === "follow-up" || type === "question") {
      questions.set(message.id, {
        questionMessage: message,
        answers: [],
      });

      questionOrder.push(message.id);
    }
  }

  // Attach every answer to its question using question_id
  for (const message of messages) {
    const type = message.message_type;
    const role = message.role;

    if (type !== "answer" && role !== "user") {
      continue;
    }

    const questionId = message.question_id;

    if (!questionId) {
      console.warn("[FINAL REPORT] Answer has no question_id:", message.id);
      continue;
    }

    const question = questions.get(questionId);

    if (!question) {
      console.warn("[FINAL REPORT] Answer references unknown question:", {
        answerId: message.id,
        questionId,
      });
      continue;
    }

    question.answers.push(message);
  }

  const pairs = [];

  for (const questionId of questionOrder) {
    const questionData = questions.get(questionId);

    if (!questionData) continue;

    const questionMessage = questionData.questionMessage;
    const answers = questionData.answers;

    if (answers.length === 0) {
      continue;
    }

    const attempts = answers.map((answer, index) => ({
      attemptNumber: index + 1,
      answerId: answer.id,
      candidateAnswer: answer.content || answer.answer || "",
      evaluation: answer.evaluation || null,
      score: answer.evaluation?.score ?? null,
      topic: answer.topic || questionMessage.topic || "general",
      difficulty: answer.difficulty || questionMessage.difficulty || "medium",
      answerDuration: answer.actual_time_seconds || null,
      confidenceScore: answer.confidence_score || null,
      createdAt: answer.created_at || null,
    }));

    // The last submitted attempt is considered the final attempt.
    const finalAttempt = attempts[attempts.length - 1];

    pairs.push({
      questionNumber: pairs.length + 1,

      questionId: questionMessage.id,

      question: questionMessage.content || "",

      // Final answer is used as the primary answer
      candidateAnswer: finalAttempt.candidateAnswer,

      evaluation: finalAttempt.evaluation,

      score: finalAttempt.score,

      topic: finalAttempt.topic,

      difficulty: finalAttempt.difficulty,

      answerDuration: finalAttempt.answerDuration,

      confidenceScore: finalAttempt.confidenceScore,

      // NEW: preserve every submission
      attempts,

      totalAttempts: attempts.length,

      finalAttemptNumber: finalAttempt.attemptNumber,
    });
  }

  return pairs;
}

/**
 * Get a message ID while supporting both Sequelize
 * field naming styles.
 */
function getMessageId(message) {
  return message?.id || message?.message_id || null;
}

/**
 * Get the question ID stored on an answer.
 */
function getQuestionId(message) {
  return message?.question_id || message?.questionId || null;
}

/**
 * Normalize the final report returned by Gemini.
 *
 * This prevents malformed/missing fields from breaking
 * the frontend report page.
 */
function normalizeFinalReport(parsed, qaPairs) {
  const reportQuestions = Array.isArray(parsed.questionAnalysis)
    ? parsed.questionAnalysis
    : [];

  return {
    overallScore: clampScore(parsed.overallScore),
    // Deterministic backend metrics.
    // These should be the source of truth for numerical report values.
    metrics: parsed.metrics || {
      totalQuestions: qaPairs.length,
      answeredQuestions: 0,
      totalAttempts: 0,
      overallScore: clampScore(parsed.overallScore),
      technicalAccuracy: 0,
      completeness: 0,
      relevance: 0,
      communication: 0,
      confidence: 0,
      performanceByDifficulty: {},
      performanceTrend: {
        firstHalf: 0,
        secondHalf: 0,
      },
    },

    // Recurring patterns calculated from stored evaluations.
    insights: parsed.insights || {
      recurringStrengths: [],
      recurringMistakes: [],
      recurringMissingConcepts: [],
      recurringSuggestions: [],
      topicPerformance: {},
    },
    candidateSummary: {
      overallAssessment:
        parsed.candidateSummary?.overallAssessment || parsed.summary || "",

      hiringRecommendation:
        parsed.candidateSummary?.hiringRecommendation || "not_available",

      resumeConsistencyScore: clampScore(
        parsed.candidateSummary?.resumeConsistencyScore,
      ),
    },

    scores: {
      overall: clampScore(
        parsed.scores?.overall ??
          parsed.metrics?.overallScore ??
          parsed.overallScore,
      ),

      technicalAccuracy: clampScore(
        parsed.scores?.technicalAccuracy ?? parsed.metrics?.technicalAccuracy,
      ),

      completeness: clampScore(
        parsed.scores?.completeness ?? parsed.metrics?.completeness,
      ),

      relevance: clampScore(
        parsed.scores?.relevance ?? parsed.metrics?.relevance,
      ),

      communication: clampScore(
        parsed.scores?.communication ?? parsed.metrics?.communication,
      ),

      confidence: clampScore(
        parsed.scores?.confidence ?? parsed.metrics?.confidence,
      ),
    },

    questionAnalysis: reportQuestions.length
      ? reportQuestions.map((item, index) =>
          normalizeQuestionAnalysis(item, qaPairs[index], index),
        )
      : qaPairs.map((pair, index) =>
          normalizeQuestionAnalysis({}, pair, index),
        ),

    communicationAnalysis: {
      overallScore: clampScore(parsed.communicationAnalysis?.overallScore),

      articulation: clampScore(parsed.communicationAnalysis?.articulation),

      clarity: clampScore(parsed.communicationAnalysis?.clarity),

      grammar: clampScore(parsed.communicationAnalysis?.grammar),

      vocabulary: clampScore(parsed.communicationAnalysis?.vocabulary),

      structure: clampScore(parsed.communicationAnalysis?.structure),

      fillerUsage: clampScore(parsed.communicationAnalysis?.fillerUsage),

      observations: Array.isArray(parsed.communicationAnalysis?.observations)
        ? parsed.communicationAnalysis.observations
        : [],
    },

    technicalAnalysis: {
      strongAreas: Array.isArray(parsed.technicalAnalysis?.strongAreas)
        ? parsed.technicalAnalysis.strongAreas
        : [],

      weakAreas: Array.isArray(parsed.technicalAnalysis?.weakAreas)
        ? parsed.technicalAnalysis.weakAreas
        : [],

      skillGaps: Array.isArray(parsed.technicalAnalysis?.skillGaps)
        ? parsed.technicalAnalysis.skillGaps.map((item) => ({
            skill: item?.skill || "",
            level: item?.level || "unknown",
            evidence: item?.evidence || "",
            recommendation: item?.recommendation || "",
          }))
        : [],
    },

    resumeAnalysis: {
      consistencyScore: clampScore(parsed.resumeAnalysis?.consistencyScore),

      supportedSkills: Array.isArray(parsed.resumeAnalysis?.supportedSkills)
        ? parsed.resumeAnalysis.supportedSkills
        : [],

      weaklySupportedSkills: Array.isArray(
        parsed.resumeAnalysis?.weaklySupportedSkills,
      )
        ? parsed.resumeAnalysis.weaklySupportedSkills
        : [],

      unverifiedSkills: Array.isArray(parsed.resumeAnalysis?.unverifiedSkills)
        ? parsed.resumeAnalysis.unverifiedSkills
        : [],

      contradictions: Array.isArray(parsed.resumeAnalysis?.contradictions)
        ? parsed.resumeAnalysis.contradictions
        : [],
    },

    difficultyAnalysis: {
      easy: clampScore(parsed.difficultyAnalysis?.easy),

      medium: clampScore(parsed.difficultyAnalysis?.medium),

      hard: clampScore(parsed.difficultyAnalysis?.hard),

      observation: parsed.difficultyAnalysis?.observation || "",
    },

    confidenceAnalysis: {
      score: clampScore(parsed.confidenceAnalysis?.score),

      nervousnessIndicator:
        parsed.confidenceAnalysis?.nervousnessIndicator || "not_available",

      observations: Array.isArray(parsed.confidenceAnalysis?.observations)
        ? parsed.confidenceAnalysis.observations
        : [],
    },

    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],

    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],

    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [],

    finalRecommendations: Array.isArray(parsed.finalRecommendations)
      ? parsed.finalRecommendations
      : [],

    learningPlan: Array.isArray(parsed.learningPlan) ? parsed.learningPlan : [],

    summary: parsed.summary || "",
  };
}

/**
 * Normalize one question's report section.
 */
function normalizeQuestionAnalysis(item, pair, index) {
  const evaluation = pair?.evaluation || {};

  return {
    questionNumber: item?.questionNumber || pair?.questionNumber || index + 1,

    question: item?.question || pair?.question || "",

    totalAttempts: item?.totalAttempts ?? pair?.totalAttempts ?? 1,

    finalAttemptNumber:
      item?.finalAttemptNumber ?? pair?.finalAttemptNumber ?? 1,

    attempts: Array.isArray(item?.attempts)
      ? item.attempts
      : Array.isArray(pair?.attempts)
        ? pair.attempts.map((attempt) => ({
            attemptNumber: attempt?.attemptNumber || 1,

            candidateAnswer: attempt?.candidateAnswer || "",

            score: clampScore(attempt?.score),
          }))
        : [],

    candidateAnswer: item?.candidateAnswer || pair?.candidateAnswer || "",

    idealAnswer: item?.idealAnswer || "",

    score: clampScore(item?.score ?? evaluation?.score),

    technicalAccuracy: clampScore(
      item?.technicalAccuracy ?? evaluation?.technicalAccuracy,
    ),

    completeness: clampScore(item?.completeness ?? evaluation?.completeness),

    relevance: clampScore(item?.relevance ?? evaluation?.relevance),
    whatWasCorrect: Array.isArray(item?.whatWasCorrect)
      ? item.whatWasCorrect
      : Array.isArray(evaluation?.strengths)
        ? evaluation.strengths
        : [],

    mistakes: Array.isArray(item?.mistakes)
      ? item.mistakes
      : Array.isArray(evaluation?.mistakes)
        ? evaluation.mistakes
        : [],

    missingConcepts: Array.isArray(item?.missingConcepts)
      ? item.missingConcepts
      : Array.isArray(evaluation?.missingConcepts)
        ? evaluation.missingConcepts
        : [],

    communicationAnalysis: {
      clarity: clampScore(
        item?.communicationAnalysis?.clarity ??
          evaluation?.communication?.clarity,
      ),

      grammar: clampScore(
        item?.communicationAnalysis?.grammar ??
          evaluation?.communication?.grammar,
      ),

      articulation: clampScore(
        item?.communicationAnalysis?.articulation ??
          evaluation?.communication?.articulation,
      ),

      structure: clampScore(
        item?.communicationAnalysis?.structure ??
          evaluation?.communication?.structure,
      ),

      fillers: Array.isArray(item?.communicationAnalysis?.fillers)
        ? item.communicationAnalysis.fillers
        : [],

      issues: Array.isArray(item?.communicationAnalysis?.issues)
        ? item.communicationAnalysis.issues
        : [],
    },

    sentenceAnalysis: Array.isArray(item?.sentenceAnalysis)
      ? item.sentenceAnalysis.map((sentence) => ({
          original: sentence?.original || "",
          corrected: sentence?.corrected || "",
          issue: sentence?.issue || "",
          explanation: sentence?.explanation || "",
        }))
      : Array.isArray(evaluation?.sentenceAnalysis)
        ? evaluation.sentenceAnalysis
        : [],

    betterAnswer: item?.betterAnswer || evaluation?.betterAnswer || "",

    improvementAreas: Array.isArray(item?.improvementAreas)
      ? item.improvementAreas
      : Array.isArray(evaluation?.suggestions)
        ? evaluation.suggestions
        : [],

    feedback: item?.feedback || evaluation?.feedback || "",
  };
}

/**
 * Build evaluation prompt for Gemini
 */
function buildEvaluationPrompt(message, answer) {
  return `You are an expert technical interviewer evaluating a candidate's answer.

Your task is to evaluate the candidate fairly based on the QUESTION and the
most likely intended meaning of the CANDIDATE ANSWER.

IMPORTANT:
The candidate's answer was produced using speech-to-text. The transcript may
contain incorrect words, missing punctuation, duplicated words, or phonetically
incorrect words.

Do NOT assume every strange word in the transcript was actually spoken.

For example:
- "node prayer Express" may mean "Node.js and Express"
- "stdp" may be "HTTP-only"
- "accessories" may be an incorrect transcription of another technical word

When the intended meaning is reasonably clear from context, evaluate that
intended meaning rather than blindly penalizing the transcription.

If the meaning is genuinely unclear, explicitly say that the transcript is
unclear and lower your evaluation confidence.

QUESTION:
${message.content}

CANDIDATE ANSWER:
${answer}

TOPIC:
${message.topic || "General"}

DIFFICULTY:
${message.difficulty || "medium"}


==================================================
EVALUATION PRINCIPLES
==================================================

1. TECHNICAL ACCURACY

Evaluate whether the candidate's underlying technical understanding is correct.

Do not mark something technically wrong merely because speech-to-text produced
an incorrect word.

Only identify a technical mistake when the candidate's intended statement is
actually incorrect.

2. COMPLETENESS

Determine which important concepts expected for this question were covered
and which important concepts were missing.

Do not penalize the candidate for concepts that are not necessary for the
question.

3. RELEVANCE

Determine whether the candidate actually answered the question.

If the candidate answered only part of the question, explain which part was
answered and which part was missing.

4. COMMUNICATION

Evaluate:

- clarity
- articulation
- grammar
- structure

Separate communication problems from technical problems.

A speech-to-text transcription error should NOT automatically become a grammar
mistake.
COMMUNICATION SCORING SCALE:

All communication scores MUST be integers from 0 to 100.

- clarity: 0-100
- articulation: 0-100
- grammar: 0-100
- structure: 0-100

Do NOT use a 0-10 scale.

For example:
- 80 means 80/100
- 90 means 90/100
- 65 means 65/100

Never return values such as 8, 9, or 7 intending them to mean 8/10, 9/10, or 7/10.
5. MISTAKES

Only report genuine mistakes.

Do NOT invent mistakes.

6. MISSING CONCEPTS

List important concepts that would have strengthened the answer.

These are different from mistakes.

7. SENTENCE ANALYSIS

Analyze only meaningful communication problems.

Do NOT generate corrections solely because speech recognition removed
punctuation or capitalization.

For each useful correction return:

- original
- corrected
- issue
- explanation

If the transcript is too corrupted to confidently reconstruct a sentence,
do not fabricate a correction.

8. BETTER ANSWER

Provide a concise, technically strong example answer to the same question.

9. CONFIDENCE

Confidence represents confidence in YOUR evaluation.

It is NOT the candidate's confidence.

Use:

0.90-1.00 = transcript and meaning are very clear
0.75-0.89 = mostly clear with some ambiguity
0.50-0.74 = significant transcription or meaning problems
0.25-0.49 = highly unclear
0.00-0.24 = almost impossible to understand

10. CANDIDATE CONFIDENCE

Do NOT attempt to diagnose psychological confidence or nervousness from text
alone.

Those metrics will be calculated separately.

11. SCORE

Score 0-100.

For technical questions, prioritize:

Technical accuracy: 50%
Completeness: 25%
Relevance: 15%
Communication: 10%

For behavioral questions, adjust the weighting appropriately.

Do not give a low technical score simply because the transcript contains
speech-to-text errors.


==================================================
RETURN ONLY VALID JSON
==================================================

{
  "score": 0,
  "confidence": 0.0,
  "isCorrect": false,

  "technicalAccuracy": 0,
  "completeness": 0,
  "relevance": 0,

  "feedback": "",

  "strengths": [],

  "mistakes": [],

  "missingConcepts": [],

  "communication": {
    "clarity": 0,
    "articulation": 0,
    "grammar": 0,
    "structure": 0
  },

  "sentenceAnalysis": [
    {
      "original": "",
      "corrected": "",
      "issue": "",
      "explanation": ""
    }
  ],

  "betterAnswer": "",

  "suggestions": [],

  "actualTime": null
}

FINAL RULES:

- Return JSON only.
- Do not use markdown.
- Do not invent facts.
- Do not exaggerate weaknesses.
- Do not make psychological diagnoses.
- Do not confuse transcription errors with technical mistakes.
- Be specific and evidence-based.
- If the answer is partially correct, clearly acknowledge what is correct.
- If the answer is unclear, say so instead of guessing.
`;
}

/**
 * Build final report prompt
 *
 * The final report receives correctly paired question/answer data.
 */
function buildFinalReportPrompt({ context, metrics, insights }) {
  return `
You are a senior technical interviewer and interview assessment specialist.

Your task is to generate the FINAL OVERALL INTERVIEW ANALYSIS for a candidate.

IMPORTANT ARCHITECTURE RULE:

The candidate's individual answers have ALREADY been evaluated by AI
during the interview.

Those evaluations are stored in the database.

DO NOT recreate or re-evaluate individual questions.

DO NOT generate question-by-question analysis.

DO NOT generate ideal answers.

DO NOT generate candidate answers.

DO NOT generate sentence-level analysis.

DO NOT generate better answers for individual questions.

Instead, analyze the aggregated interview results and recurring patterns
provided below and produce ONLY the overall interview-level assessment.

The backend will attach the stored question-level evaluations separately.


==================================================
INTERVIEW CONTEXT
==================================================

Company:
${context.company || "Not specified"}

Role:
${context.role || "Not specified"}

Difficulty:
${context.difficulty || "Not specified"}

Interview Type:
${context.interviewType || "Not specified"}

Duration:
${context.durationMinutes || "Not specified"} minutes

Candidate:
${context.candidateSummary?.name || "Unknown"}

Experience:
${
  context.candidateSummary?.totalYearsExperience ??
  context.yearsOfExperience ??
  "Not specified"
} years


==================================================
RESUME CONTEXT
==================================================

Resume Summary:
${context.resumeSummary || "Not available"}

Resume Skills:
${Array.isArray(context.skills) ? context.skills.join(", ") : "Not available"}

Strong Areas From Resume:
${
  Array.isArray(context.strongAreas)
    ? context.strongAreas.join(", ")
    : "None identified"
}

Weak Areas From Resume:
${
  Array.isArray(context.weakAreas)
    ? context.weakAreas.join(", ")
    : "None identified"
}


==================================================
DETERMINISTIC INTERVIEW METRICS
==================================================

The following values were calculated by the backend from the stored
per-answer evaluations.

Do NOT recalculate them.

${JSON.stringify(metrics, null, 2)}


==================================================
RECURRING INTERVIEW INSIGHTS
==================================================

The following patterns were extracted from the stored per-answer
evaluations.

Use them as evidence for your overall analysis.

${JSON.stringify(insights, null, 2)}


==================================================
IMPORTANT INTERPRETATION RULES
==================================================

1. OVERALL ASSESSMENT

Evaluate the candidate's overall interview performance.

Consider:

- technical knowledge
- correctness
- completeness
- relevance
- communication
- articulation
- grammar
- structure
- ability to explain concepts
- consistency
- performance across difficulty levels
- recurring strengths
- recurring weaknesses

Do not blindly reinterpret or recalculate the numerical scores.

Explain what the measured scores and recurring patterns mean.


2. HIRING RECOMMENDATION

Provide one of:

- strong_yes
- yes
- lean_yes
- neutral
- lean_no
- no
- strong_no

Base this on:

- overall performance
- technical performance
- communication
- role requirements
- interview difficulty
- consistency

Do not make the recommendation solely from one bad or good answer.


3. COMMUNICATION ANALYSIS

Analyze the candidate's communication based only on the available
communication metrics and observations.

Consider:

- clarity
- articulation
- grammar
- structure
- vocabulary
- observable hesitation or communication issues

Do not invent filler counts.

Do not make psychological diagnoses.

If evidence is insufficient, say so.


4. TECHNICAL SKILL-GAP ANALYSIS

Identify the most important technical strengths and weaknesses.

Use:

- topic performance
- recurring mistakes
- recurring missing concepts
- recurring suggestions
- interview metrics

Prioritize repeated patterns over isolated mistakes.

For each important skill gap provide:

- skill
- estimated level
- evidence
- recommendation

Possible levels:

- beginner
- basic
- intermediate
- strong
- advanced


5. RESUME CONSISTENCY

Compare the interview performance with the resume skills.

Use the term:

"Resume Consistency"

Do NOT determine whether the candidate is truthful.

Classify evidence as:

- strongly supported
- weakly supported
- unverified
- contradicted

Only use "contradicted" when actual interview evidence clearly conflicts
with a claimed skill.

Do not invent resume skills.


6. DIFFICULTY ANALYSIS

Use the backend-provided performance-by-difficulty metrics.

Explain:

- where the candidate performed well
- where performance dropped
- whether difficulty appears to affect performance

If a difficulty level has insufficient data, explicitly say so.


7. PERFORMANCE TREND

Use the backend-provided first-half and second-half performance.

Explain whether performance:

- improved
- declined
- remained stable

Do not invent reasons unless the supplied evidence supports them.


8. CONFIDENCE / NERVOUSNESS

This is an AI-observed communication indicator.

It is NOT a psychological diagnosis.

Only use observable interview evidence.

Use cautious wording such as:

- "The interview data suggests..."
- "There are signs of..."
- "The available evidence indicates..."

Never claim a medical or psychological condition.


9. FINAL RECOMMENDATIONS

Give specific recommendations based on the actual interview.

Avoid generic recommendations such as:

"Practice more."

Instead identify exactly what should be improved and why.


10. LEARNING PLAN

Create a prioritized learning plan based on the candidate's actual
technical gaps.

Each item must contain:

- area
- whyItMatters
- whatToStudy
- priority

Priority must be one of:

- high
- medium
- low


==================================================
SPEECH-TO-TEXT RULE
==================================================

Candidate answers were generated using speech-to-text.

Speech recognition can produce phonetic errors.

Do not interpret obvious transcription errors as genuine technical
mistakes when the intended meaning is reasonably clear.

The per-answer evaluation has already considered this issue.


==================================================
RETURN ONLY VALID JSON
==================================================

Return exactly one JSON object using this structure:

{
  "candidateSummary": {
    "overallAssessment": "",
    "hiringRecommendation": "lean_yes",
    "resumeConsistencyScore": 0
  },

  "communicationAnalysis": {
    "overallScore": 0,
    "articulation": 0,
    "clarity": 0,
    "grammar": 0,
    "vocabulary": 0,
    "structure": 0,
    "fillerUsage": 0,
    "observations": []
  },

  "technicalAnalysis": {
    "strongAreas": [],
    "weakAreas": [],
    "skillGaps": [
      {
        "skill": "",
        "level": "intermediate",
        "evidence": "",
        "recommendation": ""
      }
    ]
  },

  "resumeAnalysis": {
    "consistencyScore": 0,
    "supportedSkills": [],
    "weaklySupportedSkills": [],
    "unverifiedSkills": [],
    "contradictions": []
  },

  "difficultyAnalysis": {
    "easy": 0,
    "medium": 0,
    "hard": 0,
    "observation": ""
  },

  "confidenceAnalysis": {
    "score": 0,
    "nervousnessIndicator": "not_available",
    "observations": []
  },

  "strengths": [],

  "weaknesses": [],

  "recommendations": [],

  "finalRecommendations": [],

  "learningPlan": [
    {
      "area": "",
      "whyItMatters": "",
      "whatToStudy": "",
      "priority": "high"
    }
  ],

  "summary": ""
}


==================================================
FINAL RULES
==================================================

- Return JSON only.
- Do not use markdown.
- Do not generate questionAnalysis.
- Do not generate candidate answers.
- Do not generate ideal answers.
- Do not generate sentenceAnalysis.
- Do not generate betterAnswer.
- Do not regenerate per-answer evaluations.
- Do not invent candidate statements.
- Do not invent resume skills.
- Do not invent filler counts.
- Do not claim psychological diagnoses.
- Do not call a candidate dishonest.
- Use "Resume Consistency" rather than "truth score".
- Do not recalculate backend metrics.
- Use the supplied metrics and recurring insights as evidence.
- Prefer repeated patterns over isolated observations.
- Be specific rather than generic.
`;
}
/**
 * Build conversation history string
 */
function buildConversationHistory(messages) {
  return messages
    .flatMap((m) => {
      const entries = [];

      if (m.role === "assistant") {
        entries.push(`Interviewer: ${m.content}`);
      }

      if (m.role === "user") {
        entries.push(`Candidate: ${m.content}`);
      }

      // The existing answer endpoint may persist an answer
      // on its question row.
      if (m.answer) {
        entries.push(`Candidate: ${m.answer}`);
      }

      if (m.evaluation?.feedback) {
        entries.push(`Evaluation focus: ${m.evaluation.feedback}`);
      }

      return entries;
    })
    .filter(Boolean)
    .join("\n");
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
  const keywords = [
    "javascript",
    "python",
    "java",
    "react",
    "node",
    "database",
    "sql",
    "system design",
    "algorithm",
    "data structure",
    "api",
    "rest",
    "graphql",
    "docker",
    "kubernetes",
    "aws",
    "security",
    "authentication",
    "authorization",
  ];

  const lower = question.toLowerCase();

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      return keyword;
    }
  }

  return "general";
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
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Clamp confidence to 0-1
 */
function clampConfidence(confidence) {
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    return 0;
  }

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
