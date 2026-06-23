// @ts-nocheck
const mongoose = require('mongoose');

const ReviewResponse = mongoose.model('ReviewResponse');
const ReviewTemplate = mongoose.model('ReviewTemplate');
const Review = mongoose.model('Review');
const Business = mongoose.model('Business');

const getNotificationService = () => require('../../services/notificationService').notificationService;
const getAutoResponseService = () => {
  const serviceModule = require('../../services/autoResponseService');
  return serviceModule.autoResponseService || serviceModule;
};

/**
 * Create a response to a review
 */
const create = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      reviewId,
      responseText,
      status = 'pending',
      templateId = null
    } = req.body;

    if (!reviewId || !responseText) {
      return res.status(400).json({
        success: false,
        message: 'Review ID and response text are required',
        result: null
      });
    }

    // Check if review exists and belongs to owner
    const review = await Review.findOne({
      _id: reviewId,
      owner: ownerId
    }).populate('business');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        result: null
      });
    }

    // Check if a response already exists
    const existingResponse = await ReviewResponse.findOne({
      review: reviewId,
      removed: false
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'A response already exists for this review',
        result: null
      });
    }

    // Get template if provided
    let template = null;
    if (templateId) {
      template = await ReviewTemplate.findOne({
        _id: templateId,
        owner: ownerId
      });
    }

    // Create response
    const response = new ReviewResponse({
      owner: ownerId,
      business: review.business._id,
      review: reviewId,
      template: templateId,
      responseText,
      status,
      respondent: req.user ? req.user._id : ownerId,
      createdAt: new Date()
    });

    await response.save();

    // If response is approved, update the review
    if (status === 'approved') {
      review.response = {
        text: responseText,
        respondedAt: new Date(),
        status: 'responded'
      };
      await review.save();
    }

    // Send notification if needed
    if (status === 'pending' && req.user && req.user._id !== ownerId) {
      // Notify owner that a response needs approval
      const notificationService = getNotificationService();
      await notificationService.notifyReviewApproval(response._id, false, ownerId);
    }

    return res.status(201).json({
      success: true,
      message: 'Response created successfully',
      result: response
    });
  } catch (error) {
    console.error('Response creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create response',
      error: error.message
    });
  }
};

/**
 * Get a specific response
 */
const read = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const response = await ReviewResponse.findOne({
      _id: id,
      owner: ownerId,
      removed: false
    }).populate('review template business');

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Response retrieved successfully',
      result: response
    });
  } catch (error) {
    console.error('Response retrieval error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve response',
      error: error.message
    });
  }
};

/**
 * Update a response
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const {
      responseText,
      status,
      notes
    } = req.body;

    const response = await ReviewResponse.findOne({
      _id: id,
      owner: ownerId,
      removed: false
    }).populate('review');

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null
      });
    }

    // Update allowed fields
    if (responseText) response.responseText = responseText;
    if (status) response.status = status;
    if (notes) response.notes = notes;

    response.updatedAt = new Date();
    await response.save();

    // If response is approved, update the review
    if (status === 'approved' && response.review) {
      const review = response.review;
      review.response = {
        text: response.responseText,
        respondedAt: new Date(),
        status: 'responded'
      };
      await review.save();

      // Send notification to team member who created the response
      if (response.respondent && response.respondent.toString() !== ownerId.toString()) {
        const notificationService = getNotificationService();
        await notificationService.notifyReviewApproval(response._id, true, response.respondent);
      }
    } else if (status === 'rejected' && response.respondent && response.respondent.toString() !== ownerId.toString()) {
      // Notify respondent of rejection
      const notificationService = getNotificationService();
      await notificationService.notifyReviewApproval(response._id, false, response.respondent);
    }

    return res.status(200).json({
      success: true,
      message: 'Response updated successfully',
      result: response
    });
  } catch (error) {
    console.error('Response update error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update response',
      error: error.message
    });
  }
};

/**
 * Delete a response (soft delete)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const response = await ReviewResponse.findOne({
      _id: id,
      owner: ownerId
    }).populate('review');

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null
      });
    }

    // If this response was applied to the review, remove it
    if (response.status === 'approved' && response.review) {
      const review = response.review;
      review.response = null;
      await review.save();
    }

    response.removed = true;
    response.removedAt = new Date();
    await response.save();

    return res.status(200).json({
      success: true,
      message: 'Response deleted successfully',
      result: null
    });
  } catch (error) {
    console.error('Response deletion error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete response',
      error: error.message
    });
  }
};

/**
 * List responses
 */
