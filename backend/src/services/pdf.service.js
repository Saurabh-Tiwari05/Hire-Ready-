// PDF Service - generates professional interview report PDFs
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  /**
   * Generate a professional interview report PDF
   */
  async generateReportPDF(reportData) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Create uploads/reports directory if not exists
    const uploadDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `report-${reportData.interviewId}-${Date.now()}.pdf`;
    const filepath = path.join(uploadDir, filename);

    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // Build PDF content
    this._addHeader(doc, reportData);
    this._addCandidateInfo(doc, reportData);
    this._addScoreCards(doc, reportData);
    this._addQuestionAnalysis(doc, reportData);
    this._addRecommendations(doc, reportData);
    this._addImprovementRoadmap(doc, reportData);
    this._addFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve({ path: filepath, filename }));
      writeStream.on('error', reject);
    });
  }

  _addHeader(doc, data) {
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a2e').text('HireReady', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#666').text('AI Interview Evaluation Report', { align: 'center' });
    doc.moveDown();
    doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1.5);
  }

  _addCandidateInfo(doc, data) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Interview Details');
    doc.moveDown(0.5);

    const info = [
      ['Candidate', data.candidateName || 'N/A'],
      ['Company', data.company || 'N/A'],
      ['Role', data.role || 'N/A'],
      ['Date', data.date ? new Date(data.date).toLocaleDateString() : 'N/A'],
      ['Duration', data.duration ? `${data.duration} min` : 'N/A'],
      ['Type', data.type || 'Technical'],
      ['Difficulty', data.difficulty || 'Medium'],
    ];

    info.forEach(([label, value]) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor('#555').text(value);
    });

    doc.moveDown();
  }

  _addScoreCards(doc, data) {
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Performance Scores');
    doc.moveDown(0.5);

    const scores = data.scores || {};
    const scoreItems = [
      { label: 'Overall Score', value: scores.overall || 0, color: this._scoreColor(scores.overall || 0) },
      { label: 'Technical', value: scores.technical || 0, color: this._scoreColor(scores.technical || 0) },
      { label: 'Communication', value: scores.communication || 0, color: this._scoreColor(scores.communication || 0) },
      { label: 'Problem Solving', value: scores.problemSolving || 0, color: this._scoreColor(scores.problemSolving || 0) },
      { label: 'Confidence', value: scores.confidence || 0, color: this._scoreColor(scores.confidence || 0) },
      { label: 'Completeness', value: scores.completeness || 0, color: this._scoreColor(scores.completeness || 0) },
    ];

    const colWidth = 85;
    const startX = 50;
    scoreItems.forEach((item, i) => {
      const x = startX + (i % 3) * (colWidth + 15);
      const y = doc.y + Math.floor(i / 3) * 45;

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(item.label, x, y);
      doc.fontSize(20).font('Helvetica-Bold').fillColor(item.color).text(`${item.value}%`, x, y + 20);
    });

    doc.moveDown(3);
  }

  _scoreColor(score) {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#f57f17';
    return '#c62828';
  }

  _addQuestionAnalysis(doc, data) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Question-by-Question Analysis');
    doc.moveDown(0.5);

    const questions = data.questions || [];
    questions.forEach((q, idx) => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a2e').text(`Q${idx + 1}: ${q.question}`);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica').fillColor('#333').text(`Answer: ${q.answer || 'No answer provided'}`);
      doc.moveDown(0.3);

      const scoreLine = `Technical: ${q.technicalScore || 0}% | Communication: ${q.communicationScore || 0}% | Relevance: ${q.relevanceScore || 0}%`;
      doc.fontSize(9).font('Helvetica').fillColor('#666').text(scoreLine);

      if (q.missingConcepts && q.missingConcepts.length) {
        doc.fontSize(9).font('Helvetica-Oblique').fillColor('#c62828').text(`Missing: ${q.missingConcepts.join(', ')}`);
      }

      doc.moveDown(0.8);
    });
  }

  _addRecommendations(doc, data) {
    doc.moveDown();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Strengths & Areas for Improvement');
    doc.moveDown(0.5);

    const sections = [
      { title: 'Strengths', items: data.strengths || [], color: '#2e7d32' },
      { title: 'Areas to Improve', items: data.improvements || [], color: '#c62828' },
      { title: 'Recommendations', items: data.recommendations || [], color: '#1565c0' },
    ];

    sections.forEach(section => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor(section.color).text(section.title);
      doc.moveDown(0.3);
      section.items.forEach(item => {
        doc.fontSize(10).font('Helvetica').fillColor('#333').text(`• ${item}`);
      });
      doc.moveDown(0.5);
    });
  }

  _addImprovementRoadmap(doc, data) {
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text('Personalized Improvement Roadmap');
    doc.moveDown(0.5);

    const roadmap = data.roadmap || [];
    roadmap.forEach(week => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a2e').text(`Week ${week.week}: ${week.topic}`);
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text(`Focus: `, { continued: true });
      doc.font('Helvetica').text(week.focus);

      if (week.actionItems && week.actionItems.length) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Action Items:');
        week.actionItems.forEach(item => {
          doc.fontSize(9).font('Helvetica').fillColor('#555').text(`  • ${item}`);
        });
      }

      if (week.resources && week.resources.length) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333').text('Resources:');
        week.resources.forEach(res => {
          doc.fontSize(9).font('Helvetica').fillColor('#555').text(`  • ${res}`);
        });
      }

      doc.moveDown(0.8);
    });
  }

  _addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica').fillColor('#999')
        .text(`Generated by HireReady AI | Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 40, {
          align: 'center',
        });
    }
  }
}

module.exports = new PDFService();