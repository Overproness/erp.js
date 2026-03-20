// @ts-nocheck
const nodemailer = require('nodemailer');
const { loadSettings } = require('../middlewares/settings');

const sendMail = async (emailData, userId = null) => {
  try {
    const settings = await loadSettings(userId);

    // Create transporter using SMTP settings
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host || 'smtp.gmail.com',
      port: settings.smtp_port || 587,
      secure: settings.smtp_secure === 'true',
      auth: {
        user: settings.smtp_user || process.env.SMTP_USER,
        pass: settings.smtp_password || process.env.SMTP_PASSWORD,
      },
    });

    // Setup email data
    const mailOptions = {
      from: settings.smtp_from_email || process.env.SMTP_FROM_EMAIL,
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Send Mail Error:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

module.exports = sendMail;
