// Interview Service - core business logic for AI interview flow
const InterviewRepository = require("../repositories/interview.repository");
const InterviewMessageRepository = require("../repositories/interview-message.repository");
const InterviewContextService = require("./interview-context.service");
const {
  generateFirstQuestion,
  generateNextQuestion,
  evaluateAnswer,
  generateFinalReport,
} = require("./gemini.service");

class InterviewService {
  constructor(interviewRepo, interviewMessageRepo, contextService) {
    this.interviewRepo = interviewRepo;
    this.interviewMessageRepo = interviewMessageRepo;
    this.contextService = contextService;
  }

  /**
   * Start interview session (Step 1)
   * Creates Interview record, builds context, generates first question
   */
  async startInterview(userId, interviewConfig) {
    // Create interview record in DB
    const interview = await this.interviewRepo.create({
      userId,
      ...interviewConfig,
      status: "in_progress",
      interviewType: interviewConfig.interviewType,
      difficulty: interviewConfig.difficulty,
      interviewDuration: interviewConfig.interviewDuration,
      startTime: new Date(),
    });

    // Build interview context (Step 2)
    const context = await this.contextService.buildContext(userId, {
      company: interviewConfig.company,
      role: interviewConfig.role,
      difficulty: interviewConfig.difficulty,
      type: interviewConfig.interviewType,
      durationMinutes: interviewConfig.interviewDuration,
      interviewId: interview.id,
    });

    // Generate first question (Step 5)
    const firstQuestion = await generateFirstQuestion(context);
    const savedQuestion = await this._storeQuestion(
      interview.id,
      context.id,
      firstQuestion,
      "first",
    );

    return {
      interviewId: interview.id,
      contextId: context.id,
      firstQuestion: savedQuestion,
    };
  }

  /**
   * Get next follow-up question (Step 6 + 7)
   */
  async getNextQuestion(contextId, userId) {
    // Build context including conversation history and evaluation
    const context = await this.contextService.getSessionContext(contextId);
    this._assertContextOwner(context, userId);
    const nextQuestion = await generateNextQuestion(context);
    const saved = await this._storeQuestion(
      context.interviewId,
      contextId,
      nextQuestion,
      "follow-up",
    );
    return { ...nextQuestion, messageId: saved.id };
  }

  /**
   * Evaluate a candidate's answer (Step 7)
   */
  async evaluateAnswer(messageId, answer, userId) {
    const message = await this.interviewMessageRepo.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    const interview = await this.interviewRepo.getByIdAndUserId(
      message.interview_id,
      userId,
    );
    if (!interview) throw new Error("Interview not found");

    const evaluation = await evaluateAnswer(message, answer);

    await this.interviewMessageRepo.update(messageId, {
      answer,
      evaluation: evaluation,
      confidence_score: evaluation.confidence,
      mistakes: evaluation.mistakes,
      is_correct: evaluation.isCorrect,
      actual_time_seconds: evaluation.actualTime,
    });

    return evaluation;
  }

  /**
   * End interview and generate final report (Step 8)
   */
  async endInterview(contextId, userId) {
    const context = await this.contextService.getContextById(contextId);

    if (!context || context.user_id !== userId) {
      throw new Error("Interview context not found");
    }

    // IMPORTANT:
    // Reload the latest interview messages from the database.
    // The context object may not contain messages created during the interview.
    const messages = await this.interviewMessageRepo.findByInterviewId(
      context.interview_id,
    );

    console.log("[INTERVIEW END] Context:", {
      contextId,
      interviewId: context.interview_id,
    });

    console.log("[INTERVIEW END] Messages found:", messages?.length || 0);

    if (messages?.length) {
      console.log(
        "[INTERVIEW END] Message summary:",
        messages.map((message) => ({
          id: message.id,
          type: message.message_type,
          role: message.role,
          content: message.content?.substring(0, 80),
          hasAnswer: !!message.answer,
          hasEvaluation: !!message.evaluation,
        })),
      );
    }

    // Create a fresh context object containing the latest conversation.
    const reportContext = {
      ...context,
      messages: messages || [],
    };

    // Generate final report using the latest database state.
    const report = await generateFinalReport(reportContext);

    // Store final report as a message
    await this._storeQuestion(
      context.interview_id,
      contextId,
      {
        question: report.summary,
        evaluation: {
          score: report.overallScore,
        },
      },
      "final",
    );

    // Deactivate context after report generation.
    await this.contextService.deactivateContext(contextId);

    // Update interview status.
    await this.interviewRepo.updateStatus(
      context.interview_id,
      "completed",
      new Date(),
    );

    return report;
  }

  /**
   * Get interview by ID with messages
   */
  async getInterviewWithMessages(id, userId) {
    return this.interviewRepo.getByIdAndUserId(id, userId);
  }

  async getInterviewById(id) {
    return this.interviewRepo.getInterviewById(id);
  }

  /**
   * Get remaining interview time (Step 8 - Timer)
   */
  getRemainingTime(interview) {
    if (!interview.start_time || !interview.interview_duration) return 0;

    const start = new Date(interview.start_time);
    const elapsed = Date.now() - start.getTime();
    const remainingMs = interview.interview_duration * 60 * 1000 - elapsed;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  /**
   * Store a question in the database (Step 9 - Auto save)
   */
  async _storeQuestion(
    interviewId,
    contextId,
    questionData,
    type,
    parentMessageId = null,
  ) {
    return this.interviewMessageRepo.create({
      interview_id: interviewId,
      interview_context_id: contextId,
      message_type: type,
      role: "assistant",
      content: questionData.question || questionData.content || "",
      question_id: questionData.id || null,
      evaluation: questionData.evaluation || {},
      confidence_score: questionData.confidence || null,
      mistakes: questionData.mistakes || [],
      topic: questionData.topic || null,
      difficulty: questionData.difficulty || null,
      estimated_time_minutes: questionData.timeEstimate || null,
      actual_time_seconds: questionData.actualTime || null,
      parent_message_id: parentMessageId,
    });
  }

  _assertContextOwner(context, userId) {
    if (!context || context.user_id !== userId)
      throw new Error("Interview context not found");
  }
}

module.exports = InterviewService;