const list = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 20,
      businessId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      reviewId
    } = req.query;

    // Build filter
    const filter = {
      owner: ownerId,
      removed: false
    };

    if (businessId) filter.business = businessId;
    if (status) filter.status = status;
    if (reviewId) filter.review = reviewId;

    // Set up pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [responses, total] = await Promise.all([
      ReviewResponse.find(filter)
        .populate('review business template respondent')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      ReviewResponse.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Responses retrieved successfully',
      result: {
        data: responses,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Response listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve responses',
      error: error.message
    });
  }
};

/**
 * Create or manage response templates
 */
const createTemplate = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      businessId,
      name,
      templateText,
      sentimentType, // 'positive', 'neutral', 'negative'
      isDefault = false,
      platform = 'all',
      variables = []
    } = req.body;

    if (!businessId || !name || !templateText) {
      return res.status(400).json({
        success: false,
        message: 'Business ID, name and template text are required',
        result: null
      });
    }

    // Verify business exists and belongs to owner
    const business = await Business.findOne({
      _id: businessId,
      owner: ownerId
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        result: null
      });
    }

    // If set as default, remove default flag from other templates of same type
    if (isDefault) {
      await ReviewTemplate.updateMany(
        { 
          owner: ownerId,
          business: businessId,
          sentimentType,
          platform,
          isDefault: true
        },
        { isDefault: false }
      );
    }

    // Create template
    const template = new ReviewTemplate({
      owner: ownerId,
      business: businessId,
      name,
      templateText,
      sentimentType: sentimentType || 'all',
      isDefault,
      platform,
      variables,
      createdAt: new Date()
    });

    await template.save();

    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      result: template
    });
  } catch (error) {
    console.error('Template creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * List templates
 */
const listTemplates = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const {
      page = 1,
      limit = 20,
      businessId,
      sentimentType,
      platform,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter
    const filter = {
      owner: ownerId,
      removed: false
    };

    if (businessId) filter.business = businessId;
    if (sentimentType) filter.sentimentType = sentimentType;
    if (platform) filter.platform = platform;

    // Set up pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [templates, total] = await Promise.all([
      ReviewTemplate.find(filter)
        .populate('business')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      ReviewTemplate.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Templates retrieved successfully',
      result: {
        data: templates,
        pagination: {
          total,
          page: Number(page),
          pageSize: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Template listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve templates',
      error: error.message
    });
  }
};

/**
 * Generate auto-response for a review
 */
const generateAutoResponse = async (req, res) => {
  try {
    const ownerId = req.admin._id;
    const { reviewId } = req.body;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required',
        result: null
      });
    }

    // Check if review exists and belongs to owner
    const review = await Review.findOne({
      _id: reviewId,
      owner: ownerId
    }).populate('business');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
        result: null
      });
    }

    // Check if a response already exists
    const existingResponse = await ReviewResponse.findOne({
      review: reviewId,
      removed: false
    });

    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'A response already exists for this review',
        result: null
      });
    }

    // Generate response using the auto-response service
    const autoResponseService = getAutoResponseService();
    const autoResponse = await autoResponseService.generateResponse(review);

    // Create response entity but don't save it yet (preview mode)
    const response = {
      review: reviewId,
      business: review.business._id,
      responseText: autoResponse.responseText,
      template: autoResponse.templateId || null,
      autoGenerated: true,
      generatedAt: new Date()
    };

    return res.status(200).json({
      success: true,
      message: 'Auto-response generated successfully',
      result: {
        response,
        template: autoResponse.template || null,
        variables: autoResponse.variables || {},
        sentimentType: review.sentiment?.label || 'neutral'
      }
    });
  } catch (error) {
    console.error('Auto-response generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate auto-response',
      error: error.message
    });
  }
};

module.exports = {
  create,
  read,
  update,
  delete: remove,
  list,
  createTemplate,
  listTemplates,
  generateAutoResponse
};
