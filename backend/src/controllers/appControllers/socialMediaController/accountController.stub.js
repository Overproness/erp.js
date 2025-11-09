const SocialAccount = require('@/models/appModels/SocialAccount');

// Stub auth utilities to prevent import errors
const stubAuth = {
  exchangeCodeForToken: async () => ({ accountId: 'stub', accessToken: 'stub' }),
  refreshToken: async () => ({ accessToken: 'stub' }),
  getAccountStats: async () => ({ followers: 0, posts: 0 }),
  revokeAccess: async () => ({ success: true }),
};

const facebookAuth = stubAuth;
const instagramAuth = stubAuth;
const twitterAuth = stubAuth;

// Get all connected accounts
const getAccounts = async (req, res) => {
  try {
    // Fix: Check what auth property is available - auth middleware sets req.companyOwner
    const ownerId = req.companyOwner?._id || req.user?._id || req.auth?.id || 'default-owner';
    const { platform, active } = req.query;

    const filter = { owner: ownerId, removed: false };
    if (platform) filter.platform = platform;
    if (active !== undefined) filter.isActive = active === 'true';

    const accounts = await SocialAccount.find(filter).sort({ created: -1 });

    return res.status(200).json({
      success: true,
      result: {
        items: accounts,
        total: accounts.length,
      },
      message: 'Social media accounts retrieved successfully',
    });
  } catch (error) {
    console.error('Get Accounts Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve social media accounts',
      error: error.message,
    });
  }
};

// Create or connect social media account
const connectAccount = async (req, res) => {
  try {
    const { platform, authCode, redirectUri } = req.body;
    // Fix: Check what auth property is available - auth middleware sets req.companyOwner
    const ownerId = req.companyOwner?._id || req.user?._id || req.auth?.id || 'default-owner';

    if (!platform || !authCode) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Platform and authorization code are required',
      });
    }

    // Stub implementation for now
    const accountData = {
      platform,
      platformAccountId: 'stub_' + Date.now(),
      accountName: `${platform} Account`,
      accessToken: 'stub_token',
    };

    const account = new SocialAccount({
      ...accountData,
      owner: ownerId,
      isActive: true,
    });

    await account.save();

    return res.status(200).json({
      success: true,
      result: account,
      message: 'Social media account connected successfully',
    });
  } catch (error) {
    console.error('Connect Account Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to connect social media account',
      error: error.message,
    });
  }
};

// Stub implementations for other methods
const read = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Account details (stub)' });
};

const update = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Account updated (stub)' });
};

const disconnect = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Account disconnected (stub)' });
};

const refreshToken = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Token refreshed (stub)' });
};

const testConnection = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Connection tested (stub)' });
};

const getSettings = async (req, res) => {
  res.json({
    success: true,
    result: {
      autoPost: false,
      defaultPrivacy: 'public',
      notifications: true,
    },
    message: 'Settings retrieved (stub)',
  });
};

const updateSettings = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Settings updated (stub)' });
};

const getNotificationSettings = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Notification settings (stub)' });
};

const updateNotificationSettings = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Notification settings updated (stub)' });
};

const getApprovalWorkflow = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Approval workflow (stub)' });
};

const updateApprovalWorkflow = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Approval workflow updated (stub)' });
};

const getFacebookPages = async (req, res) => {
  res.json({ success: true, result: [], message: 'Facebook pages (stub)' });
};

const getInstagramBusinessAccounts = async (req, res) => {
  res.json({ success: true, result: [], message: 'Instagram business accounts (stub)' });
};

const getTwitterProfile = async (req, res) => {
  res.json({ success: true, result: {}, message: 'Twitter profile (stub)' });
};

module.exports = {
  getAccounts,
  connectAccount,
  read,
  update,
  disconnect,
  refreshToken,
  testConnection,
  getSettings,
  updateSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getApprovalWorkflow,
  updateApprovalWorkflow,
  getFacebookPages,
  getInstagramBusinessAccounts,
  getTwitterProfile,
};
