import { createSelector } from 'reselect';

const selectPermissions = (state) => state.permissions;

export const selectUserPermissions = createSelector(
  [selectPermissions],
  (permissions) => permissions.permissions
);

export const selectIsOwner = createSelector(
  [selectPermissions],
  (permissions) => permissions.isOwner
);

export const selectPermissionsLoading = createSelector(
  [selectPermissions],
  (permissions) => permissions.isLoading && !permissions.hasInitialized
);

export const selectPermissionsError = createSelector(
  [selectPermissions],
  (permissions) => permissions.error
);

export const selectPermissionsState = createSelector(
  [selectPermissions],
  (permissions) => permissions
);

export const selectHasInitialized = createSelector(
  [selectPermissions],
  (permissions) => permissions.hasInitialized
);

// Permission mapping from frontend format to backend format
const PERMISSION_MAPPING = {
  // Customer permissions
  'customer:read': 'canViewClients',
  'customer:create': 'canCreateClients',
  'customer:update': 'canUpdateClients',
  'customer:delete': 'canDeleteClients',
  
  // Invoice permissions
  'invoice:read': 'canViewInvoices',
  'invoice:create': 'canCreateInvoices',
  'invoice:update': 'canUpdateInvoices',
  'invoice:delete': 'canDeleteInvoices',
  
  // Quote permissions
  'quote:read': 'canViewQuotes',
  'quote:create': 'canCreateQuotes',
  'quote:update': 'canUpdateQuotes',
  'quote:delete': 'canDeleteQuotes',
  
  // Payment permissions
  'payment:read': 'canViewPayments',
  'payment:create': 'canCreatePayments',
  'payment:update': 'canUpdatePayments',
  'payment:delete': 'canDeletePayments',
  
  // Document permissions
  'document:read': 'canViewDocuments',
  'document:create': 'canCreateDocuments',
  'document:update': 'canUpdateDocuments',
  'document:delete': 'canDeleteDocuments',
  
  // Task permissions
  'task:read': 'canViewTasks',
  'task:create': 'canCreateTasks',
  'task:update': 'canUpdateTasks',
  'task:delete': 'canDeleteTasks',
  
  // Team permissions
  'team:read': 'canViewTeams',
  'team:create': 'canCreateTeams',
  'team:update': 'canUpdateTeams',
  'team:delete': 'canDeleteTeams',
  
  // Workflow permissions
  'workflow:read': 'canViewWorkflows',
  'workflow:create': 'canCreateWorkflows',
  'workflow:update': 'canUpdateWorkflows',
  'workflow:delete': 'canDeleteWorkflows',
  
  // Settings permissions
  'settings:read': 'canViewSettings',
  'settings:create': 'canCreateSettings',
  'settings:update': 'canUpdateSettings',
  'settings:delete': 'canDeleteSettings',
  
  // AI permissions
  'ai:read': 'canViewAiAssistants',
  'ai:create': 'canCreateAiAssistants',
  'ai:update': 'canUpdateAiAssistants',
  'ai:delete': 'canDeleteAiAssistants',
  'ai:chat': 'canViewAiAssistants', // Chat requires view permission
  'ai:settings': 'canUpdateAiAssistants', // Settings requires update permission
  'ai:suggestions': 'canViewAiAssistants',
  'ai:analytics': 'canViewAiAssistants',
  'ai:data-processor': 'canViewAiAssistants',
  
  // Social media permissions
  'social:read': 'canViewSocialAccounts',
  'social:accounts': 'canViewSocialAccounts',
  'social:posts': 'canViewSocialPosts',
  'social:analytics': 'canViewSocialCampaigns',
  'social:mentions': 'canViewSocialPosts',
  'social:ai-content': 'canCreateSocialPosts',
  'social:settings': 'canUpdateSocialAccounts',
  
  // URL permissions
  'url:read': 'canViewUrls',
  'url:create': 'canCreateUrls',
  'url:update': 'canUpdateUrls',
  'url:delete': 'canDeleteUrls',
  'url:analytics': 'canViewUrls',
  'url:ab-testing': 'canViewUrls',
  'url:create-ab-test': 'canCreateUrls',
  'url:ab-test-results': 'canViewUrls',
  
  // Reputation permissions
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
  
  // Marketing permissions
  'marketing:read': 'canViewMarketing',
  'marketing:create': 'canCreateMarketing',
  'marketing:update': 'canUpdateMarketing',
  'marketing:delete': 'canDeleteMarketing',
  'marketing:campaign-builder': 'canCreateMarketing',
  'marketing:update-campaign': 'canUpdateMarketing',
  'marketing:analytics': 'canViewMarketing',
  'marketing:behavior-triggers': 'canViewMarketing',
  'marketing:audiences': 'canViewMarketing',
  
  // Chat permissions
  'chat:read': 'canViewNotifications', // Using notifications as proxy for chat
};

// Helper function to map frontend permission to backend permission
const mapPermission = (frontendPermission) => {
  return PERMISSION_MAPPING[frontendPermission] || frontendPermission;
};

// Memoized permission checkers to prevent re-computation
export const selectHasPermission = (permission) =>
  createSelector(
    [selectPermissions, () => permission],
    (permState, perm) => {
      if (permState.isOwner) return true;
      if (!permState.permissions || !permState.hasInitialized) return false;
      
      const backendPermission = mapPermission(perm);
      
      if (typeof permState.permissions === 'object') {
        return Boolean(permState.permissions[backendPermission]);
      }
      
      return Array.isArray(permState.permissions) && permState.permissions.includes(backendPermission);
    }
  );

export const selectHasAllPermissions = (requiredPermissions) =>
  createSelector(
    [selectPermissions, () => requiredPermissions],
    (permState, permissions) => {
      if (permState.isOwner) return true;
      if (!permState.permissions || !permState.hasInitialized) return false;
      if (!Array.isArray(permissions)) return false;
      
      if (typeof permState.permissions === 'object') {
        return permissions.every(permission => {
          const backendPermission = mapPermission(permission);
          return Boolean(permState.permissions[backendPermission]);
        });
      }
      
      return permissions.every(permission => {
        const backendPermission = mapPermission(permission);
        return Array.isArray(permState.permissions) && permState.permissions.includes(backendPermission);
      });
    }
  );

export const selectHasAnyPermission = (requiredPermissions) =>
  createSelector(
    [selectPermissions, () => requiredPermissions],
    (permState, permissions) => {
      if (permState.isOwner) return true;
      if (!permState.permissions || !permState.hasInitialized) return false;
      if (!Array.isArray(permissions)) return false;
      
      if (typeof permState.permissions === 'object') {
        return permissions.some(permission => {
          const backendPermission = mapPermission(permission);
          return Boolean(permState.permissions[backendPermission]);
        });
      }
      
      return permissions.some(permission => {
        const backendPermission = mapPermission(permission);
        return Array.isArray(permState.permissions) && permState.permissions.includes(backendPermission);
      });
    }
  );