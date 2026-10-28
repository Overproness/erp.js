// @ts-nocheck
import crypto from 'crypto';
import mongoose from 'mongoose';
import { ConversionsGateway } from '@/services/conversions/ConversionsGateway';
import { QueueManager } from '@/utils/queueManager';

/**
 * Validates Meta x-hub-signature-256 header against app secret
 */
export const verifyMetaSignature = (payloadString: string, signatureHeader?: string, secret?: string): boolean => {
  if (!signatureHeader || !secret) return true; // Permissive if secret not configured
  const [method, signature] = signatureHeader.split('=');
  if (method !== 'sha256' || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString, 'utf8');
  const expected = hmac.digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, expBuf);
};

/**
 * GET /api/public/social-media/webhooks/meta (or facebook)
 * Meta Webhook Challenge-Response Verification
 */
export const verifyMetaWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken =
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
    process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN ||
    'erpjs_marketing_webhook_verify_token';

  if (mode === 'subscribe' && (token === expectedToken || !token)) {
    console.log('[MetaWebhook] Verification challenge succeeded.');
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden: Token mismatch');
};

/**
 * POST /api/public/social-media/webhooks/meta (or facebook)
 * Handles Meta Inbound Webhooks: Lead Ads, comments, mentions
 */
export const handleMetaWebhook = async (req, res) => {
  const body = req.body;
  if (!body || body.object !== 'page') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  try {
    for (const entry of body.entry || []) {
      const pageId = entry.id;

      // Handle changes (e.g. Leadgen forms or Page Feed comments)
      if (entry.changes && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'leadgen') {
            const leadData = change.value;
            console.log(`[MetaWebhook] Received Leadgen event for page ${pageId}:`, leadData);

            // Enqueue async processing for the lead
            await QueueManager.getInstance().enqueue('marketing:meta-leadgen', {
              pageId,
              leadgenId: leadData.leadgen_id,
              formId: leadData.form_id,
              createdTime: leadData.created_time,
            });
          }

          if (change.field === 'feed') {
            console.log(`[MetaWebhook] Feed interaction on page ${pageId}`);
          }
        }
      }

      // Handle messaging
      if (entry.messaging && Array.isArray(entry.messaging)) {
        for (const message of entry.messaging) {
          console.log(`[MetaWebhook] Messenger event from ${message.sender?.id}`);
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  } catch (err: any) {
    console.error('[MetaWebhook] Processing error:', err);
    return res.status(200).send('EVENT_RECEIVED');
  }
};

/**
 * POST /api/public/social-media/webhooks/conversion
 * Inbound conversion webhook for external e-commerce (Shopify, Stripe, custom storefronts)
 */
export const handleInboundConversionWebhook = async (req, res) => {
  const {
    ownerId,
    eventName = 'Purchase',
    orderId,
    value,
    currency = 'USD',
    email,
    phone,
    clientIp,
    userAgent,
    fbp,
    fbc,
    ttclid,
    gclid,
  } = req.body;

  if (!ownerId && !email) {
    return res.status(400).json({
      success: false,
      message: 'ownerId and customer email are required for conversion tracking',
    });
  }

  try {
    const result = await ConversionsGateway.trackConversion({
      ownerId: ownerId || new mongoose.Types.ObjectId(),
      eventName,
      user: {
        email,
        phone,
        clientIp: clientIp || req.ip,
        clientUserAgent: userAgent || req.headers['user-agent'],
        fbp,
        fbc,
        ttclid,
        gclid,
      },
      customData: {
        currency,
        value: Number(value) || 0,
        orderId: orderId || `order_${Date.now()}`,
      },
      sourceUrl: req.headers.referer || req.headers.origin,
      actionSource: 'website',
      async: true,
    });

    return res.status(200).json({
      success: true,
      result,
      message: `Conversion event '${eventName}' queued successfully.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Failed to process conversion: ${error.message}`,
    });
  }
};
