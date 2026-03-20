import { useQuery, useMutation, type QueryHookOptions, type MutationHookOptions } from '@apollo/client/react';
import {
  GET_TEAMS,
  GET_TEAM,
  SEARCH_TEAMS,
  TEAM_SUMMARY,
  LIST_TEAM_MEMBERS,
  TEAM_MEMBER_PERFORMANCE,
  CREATE_TEAM,
  UPDATE_TEAM,
  DELETE_TEAM,
  INVITE_TEAM_MEMBER,
  ACCEPT_TEAM_INVITATION,
  REMOVE_TEAM_MEMBER,
} from '../graphql/operations/team';

export const useTeams = (options?: QueryHookOptions) =>
  useQuery(GET_TEAMS, options);

export const useTeam = (id: string, options?: QueryHookOptions) =>
  useQuery(GET_TEAM, { ...options, variables: { id } });

export const useSearchTeams = (q: string, options?: QueryHookOptions) =>
  useQuery(SEARCH_TEAMS, { ...options, variables: { q } });

export const useTeamSummary = (options?: QueryHookOptions) =>
  useQuery(TEAM_SUMMARY, options);

export const useTeamMembers = (id: string, options?: QueryHookOptions) =>
  useQuery(LIST_TEAM_MEMBERS, { ...options, variables: { id } });

export const useTeamMemberPerformance = (id: string, memberId: string, options?: QueryHookOptions) =>
  useQuery(TEAM_MEMBER_PERFORMANCE, { ...options, variables: { id, memberId } });

export const useCreateTeam = (options?: MutationHookOptions) =>
  useMutation(CREATE_TEAM, options);

export const useUpdateTeam = (options?: MutationHookOptions) =>
  useMutation(UPDATE_TEAM, options);

export const useDeleteTeam = (options?: MutationHookOptions) =>
  useMutation(DELETE_TEAM, options);

export const useInviteTeamMember = (options?: MutationHookOptions) =>
  useMutation(INVITE_TEAM_MEMBER, options);

export const useAcceptTeamInvitation = (options?: MutationHookOptions) =>
  useMutation(ACCEPT_TEAM_INVITATION, options);

export const useRemoveTeamMember = (options?: MutationHookOptions) =>
  useMutation(REMOVE_TEAM_MEMBER, options);
