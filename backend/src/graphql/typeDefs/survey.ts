// @ts-nocheck
const { gql } = require('graphql-tag');

const surveyTypeDefs = gql`
  type SurveyQuestion {
    questionText: String
    questionType: String
    options: [String]
    required: Boolean
    order: Int
  }

  type Survey {
    _id: ID!
    title: String!
    description: String
    questions: [SurveyQuestion]
    status: String
    startDate: DateTime
    endDate: DateTime
    responseCount: Int
    isPublic: Boolean
    publicUrl: String
    settings: JSON
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  type SurveyResponse {
    _id: ID!
    survey: ID
    respondent: JSON
    answers: [JSON]
    completedAt: DateTime
    metadata: JSON
    removed: Boolean
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input SurveyQuestionInput {
    questionText: String!
    questionType: String!
    options: [String]
    required: Boolean
    order: Int
  }

  input SurveyCreateInput {
    title: String!
    description: String
    questions: [SurveyQuestionInput]
    startDate: DateTime
    endDate: DateTime
    isPublic: Boolean
    settings: JSON
  }

  input SurveyUpdateInput {
    title: String
    description: String
    questions: [SurveyQuestionInput]
    status: String
    startDate: DateTime
    endDate: DateTime
    isPublic: Boolean
    settings: JSON
  }

  extend type Query {
    surveyRead(id: ID!): MutationResponse!
    surveyList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    surveyListAll: ListResponse!
    surveySearch(q: String!, fields: String): ListResponse!
    surveyFilter(filter: String, equal: String): ListResponse!
    surveyAnalytics(id: ID!): MutationResponse!
    surveyResponseList(surveyId: ID!, page: Int, limit: Int): ListResponse!
    surveyResponseRead(id: ID!): MutationResponse!
  }

  extend type Mutation {
    surveyCreate(input: JSON!): MutationResponse!
    surveyUpdate(id: ID!, input: JSON!): MutationResponse!
    surveyDelete(id: ID!): MutationResponse!
    surveyPublish(id: ID!): MutationResponse!
    surveyClose(id: ID!): MutationResponse!
    surveyResponseCreate(surveyId: ID!, input: JSON!): MutationResponse!
    surveyResponseDelete(id: ID!): MutationResponse!
  }
`;

module.exports = surveyTypeDefs;
