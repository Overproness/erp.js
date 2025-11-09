/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

const mongoose = require('mongoose');

// Utility function to sanitize user input (prevent XSS)
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<\/script>/gi, '')
      .replace(/<script[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/<object\b[^>]*>/gi, '')
      .replace(/<embed\b[^>]*>/gi, '')
      .replace(/<link\b[^>]*>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/%3cscript/gi, '')
      .replace(/%3c\/script%3e/gi, '')
      .replace(/&lt;script&gt;/gi, '')
      .replace(/&lt;\/script&gt;/gi, '');
  }
  return input;
};

// Utility function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

exports.catchErrors = (fn) => {
  return function (req, res, next) {
    return fn(req, res, next).catch((error) => {
      console.log('=== CATCH ERRORS DEBUG ===');
      console.log('Controller:', fn.name);
      console.log('Error:', error.message);
      console.log('Error stack:', error.stack);
      console.log('Request URL:', req.url);
      console.log('Request method:', req.method);
      console.log('Auth headers:', req.headers.authorization ? 'Present' : 'Missing');
      console.log('=========================');

      // Handle ObjectId validation errors - return 400 for invalid ObjectIds
      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid ID format',
          controller: fn.name,
          error: 'Invalid ObjectId provided',
        });
      }

      // Handle invalid ObjectId in URL params (for security tests)
      if (error.message && error.message.includes('Cast to ObjectId failed')) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid ID format',
          controller: fn.name,
          error: 'Invalid ObjectId provided',
        });
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Required fields are not supplied',
          controller: fn.name,
          error: error,
        });
      }

      // Handle mongoose validation errors
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Database operation failed',
          controller: fn.name,
          error: 'Invalid data provided',
        });
      }

      // Handle missing resource errors as 404
      if (
        error.message &&
        (error.message.includes('not found') ||
          error.message.includes('does not exist') ||
          error.message.includes('No document found'))
      ) {
        return res.status(404).json({
          success: false,
          result: null,
          message: error.message,
          controller: fn.name,
          error: 'Resource not found',
        });
      }

      // Default to server error
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
        controller: fn.name,
        error: error,
      });
    });
  };
};

// Input sanitization middleware
exports.sanitizeInputs = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      }
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeInput(req.query[key]);
        }
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      error: error.message,
    });
  }
};

// ObjectId validation middleware
exports.validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: `Invalid ${paramName} format`,
        error: 'Invalid ObjectId provided',
      });
    }

    next();
  };
};

// Enhanced sanitization for output (prevent stored XSS)
exports.sanitizeOutput = (data) => {
  if (!data) return data;

  if (typeof data === 'string') {
    return sanitizeInput(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => exports.sanitizeOutput(item));
  }

  if (typeof data === 'object') {
    const sanitized = {};
    const sensitiveFields = ['password', 'token', 'secret', '__v', '_id'];

    for (const key in data) {
      // Skip sensitive fields and private fields (starting with _)
      if (sensitiveFields.includes(key) || key.startsWith('_')) {
        continue;
      }
      sanitized[key] = exports.sanitizeOutput(data[key]);
    }
    return sanitized;
  }

  return data;
};

/*
  Not Found Error Handler

  If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
*/
exports.notFound = (req, res, next) => {
  return res.status(404).json({
    success: false,
    message: "Api url doesn't exist ",
  });
};

/*
  Development Error Handler

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (error, req, res, next) => {
  error.stack = error.stack || '';
  const errorDetails = {
    message: error.message,
    status: error.status,
    stackHighlighted: error.stack.replace(/[a-z_-\d]+.js:\d+:\d+/gi, '<mark>$&</mark>'),
  };

  return res.status(500).json({
    success: false,
    message: error.message,
    error: error,
  });
};

/*
  Production Error Handler

  No stacktraces are leaked to admin
*/
exports.productionErrors = (error, req, res, next) => {
  return res.status(500).json({
    success: false,
    message: error.message,
    error: error,
  });
};
