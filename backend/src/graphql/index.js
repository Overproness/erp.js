const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');

async function createApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError) => {
      // Don't expose internal errors in production
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

// Context builder - extracts auth from request
async function buildContext({ req, res }) {
  const context = { req, res, admin: null };

  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const AdminModel = mongoose.model('CompanyOwner');
      const admin = await AdminModel.findOne({
        _id: decoded.id,
        removed: false,
      }).lean();

      if (admin) {
        context.admin = {
          ...admin,
          companyID: admin.companyID || admin._id.toString(),
        };
      }
    } catch (error) {
      // Token invalid or expired - continue without auth
    }
  }

  return context;
}

module.exports = { createApolloServer, buildContext };
