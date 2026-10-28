// @ts-nocheck
import mongoose from 'mongoose';
import { AdCampaignGateway } from '../../services/ads/AdCampaignGateway';

/**
 * AdCampaignController
 *
 * REST Controller for paid ad campaign orchestration across Meta, Google, TikTok, and X.
 */
class AdCampaignController {
  /**
   * Create and deploy a paid ad campaign
   * POST /api/marketing/ad-campaigns
   */
  async createCampaign(req, res) {
    try {
      const ownerId = req.companyOwner?._id || req.admin?._id;
      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const {
        name,
        description,
        objective = 'OUTCOME_TRAFFIC',
        platforms = ['facebook', 'google'],
        budget = { amount: 50, type: 'DAILY', currency: 'USD' },
        targeting = {},
        creatives = [],
        startDate,
        endDate,
      } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Campaign name is required' });
      }

      let campaignDoc: any = null;
      if (mongoose.connection.readyState === 1) {
        const AdCampaign = mongoose.model('AdCampaign');
        campaignDoc = new AdCampaign({
          name,
          description: description || `Ad campaign for ${name}`,
          objective,
          platforms,
          budget,
          targeting,
          creatives,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          owner: ownerId,
          status: 'ACTIVE',
        });
        await campaignDoc.save();
      }

      const campaignId = campaignDoc?._id?.toString() || `camp_${Date.now()}`;

      // Dispatch multi-platform creation
      const dispatchResult = await AdCampaignGateway.getInstance().deployCampaign({
        ownerId,
        campaignId,
        name,
        objective,
        platforms,
        budget,
        targeting,
        creatives,
      });

      return res.status(201).json({
        success: true,
        message: 'Ad campaign created and deployed successfully',
        result: campaignDoc || {
          _id: campaignId,
          name,
          objective,
          platforms,
          budget,
          status: 'ACTIVE',
          platformCampaignIds: dispatchResult.platforms,
        },
        dispatch: dispatchResult,
      });
    } catch (error) {
      console.error('Error creating ad campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create ad campaign',
        error: error.message,
      });
    }
  }

  /**
   * Get all paid ad campaigns
   * GET /api/marketing/ad-campaigns
   */
  async getCampaigns(req, res) {
    try {
      const ownerId = req.companyOwner?._id || req.admin?._id;
      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      let campaigns: any[] = [];
      if (mongoose.connection.readyState === 1) {
        try {
          const AdCampaign = mongoose.model('AdCampaign');
          campaigns = await AdCampaign.find({
            owner: ownerId,
            removed: false,
          })
            .sort({ createdAt: -1 })
            .lean();
        } catch {}
      }

      return res.status(200).json({
        success: true,
        result: campaigns,
        data: campaigns,
        pagination: {
          total: campaigns.length,
          page: 1,
          limit: campaigns.length || 10,
        },
      });
    } catch (error) {
      console.error('Error fetching ad campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch ad campaigns',
        error: error.message,
      });
    }
  }

  /**
   * Get campaign by ID
   * GET /api/marketing/ad-campaigns/:id
   */
  async getCampaignById(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      let campaign: any = null;
      if (mongoose.connection.readyState === 1) {
        const AdCampaign = mongoose.model('AdCampaign');
        campaign = await AdCampaign.findOne({ _id: id, owner: ownerId, removed: false }).lean();
      }

      if (!campaign) {
        return res.status(404).json({ success: false, message: 'Ad campaign not found' });
      }

      return res.status(200).json({ success: true, result: campaign });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update campaign budget or configuration
   * PUT /api/marketing/ad-campaigns/:id
   */
  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.companyOwner?._id || req.admin?._id;
      const updates = req.body;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      let campaign: any = null;
      if (mongoose.connection.readyState === 1) {
        const AdCampaign = mongoose.model('AdCampaign');
        campaign = await AdCampaign.findOne({ _id: id, owner: ownerId, removed: false });
        if (campaign) {
          if (updates.name) campaign.name = updates.name;
          if (updates.description) campaign.description = updates.description;
          if (updates.budget) campaign.budget = { ...campaign.budget, ...updates.budget };
          if (updates.status) campaign.status = updates.status;
          if (updates.targeting) campaign.targeting = { ...campaign.targeting, ...updates.targeting };
          await campaign.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        result: campaign,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Toggle campaign status (ACTIVE / PAUSED)
   * POST /api/marketing/ad-campaigns/:id/status
   */
  async toggleCampaignStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const targetStatus = status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
      await AdCampaignGateway.getInstance().toggleStatus(ownerId, id, targetStatus);

      return res.status(200).json({
        success: true,
        message: `Campaign status updated to ${targetStatus}`,
        status: targetStatus,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Sync telemetry performance metrics for campaign
   * POST /api/marketing/ad-campaigns/:id/telemetry/sync
   */
  async syncTelemetry(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const telemetry = await AdCampaignGateway.getInstance().syncTelemetry(ownerId, id);

      return res.status(200).json({
        success: true,
        message: 'Telemetry metrics synchronized successfully',
        result: telemetry,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete campaign
   * DELETE /api/marketing/ad-campaigns/:id
   */
  async deleteCampaign(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.companyOwner?._id || req.admin?._id;

      if (!ownerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (mongoose.connection.readyState === 1) {
        const AdCampaign = mongoose.model('AdCampaign');
        await AdCampaign.findOneAndUpdate(
          { _id: id, owner: ownerId },
          { $set: { removed: true, status: 'ARCHIVED' } }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
        result: { id },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export = new AdCampaignController();
