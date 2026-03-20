import apolloClient from '@/graphql/client';
import {
  INVITE_TEAM_MEMBER,
  REMOVE_TEAM_MEMBER,
} from '@/graphql/operations/team';
import { gql } from '@apollo/client';

const inviteMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, ...memberData } = jsonData;

    if (!memberData.permissions) {
      memberData.permissions = {
        canViewInvoices: false,
        canCreateInvoices: false,
        canUpdateInvoices: false,
        canDeleteInvoices: false,
        canViewClients: false,
        canCreateClients: false,
        canUpdateClients: false,
        canDeleteClients: false,
        canViewPayments: false,
        canCreatePayments: false,
        canUpdatePayments: false,
        canDeletePayments: false,
        canViewQuotes: false,
        canCreateQuotes: false,
        canUpdateQuotes: false,
        canDeleteQuotes: false,
        canViewOffers: false,
        canCreateOffers: false,
        canUpdateOffers: false,
        canDeleteOffers: false,
        canViewMarketing: false,
        canCreateMarketing: false,
        canUpdateMarketing: false,
        canDeleteMarketing: false,
        canViewReputation: false,
        canUpdateReputation: false,
        canViewTasks: false,
        canCreateTasks: false,
        canUpdateTasks: false,
        canDeleteTasks: false,
        canViewDocuments: false,
        canCreateDocuments: false,
        canUpdateDocuments: false,
        canDeleteDocuments: false,
        canViewReports: false,
        canCreateReports: false,
        canUpdateReports: false,
        canDeleteReports: false,
        canViewAnalytics: false,
        canViewSettings: false,
        canUpdateSettings: false,
        canViewNotifications: false,
        canUpdateNotifications: false,
      };
    } else {
      memberData.permissions = Object.fromEntries(
        Object.entries(memberData.permissions).map(([key, val]) => [key, val === true])
      );
    }

    const formattedData = {
      email: memberData.email,
      role: memberData.role || 'member',
    };

    const { data } = await apolloClient.mutate({
      mutation: INVITE_TEAM_MEMBER,
      variables: { id: teamId, input: formattedData },
    });

    return {
      success: data.teamInviteMember?.success ?? true,
      result: data.teamInviteMember?.result,
      message: data.teamInviteMember?.message || 'Team member invited successfully'
    };
  } catch (error) {
    console.error('Error inviting team member:', error);
    return {
      success: false,
      result: null,
      message: error.message || 'Invitation failed'
    };
  }
};

const updateMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, memberId, ...data } = jsonData;

    if (data.permissions) {
      data.permissions = {
        canViewInvoices: data.permissions.canViewInvoices === true,
        canViewClients: data.permissions.canViewClients === true,
        canViewPayments: data.permissions.canViewPayments === true,
        canViewQuotes: data.permissions.canViewQuotes === true,
        canViewOffers: data.permissions.canViewOffers === true
      };
    }

    const { data: result } = await apolloClient.mutate({
      mutation: gql`mutation TeamUpdateMember($id: ID!, $memberId: ID!, $input: JSON) { teamUpdateMember(id: $id, memberId: $memberId, input: $input) { success result message } }`,
      variables: { id: teamId, memberId, input: data },
    });

    return {
      success: result.teamUpdateMember?.success ?? true,
      result: result.teamUpdateMember?.result,
      message: result.teamUpdateMember?.message || 'Team member updated successfully'
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    return {
      success: false,
      result: null,
      message: error.message || 'Update failed'
    };
  }
};

const removeMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, memberId } = jsonData;

    const { data } = await apolloClient.mutate({
      mutation: REMOVE_TEAM_MEMBER,
      variables: { id: teamId, memberId },
    });

    return {
      success: data.teamRemoveMember?.success ?? true,
      result: data.teamRemoveMember?.result,
      message: data.teamRemoveMember?.message || 'Team member removed successfully'
    };
  } catch (error) {
    console.error('Error removing team member:', error);
    return {
      success: false,
      result: null,
      message: error.message || 'Remove failed'
    };
  }
};

const teamCustomRequests = {
  inviteMember,
  updateMember,
  removeMember,
};

export default teamCustomRequests;
