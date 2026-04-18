import { AdminUser } from './context';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
      user?: AdminUser;
      authType?: string;
      adminId?: string;
      plan?: string;
      subscription?: any;
      isUser?: boolean;
      companyOwner?: any;
      userPermissions?: any;
    }
  }
}

export {};
