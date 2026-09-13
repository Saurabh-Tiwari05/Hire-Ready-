// Interview Message Repository - handles database operations for messages
const { InterviewMessage } = require('../models');

class InterviewMessageRepository {
  /**
   * Create a new interview message
   */
  async create(data) {
    // Map frontend params to database fields (snake_case)
    return InterviewMessage.create({
      interview_id: data.interview_id || data.interviewId,
      interview_context_id: data.interview_context_id || data.contextId,
      message_type: data.message_type || data.messageType || 'question',
      role: data.role || 'assistant',
      content: data.content,
      question_id: data.question_id || data.questionId,
      answer: data.answer,
      evaluation: data.evaluation,
      confidence_score: data.confidence_score || data.confidenceScore,
      mistakes: data.mistakes || [],
      topic: data.topic,
      difficulty: data.difficulty,
      estimated_time_minutes: data.estimated_time_minutes || data.estimatedTimeMinutes,
      actual_time_seconds: data.actual_time_seconds || data.actualTimeSeconds,
      parent_message_id: data.parent_message_id || data.parentMessageId,
      is_correct: data.is_correct !== undefined ? data.is_correct : data.isCorrect,
    });
  }

  /**
   * Find message by ID
   */
  async findById(id) {
    return InterviewMessage.findByPk(id);
  }

  /**
   * Find all messages for an interview
   */
  async findByInterviewId(interviewId, options = {}) {
    const { limit = 100, offset = 0, messageType } = options;
    const where = { interview_id: interviewId };
    if (messageType) where.message_type = messageType;

    return InterviewMessage.findAll({
      where,
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });
  }

  /**
   * Find message by question ID
   */
  async findByQuestionId(questionId) {
    return InterviewMessage.findOne({ where: { question_id: questionId } });
  }

  /**
   * Update an existing message
   */
  async update(id, data) {
    const message = await InterviewMessage.findByPk(id);
    if (!message) return null;

    // Map camelCase to snake_case for update
    const mappedData = {
      interview_id: data.interviewId,
      interview_context_id: data.contextId,
      message_type: data.messageType,
      role: data.role,
      content: data.content,
      question_id: data.questionId,
      answer: data.answer,
      evaluation: data.evaluation,
      confidence_score: data.confidenceScore,
      mistakes: data.mistakes,
      topic: data.topic,
      difficulty: data.difficulty,
      estimated_time_minutes: data.estimatedTimeMinutes,
      actual_time_seconds: data.actualTimeSeconds,
      is_correct: data.isCorrect !== undefined ? data.isCorrect : data.isCorrect,
      is_repeated: data.repeated,
      parent_message_id: data.parentMessageId,
    };

    // Filter out undefined values
    Object.keys(mappedData).forEach(key => {
      if (mappedData[key] === undefined) delete mappedData[key];
    });

    await message.update(mappedData);
    return message;
  }

  /**
   * Delete a message
   */
  async delete(id) {
    const message = await InterviewMessage.findByPk(id);
    if (!message) return false;
    await message.destroy();
    return true;
  }

  /**
   * Delete all messages for an interview
   */
  async deleteByInterviewId(interviewId) {
    return InterviewMessage.destroy({ where: { interview_id: interviewId } });
  }

  /**
   * Get messages with evaluation data
   */
  async getEvaluatedMessages(interviewId) {
    return InterviewMessage.findAll({
      where: {
        interview_id: interviewId,
        evaluation: { [require('sequelize').Op.not]: null },
      },
      order: [['created_at', 'ASC']],
    });
  }
}

module.exports = new InterviewMessageRepository();