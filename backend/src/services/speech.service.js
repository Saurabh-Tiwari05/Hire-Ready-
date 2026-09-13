// Speech Service - handles speech-to-text processing and transcript management
const SpeechRepository = require('../repositories/speech.repository');
const { evaluateAnswer } = require('./gemini.service');
const InterviewMessageRepository = require('../repositories/interview-message.repository');
const { v4: uuidv4 } = require('uuid');

class SpeechService {
  constructor() {
    this.speechRepository = SpeechRepository;
    this.interviewMessageRepository = InterviewMessageRepository;
  }

  /**
   * Process final transcript and send for evaluation
   * @param {Object} params - Speech processing parameters
   * @returns {Promise<Object>} Evaluation result
   */
  async processTranscript({
    interviewId,
    contextId,
    questionId,
    transcript,
    startTime,
    endTime,
    responseDuration,
    wordCount,
    topic,
    difficulty,
  }) {
    // Save transcript as an answer message
    const answerMessage = await this.interviewMessageRepository.create({
      interview_id: interviewId,
      interview_context_id: contextId,
      message_type: 'answer',
      role: 'user',
      content: transcript,
      question_id: questionId,
      topic,
      difficulty,
      estimated_time_minutes: Math.ceil(responseDuration / 60000),
      actual_time_seconds: Math.floor(responseDuration / 1000),
    });

    // Get the original question for context
    const questionMessage = await this.interviewMessageRepository.findById(questionId);

    // Evaluate the answer using Gemini
    const evaluation = await evaluateAnswer(
      {
        content: questionMessage?.content || '',
        topic,
        difficulty,
      },
      transcript
    );

    // Update the answer message with evaluation
    await this.interviewMessageRepository.update(answerMessage.id, {
      evaluation,
      confidence_score: evaluation.confidence,
      mistakes: evaluation.mistakes,
      is_correct: evaluation.isCorrect,
    });

    return {
      messageId: answerMessage.id,
      evaluation,
      transcript,
      metadata: {
        startTime,
        endTime,
        responseDuration,
        wordCount,
      },
    };
  }

  /**
   * Save interim transcript (for auto-save/recovery)
   * @param {Object} params - Interim transcript parameters
   * @returns {Promise<Object>} Saved transcript info
   */
  async saveInterimTranscript({
    interviewId,
    contextId,
    questionId,
    transcript,
    isFinal = false,
    startTime,
  }) {
    // Store interim transcript as a system message for recovery
    const interimMessage = await this.interviewMessageRepository.create({
      interview_id: interviewId,
      interview_context_id: contextId,
      message_type: isFinal ? 'answer' : 'system',
      role: 'system',
      content: transcript,
      question_id: questionId,
      topic: 'interim_transcript',
      metadata: JSON.stringify({
        isInterim: !isFinal,
        startTime,
        timestamp: new Date().toISOString(),
      }),
    });

    return {
      id: interimMessage.id,
      isFinal,
    };
  }

  /**
   * Get all transcripts for an interview session (for recovery)
   * @param {string} interviewId
   * @returns {Promise<Array>} All transcripts
   */
  async getInterviewTranscripts(interviewId) {
    const messages = await this.interviewMessageRepository.findByInterviewId(interviewId);
    return messages.map(m => m.toJSON());
  }

  /**
   * Generate next question based on conversation history
   * @param {string} contextId
   * @returns {Promise<Object>} Next question
   */
  async getNextQuestion(contextId) {
    // This would integrate with the interview service
    // For now, return null as the interview service handles this
    return null;
  }

  /**
   * Calculate word count from transcript
   * @param {string} transcript
   * @returns {number} Word count
   */
  calculateWordCount(transcript) {
    if (!transcript || typeof transcript !== 'string') return 0;
    return transcript.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Check if transcript has meaningful content
   * @param {string} transcript
   * @returns {boolean}
   */
  hasMeaningfulContent(transcript) {
    if (!transcript) return false;
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 2);
    return words.length >= 3; // At least 3 words of length > 2
  }
}

module.exports = new SpeechService();