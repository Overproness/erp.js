import { request } from '@/request';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';
import storePersist from '@/redux/storePersist';

const inviteMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, ...memberData } = jsonData;

    // Include authentication token
    const authData = storePersist.get('auth');
    const config = {
      headers: {
        Authorization: `Bearer ${authData?.current?.token}`,
        'Content-Type': 'application/json'
      }
    };    
    // The backend expects permissions as an object
    // Make sure permissions is properly formatted
    console.log('Custom request received memberData:', JSON.stringify(memberData, null, 2));
    console.log('Custom request permissions before formatting:', JSON.stringify(memberData.permissions, null, 2));
    
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
      // Make sure each permission is explicitly a boolean
      memberData.permissions = Object.fromEntries(
        Object.entries(memberData.permissions).map(([key, val]) => [key, val === true])
      );
    }

    // Format the data to match the server-expected schema
    const formattedData = {
      name: memberData.name,
      email: memberData.email,
      role: memberData.role || 'member',
      permissions: memberData.permissions
    };

    console.log('Sending invitation data:', formattedData);
    const response = await axios.post(`${API_BASE_URL}team/${teamId}/invite`, formattedData, config);
    return {
      success: true,
      result: response.data,
      message: 'Team member invited successfully'
    };
  } catch (error) {
    console.error('Error inviting team member:', error);
    
    // Show better error message to help with debugging
    const errorMessage = error.response?.data?.message || error.message;
    console.log('Invitation failed:', errorMessage);
    
    return {
      success: false,
      result: null,
      message: errorMessage
    };
    if (error.response?.data) {
      const newError = new Error(error.response.data.message || 'Invitation failed');
      newError.response = error.response;
      throw newError;
    }
    
    throw error;
  }
};

const updateMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, memberId, ...data } = jsonData;
    // Include authentication token
    const authData = storePersist.get('auth');
    const config = {
      headers: {
        Authorization: `Bearer ${authData?.current?.token}`,
        'Content-Type': 'application/json'
      }
    };
    
    console.log('Updating team member:', { teamId, memberId, data });
    
    // Make sure permissions is properly formatted
    if (data.permissions) {
      console.log('Converting each permission value to explicit boolean');
      data.permissions = {
        canViewInvoices: data.permissions.canViewInvoices === true,
        canViewClients: data.permissions.canViewClients === true,
        canViewPayments: data.permissions.canViewPayments === true,
        canViewQuotes: data.permissions.canViewQuotes === true,
        canViewOffers: data.permissions.canViewOffers === true
      };
    }
    
    const response = await axios.patch(
      `${API_BASE_URL}team/${teamId}/members/${memberId}`, 
      data, 
      config
    );
    
    return {
      success: true,
      result: response.data,
      message: 'Team member updated successfully'
    };
  } catch (error) {
    console.error('Error updating team member:', error);
    
    const errorMessage = error.response?.data?.message || error.message;
    console.log('Update failed:', errorMessage);
    
    return {
      success: false,
      result: null,
      message: errorMessage
    };
  }
};

const removeMember = async ({ entity, customAction, jsonData }) => {
  try {
    const { teamId, memberId } = jsonData;
    // Include authentication token
    const authData = storePersist.get('auth');
    const config = {
      headers: {
        Authorization: `Bearer ${authData?.current?.token}`
      }
    };    
    const response = await axios.delete(`${API_BASE_URL}team/${teamId}/members/${memberId}`, config);
    return {
      success: true,
      result: response.data,
      message: 'Team member removed successfully'
    };
  } catch (error) {
    console.error('Error removing team member:', error);
    const errorMessage = error.response?.data?.message || error.message;
    return {
      success: false,
      result: null,
      message: errorMessage
    };
  }
};

const teamCustomRequests = {
  inviteMember,
  updateMember,
  removeMember,
};

export default teamCustomRequests;
