// @ts-nocheck

import { facebookAuth } from '@/utils/socialMedia/facebookAuth';
import { instagramAuth } from '@/utils/socialMedia/instagramAuth';
import { twitterAuth } from '@/utils/socialMedia/twitterAuth';
import SocialAccount from '@/models/appModels/SocialAccount';
// Create or connect social media account
const connectAccount = async (req, res) => {
  try {
    const { platform, authCode, redirectUri } = req.body;
    const ownerId = req.admin._id;

    if (!platform || !authCode) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Platform and authorization code are required',
      });
    }

    let accountData;

    // Get account data and tokens based on platform
    switch (platform) {
      case 'facebook':
        accountData = await facebookAuth.exchangeCodeForToken(authCode, redirectUri);
        break;
      case 'instagram':
        accountData = await instagramAuth.exchangeCodeForToken(authCode, redirectUri);
        break;
      case 'twitter':
        accountData = await twitterAuth.exchangeCodeForToken(authCode, redirectUri);
        break;
      default:
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Unsupported platform',
        });
    }

    // Check if account already exists
    const existingAccount = await SocialAccount.findOne({
      platform,
      platformAccountId: accountData.platformAccountId,
      owner: ownerId,
      removed: false,
    });

    if (existingAccount) {
      // Update existing account
      existingAccount.accessToken = accountData.accessToken;
      existingAccount.refreshToken = accountData.refreshToken;
      existingAccount.tokenExpires = accountData.tokenExpires;
      existingAccount.accountName = accountData.accountName;
      existingAccount.accountHandle = accountData.accountHandle;
      existingAccount.accountImage = accountData.accountImage;
      existingAccount.permissions = accountData.permissions;
      existingAccount.isActive = true;
      existingAccount.lastSyncAt = new Date();

      await existingAccount.save();

      return res.status(200).json({
        success: true,
        result: existingAccount,
        message: 'Social media account updated successfully',
      });
    }

    // Create new account
    const newAccount = new SocialAccount({
      platform,
      platformAccountId: accountData.platformAccountId,
      accountName: accountData.accountName,
      accountHandle: accountData.accountHandle,
      accountImage: accountData.accountImage,
      accessToken: accountData.accessToken,
      refreshToken: accountData.refreshToken,
      tokenExpires: accountData.tokenExpires,
      permissions: accountData.permissions,
      owner: ownerId,
    });

    await newAccount.save();

    // Fetch initial account stats
    try {
      await syncAccountStats(newAccount);
    } catch (syncError) {
      console.warn('Failed to sync initial stats:', syncError.message);
    }

    return res.status(201).json({
      success: true,
      result: newAccount,
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

// Get all connected accounts
const getAccounts = async (req, res) => {
  try {
    const ownerId = req.admin._id;
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

// Get single account details
const getAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const account = await SocialAccount.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media account not found',
      });
    }

    return res.status(200).json({
      success: true,
      result: account,
      message: 'Social media account retrieved successfully',
    });

  } catch (error) {
    console.error('Get Account Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to retrieve social media account',
      error: error.message,
    });
  }
};

// Update account settings
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;
    const updateData = req.body;

    const account = await SocialAccount.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media account not found',
      });
    }

    // Update allowed fields
    const allowedFields = ['isActive', 'settings'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'settings') {
          account.settings = { ...account.settings, ...updateData.settings };
        } else {
          account[field] = updateData[field];
        }
      }
    });

    await account.save();

    return res.status(200).json({
      success: true,
      result: account,
      message: 'Social media account updated successfully',
    });

  } catch (error) {
    console.error('Update Account Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to update social media account',
      error: error.message,
    });
  }
};

// Disconnect/remove account
const disconnectAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const account = await SocialAccount.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media account not found',
      });
    }

    // Soft delete
    account.removed = true;
    account.isActive = false;
    await account.save();

    return res.status(200).json({
      success: true,
      result: null,
      message: 'Social media account disconnected successfully',
    });

  } catch (error) {
    console.error('Disconnect Account Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to disconnect social media account',
      error: error.message,
    });
  }
};

// Sync account statistics
const syncStats = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.admin._id;

    const account = await SocialAccount.findOne({
      _id: id,
      owner: ownerId,
      removed: false,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Social media account not found',
      });
    }

    await syncAccountStats(account);

    return res.status(200).json({
      success: true,
      result: account,
      message: 'Account statistics synced successfully',
    });

  } catch (error) {
    console.error('Sync Stats Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to sync account statistics',
      error: error.message,
    });
  }
};

// Helper function to sync account stats
const syncAccountStats = async (account) => {
  try {
    let stats;

    switch (account.platform) {
      case 'facebook':
        stats = await facebookAuth.getAccountStats(account.accessToken, account.platformAccountId);
        break;
      case 'instagram':
        stats = await instagramAuth.getAccountStats(account.accessToken, account.platformAccountId);
        break;
      case 'twitter':
        stats = await twitterAuth.getAccountStats(account.accessToken, account.platformAccountId);
        break;
      default:
        throw new Error('Unsupported platform for stats sync');
    }

    await account.updateStats(stats);
    return stats;

  } catch (error) {
    console.error(`Failed to sync stats for ${account.platform} account:`, error);
    throw error;
  }
};

// Get auth URL for platform
const getAuthUrl = async (req, res) => {
  try {
    const { platform } = req.params;
    const { redirectUri } = req.query;

    let authUrl;

    switch (platform) {
      case 'facebook':
        authUrl = facebookAuth.getAuthUrl(redirectUri);
        break;
      case 'instagram':
        authUrl = instagramAuth.getAuthUrl(redirectUri);
        break;
      case 'twitter':
        authUrl = twitterAuth.getAuthUrl(redirectUri);
        break;
      default:
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Unsupported platform',
        });
    }

    return res.status(200).json({
      success: true,
      result: { authUrl },
      message: 'Authorization URL generated successfully',
    });

  } catch (error) {
    console.error('Get Auth URL Error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to generate authorization URL',
      error: error.message,
    });
  }
};

export = {
  connectAccount,
  getAccounts,
  getAccount,
  updateAccount,
  disconnectAccount,
  syncStats,
  getAuthUrl,
};
