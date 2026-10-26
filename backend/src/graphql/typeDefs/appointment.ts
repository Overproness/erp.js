// @ts-nocheck
const { gql } = require('graphql-tag');

const appointmentTypeDefs = gql`
  type Appointment {
    _id: ID!
    title: String!
    description: String
    client: ID
    assignedTo: ID
    startTime: DateTime!
    endTime: DateTime!
    location: String
    type: String
    status: String
    notes: String
    reminderSent: Boolean
    reminderTime: DateTime
    recurrence: JSON
    metadata: JSON
    removed: Boolean
    enabled: Boolean
    owner: ID
    companyID: ID
    createdAt: DateTime
    updatedAt: DateTime
  }

  input AppointmentCreateInput {
    title: String!
    description: String
    client: ID
    assignedTo: ID
    startTime: DateTime!
    endTime: DateTime!
    location: String
    type: String
    notes: String
    reminderTime: DateTime
    recurrence: JSON
  }

  input AppointmentUpdateInput {
    title: String
    description: String
    client: ID
    assignedTo: ID
    startTime: DateTime
    endTime: DateTime
    location: String
    type: String
    status: String
    notes: String
    reminderTime: DateTime
    recurrence: JSON
  }

  extend type Query {
    appointmentRead(id: ID!): MutationResponse!
    appointmentList(page: Int, limit: Int, sortBy: String, sortValue: String): ListResponse!
    appointmentListAll: ListResponse!
    appointmentSearch(q: String!, fields: String): ListResponse!
    appointmentFilter(filter: String, equal: String): ListResponse!
    appointmentByDateRange(startDate: DateTime!, endDate: DateTime!): ListResponse!
  }

  extend type Mutation {
    appointmentCreate(input: JSON!): MutationResponse!
    appointmentUpdate(id: ID!, input: JSON!): MutationResponse!
    appointmentDelete(id: ID!): MutationResponse!
    appointmentCancel(id: ID!): MutationResponse!
    appointmentReschedule(id: ID!, startTime: DateTime!, endTime: DateTime!): MutationResponse!
  }
`;

module.exports = appointmentTypeDefs;
