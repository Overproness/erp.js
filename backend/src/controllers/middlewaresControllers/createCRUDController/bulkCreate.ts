// @ts-nocheck
const bulkCreate = async (Model, req, res) => {
  try {
    // Get owner and user from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);
    const createdBy = (req.user && req.user._id) || (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Items array is required and must not be empty',
      });
    }

    // Set owner and other tracking fields for all items, with sanitization
    const documentsToCreate = items.map((item) => {
      const sanitizedItem = { ...item };

      // Sanitize string fields
      Object.keys(sanitizedItem).forEach((key) => {
        if (typeof sanitizedItem[key] === 'string') {
          sanitizedItem[key] = sanitizedItem[key].trim();
          if (key === 'email') {
            sanitizedItem[key] = sanitizedItem[key].toLowerCase();
          }
          // Basic XSS prevention (safe regex)
          sanitizedItem[key] = sanitizedItem[key].replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            ''
          );
        }
      });

      return {
        ...sanitizedItem,
        owner,
        createdBy,
        removed: false,
      };
    });

    const result = await Model.insertMany(documentsToCreate);

    // Convert results to plain objects and ensure owner is ID
    const processedResult = result.map((doc) => {
      const plainDoc = doc.toObject();
      if (plainDoc.owner && typeof plainDoc.owner === 'object') {
        plainDoc.owner = plainDoc.owner._id || plainDoc.owner;
      }
      return plainDoc;
    });

    return res.status(201).json({
      success: true,
      result: processedResult,
      message: `Successfully created ${result.length} documents`,
    });
  } catch (error) {
    // Handle different types of errors
    let status = 500;
    const errorResponse = {
      success: false,
      result: null,
      message: error.message,
    };

    // Handle validation errors
    if (error.name === 'ValidationError') {
      status = 400;
      errorResponse.errors = error.errors;
    }
    // Handle duplicate key errors (MongoDB code 11000)
    else if (error.code === 11000 || error.name === 'MongoServerError') {
      status = 400;
      errorResponse.message = error.message.includes('duplicate')
        ? error.message
        : 'Duplicate key error - this value already exists';
    }

    return res.status(status).json(errorResponse);
  }
};

module.exports = bulkCreate;
