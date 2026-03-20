// @ts-nocheck
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const puppeteer = require('puppeteer');
const Excel = require('exceljs');
const { platformUtils } = require('./platformUtils');

/**
 * Review export utility
 * Handles exporting reviews to CSV, Excel, and PDF formats
 */

/**
 * Format date for export
 * @param {Date|String} date - Date to format
 * @param {String} format - Output format ('ISO', 'short', 'long')
 * @returns {String} Formatted date string
 */
const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  switch (format) {
    case 'ISO':
      return dateObj.toISOString();
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'short':
    default:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
};

/**
 * Prepare reviews for export
 * @param {Array} reviews - Array of review objects
 * @returns {Array} Formatted review data for export
 */
const prepareReviewsForExport = (reviews) => {
  if (!reviews || !Array.isArray(reviews)) return [];
  
  return reviews.map(review => ({
    id: review._id?.toString() || review.id,
    platform: review.platform,
    platformName: platformUtils.getPlatformDisplayName(review.platform),
    rating: review.rating,
    date: formatDate(review.publishedAt || review.createdAt, 'short'),
    dateISO: formatDate(review.publishedAt || review.createdAt, 'ISO'),
    clientName: review.client?.name || 'Anonymous',
    title: review.title || '',
    comment: review.comment || '',
    sentiment: review.sentiment?.category || 'unknown',
    sentimentScore: review.sentiment?.score || 0,
    hasResponse: review.response ? 'Yes' : 'No',
    responseDate: review.response ? formatDate(review.response.sentAt, 'short') : '',
    responseText: review.response?.responseText || ''
  }));
};

/**
 * Export reviews to CSV format
 * @param {Array} reviews - Array of review objects
 * @param {Object} options - Export options
 * @returns {String} CSV content
 */
const exportToCSV = (reviews, options = {}) => {
  const {
    fields = [
      'id', 'platform', 'rating', 'date', 'clientName',
      'title', 'comment', 'sentiment', 'hasResponse', 'responseText'
    ],
    includeHeader = true
  } = options;
  
  // Prepare data
  const data = prepareReviewsForExport(reviews);
  
  // Set up CSV parser options
  const parserOptions = {
    fields,
    header: includeHeader
  };
  
  // Generate CSV
  try {
    const parser = new Parser(parserOptions);
    return parser.parse(data);
  } catch (error) {
    console.error('Error exporting reviews to CSV:', error);
    throw error;
  }
};

/**
 * Export reviews to Excel format
 * @param {Array} reviews - Array of review objects
 * @param {Object} options - Export options
 * @returns {Buffer} Excel file buffer
 */
const exportToExcel = async (reviews, options = {}) => {
  const {
    sheetName = 'Reviews',
    includeAnalytics = true
  } = options;
  
  // Prepare data
  const data = prepareReviewsForExport(reviews);
  
  // Create workbook and sheet
  const workbook = new Excel.Workbook();
  workbook.creator = 'Reputation Management System';
  workbook.created = new Date();
  
  // Add main reviews sheet
  const reviewsSheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: '4472C4' } }
  });
  
  // Define columns
  reviewsSheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Platform', key: 'platformName', width: 15 },
    { header: 'Rating', key: 'rating', width: 8 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Client', key: 'clientName', width: 20 },
    { header: 'Title', key: 'title', width: 25 },
    { header: 'Comment', key: 'comment', width: 50 },
    { header: 'Sentiment', key: 'sentiment', width: 12 },
    { header: 'Response', key: 'hasResponse', width: 10 },
    { header: 'Response Date', key: 'responseDate', width: 12 },
    { header: 'Response Text', key: 'responseText', width: 50 }
  ];
  
  // Style header row
  const headerRow = reviewsSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' },
    bgColor: { argb: 'FFFFFF' }
  };
  headerRow.font = { color: { argb: 'FFFFFF' }, bold: true };
  
  // Add data
  reviewsSheet.addRows(data);
  
  // Add analytics sheet if requested
  if (includeAnalytics && reviews.length > 0) {
    const analyticsUtils = require('./analyticsUtils');
    
    const analyticsSheet = workbook.addWorksheet('Analytics', {
      properties: { tabColor: { argb: '70AD47' } }
    });
    
    // Calculate summary metrics
    const summary = analyticsUtils.generateReviewSummary(reviews);
    
    // Add summary section
    analyticsSheet.mergeCells('A1:B1');
    const titleCell = analyticsSheet.getCell('A1');
    titleCell.value = 'Review Summary';
    titleCell.font = { size: 14, bold: true };
    
    // Add key metrics
    analyticsSheet.getCell('A3').value = 'Total Reviews';
    analyticsSheet.getCell('B3').value = summary.totalReviews;
    
    analyticsSheet.getCell('A4').value = 'Average Rating';
    analyticsSheet.getCell('B4').value = summary.averageRating;
    
    analyticsSheet.getCell('A5').value = 'Response Rate';
    analyticsSheet.getCell('B5').value = `${summary.responseRate}%`;
    
    analyticsSheet.getCell('A6').value = 'Performance Score';
    analyticsSheet.getCell('B6').value = summary.performanceScore;
    
    // Add rating distribution
    analyticsSheet.mergeCells('A8:B8');
    const ratingTitle = analyticsSheet.getCell('A8');
    ratingTitle.value = 'Rating Distribution';
    ratingTitle.font = { size: 12, bold: true };
    
    analyticsSheet.getCell('A9').value = '5 Stars';
    analyticsSheet.getCell('B9').value = summary.ratingDistribution[5];
    
    analyticsSheet.getCell('A10').value = '4 Stars';
    analyticsSheet.getCell('B10').value = summary.ratingDistribution[4];
    
    analyticsSheet.getCell('A11').value = '3 Stars';
    analyticsSheet.getCell('B11').value = summary.ratingDistribution[3];
    
    analyticsSheet.getCell('A12').value = '2 Stars';
    analyticsSheet.getCell('B12').value = summary.ratingDistribution[2];
    
    analyticsSheet.getCell('A13').value = '1 Star';
    analyticsSheet.getCell('B13').value = summary.ratingDistribution[1];
    
    // Add sentiment distribution
    analyticsSheet.mergeCells('A15:B15');
    const sentimentTitle = analyticsSheet.getCell('A15');
    sentimentTitle.value = 'Sentiment Distribution';
    sentimentTitle.font = { size: 12, bold: true };
    
    analyticsSheet.getCell('A16').value = 'Positive';
    analyticsSheet.getCell('B16').value = summary.sentimentDistribution.positive;
    
    analyticsSheet.getCell('A17').value = 'Neutral';
    analyticsSheet.getCell('B17').value = summary.sentimentDistribution.neutral;
    
    analyticsSheet.getCell('A18').value = 'Negative';
    analyticsSheet.getCell('B18').value = summary.sentimentDistribution.negative;
    
    // Set column widths
    analyticsSheet.getColumn('A').width = 20;
    analyticsSheet.getColumn('B').width = 15;
  }
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer();
};

