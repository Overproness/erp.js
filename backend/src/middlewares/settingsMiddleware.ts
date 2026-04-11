
/**
 * Middleware to make the current request context available to settings loader
 */
const settingsMiddleware = (req: any, res: any, next: any) => {
  // Store the request object in a global variable
  // so that setting loaders can access the current companyOwner user
  (global as any).req = req;
  
  next();
};

module.exports = settingsMiddleware;
