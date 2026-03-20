// @ts-nocheck
const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('').trim(),
  teamLead: Joi.string().optional(),
  enabled: Joi.boolean().default(true),
  members: Joi.array()
    .items(
      Joi.object({
        user: Joi.string().required(),
        role: Joi.string().valid('leader', 'lead', 'manager', 'member', 'admin').default('member'), // Added 'admin'
      })
    )
    .optional(),
  permissions: Joi.object({
    view: Joi.array().items(Joi.string()).optional(),
    edit: Joi.array().items(Joi.string()).optional(),
    create: Joi.array().items(Joi.string()).optional(),
    delete: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  settings: Joi.object({
    allowCrossTeamCollaboration: Joi.boolean().default(true),
    requireApprovalForTasks: Joi.boolean().default(false),
    autoAssignTasks: Joi.boolean().default(false),
  }).optional(),
});

const updateTeamSchema = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().allow('').trim(),
  teamLead: Joi.string().optional(),
  enabled: Joi.boolean(),
});

const inviteMemberSchema = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('member', 'lead', 'admin', 'manager').default('member'), // Added 'manager' for consistency
  permissions: Joi.object({
    // Invoices
    canViewInvoices: Joi.boolean().default(false),
    canCreateInvoices: Joi.boolean().default(false),
    canUpdateInvoices: Joi.boolean().default(false),
    canDeleteInvoices: Joi.boolean().default(false),
    // Clients
    canViewClients: Joi.boolean().default(false),
    canCreateClients: Joi.boolean().default(false),
    canUpdateClients: Joi.boolean().default(false),
    canDeleteClients: Joi.boolean().default(false),
    // Payments
    canViewPayments: Joi.boolean().default(false),
    canCreatePayments: Joi.boolean().default(false),
    canUpdatePayments: Joi.boolean().default(false),
    canDeletePayments: Joi.boolean().default(false),
    // Quotes
    canViewQuotes: Joi.boolean().default(false),
    canCreateQuotes: Joi.boolean().default(false),
    canUpdateQuotes: Joi.boolean().default(false),
    canDeleteQuotes: Joi.boolean().default(false),
    // Offers
    canViewOffers: Joi.boolean().default(false),
    canCreateOffers: Joi.boolean().default(false),
    canUpdateOffers: Joi.boolean().default(false),
    canDeleteOffers: Joi.boolean().default(false),
    // Marketing
    canViewMarketing: Joi.boolean().default(false),
    canCreateMarketing: Joi.boolean().default(false),
    canUpdateMarketing: Joi.boolean().default(false),
    canDeleteMarketing: Joi.boolean().default(false),
    // Reputation
    canViewReputation: Joi.boolean().default(false),
    canUpdateReputation: Joi.boolean().default(false),
    // Tasks
    canViewTasks: Joi.boolean().default(false),
    canCreateTasks: Joi.boolean().default(false),
    canUpdateTasks: Joi.boolean().default(false),
    canDeleteTasks: Joi.boolean().default(false),
    // Documents
    canViewDocuments: Joi.boolean().default(false),
    canCreateDocuments: Joi.boolean().default(false),
    canUpdateDocuments: Joi.boolean().default(false),
    canDeleteDocuments: Joi.boolean().default(false),
    // Reports
    canViewReports: Joi.boolean().default(false),
    canCreateReports: Joi.boolean().default(false),
    canUpdateReports: Joi.boolean().default(false),
    canDeleteReports: Joi.boolean().default(false),
    // Analytics
    canViewAnalytics: Joi.boolean().default(false),
    canCreateAnalytics: Joi.boolean().default(false),
    canUpdateAnalytics: Joi.boolean().default(false),
    canDeleteAnalytics: Joi.boolean().default(false),
    // Settings
    canViewSettings: Joi.boolean().default(false),
    canCreateSettings: Joi.boolean().default(false),
    canUpdateSettings: Joi.boolean().default(false),
    canDeleteSettings: Joi.boolean().default(false),
    // Notifications
    canViewNotifications: Joi.boolean().default(false),
    canCreateNotifications: Joi.boolean().default(false),
    canUpdateNotifications: Joi.boolean().default(false),
    canDeleteNotifications: Joi.boolean().default(false),
    // AI Assistant
    canViewAiAssistants: Joi.boolean().default(false),
    canCreateAiAssistants: Joi.boolean().default(false),
    canUpdateAiAssistants: Joi.boolean().default(false),
    canDeleteAiAssistants: Joi.boolean().default(false),
    // Taxes
    canViewTaxes: Joi.boolean().default(false),
    canCreateTaxes: Joi.boolean().default(false),
    canUpdateTaxes: Joi.boolean().default(false),
    canDeleteTaxes: Joi.boolean().default(false),
    // Currency
    canViewCurrency: Joi.boolean().default(false),
    canCreateCurrency: Joi.boolean().default(false),
    canUpdateCurrency: Joi.boolean().default(false),
    canDeleteCurrency: Joi.boolean().default(false),
    // Team
    canViewTeams: Joi.boolean().default(false),
    canCreateTeams: Joi.boolean().default(false),
    canUpdateTeams: Joi.boolean().default(false),
    canDeleteTeams: Joi.boolean().default(false),
    // Workflow
    canViewWorkflows: Joi.boolean().default(false),
    canCreateWorkflows: Joi.boolean().default(false),
    canUpdateWorkflows: Joi.boolean().default(false),
    canDeleteWorkflows: Joi.boolean().default(false),
    // Social Media
    canViewSocialAccounts: Joi.boolean().default(false),
    canCreateSocialAccounts: Joi.boolean().default(false),
    canUpdateSocialAccounts: Joi.boolean().default(false),
    canDeleteSocialAccounts: Joi.boolean().default(false),
    canViewSocialPosts: Joi.boolean().default(false),
    canCreateSocialPosts: Joi.boolean().default(false),
    canUpdateSocialPosts: Joi.boolean().default(false),
    canDeleteSocialPosts: Joi.boolean().default(false),
    canViewSocialCampaigns: Joi.boolean().default(false),
    canCreateSocialCampaigns: Joi.boolean().default(false),
    canUpdateSocialCampaigns: Joi.boolean().default(false),
    canDeleteSocialCampaigns: Joi.boolean().default(false),
    // URL Management
    canViewUrls: Joi.boolean().default(false),
    canCreateUrls: Joi.boolean().default(false),
    canUpdateUrls: Joi.boolean().default(false),
    canDeleteUrls: Joi.boolean().default(false),
    // Add more domains/actions as needed
  })
    .optional()
    .default({
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
      canCreateSettings: false,
      canUpdateSettings: false,
      canDeleteSettings: false,
      canViewNotifications: false,
      canCreateNotifications: false,
      canUpdateNotifications: false,
      canDeleteNotifications: false,
      canViewAiAssistants: false,
      canCreateAiAssistants: false,
      canUpdateAiAssistants: false,
      canDeleteAiAssistants: false,
      canViewTaxes: false,
      canCreateTaxes: false,
      canUpdateTaxes: false,
      canDeleteTaxes: false,
      canViewCurrency: false,
      canCreateCurrency: false,
      canUpdateCurrency: false,
      canDeleteCurrency: false,
      canViewTeams: false,
      canCreateTeams: false,
      canUpdateTeams: false,
      canDeleteTeams: false,
      canViewWorkflows: false,
      canCreateWorkflows: false,
      canUpdateWorkflows: false,
      canDeleteWorkflows: false,
      canViewSocialAccounts: false,
      canCreateSocialAccounts: false,
      canUpdateSocialAccounts: false,
      canDeleteSocialAccounts: false,
      canViewSocialPosts: false,
      canCreateSocialPosts: false,
      canUpdateSocialPosts: false,
      canDeleteSocialPosts: false,
      canViewSocialCampaigns: false,
      canCreateSocialCampaigns: false,
      canUpdateSocialCampaigns: false,
      canDeleteSocialCampaigns: false,
      canViewUrls: false,
      canCreateUrls: false,
      canUpdateUrls: false,
      canDeleteUrls: false,
    })
    .custom((value, helpers) => {
      // Convert all values to explicit booleans
      const safeValue = {};
      Object.keys(value).forEach(key => {
        safeValue[key] = value[key] === true;
      });
      return safeValue;
    }),
  teamId: Joi.any().strip(), // Strip this field when validating as we use the param from the URL
})
  .unknown(true)
  .options({ stripUnknown: true }); // Allow unknown fields for flexibility

