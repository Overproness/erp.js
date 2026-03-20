// GraphQL context type definition

import { Request, Response } from 'express';

export interface AdminUser {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  photo?: string;
  role?: string;
  companyName?: string;
  companyID: string;
  hasCompanySetup?: boolean;
  removed?: boolean;
}

export interface GraphQLContext {
  req: Request;
  res: Response;
  admin: AdminUser | null;
}
