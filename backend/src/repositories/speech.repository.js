const { InterviewMessage } = require('../models');

class SpeechRepository {
  /**
   * Save a speech transcript as an interview message
   * @param {Object} params
   * @param {string} params.interviewId - ID of the interview session
   * @param {string} params.questionId - ID of the question being answered
   * @param {string} params.transcript - Final transcript text
   * @param {string} params.startTime - Recording start timestamp (ISO)
   * @param {string} params.endTime - Recording end timestamp (ISO)
   * @param {number} params.responseDuration - Duration in milliseconds
   * @param {number} params.wordCount - Number of words spoken
   * @param {string} params.messageType - 'answer' | 'system' | 'evaluation'
   * @param {Object} params.evaluation - Evaluation data for AI feedback
   * @param {string} params.topic - Subject area of the question
   * @param {string} params.difficulty - Question difficulty level
   * @param {string} params.candidateId - Candidate user ID
   */
  async saveTranscript(params) {
    const {
      interviewId,
      questionId,
      transcript,
      startTime,
      endTime,
      responseDuration,
      wordCount,
      messageType = 'answer',
      evaluation,
      topic,
      difficulty,
      candidateId,
      contextId,
    } = params;

    // Create interview message record
    const interviewMessage = await InterviewMessage.create({
      interview_id: interviewId,
      interview_context_id: contextId || null,
      question_id: questionId,
      content: transcript,
      role: 'user',
      message_type: messageType,
      evaluation: evaluation || null, // JSONB field
      topic,
      difficulty,
      // Store timing info as JSON for flexibility
      metadata: JSON.stringify({
        startTime,
        endTime,
        responseDuration,
        wordCount,
      }),
    });

    return interviewMessage;
  }

  /**
   * Get answer transcripts for a specific interview session
   * @param {string} interviewId
   * @returns {Promise<Array>} List of answer transcripts
   */
  async getAnswersByInterviewId(interviewId) {
    const answers = await InterviewMessage.findAll({
      where: {
        interview_id: interviewId,
        message_type: 'answer',
      },
      order: [['created_at', 'ASC']],
      attributes: ['content', 'created_at', 'metadata', 'question_id'],
    });

    return answers.map(row => ({
      ...row.toJSON(),
      metadata: JSON.parse(row.metadata),
    }));
  }

  /**
   * Get evaluation results for an interview
   * @param {string} interviewId
   * @returns {Promise<Object>} Evaluation summary
   */
  async getEvaluation(interviewId) {
    const evaluations = await InterviewMessage.findAll({
      where: {
        interview_id: interviewId,
        message_type: 'evaluated',
      },
    });

    const evaluationJSON = evaluations.map(row => row.toJSON());
    return {
      results: evaluationJSON,
      count: evaluationJSON.length,
    };
  }
}

module.exports = new SpeechRepository();