const updateMemberSchema = Joi.object({
  name: Joi.string().trim(),
  role: Joi.string().valid('member', 'lead', 'admin', 'manager'), // Added 'manager' for consistency
  permissions: Joi.object({
    canViewInvoices: Joi.boolean(),
    canCreateInvoices: Joi.boolean(),
    canUpdateInvoices: Joi.boolean(),
    canDeleteInvoices: Joi.boolean(),
    canViewClients: Joi.boolean(),
    canCreateClients: Joi.boolean(),
    canUpdateClients: Joi.boolean(),
    canDeleteClients: Joi.boolean(),
    canViewPayments: Joi.boolean(),
    canCreatePayments: Joi.boolean(),
    canUpdatePayments: Joi.boolean(),
    canDeletePayments: Joi.boolean(),
    canViewQuotes: Joi.boolean(),
    canCreateQuotes: Joi.boolean(),
    canUpdateQuotes: Joi.boolean(),
    canDeleteQuotes: Joi.boolean(),
    canViewOffers: Joi.boolean(),
    canCreateOffers: Joi.boolean(),
    canUpdateOffers: Joi.boolean(),
    canDeleteOffers: Joi.boolean(),
    canViewMarketing: Joi.boolean(),
    canCreateMarketing: Joi.boolean(),
    canUpdateMarketing: Joi.boolean(),
    canDeleteMarketing: Joi.boolean(),
    canViewReputation: Joi.boolean(),
    canUpdateReputation: Joi.boolean(),
    // Tasks
    canViewTasks: Joi.boolean(),
    canCreateTasks: Joi.boolean(),
    canUpdateTasks: Joi.boolean(),
    canDeleteTasks: Joi.boolean(),
    // Documents
    canViewDocuments: Joi.boolean(),
    canCreateDocuments: Joi.boolean(),
    canUpdateDocuments: Joi.boolean(),
    canDeleteDocuments: Joi.boolean(),
    // Reports
    canViewReports: Joi.boolean(),
    canCreateReports: Joi.boolean(),
    canUpdateReports: Joi.boolean(),
    canDeleteReports: Joi.boolean(),
    // Analytics
    canViewAnalytics: Joi.boolean(),
    canCreateAnalytics: Joi.boolean(),
    canUpdateAnalytics: Joi.boolean(),
    canDeleteAnalytics: Joi.boolean(),
    // Settings
    canViewSettings: Joi.boolean(),
    canCreateSettings: Joi.boolean(),
    canUpdateSettings: Joi.boolean(),
    canDeleteSettings: Joi.boolean(),
    // Notifications
    canViewNotifications: Joi.boolean(),
    canCreateNotifications: Joi.boolean(),
    canUpdateNotifications: Joi.boolean(),
    canDeleteNotifications: Joi.boolean(),
    // AI Assistant
    canViewAiAssistants: Joi.boolean(),
    canCreateAiAssistants: Joi.boolean(),
    canUpdateAiAssistants: Joi.boolean(),
    canDeleteAiAssistants: Joi.boolean(),
    // Taxes
    canViewTaxes: Joi.boolean(),
    canCreateTaxes: Joi.boolean(),
    canUpdateTaxes: Joi.boolean(),
    canDeleteTaxes: Joi.boolean(),
    // Currency
    canViewCurrency: Joi.boolean(),
    canCreateCurrency: Joi.boolean(),
    canUpdateCurrency: Joi.boolean(),
    canDeleteCurrency: Joi.boolean(),
    // Team
    canViewTeams: Joi.boolean(),
    canCreateTeams: Joi.boolean(),
    canUpdateTeams: Joi.boolean(),
    canDeleteTeams: Joi.boolean(),
    // Workflow
    canViewWorkflows: Joi.boolean(),
    canCreateWorkflows: Joi.boolean(),
    canUpdateWorkflows: Joi.boolean(),
    canDeleteWorkflows: Joi.boolean(),
    // Social Media
    canViewSocialAccounts: Joi.boolean(),
    canCreateSocialAccounts: Joi.boolean(),
    canUpdateSocialAccounts: Joi.boolean(),
    canDeleteSocialAccounts: Joi.boolean(),
    canViewSocialPosts: Joi.boolean(),
    canCreateSocialPosts: Joi.boolean(),
    canUpdateSocialPosts: Joi.boolean(),
    canDeleteSocialPosts: Joi.boolean(),
    canViewSocialCampaigns: Joi.boolean(),
    canCreateSocialCampaigns: Joi.boolean(),
    canUpdateSocialCampaigns: Joi.boolean(),
    canDeleteSocialCampaigns: Joi.boolean(),
    // URL Management
    canViewUrls: Joi.boolean(),
    canCreateUrls: Joi.boolean(),
    canUpdateUrls: Joi.boolean(),
    canDeleteUrls: Joi.boolean(),
    // Add more domains/actions as needed
  }),
  enabled: Joi.boolean(),
});

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberSchema,
};
