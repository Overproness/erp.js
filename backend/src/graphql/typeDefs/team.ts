// @ts-nocheck
const { gql } = require('graphql-tag');

const teamTypeDefs = gql`
  type TeamMember {
    user: ID
    role: String
    joinedAt: DateTime
    status: String
  }

  type Team {
    _id: ID!
    name: String!
    description: String
    members: [TeamMember]
    leader: ID
    department: String
    status: String
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input TeamCreateInput {
    name: String!
    description: String
    leader: ID
    department: String
  }

  input TeamUpdateInput {
    name: String
    description: String
    leader: ID
    department: String
    status: String
  }

  input TeamMemberInput {
    email: String!
    role: String
  }

  extend type Query {
    teamRead(id: ID!): MutationResponse!
    teamList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    teamListAll: ListResponse!
    teamSearch(q: String!, fields: String): ListResponse!
    teamFilter(filter: String, equal: String): ListResponse!
    teamSummary: MutationResponse!
    teamListMembers(id: ID!): ListResponse!
    teamMemberPerformance(id: ID!, memberId: ID!): MutationResponse!
    teamInvitationDetails(token: String!): MutationResponse!
  }

  extend type Mutation {
    teamCreate(input: JSON!): MutationResponse!
    teamUpdate(id: ID!, input: JSON!): MutationResponse!
    teamDelete(id: ID!): MutationResponse!
    teamInviteMember(id: ID!, input: TeamMemberInput!): MutationResponse!
    teamAcceptInvitation(token: String!): MutationResponse!
    teamUpdateMember(id: ID!, memberId: ID!, input: JSON): MutationResponse!
    teamRemoveMember(id: ID!, memberId: ID!): MutationResponse!
  }
`;

module.exports = teamTypeDefs;