/**
 * Generate HTML for PDF export
 * @param {Array} reviews - Array of review objects
 * @param {Object} businessInfo - Business information
 * @returns {String} HTML content
 */
const generateHtmlForPdf = (reviews, businessInfo) => {
  const formattedReviews = prepareReviewsForExport(reviews);
  
  // Generate review HTML
  const reviewsHtml = formattedReviews.map(review => `
    <div class="review">
      <div class="review-header">
        <div class="rating">
          ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
          <span class="platform">${review.platformName}</span>
        </div>
        <div class="client">${review.clientName}</div>
        <div class="date">${review.date}</div>
      </div>
      ${review.title ? `<h4 class="review-title">${review.title}</h4>` : ''}
      <div class="review-content">${review.comment}</div>
      ${review.hasResponse === 'Yes' ? `
        <div class="response">
          <div class="response-header">
            <strong>Response</strong>
            <span class="response-date">${review.responseDate}</span>
          </div>
          <div class="response-content">${review.responseText}</div>
        </div>
      ` : ''}
    </div>
  `).join('');
  
  // Calculate summary metrics
  const analyticsUtils = require('./analyticsUtils');
  const summary = analyticsUtils.generateReviewSummary(reviews);
  
  // Generate HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Review Report - ${businessInfo.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 10px;
          border-bottom: 1px solid #ddd;
        }
        .business-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .report-title {
          font-size: 18px;
          color: #666;
        }
        .report-date {
          font-size: 14px;
          color: #999;
          margin-top: 5px;
        }
        .summary {
          margin-bottom: 30px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .summary-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        .summary-label {
          font-size: 13px;
          color: #666;
        }
        .summary-value {
          font-size: 18px;
          font-weight: bold;
        }
        .review {
          margin-bottom: 25px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .rating {
          font-size: 16px;
          color: #f8ce0b;
        }
        .platform {
          font-size: 12px;
          color: #666;
          margin-left: 5px;
        }
        .client {
          font-weight: bold;
        }
        .date {
          color: #666;
          font-size: 12px;
        }
        .review-title {
          margin: 0 0 5px 0;
        }
        .review-content {
          line-height: 1.4;
          margin-bottom: 15px;
          white-space: pre-wrap;
        }
        .response {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
        }
        .response-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .response-date {
          font-size: 12px;
          color: #666;
        }
        .response-content {
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="business-name">${businessInfo.name}</div>
        <div class="report-title">Review Report</div>
        <div class="report-date">Generated on ${new Date().toLocaleDateString()}</div>
      </div>
      
      <div class="summary">
        <div class="summary-title">Review Summary</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Reviews</div>
            <div class="summary-value">${summary.totalReviews}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Rating</div>
            <div class="summary-value">${summary.averageRating} / 5.0</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Response Rate</div>
            <div class="summary-value">${summary.responseRate}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Performance Score</div>
            <div class="summary-value">${summary.performanceScore} / 100</div>
          </div>
        </div>
      </div>
      
      <div class="reviews">
        ${reviewsHtml}
      </div>
    </body>
    </html>
  `;
};

/**
 * Export reviews to PDF format
 * @param {Array} reviews - Array of review objects
 * @param {Object} options - Export options
 * @returns {Buffer} PDF file buffer
 */
const exportToPDF = async (reviews, options = {}) => {
  const {
    businessInfo = { name: 'Business Name' },
    pageSize = 'A4',
    margin = { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
  } = options;
  
  try {
    // Generate HTML content
    const html = generateHtmlForPdf(reviews, businessInfo);
    
    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: pageSize,
      printBackground: true,
      margin: margin
    });
    
    await browser.close();
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error exporting reviews to PDF:', error);
    throw error;
  }
};

/**
 * Save exported file
 * @param {Buffer|String} content - File content
 * @param {String} filePath - Output file path
 * @returns {Promise<Boolean>} Success status
 */
const saveExportFile = (content, filePath) => {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(true);
    });
  });
};

module.exports = {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  prepareReviewsForExport,
  saveExportFile,
  formatDate
};
