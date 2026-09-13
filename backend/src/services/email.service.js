// Email Service - handles all email delivery using Nodemailer
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this._initTransporter();
  }

  _initTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('SMTP credentials not fully configured. Email service disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      pool: true,
      maxConnections: 5,
      rateLimit: 10,
    });
  }

  /**
   * Send interview report email to user
   */
  async sendInterviewReport(toEmail, reportData, pdfPath) {
    const defaultFrom = process.env.EMAIL_FROM || 'reports@hireready.com';

    const html = this._generateReportEmailHtml(reportData);

    const mailOptions = {
      from: defaultFrom,
      to: toEmail,
      subject: `Your HireReady Interview Report - ${reportData.company || 'Interview'}`,
      html,
      attachments: pdfPath ? [{
        filename: reportData.pdfFilename || 'InterviewReport.pdf',
        path: pdfPath,
      }] : [],
    };

    return this._sendMail(mailOptions);
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(toEmail, userData) {
    const defaultFrom = process.env.EMAIL_FROM || 'welcome@hireready.com';

    const html = this._generateWelcomeHtml(userData);

    const mailOptions = {
      from: defaultFrom,
      to: toEmail,
      subject: 'Welcome to HireReady! 🚀',
      html,
    };

    return this._sendMail(mailOptions);
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(toEmail, resetToken) {
    const defaultFrom = process.env.EMAIL_FROM || 'security@hireready.com';
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const html = this._generatePasswordResetHtml(resetUrl);

    const mailOptions = {
      from: defaultFrom,
      to: toEmail,
      subject: 'Password Reset Request',
      html,
    };

    return this._sendMail(mailOptions);
  }

  /**
   * Send email with retry logic
   */
  async _sendMail(mailOptions, retries = 1) {
    if (!this.transporter) {
      throw new Error('Email transporter not configured. SMTP credentials missing.');
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      if (retries > 0) {
        console.warn(`Email sending failed, retrying... (${retries} attempts left)`);
        return this._sendMail(mailOptions, retries - 1);
      }
      console.error('Email sending failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate HTML email template for interview report
   */
  _generateReportEmailHtml(data) {
    const scoreColor = (score) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#f59e0b';
      return '#ef4444';
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; }
    .card { background: #1e293b; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
    .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .score { display: inline-block; background: #0f172a; padding: 6px 14px; border-radius: 6px; font-weight: bold; }
    .btn { display: inline-block; padding: 10px 20px; border-radius: 6px; font-weight: 600; text-decoration: none; }
    .btn-download { background: #3b82f6; color: white; }
    .btn-dashboard { background: #64748b; color: white; margin-left: 10px; }
    .strength { color: #22c55e; }
    .weakness { color: #ef4444; }
    .footer { text-align: center; margin-top: 24px; color: #64748b; font-size: 12px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">HireReady</div>
        <h2 style="color: #cbd5e1; margin-top: 8px;">Interview Report</h2>
      </div>

      <p style="color: #cbd5e1;">Hello ${data.candidateName || 'Candidate'},</p>

      <p style="color: #94a3b8; line-height: 1.6;">
        Congratulations on completing your interview with <strong style="color: #3b82f6;">${data.company || 'the company'}</strong>
        for the role of <strong>${data.role || 'the position'}</strong>.
      </p>

      <p style="text-align: center; margin: 24px 0;">
        <span class="score" style="color: ${scoreColor(data.scores?.overall || 0)};">
          Overall Score: ${data.scores?.overall || 0}%
        </span>
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 6px 12px; color: #94a3b8;">Technical</td>
          <td style="padding: 6px 12px; color: ${scoreColor(data.scores?.technical || 0)}; font-weight: bold;">${data.scores?.technical || 0}%</td>
          <td style="padding: 6px 12px; color: #94a3b8;">Communication</td>
          <td style="padding: 6px 12px; color: ${scoreColor(data.scores?.communication || 0)}; font-weight: bold;">${data.scores?.communication || 0}%</td>
        </tr>
      </table>

      <div style="display: flex; gap: 20px; margin: 20px 0;">
        <div style="flex: 1;">
          <h3 class="strength" style="font-size: 16px;">Strengths</h3>
          <ul style="color: #94a3b8;">
            ${(data.strengths || []).map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div style="flex: 1;">
          <h3 class="weakness" style="font-size: 16px;">Areas to Improve</h3>
          <ul style="color: #94a3b8;">
            ${(data.improvements || []).map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>

      <p style="color: #94a3b8; line-height: 1.6;">
        <strong>Recommendations:</strong>
      </p>
      <ul style="color: #94a3b8; margin-top: 8px;">
        ${(data.recommendations || []).map(r => `<li>${r}</li>`).join('')}
      </ul>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reports/${data.reportId || ''}" class="btn btn-download">
          Download Full Report (PDF)
        </a>
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn btn-dashboard">
          View Dashboard
        </a>
      </div>

      <div class="footer">
        <p>This report was generated by HireReady AI.</p>
        <p>You can view and download this report anytime from your dashboard.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML email template for welcome
   */
  _generateWelcomeHtml(userData) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Welcome to HireReady</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #1e293b; border-radius: 12px; padding: 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; margin-bottom: 16px; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { color: #64748b; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">HireReady</div>
      <h2 style="color: #cbd5e1;">Welcome, ${userData.fullName || 'there'}!</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        Your account has been successfully created. Start preparing for your interviews with our AI-powered platform.
      </p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">Go to Dashboard</a>
      <div class="footer">
        <p>HireReady - Interview Preparation Platform</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate HTML email template for password reset
   */
  _generatePasswordResetHtml(resetUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #1e293b; border-radius: 12px; padding: 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #3b82f6; margin-bottom: 16px; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { color: #64748b; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">HireReady</div>
      <h2 style="color: #cbd5e1;">Password Reset Request</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        You requested a password reset. Click the button below to reset your password.
      </p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <div class="footer">
        <p style="color: #64748b; font-size: 12px;">This link expires in 1 hour.</p>
        <p style="color: #64748b; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

module.exports = new EmailService();