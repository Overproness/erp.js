import { gql } from '@apollo/client';

export const GET_TEAMS = gql`
  query GetTeams($page: Int, $limit: Int, $sortBy: String, $sortValue: String) {
    teamList(page: $page, limit: $limit, sortBy: $sortBy, sortValue: $sortValue) {
      success result pagination { page count pages total } message
    }
  }
`;

export const GET_TEAM = gql`
  query GetTeam($id: ID!) { teamRead(id: $id) { success result message } }
`;

export const SEARCH_TEAMS = gql`
  query SearchTeams($q: String!, $fields: String) {
    teamSearch(q: $q, fields: $fields) { success result message }
  }
`;

export const TEAM_SUMMARY = gql`
  query TeamSummary { teamSummary { success result message } }
`;

export const LIST_TEAM_MEMBERS = gql`
  query ListTeamMembers($id: ID!) {
    teamListMembers(id: $id) { success result message }
  }
`;

export const TEAM_MEMBER_PERFORMANCE = gql`
  query TeamMemberPerformance($id: ID!, $memberId: ID!) {
    teamMemberPerformance(id: $id, memberId: $memberId) { success result message }
  }
`;

export const CREATE_TEAM = gql`
  mutation CreateTeam($input: TeamCreateInput!) {
    teamCreate(input: $input) { success result message }
  }
`;

export const UPDATE_TEAM = gql`
  mutation UpdateTeam($id: ID!, $input: TeamUpdateInput!) {
    teamUpdate(id: $id, input: $input) { success result message }
  }
`;

export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: ID!) {
    teamDelete(id: $id) { success result message }
  }
`;

export const INVITE_TEAM_MEMBER = gql`
  mutation InviteTeamMember($id: ID!, $input: TeamMemberInput!) {
    teamInviteMember(id: $id, input: $input) { success result message }
  }
`;

export const ACCEPT_TEAM_INVITATION = gql`
  mutation AcceptTeamInvitation($token: String!) {
    teamAcceptInvitation(token: $token) { success result message }
  }
`;

export const REMOVE_TEAM_MEMBER = gql`
  mutation RemoveTeamMember($id: ID!, $memberId: ID!) {
    teamRemoveMember(id: $id, memberId: $memberId) { success result message }
  }
`;
