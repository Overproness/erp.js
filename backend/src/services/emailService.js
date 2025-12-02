const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { htmlToText } = require('html-to-text');
const config = require('@/config/notificationConfig');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host || process.env.EMAIL_HOST,
      port: config.email.port || process.env.EMAIL_PORT,
      secure: config.email.secure || process.env.EMAIL_SECURE === 'true',
      auth: {
        user: config.email.user || process.env.EMAIL_USER,
        pass: config.email.pass || process.env.EMAIL_PASS,
      },
    });

    this.templateDir = path.join(__dirname, '../../emailTemplate');
    this.defaultSender =
      config.email.defaultSender || process.env.DEFAULT_SENDER || 'noreply@reviewsystem.com';
  }

  /**
   * Send email using template
   * @param {String|Array} to - Recipient email(s)
   * @param {String} subject - Email subject
   * @param {String} templateName - Template name (without extension)
   * @param {Object} data - Data to inject into template
   * @param {Object} options - Additional options (cc, bcc, attachments)
   * @returns {Promise} Email sending result
   */
  async sendTemplateEmail(to, subject, templateName, data, options = {}) {
    try {
      // Ensure template exists
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Email template not found: ${templateName}`);
      }

      // Read and render template
      const template = fs.readFileSync(templatePath, 'utf8');
      const html = ejs.render(template, data);
      const text = htmlToText(html);

      // Setup email options
      const mailOptions = {
        from: options.sender || this.defaultSender,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html,
        text,
      };

      // Add optional fields if provided
      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;
      if (options.attachments) mailOptions.attachments = options.attachments;

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        recipient: to,
        template: templateName,
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  /**
   * Send review request email
   * @param {Object} customer - Customer information
   * @param {Object} business - Business information
   * @param {String} reviewLink - Review link URL
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendReviewRequest(customer, business, reviewLink, options = {}) {
    const data = {
      customerName: customer.name,
      businessName: business.name,
      businessLogo: business.branding?.logoUrl,
      primaryColor: business.branding?.primaryColor || '#4CAF50',
      secondaryColor: business.branding?.secondaryColor || '#2196F3',
      reviewLink,
      businessSignature: business.contact?.name || business.name,
      businessPosition: business.contact?.title || 'Owner',
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplateEmail(
      customer.email,
      options.subject || `${business.name} values your feedback!`,
      'reviewRequest',
      data,
      options
    );
  }

  /**
   * Send review thank you email
   * @param {Object} review - Review information
   * @param {Object} business - Business information
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendReviewThankYou(review, business, options = {}) {
    const data = {
      customerName: review.client.name,
      businessName: business.name,
      businessLogo: business.branding?.logoUrl,
      primaryColor: business.branding?.primaryColor || '#4CAF50',
      secondaryColor: business.branding?.secondaryColor || '#2196F3',
      rating: review.rating,
      reviewContent: review.comment,
      businessSignature: business.contact?.name || business.name,
      businessPosition: business.contact?.title || 'Owner',
      socialLinks: business.socialLinks,
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplateEmail(
      review.client.email,
      options.subject || `Thank you for your feedback, ${review.client.name}!`,
      'reviewThankYou',
      data,
      options
    );
  }

  /**
   * Send new review notification to business owner
   * @param {Object} review - Review information
   * @param {Object} business - Business information
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendReviewNotification(review, business, recipient, options = {}) {
    const data = {
      recipientName: recipient.name,
      businessName: business.name,
      customerName: review.client.name,
      rating: review.rating,
      reviewContent: review.comment,
      platform: review.platform,
      reviewDate: new Date(review.publishedAt).toLocaleString(),
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/reviews/${
        review._id
      }`,
      sentiment: review.sentiment?.category || 'neutral',
      isUrgent: review.rating <= 3,
      currentYear: new Date().getFullYear(),
    };

    // Determine template based on rating
    const template = review.rating <= 3 ? 'negativeReviewAlert' : 'reviewNotification';
    const subject =
      review.rating <= 3
        ? `Urgent: ${review.rating}-star review from ${review.client.name}`
        : `New ${review.rating}-star review from ${review.client.name}`;

    return this.sendTemplateEmail(
      recipient.email,
      options.subject || subject,
      template,
      data,
      options
    );
  }

  /**
   * Send response approval request to business owner
   * @param {Object} review - Review information
   * @param {Object} response - Response information
   * @param {Object} business - Business information
   * @param {Object} recipient - Recipient information
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendResponseApproval(review, response, business, recipient, options = {}) {
    const data = {
      recipientName: recipient.name,
      businessName: business.name,
      customerName: review.client.name,
      rating: review.rating,
      reviewContent: review.comment,
      platform: review.platform,
      responseText: response.responseText,
      approvalUrl: `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/dashboard/reviews/approval/${response._id}`,
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplateEmail(
      recipient.email,
      options.subject ||
        `Review Response Needs Approval: ${review.client.name}'s ${review.rating}-star review`,
      'reviewApproval',
      data,
      options
    );
  }

  /**
   * Send response sent notification to business owner
   * @param {Object} review - Review information
   * @param {Object} response - Response information
   * @param {Object} business - Business information
   * @param {Object} recipient - Recipient information
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendResponseSent(review, response, business, recipient, options = {}) {
    const data = {
      recipientName: recipient.name,
      businessName: business.name,
      customerName: review.client.name,
      rating: review.rating,
      platform: review.platform,
      responseText: response.responseText,
      responseDate: new Date(response.sentAt).toLocaleString(),
      reviewUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/reviews/${
        review._id
      }`,
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplateEmail(
      recipient.email,
      options.subject || `Response sent to ${review.client.name}'s review`,
      'responseSent',
      data,
      options
    );
  }

  /**
   * Send quote to customer
   * @param {Object} customer - Customer information
   * @param {Object} quote - Quote information
   * @param {Object} business - Business information
   * @param {Object} options - Additional options (attachments for PDF, etc.)
   * @returns {Promise} Email sending result
   */
  async sendQuote(customer, quote, business, options = {}) {
    const data = {
      customerName: customer.name || customer.company,
      businessName: business.name,
      businessLogo: business.branding?.logoUrl,
      primaryColor: business.branding?.primaryColor || '#4F46E5',
      secondaryColor: business.branding?.secondaryColor || '#7C3AED',
      quoteNumber: `${quote.year}-${quote.number}`,
      quoteDate: new Date(quote.date).toLocaleDateString(),
      expiryDate: new Date(quote.expiredDate).toLocaleDateString(),
      currency: quote.currency,
      subtotal: quote.subTotal,
      taxRate: quote.taxRate,
      taxTotal: quote.taxTotal,
      discount: quote.discount,
      total: quote.total,
      items: quote.items,
      notes: quote.notes,
      quoteUrl:
        options.quoteUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/quote/${quote._id}`,
      businessContact: business.contact || {
        email: business.email,
        phone: business.phone,
        address: business.address,
      },
      socialLinks: business.socialLinks,
      currentYear: new Date().getFullYear(),
    };

    return this.sendTemplateEmail(
      customer.email,
      options.subject || `Quote #${quote.year}-${quote.number} from ${business.name}`,
      'quoteNotification',
      data,
      options
    );
  }

  /**
   * Send quote reminder to customer
   * @param {Object} customer - Customer information
   * @param {Object} quote - Quote information
   * @param {Object} business - Business information
   * @param {Object} options - Additional options
   * @returns {Promise} Email sending result
   */
  async sendQuoteReminder(customer, quote, business, options = {}) {
    const daysLeft = Math.ceil((new Date(quote.expiredDate) - new Date()) / (1000 * 60 * 60 * 24));

    const data = {
      customerName: customer.name || customer.company,
      businessName: business.name,
      businessLogo: business.branding?.logoUrl,
      primaryColor: business.branding?.primaryColor || '#4F46E5',
      secondaryColor: business.branding?.secondaryColor || '#7C3AED',
      quoteNumber: `${quote.year}-${quote.number}`,
      quoteDate: new Date(quote.date).toLocaleDateString(),
      expiryDate: new Date(quote.expiredDate).toLocaleDateString(),
      daysLeft,
      currency: quote.currency,
      total: quote.total,
      quoteUrl:
        options.quoteUrl ||
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/quote/${quote._id}`,
      businessContact: business.contact || {
        email: business.email,
        phone: business.phone,
      },
      currentYear: new Date().getFullYear(),
    };

    const subject =
      daysLeft <= 3
        ? `⏰ Urgent: Quote #${quote.year}-${quote.number} expires in ${daysLeft} day${
            daysLeft !== 1 ? 's' : ''
          }!`
        : `Reminder: Quote #${quote.year}-${quote.number} from ${business.name}`;

    return this.sendTemplateEmail(
      customer.email,
      options.subject || subject,
      'quoteNotification',
      data,
      options
    );
  }

  /**
   * Test email configuration
   * @returns {Promise<Object>} Test result
   */
  async testEmailConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, message: 'Email configuration is invalid', error: error.message };
    }
  }
}

module.exports = new EmailService();
