import mongoose from 'mongoose';
import { PIINormalizer } from '@/utils/piiNormalizer';
import { QueueManager } from '@/utils/queueManager';
import { ServerConversionEvent } from '@/types/marketingProviders';
import { MockSandboxProvider } from '@/services/marketingProviders/MockSandboxProvider';
import { MetaConversionsService } from './MetaConversionsService';
import { TikTokEventsService } from './TikTokEventsService';
import { GoogleEnhancedConversionsService } from './GoogleEnhancedConversionsService';

export interface DispatchConversionParams {
  ownerId: string | mongoose.Types.ObjectId;
  eventName: string;
  eventId?: string;
  user?: {
    email?: string;
    phone?: string;
    clientIp?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
    ttclid?: string;
    gclid?: string;
  };
  customData?: {
    currency?: string;
    value?: number;
    orderId?: string;
    contents?: Array<{ id: string; quantity: number; itemPrice: number }>;
  };
  sourceUrl?: string;
  actionSource?: 'website' | 'system' | 'offline';
  async?: boolean;
}

export interface DispatchResult {
  eventId: string;
  eventName: string;
  dispatchedTo: string[];
  results: Record<string, { success: boolean; message?: string }>;
}

/**
 * ConversionsGateway
 *
 * Unified server-to-server conversion pipeline.
 * Formats, hashes PII, deduplicates, and fans out conversion events across Meta CAPI,
 * TikTok Events, and Google Enhanced Conversions with sandbox fallback.
 */
export class ConversionsGateway {
  private static instance: ConversionsGateway;

  private constructor() {
    this.registerQueueWorker();
  }

  public static getInstance(): ConversionsGateway {
    if (!ConversionsGateway.instance) {
      ConversionsGateway.instance = new ConversionsGateway();
    }
    return ConversionsGateway.instance;
  }

  /**
   * Registers async BullMQ / in-process queue handler
   */
  private registerQueueWorker(): void {
    const queue = QueueManager.getInstance();
    queue.registerHandler('marketing:conversion-event', async (job) => {
      return this.dispatchDirect(job.data);
    });
  }

  /**
   * Main entrypoint: dispatches an event synchronously or enqueues asynchronously
   */
  public async trackConversion(params: DispatchConversionParams): Promise<DispatchResult> {
    if (params.async) {
      const eventId = params.eventId || PIINormalizer.generateEventId('conv', params.customData?.orderId);
      const enqueuedParams = { ...params, eventId, async: false };

      await QueueManager.getInstance().enqueue('marketing:conversion-event', enqueuedParams);

      return {
        eventId,
        eventName: params.eventName,
        dispatchedTo: ['async_queue'],
        results: { queue: { success: true, message: 'Event successfully enqueued for processing' } },
      };
    }

    return this.dispatchDirect(params);
  }

