import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to make the current request context available to settings loader
 */
const settingsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store the request object in a global variable
  // so that setting loaders can access the current companyOwner user
  (global as any).req = req;
  
  next();
};

module.exports = settingsMiddleware;
