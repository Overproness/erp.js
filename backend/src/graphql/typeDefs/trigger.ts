// @ts-nocheck
const { gql } = require('graphql-tag');

const triggerTypeDefs = gql`
  type TriggerRule {
    _id: ID!
    name: String!
    description: String
    event: String!
    conditions: [JSON]
    actions: [JSON]
    isActive: Boolean
    priority: Int
    cooldownPeriod: Int
    executionCount: Int
    lastExecutedAt: DateTime
    campaign: ID
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input TriggerRuleCreateInput {
    name: String!
    description: String
    event: String!
    conditions: [JSON]
    actions: [JSON]
    isActive: Boolean
    priority: Int
    cooldownPeriod: Int
    campaign: ID
  }

  input TriggerRuleUpdateInput {
    name: String
    description: String
    event: String
    conditions: [JSON]
    actions: [JSON]
    isActive: Boolean
    priority: Int
    cooldownPeriod: Int
    campaign: ID
  }

  extend type Query {
    triggerRuleRead(id: ID!): MutationResponse!
    triggerRuleList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    triggerRuleListAll: ListResponse!
    triggerRuleSearch(q: String!, fields: String): ListResponse!
    triggerRuleFilter(filter: String, equal: String): ListResponse!
  }

  extend type Mutation {
    triggerRuleCreate(input: JSON!): MutationResponse!
    triggerRuleUpdate(id: ID!, input: JSON!): MutationResponse!
    triggerRuleDelete(id: ID!): MutationResponse!
    triggerRuleActivate(id: ID!): MutationResponse!
    triggerRuleDeactivate(id: ID!): MutationResponse!
    triggerRuleTest(id: ID!, input: JSON): MutationResponse!
  }
`;

module.exports = triggerTypeDefs;
