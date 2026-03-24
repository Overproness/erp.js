import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { permissions } from '@/redux/permissions/actions';
import { 
  selectPermissionsLoading,
  selectIsOwner,
  selectUserPermissions,
  selectPermissionsError,
  selectPermissionsState
} from '@/redux/permissions/selectors';
import { selectAuth } from '@/redux/auth/selectors';

// Permission mapping from frontend format to backend format
const PERMISSION_MAPPING = {
  'customer:read': 'canViewClients',
  'customer:create': 'canCreateClients',
  'customer:update': 'canUpdateClients',
  'customer:delete': 'canDeleteClients',
  'invoice:read': 'canViewInvoices',
  'invoice:create': 'canCreateInvoices',
  'invoice:update': 'canUpdateInvoices',
  'invoice:delete': 'canDeleteInvoices',
  'quote:read': 'canViewQuotes',
  'quote:create': 'canCreateQuotes',
  'quote:update': 'canUpdateQuotes',
  'quote:delete': 'canDeleteQuotes',
  'payment:read': 'canViewPayments',
  'payment:create': 'canCreatePayments',
  'payment:update': 'canUpdatePayments',
  'payment:delete': 'canDeletePayments',
  'document:read': 'canViewDocuments',
  'document:create': 'canCreateDocuments',
  'document:update': 'canUpdateDocuments',
  'document:delete': 'canDeleteDocuments',
  'task:read': 'canViewTasks',
  'task:create': 'canCreateTasks',
  'task:update': 'canUpdateTasks',
  'task:delete': 'canDeleteTasks',
  'team:read': 'canViewTeams',
  'team:create': 'canCreateTeams',
  'team:update': 'canUpdateTeams',
  'team:delete': 'canDeleteTeams',
  'workflow:read': 'canViewWorkflows',
  'workflow:create': 'canCreateWorkflows',
  'workflow:update': 'canUpdateWorkflows',
  'workflow:delete': 'canDeleteWorkflows',
  'settings:read': 'canViewSettings',
  'settings:create': 'canCreateSettings',
  'settings:update': 'canUpdateSettings',
  'settings:delete': 'canDeleteSettings',
  'ai:read': 'canViewAiAssistants',
  'ai:create': 'canCreateAiAssistants',
  'ai:update': 'canUpdateAiAssistants',
  'ai:delete': 'canDeleteAiAssistants',
  'ai:chat': 'canViewAiAssistants',
  'ai:settings': 'canUpdateAiAssistants',
  'ai:suggestions': 'canViewAiAssistants',
  'ai:analytics': 'canViewAiAssistants',
  'ai:data-processor': 'canViewAiAssistants',
  'social:read': 'canViewSocialAccounts',
  'social:accounts': 'canViewSocialAccounts',
  'social:posts': 'canViewSocialPosts',
  'social:analytics': 'canViewSocialCampaigns',
  'social:mentions': 'canViewSocialPosts',
  'social:ai-content': 'canCreateSocialPosts',
  'social:settings': 'canUpdateSocialAccounts',
  'url:read': 'canViewUrls',
  'url:create': 'canCreateUrls',
  'url:update': 'canUpdateUrls',
  'url:delete': 'canDeleteUrls',
  'url:analytics': 'canViewUrls',
  'url:ab-testing': 'canViewUrls',
  'url:create-ab-test': 'canCreateUrls',
  'url:ab-test-results': 'canViewUrls',
  'reputation:read': 'canViewReputation',
  'reputation:create': 'canCreateReputation',
  'reputation:delete': 'canDeleteReputation',
  'reputation:reviews': 'canViewReputation',
  'reputation:links': 'canViewReputation',
  'reputation:create-link': 'canCreateReputation',
  'reputation:edit-link': 'canUpdateReputation',
  'reputation:portal': 'canViewReputation',
  'reputation:connections': 'canViewReputation',
  'reputation:connection-detail': 'canViewReputation',
  'reputation:analytics': 'canViewReputation',
  'marketing:read': 'canViewMarketing',
  'marketing:create': 'canCreateMarketing',
  'marketing:update': 'canUpdateMarketing',
  'marketing:delete': 'canDeleteMarketing',
  'marketing:campaign-builder': 'canCreateMarketing',
  'marketing:update-campaign': 'canUpdateMarketing',
  'marketing:analytics': 'canViewMarketing',
  'marketing:behavior-triggers': 'canViewMarketing',
  'marketing:audiences': 'canViewMarketing',
  'chat:read': 'canViewNotifications',
};

