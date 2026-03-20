import type { Request, Response } from 'express';
const crmUrlService = require('@/services/crmUrlService');

/**
 * Generate customer portal URL
 */
const generatePortalUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const options = {
      userId: req.user?._id,
      ...req.body,
    };

    const urlData = await crmUrlService.generateCustomerPortalUrl(id, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Customer portal URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating portal URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate payment request URL
 */
const generatePaymentUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentData, ...options } = req.body;

    if (!paymentData || !paymentData.amount) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Payment data with amount is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generatePaymentRequestUrl(id, paymentData, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Payment request URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating payment URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate document share URL
 */
const generateDocumentUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { documentId, ...options } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Document ID is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generateDocumentShareUrl(id, documentId, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Document share URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating document URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate appointment scheduling URL
 */
const generateAppointmentUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const options = {
      userId: req.user?._id,
      ...req.body,
    };

    const urlData = await crmUrlService.generateAppointmentSchedulingUrl(id, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Appointment scheduling URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating appointment URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate survey URL
 */
const generateSurveyUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { surveyId, ...options } = req.body;

    if (!surveyId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Survey ID is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generateSurveyUrl(id, surveyId, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Survey URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating survey URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate review request URL
 */
const generateReviewUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const options = {
      userId: req.user?._id,
      ...req.body,
    };

    const urlData = await crmUrlService.generateReviewRequestUrl(id, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Review request URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating review URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate quote acceptance URL
 */
const generateQuoteUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quoteId, ...options } = req.body;

    if (!quoteId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Quote ID is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generateQuoteAcceptanceUrl(id, quoteId, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Quote URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating quote URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate invoice payment URL
 */
const generateInvoiceUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { invoiceId, ...options } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invoice ID is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generateInvoicePaymentUrl(id, invoiceId, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Invoice payment URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating invoice URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate event registration URL
 */
const generateEventUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { eventId, ...options } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Event ID is required',
      });
    }

    options.userId = req.user?._id;
    const urlData = await crmUrlService.generateEventRegistrationUrl(id, eventId, options);

    return res.status(200).json({
      success: true,
      result: urlData,
      message: 'Event registration URL generated successfully',
    });
  } catch (error) {
    console.error('Error generating event URL:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Get all URLs for a customer
 */
const getCustomerUrls = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const filters = {
      type: req.query.type,
      isActive: req.query.isActive === 'true',
      limit: parseInt(req.query.limit as string) || 50,
    };

    const urls = await crmUrlService.getCustomerUrls(id, filters);

    return res.status(200).json({
      success: true,
      result: urls,
      message: 'Customer URLs retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting customer URLs:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Generate bulk URLs for multiple customers
 */
const generateBulkUrls = async (req: Request, res: Response) => {
  try {
    const { customerIds, urlType, options } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Customer IDs array is required',
      });
    }

    if (!urlType) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'URL type is required',
      });
    }

    const enrichedOptions = {
      userId: req.user?._id,
      ...options,
    };

    const results = await crmUrlService.generateBulkUrls(customerIds, urlType, enrichedOptions);

    const successCount = results.filter((r: any) => r.success).length;
    const failCount = results.filter((r: any) => !r.success).length;

    return res.status(200).json({
      success: true,
      result: results,
      message: `Bulk URL generation completed: ${successCount} successful, ${failCount} failed`,
    });
  } catch (error) {
    console.error('Error generating bulk URLs:', error);
    return res.status(400).json({
      success: false,
      result: null,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

module.exports = {
  generatePortalUrl,
  generatePaymentUrl,
  generateDocumentUrl,
  generateAppointmentUrl,
  generateSurveyUrl,
  generateReviewUrl,
  generateQuoteUrl,
  generateInvoiceUrl,
  generateEventUrl,
  getCustomerUrls,
  generateBulkUrls,
};
