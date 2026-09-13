// Interview Repository - handles all database operations for interviews
const { Interview, InterviewContext, InterviewMessage, CandidateProfile, Resume } = require('../models');
const { Op } = require('sequelize');

class InterviewRepository {
  /**
   * Get interview by ID with all messages and context
   */
  async getById(id) {
    return Interview.findByPk(id, {
      include: [
        {
          model: InterviewMessage,
          as: 'messages',
          order: [['created_at', 'ASC']],
        },
        {
          model: InterviewContext,
          as: 'interviewContext',
        },
      ],
    });
  }

  /**
   * Get interview with messages, verify user ownership
   */
  async getByIdAndUserId(id, userId) {
    const interview = await Interview.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: InterviewMessage,
          as: 'messages',
          order: [['created_at', 'ASC']],
        },
        {
          model: InterviewContext,
          as: 'interviewContext',
        },
      ],
    });

    return interview ? interview.toJSON() : null;
  }

  /**
   * Get all interviews for a user
   */
  async getByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, status } = options;
    const where = { user_id: userId };
    if (status) where.status = status;

    const interviews = await Interview.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: InterviewContext,
          as: 'interviewContext',
          required: false,
        },
      ],
    });

    return interviews.map(i => i.toJSON());
  }

  /**
   * Get a single interview by ID
   */
  async getInterviewById(id) {
    return Interview.findByPk(id);
  }

  /**
   * Create interview session record
   */
  async create(data) {
    const interview = await Interview.create({
      user_id: data.userId,
      resume_id: data.resumeId || null,
      company: data.company,
      role: data.role,
      stage: data.stage || 'screening',
      status: data.status || 'in_progress',
      interview_type: data.interviewType,
      difficulty: data.difficulty,
      interview_duration: data.interviewDuration,
      start_time: data.startTime || new Date(),
      metadata: data.metadata || {},
    });

    return interview.toJSON();
  }

  /**
   * Update interview status
   */
  async updateStatus(id, status, endTime = null) {
    const updateData = { status };
    if (endTime) {
      updateData.end_time = endTime;
      updateData.completed_at = endTime;
    }

    await Interview.update(updateData, { where: { id } });
    return Interview.findByPk(id);
  }

  /**
   * Update interview record
   */
  async update(id, data) {
    const interview = await Interview.findByPk(id);
    if (!interview) return null;

    await interview.update(data);
    return interview;
  }

  /**
   * Delete interview and its messages
   */
  async delete(id) {
    await InterviewMessage.destroy({ where: { interview_id: id } });
    await InterviewContext.destroy({ where: { interview_id: id } });
    return Interview.destroy({ where: { id } });
  }

  /**
   * Get active interview for user (timer support)
   */
  async getActiveInterview(userId) {
    return Interview.findOne({
      where: {
        user_id: userId,
        status: { [Op.or]: ['started', 'in_progress'] },
      },
      include: [
        {
          model: InterviewContext,
          as: 'interviewContext',
          required: false,
        },
      ],
    });
  }
}

module.exports = new InterviewRepository();
