// @ts-nocheck
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import typeDefs from './typeDefs';
import resolvers from './resolvers';
import { GraphQLContext, AdminUser } from '../types/context';

async function createApolloServer(): Promise<ApolloServer> {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError: any) => {
      if (process.env.NODE_ENV === 'production') {
        if (formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR') {
          return {
            message: 'Internal server error',
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          };
        }
      }
      return formattedError;
    },
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();
  return server;
}

async function buildContext({ req, res }: { req: any; res: any }): Promise<GraphQLContext> {
  const context: GraphQLContext = { req, res, admin: null };

  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      const AdminModel = mongoose.model('CompanyOwner');
      const admin = await AdminModel.findOne({
        _id: decoded.id,
        removed: false,
      }).lean();

      if (admin) {
        context.admin = {
          ...admin,
          _id: (admin as any)._id.toString(),
          companyID: (admin as any).companyID || (admin as any)._id.toString(),
        } as unknown as AdminUser;
      }
    } catch (error) {
      // Token invalid or expired - continue without auth
    }
  }

  return context;
}

export { createApolloServer, buildContext };
