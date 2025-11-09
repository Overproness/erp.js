const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('ReviewResponse');

// Custom methods for review response management
methods.submitResponse = async (req, res) => {
  try {
    const owner = req.admin?._id || req.user?.companyOwner;
    
    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Authentication required',
      });
    }
    
    const { reviewId, responseText, isPublished } = req.body;
    
    // Create new review response
    const ReviewResponse = mongoose.model('ReviewResponse');
    const response = new ReviewResponse({
      review: reviewId,
      owner,
      createdBy: req.admin?._id || req.user?._id,
      responseText,
      isPublished: isPublished || false,
    });
    
    await response.save();
    
    // Update the review with the response reference
    await mongoose.model('Review').findByIdAndUpdate(reviewId, {
      $set: { response: response._id }
    });
    
    return res.status(201).json({
      success: true,
      result: response,
      message: 'Review response submitted successfully',
    });
  } catch (error) {
    console.error('Submit review response error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to submit review response',
      error: error.message,
    });
  }
};

module.exports = methods;