const mapPermission = (frontendPermission) => {
  return PERMISSION_MAPPING[frontendPermission] || frontendPermission;
};

export const usePermissions = () => {
  const dispatch = useDispatch();
  const { current: authUser, isLoggedIn } = useSelector(selectAuth);
  
  const loading = useSelector(selectPermissionsLoading);
  const isOwner = useSelector(selectIsOwner);
  const userPermissions = useSelector(selectUserPermissions);
  const error = useSelector(selectPermissionsError);
  const permissionsState = useSelector(selectPermissionsState);
  
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch permissions only once when user is logged in
  useEffect(() => {
    if (isLoggedIn && authUser && !hasInitialized && !loading) {
      dispatch(permissions.fetch());
      setHasInitialized(true);
    }
    
    // Reset when user logs out
    if (!isLoggedIn && hasInitialized) {
      dispatch(permissions.clear());
      setHasInitialized(false);
    }
  }, [isLoggedIn, authUser, dispatch, hasInitialized, loading]);

  // Create permission checker functions that don't violate hook rules
  const hasPermission = useCallback((permission) => {
    // Owner always has access
    if (isOwner) return true;
    
    // If permissions haven't loaded yet or user doesn't have any permissions, deny access
    if (!permissionsState.hasInitialized || !userPermissions) {
      return false;
    }
    
    const backendPermission = mapPermission(permission);
    
    if (typeof userPermissions === 'object') {
      return Boolean(userPermissions[backendPermission]);
    }
    
    return Array.isArray(userPermissions) && userPermissions.includes(backendPermission);
  }, [isOwner, userPermissions, permissionsState.hasInitialized, loading]);

  const hasAllPermissions = useCallback((requiredPermissions) => {
    if (isOwner) return true;
    if (!permissionsState.hasInitialized || !userPermissions) return false;
    if (!Array.isArray(requiredPermissions)) return false;
    
    if (typeof userPermissions === 'object') {
      return requiredPermissions.every(permission => {
        const backendPermission = mapPermission(permission);
        return Boolean(userPermissions[backendPermission]);
      });
    }
    
    return requiredPermissions.every(permission => {
      const backendPermission = mapPermission(permission);
      return Array.isArray(userPermissions) && userPermissions.includes(backendPermission);
    });
  }, [isOwner, userPermissions, permissionsState.hasInitialized]);

  const hasAnyPermission = useCallback((requiredPermissions) => {
    if (isOwner) return true;
    if (!permissionsState.hasInitialized || !userPermissions) return false;
    if (!Array.isArray(requiredPermissions)) return false;
    
    if (typeof userPermissions === 'object') {
      return requiredPermissions.some(permission => {
        const backendPermission = mapPermission(permission);
        return Boolean(userPermissions[backendPermission]);
      });
    }
    
    return requiredPermissions.some(permission => {
      const backendPermission = mapPermission(permission);
      return Array.isArray(userPermissions) && userPermissions.includes(backendPermission);
    });
  }, [isOwner, userPermissions, permissionsState.hasInitialized]);

  return {
    loading: (loading && !hasInitialized) || (!permissionsState.hasInitialized && isLoggedIn && authUser),
    isOwner,
    permissions: userPermissions,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    refetch: () => {
      if (isLoggedIn && authUser) {
        dispatch(permissions.fetch());
      }
    }
  };
};