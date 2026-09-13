// Report Service - orchestrates report generation, PDF creation, and email delivery
const { Report, Interview, User } = require('../models');
const PDFService = require('./pdf.service');
const EmailService = require('./email.service');
const AppError = require('../utils/appError');

class ReportService {
  /**
   * Generate comprehensive report for an interview
   */
  async generateInterviewReport(interviewId, userId) {
    // 1. Collect all data (Interview, Evaluations, Context)
    const interview = await Interview.findByPk(interviewId, {
      include: [
        { model: User, as: 'user' },
        // ... include other related models
      ]
    });

    if (!interview) throw new AppError('Interview not found', 404);

    // 2. Build report object (JSON structure)
    const reportData = this._buildReportData(interview);

    // 3. Save report to DB
    const report = await Report.create({
      user_id: userId,
      interview_id: interviewId,
      type: 'interview_analysis',
      title: `Interview Report - ${interview.company}`,
      content: reportData,
      scores: reportData.scores,
      strengths: reportData.strengths,
      improvements: reportData.improvements,
      recommendations: reportData.recommendations,
    });

    // 4. Generate PDF
    try {
      const pdf = await PDFService.generateReportPDF(reportData);
      report.pdf_path = pdf.path;
      report.pdf_filename = pdf.filename;
      await report.save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Don't fail the interview process for PDF error
    }

    // 5. Send Email
    try {
      await EmailService.sendInterviewReport(interview.user.email, reportData, report.pdf_path);
      report.email_sent = true;
      report.email_status = 'sent';
    } catch (err) {
      console.error('Email sending failed:', err);
      report.email_status = 'failed';
      report.email_error = err.message;
    }
    await report.save();

    return report;
  }

  _buildReportData(interview) {
    // Logic to aggregate data into structured JSON format
    return {
      candidateName: interview.user.full_name,
      company: interview.company,
      role: interview.role,
      scores: { overall: 85 }, // Extracted from evaluation service
      strengths: [],
      improvements: [],
      recommendations: [],
      // ...
    };
  }
}

module.exports = new ReportService();