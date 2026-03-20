import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

const sanitizeInput = (input: string): string => {
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
};

const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
};

export const catchErrors = (fn: Function) => {
  return function (req: Request, res: Response, next: NextFunction) {
    return fn(req, res, next).catch((error: any) => {
      console.log('=== CATCH ERRORS DEBUG ===');
      console.log('Controller:', fn.name);
      console.log('Error:', error.message);
      console.log('Error stack:', error.stack);
      console.log('Request URL:', req.url);
      console.log('Request method:', req.method);
      console.log('Auth headers:', req.headers.authorization ? 'Present' : 'Missing');
      console.log('=========================');

      if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid ID format',
          controller: fn.name,
          error: 'Invalid ObjectId provided',
        });
      }

      if (error.message && error.message.includes('Cast to ObjectId failed')) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid ID format',
          controller: fn.name,
          error: 'Invalid ObjectId provided',
        });
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Required fields are not supplied',
          controller: fn.name,
          error: error,
        });
      }

      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Database operation failed',
          controller: fn.name,
          error: 'Invalid data provided',
        });
      }

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

export const sanitizeInputs = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      }
    }

    if (req.query && typeof req.query === 'object') {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          (req.query as any)[key] = sanitizeInput(req.query[key] as string);
        }
      }
    }

    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Invalid input detected',
      error: error.message,
    });
  }
};

export const validateObjectId = (paramName = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName] as string | undefined;

    if (id && !isValidObjectId(id as string)) {
      res.status(400).json({
        success: false,
        result: null,
        message: `Invalid ${paramName} format`,
        error: 'Invalid ObjectId provided',
      });
      return;
    }

    next();
  };
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    result: null,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const productionErrors = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(err.status || 500).json({
    success: false,
    result: null,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined,
  });
};

export const sanitizeOutput = (data: any): any => {
  if (!data) return data;

  if (typeof data === 'string') {
    return sanitizeInput(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeOutput(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};
    const sensitiveFields = ['password', 'token', 'secret', '__v', '_id'];

    for (const key in data) {
      if (sensitiveFields.includes(key) || key.startsWith('_')) {
        continue;
      }
      sanitized[key] = sanitizeOutput(data[key]);
    }
    return sanitized;
  }

  return data;
};