  /**
   * Direct execution of conversion dispatch
   */
  public async dispatchDirect(params: DispatchConversionParams): Promise<DispatchResult> {
    const { ownerId, eventName, user, customData, sourceUrl, actionSource } = params;

    const eventId = params.eventId || PIINormalizer.generateEventId('conv', customData?.orderId);
    const emailHash = user?.email ? PIINormalizer.hashEmail(user.email) : undefined;
    const phoneHash = user?.phone ? PIINormalizer.hashPhone(user.phone) : undefined;

    const conversionEvent: ServerConversionEvent = {
      eventName,
      eventTime: Math.floor(Date.now() / 1000),
      eventId,
      eventSourceUrl: sourceUrl,
      actionSource: actionSource || 'system',
      userData: {
        emailHash,
        phoneHash,
        clientIp: user?.clientIp,
        clientUserAgent: user?.clientUserAgent,
        fbp: user?.fbp,
        fbc: user?.fbc,
        ttclid: user?.ttclid,
        gclid: user?.gclid,
      },
      customData,
    };

    const dispatchedTo: string[] = [];
    const results: Record<string, { success: boolean; message?: string }> = {};

    let integrations: any[] = [];
    if (mongoose.connection.readyState === 1) {
      try {
        const MarketingIntegration = mongoose.model('MarketingIntegration');
        integrations = await MarketingIntegration.find({
          owner: ownerId,
          removed: false,
        });
      } catch {
        // If DB or model not available in current test harness
      }
    }

    const platformConfigs = new Map<string, any>();
    for (const item of integrations) {
      platformConfigs.set(item.platform, item);
    }

    // 1. Meta CAPI
    const metaRecord = platformConfigs.get('facebook') || platformConfigs.get('instagram');
    if (metaRecord && metaRecord.mode === 'LIVE') {
      const creds = metaRecord.getDecryptedCredentials();
      if (creds?.pixelId && creds?.accessToken) {
        try {
          const metaService = new MetaConversionsService({
            pixelId: creds.pixelId,
            accessToken: creds.accessToken,
            testEventCode: creds.testEventCode,
          });
          const res = await metaService.sendEvent(conversionEvent);
          dispatchedTo.push('meta');
          results.meta = { success: true, message: `Dispatched to Meta CAPI (trace: ${res.fbtraceId || 'ok'})` };
        } catch (err: any) {
          dispatchedTo.push('meta');
          results.meta = { success: false, message: err.message };
        }
      }
    } else {
      // Mock Sandbox fallback
      const sandbox = new MockSandboxProvider('facebook');
      const res = await sandbox.sendServerEvent({}, conversionEvent);
      dispatchedTo.push('meta_sandbox');
      results.meta_sandbox = { success: res.success, message: res.message };
    }

    // 2. TikTok Events API
    const tiktokRecord = platformConfigs.get('tiktok');
    if (tiktokRecord && tiktokRecord.mode === 'LIVE') {
      const creds = tiktokRecord.getDecryptedCredentials();
      if (creds?.pixelCode && creds?.accessToken) {
        try {
          const tiktokService = new TikTokEventsService({
            pixelCode: creds.pixelCode,
            accessToken: creds.accessToken,
            testEventCode: creds.testEventCode,
          });
          await tiktokService.sendEvent(conversionEvent);
          dispatchedTo.push('tiktok');
          results.tiktok = { success: true, message: 'Dispatched to TikTok Events API' };
        } catch (err: any) {
          dispatchedTo.push('tiktok');
          results.tiktok = { success: false, message: err.message };
        }
      }
    } else {
      const sandbox = new MockSandboxProvider('tiktok');
      const res = await sandbox.sendServerEvent({}, conversionEvent);
      dispatchedTo.push('tiktok_sandbox');
      results.tiktok_sandbox = { success: res.success, message: res.message };
    }

    // 3. Google Enhanced Conversions
    const googleRecord = platformConfigs.get('google');
    if (googleRecord && googleRecord.mode === 'LIVE') {
      const creds = googleRecord.getDecryptedCredentials();
      if (creds?.customerId && creds?.conversionActionId) {
        try {
          const googleService = new GoogleEnhancedConversionsService({
            customerId: creds.customerId,
            conversionActionId: creds.conversionActionId,
            developerToken: creds.developerToken,
            accessToken: creds.accessToken,
          });
          await googleService.sendEvent(conversionEvent);
          dispatchedTo.push('google');
          results.google = { success: true, message: 'Dispatched to Google Enhanced Conversions' };
        } catch (err: any) {
          dispatchedTo.push('google');
          results.google = { success: false, message: err.message };
        }
      }
    } else {
      const sandbox = new MockSandboxProvider('google');
      const res = await sandbox.sendServerEvent({}, conversionEvent);
      dispatchedTo.push('google_sandbox');
      results.google_sandbox = { success: res.success, message: res.message };
    }

    return {
      eventId,
      eventName,
      dispatchedTo,
      results,
    };
  }
}

export default ConversionsGateway.getInstance();
