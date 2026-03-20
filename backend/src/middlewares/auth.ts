import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: any;
  isUser?: boolean;
  userPermissions?: any;
  companyOwner?: any;
  admin?: any;
}

export const checkAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        result: null,
        message: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; isUser?: boolean };

    if (decoded.isUser) {
      const User = mongoose.model('User');
      const user = await User.findOne({
        _id: decoded.id,
        removed: false,
        isInvitationAccepted: true,
      });

      if (!user) {
        res.status(401).json({
          success: false,
          result: null,
          message: 'Invalid user authentication token',
        });
        return;
      }

      req.user = user;
      req.isUser = true;
      req.userPermissions = (user as any).permissions;
      next();
      return;
    }

    const CompanyOwner = mongoose.model('CompanyOwner');
    const companyOwner = await CompanyOwner.findOne({ _id: decoded.id, removed: false });

    if (!companyOwner) {
      res.status(401).json({
        success: false,
        result: null,
        message: 'Invalid authentication token',
      });
      return;
    }

    req.companyOwner = companyOwner;
    req.admin = companyOwner;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      result: null,
      message: 'Authentication token is invalid or expired',
      error: error.message,
    });
  }
};

export const isCompanyOwner = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (
    req.companyOwner &&
    (req.companyOwner.role === 'admin' || req.companyOwner.role === 'owner')
  ) {
    next();
  } else {
    res.status(403).json({
      success: false,
      result: null,
      message: 'Access denied: CompanyOwner privileges required',
    });
  }
};
