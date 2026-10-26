// @ts-nocheck
const { gql } = require('graphql-tag');

const settingsTypeDefs = gql`
  type Setting {
    _id: ID!
    settingCategory: String
    settingKey: String!
    settingValue: JSON
    valueType: String
    isPrivate: Boolean
    isCoreSetting: Boolean
    owner: ID
    companyID: ID
    removed: Boolean
    createdAt: DateTime
    updatedAt: DateTime
  }

  input SettingCreateInput {
    settingCategory: String
    settingKey: String!
    settingValue: JSON
    valueType: String
    isPrivate: Boolean
    isCoreSetting: Boolean
  }

  input SettingUpdateInput {
    settingCategory: String
    settingKey: String
    settingValue: JSON
    valueType: String
    isPrivate: Boolean
    isCoreSetting: Boolean
  }

  extend type Query {
    settingRead(id: ID!): MutationResponse!
    settingList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    settingListAll: ListResponse!
    settingSearch(q: String!, fields: String): ListResponse!
    settingFilter(filter: String, equal: String): ListResponse!
    settingReadByKey(settingKey: String!): MutationResponse!
    settingListByKey(settingKey: String!): ListResponse!
  }

  extend type Mutation {
    settingCreate(input: JSON!): MutationResponse!
    settingUpdate(id: ID!, input: JSON!): MutationResponse!
    settingDelete(id: ID!): MutationResponse!
    settingUpdateByKey(settingKey: String!, input: SettingUpdateInput!): MutationResponse!
    settingUpdateMany(input: [SettingUpdateInput!]!): MutationResponse!
    settingTestOpenAIKey(key: String!): MutationResponse!
    settingTestGeminiKey(key: String!): MutationResponse!
    settingTestClaudeKey(key: String!): MutationResponse!
  }
`;

module.exports = settingsTypeDefs;
