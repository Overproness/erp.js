const mongoose = require('mongoose');
const Model = mongoose.model('AppDocument');
const URL = mongoose.model('URL');
const urlService = require('@/services/urlService');

/**
 * Generate shareable URL for document using URL module
 * Integrates with the URL module for tracking and analytics
 */
const generateDocumentShareURL = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, expiresAt, password, maxViews, analytics } = req.body;

    // Get owner from either user or companyOwner context
    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    // Find the document
    const document = await Model.findOne({
      _id: id,
      owner: owner,
      removed: false,
    }).select('_id title fileName fileType owner companyID');

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Generate short code for the URL
    const shortCode = await urlService.generateShortCode();

    // Create URL in URL module - use public share endpoint
    // Note: The short URL will redirect to this public endpoint
    const targetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/public/document/shared/${shortCode}`;

    const urlData = {
      originalUrl: targetUrl,
      shortCode: shortCode,
      title: `Share: ${document.title}`,
      description: `Shared document: ${document.fileName}`,
      owner: owner,
      createdBy: owner,
      companyID: document.companyID,
      category: 'document_share',
      tags: ['document', 'share', document.fileType],
      customization: {
        password: password || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxClicks: maxViews || null,
      },
      metadata: {
        documentId: document._id,
        documentTitle: document.title,
        fileName: document.fileName,
        fileType: document.fileType,
        permissions: permissions || ['read'],
        sharedAt: new Date(),
      },
      trackingEnabled: analytics !== false, // Enable tracking by default
      isActive: true,
    };

    const url = new URL(urlData);
    const savedUrl = await url.save();

    // Generate short URL
    const shortUrl = `${req.protocol}://${req.get('host')}/s/${savedUrl.shortCode}`;

    return res.status(200).json({
      success: true,
      result: {
        urlId: savedUrl._id,
        shortUrl: shortUrl,
        shortCode: savedUrl.shortCode,
        originalUrl: targetUrl,
        documentId: document._id,
        documentTitle: document.title,
        permissions: permissions || ['read'],
        expiresAt: savedUrl.customization?.expiresAt || null,
        maxViews: savedUrl.customization?.maxClicks || null,
        hasPassword: !!password,
        trackingEnabled: savedUrl.trackingEnabled,
        createdAt: savedUrl.created,
      },
      message: 'Document share URL generated successfully',
    });
  } catch (error) {
    console.error('Generate document share URL error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

/**
 * Get document through shared URL (public endpoint)
 */
const accessSharedDocument = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { password } = req.body;

    // Find URL by shortCode
    const url = await URL.findOne({
      shortCode: shortCode,
      isActive: true,
      removed: false,
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Share link not found or has been disabled',
      });
    }

    // Check if URL has expired
    if (url.customization?.expiresAt && new Date() > new Date(url.customization.expiresAt)) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'This share link has expired',
      });
    }

    // Check if max clicks reached
    if (url.customization?.maxClicks && url.clicks >= url.customization.maxClicks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'This share link has reached its maximum view limit',
      });
    }

    // Check password if required
    if (url.customization?.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Password required to access this document',
          requiresPassword: true,
        });
      }

      // Simple password check (in production, use bcrypt)
      if (password !== url.customization.password) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Incorrect password',
        });
      }
    }

    // Get document
    const documentId = url.metadata?.documentId;
    if (!documentId) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document reference not found',
      });
    }

    const document = await Model.findOne({
      _id: documentId,
      removed: false,
    }).select('title description fileName fileType fileSize documentType tags created');

    if (!document) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document not found',
      });
    }

    // Update URL clicks
    url.clicks = (url.clicks || 0) + 1;
    url.lastClickedAt = new Date();
    await url.save();

    // Return document metadata (not the file itself)
    return res.status(200).json({
      success: true,
      result: {
        document: {
          id: document._id,
          title: document.title,
          description: document.description,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          documentType: document.documentType,
          tags: document.tags,
          createdAt: document.created,
        },
        downloadUrl: `${req.protocol}://${req.get(
          'host'
        )}/api/document/shared/${shortCode}/download`,
        permissions: url.metadata?.permissions || ['read'],
        viewCount: url.clicks,
      },
      message: 'Document accessed successfully',
    });
  } catch (error) {
    console.error('Access shared document error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

/**
 * Download shared document
 */
const downloadSharedDocument = async (req, res) => {
  try {
    const { shortCode } = req.params;

    // Find URL by shortCode
    const url = await URL.findOne({
      shortCode: shortCode,
      isActive: true,
      removed: false,
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Share link not found or has been disabled',
      });
    }

    // Security checks (same as accessSharedDocument)
    if (url.customization?.expiresAt && new Date() > new Date(url.customization.expiresAt)) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'This share link has expired',
      });
    }

    if (url.customization?.maxClicks && url.clicks >= url.customization.maxClicks) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'This share link has reached its maximum view limit',
      });
    }

    // Get document
    const documentId = url.metadata?.documentId;
    if (!documentId) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Document reference not found',
      });
    }

    // Use the existing download controller
    const downloadDocument = require('./downloadDocument');
    req.params.id = documentId;
    req.isPublicShare = true; // Flag to bypass permission checks

    return await downloadDocument(req, res);
  } catch (error) {
    console.error('Download shared document error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

/**
 * List all share URLs for a document
 */
const listDocumentShareURLs = async (req, res) => {
  try {
    const { id } = req.params;

    const owner =
      (req.user && (req.user.companyOwner || req.user._id)) ||
      (req.companyOwner && req.companyOwner._id);

    if (!owner) {
      return res.status(401).json({
        success: false,
        result: null,
        message: 'Owner context not found - authentication required',
      });
    }

    // Find all URLs for this document
    const urls = await URL.find({
      'metadata.documentId': id,
      owner: owner,
      removed: false,
    }).sort({ created: -1 });

    const shareUrls = urls.map((url) => ({
      urlId: url._id,
      shortUrl: `${req.protocol}://${req.get('host')}/s/${url.shortId}`,
      shortId: url.shortId,
      title: url.title,
      clicks: url.clicks,
      isActive: url.isActive,
      expiresAt: url.customization?.expiresAt || null,
      maxViews: url.customization?.maxClicks || null,
      hasPassword: !!url.customization?.password,
      createdAt: url.created,
      lastClickedAt: url.lastClickedAt,
    }));

    return res.status(200).json({
      success: true,
      result: shareUrls,
      message: `Found ${shareUrls.length} share URL(s) for this document`,
    });
  } catch (error) {
    console.error('List document share URLs error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
      error,
    });
  }
};

module.exports = {
  generateDocumentShareURL,
  accessSharedDocument,
  downloadSharedDocument,
  listDocumentShareURLs,
};
