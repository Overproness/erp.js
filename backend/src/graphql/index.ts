// @ts-nocheck
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
const { makeExecutableSchema } = require('@graphql-tools/schema');
import typeDefs from './typeDefs';
import { initializeResolvers } from './resolvers';
import { GraphQLContext, AdminUser } from '../types/context';

/** Remove resolver entries that have no matching field in the schema */
function filterResolversToSchema(resolvers: any, schema: any) {
  const queryFields = new Set(Object.keys(schema.getQueryType()?.getFields() ?? {}));
  const mutationFields = new Set(Object.keys(schema.getMutationType()?.getFields() ?? {}));
  return {
    ...resolvers,
    Query: Object.fromEntries(
      Object.entries(resolvers.Query ?? {}).filter(([k]) => queryFields.has(k))
    ),
    Mutation: Object.fromEntries(
      Object.entries(resolvers.Mutation ?? {}).filter(([k]) => mutationFields.has(k))
    ),
  };
}

async function createApolloServer(): Promise<ApolloServer> {
  // Import all app controllers and wire them into the resolvers
  const controllers = require('../controllers/appControllers');
  const coreControllers = require('../controllers/coreControllers/adminAuth');
  const settingController = require('../controllers/coreControllers/settingController');
  const adminController = require('../controllers/coreControllers/adminController');

  const resolvers = initializeResolvers({
    ...controllers,
    adminAuth: coreControllers,
    settingController,
    adminController,
  });

  // Build a schema from typeDefs alone to know which Query/Mutation fields exist
  const typeDefsOnlySchema = makeExecutableSchema({ typeDefs });
  const filteredResolvers = filterResolversToSchema(resolvers, typeDefsOnlySchema);

  const server = new ApolloServer({
    typeDefs,
    resolvers: filteredResolvers,
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
