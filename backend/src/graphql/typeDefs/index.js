const { gql } = require('graphql-tag');
const commonTypeDefs = require('./common');
const authTypeDefs = require('./auth');
const { entitiesTypeDefs, entitySpecificTypeDefs } = require('./entities');

// Root types that all extensions build on
const rootTypeDefs = gql`
  type Query {
    _health: String!
  }

  type Mutation {
    _noop: String
  }
`;

module.exports = [
  rootTypeDefs,
  commonTypeDefs,
  authTypeDefs,
  entitiesTypeDefs,
  entitySpecificTypeDefs,
];
