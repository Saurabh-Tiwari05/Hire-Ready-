const { Evaluation, QuestionEvaluation, Interview } = require('../models');

class EvaluationRepository {
  /**
   * Create evaluation record
   */
  async create(data) {
    return Evaluation.create(data);
  }

  /**
   * Create question evaluation
   */
  async createQuestionEvaluation(data) {
    return QuestionEvaluation.create(data);
  }

  /**
   * Find evaluation by ID
   */
  async findById(id) {
    return Evaluation.findByPk(id, {
      include: [
        {
          model: QuestionEvaluation,
          as: 'questionEvaluations',
          order: [['created_at', 'ASC']],
        },
        {
          model: Interview,
          as: 'interview',
        },
      ],
    });
  }

  /**
   * Find evaluation by interview ID
   */
  async findByInterviewId(interviewId) {
    return Evaluation.findOne({
      where: { interview_id: interviewId },
      include: [
        {
          model: QuestionEvaluation,
          as: 'questionEvaluations',
          order: [['created_at', 'ASC']],
        },
      ],
    });
  }

  /**
   * Find evaluations for a user
   */
  async findByUserId(userId) {
    return Evaluation.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Update evaluation
   */
  async update(id, data) {
    const evaluation = await Evaluation.findByPk(id);
    if (!evaluation) return null;

    await evaluation.update(data);
    return evaluation;
  }

  /**
   * Delete evaluation and related question evaluations
   */
  async delete(id) {
    await QuestionEvaluation.destroy({ where: { evaluation_id: id } });
    return Evaluation.destroy({ where: { id } });
  }

  /**
   * Find question evaluation by ID
   */
  async findQuestionById(id) {
    return QuestionEvaluation.findByPk(id);
  }
}

module.exports = new EvaluationRepository();