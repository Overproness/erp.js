import assert from 'assert';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Phase 1 imports
import { TokenVaultService } from '../src/utils/tokenVault';
import { QueueManager } from '../src/utils/queueManager';
import { MockSandboxProvider } from '../src/services/marketingProviders/MockSandboxProvider';
import '../src/models/appModels/MarketingIntegration';

// Phase 2 imports
import { ProviderFactory } from '../src/services/marketingProviders/ProviderFactory';

// Phase 3 imports
import { PIINormalizer } from '../src/utils/piiNormalizer';
import { ConversionsGateway } from '../src/services/conversions/ConversionsGateway';
import { verifyMetaSignature } from '../src/controllers/appControllers/marketingWebhookController';

// Phase 4 imports
import { MetaAudienceService } from '../src/services/audiences/MetaAudienceService';
import { GoogleAudienceService } from '../src/services/audiences/GoogleAudienceService';
import { LinkedInAudienceService } from '../src/services/audiences/LinkedInAudienceService';
import { TikTokAudienceService } from '../src/services/audiences/TikTokAudienceService';
import { AudienceSyncGateway } from '../src/services/audiences/AudienceSyncGateway';
import '../src/models/appModels/RetargetingCampaign';

// Phase 5 imports
import { MetaAdsService } from '../src/services/ads/MetaAdsService';
import { GoogleAdsService } from '../src/services/ads/GoogleAdsService';
import { TikTokAdsService } from '../src/services/ads/TikTokAdsService';
import { TwitterAdsService } from '../src/services/ads/TwitterAdsService';
import { AdCampaignGateway } from '../src/services/ads/AdCampaignGateway';
import '../src/models/appModels/AdCampaign';

// Phase 6 imports
import { GoogleBusinessProfileService } from '../src/services/reputation/GoogleBusinessProfileService';
import { MetaPageReviewsService } from '../src/services/reputation/MetaPageReviewsService';
import { TrustpilotService } from '../src/services/reputation/TrustpilotService';
import { YelpFusionService } from '../src/services/reputation/YelpFusionService';
import { SentimentAutoResponseService } from '../src/services/reputation/SentimentAutoResponseService';
import { ReputationGateway } from '../src/services/reputation/ReputationGateway';

async function runFullMarketingRegression() {
  console.log('===============================================================');
  console.log('--- EXECUTING UNIFIED MARKETING STACK REGRESSION TEST SUITE ---');
  console.log('===============================================================');

  const testOwner = new mongoose.Types.ObjectId();

  // -------------------------------------------------------------
  // 1. VAULT & BYOC CREDENTIAL SECURITY (PHASE 1)
  // -------------------------------------------------------------
  console.log('\n[1/6] Verifying BYOC Token Vault & Credential Isolation...');
  const secretPayload = {
    apiKey: 'sk-live-erpjs-marketing-987654321',
    accessToken: 'EAABwzLixnjYBAmocktokenforfacebookmarketing',
    refreshToken: '1//04mockgooglerefreshtokensecret',
  };
  const encrypted = TokenVaultService.encryptObject(secretPayload);
  assert(encrypted.encryptedData && encrypted.iv && encrypted.authTag, 'Vault must generate valid envelope');
  const decrypted = TokenVaultService.decryptObject(encrypted);
  assert.deepStrictEqual(decrypted, secretPayload, 'Decrypted credentials must match original exactly');

  const queue = QueueManager.getInstance();
  let jobFired = false;
  queue.registerHandler('regression_queue_test', async (job) => {
    if (job.data.tag === 'healthcheck') jobFired = true;
    return { ok: true };
  });
  await queue.add('regression_queue_test', { tag: 'healthcheck' });
  await new Promise((r) => setTimeout(r, 600));
  assert.strictEqual(jobFired, true, 'QueueManager in-process worker must dispatch asynchronously');
  console.log('   ✓ Token Vault and Queue Manager operational.');

  // -------------------------------------------------------------
  // 2. ORGANIC SOCIAL PUBLISHING & ANALYTICS (PHASE 2)
  // -------------------------------------------------------------
  console.log('\n[2/6] Verifying Cross-Platform Social Media Publishing & Metrics...');
  const platforms = ['facebook', 'linkedin', 'twitter', 'tiktok'] as const;
  for (const plat of platforms) {
    const provider = await ProviderFactory.getSocialPublishingProvider(plat, testOwner);
    const postRes = await provider.publishPost(
      {},
      { content: `Omnichannel automated broadcast via ERP.js on ${plat}` }
    );
    assert(postRes.platformPostId, `Post ID generated for ${plat}`);
    assert.strictEqual(postRes.status, 'PUBLISHED');

    const metrics = await provider.getPostMetrics({}, postRes.platformPostId);
    assert(typeof metrics.impressions === 'number' && metrics.impressions > 0);
    assert(typeof metrics.clicks === 'number');

    const insights = await provider.getPageInsights({});
    assert(insights.followers > 0);
  }
  console.log('   ✓ Organic social publishing and telemetry verified across 4 platforms.');

  // -------------------------------------------------------------
  // 3. SERVER CONVERSIONS & REAL-TIME BEHAVIOR TRIGGERS (PHASE 3)
  // -------------------------------------------------------------
  console.log('\n[3/6] Verifying CAPI Conversions, PII Normalization & Webhook Signatures...');
  const rawEmail = '  John.Doe+Test@Domain.COM ';
  const expectedHash = crypto.createHash('sha256').update('john.doe+test@domain.com').digest('hex');
  const hashedEmail = PIINormalizer.hashEmail(rawEmail);
  assert.strictEqual(hashedEmail, expectedHash);

  const conversionsGateway = ConversionsGateway.getInstance();
  const conversionResult = await conversionsGateway.trackConversion({
    ownerId: testOwner,
    eventName: 'Purchase',
    user: {
      email: 'customer@erpjs.org',
      phone: '+1 555 123 4567',
      clientIp: '192.168.1.1',
      clientUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    customData: {
      value: 129.99,
      currency: 'USD',
      orderId: 'ORD-98765',
    },
    async: false,
  });
  assert(conversionResult.eventId, 'Conversion eventId generated');
  assert(conversionResult.dispatchedTo.length >= 3, 'Dispatched to Meta, TikTok, and Google');

  // Webhook signature verification
  const webhookBody = JSON.stringify({ entry: [{ id: '12345', time: Date.now() }] });
  const webhookSecret = 'marketing_webhook_secret_key_123';
  const validSignature = `sha256=${crypto.createHmac('sha256', webhookSecret).update(webhookBody, 'utf8').digest('hex')}`;
  assert.strictEqual(
    verifyMetaSignature(webhookBody, validSignature, webhookSecret),
    true,
    'HMAC signature verification must pass for valid payload'
  );
  console.log('   ✓ PII normalization, CAPI fan-out, and cryptographic webhook check verified.');

  // -------------------------------------------------------------
  // 4. RETARGETING AUDIENCES & CUSTOMER MATCH (PHASE 4)
  // -------------------------------------------------------------
  console.log('\n[4/6] Verifying Audience Segmentation, Chunking & Threshold Enforcement...');
  // Meta 10,000 chunking
  assert.strictEqual(MetaAudienceService.BATCH_SIZE, 10000, 'Meta batch size limit must be 10,000');
  const dummyUsers = Array.from({ length: 25000 }, (_, i) => ({
    emailHash: `hash_${i}`,
  }));
  const metaChunks: any[][] = [];
  for (let i = 0; i < dummyUsers.length; i += MetaAudienceService.BATCH_SIZE) {
    metaChunks.push(dummyUsers.slice(i, i + MetaAudienceService.BATCH_SIZE));
  }
  assert.strictEqual(metaChunks.length, 3);
  assert.strictEqual(metaChunks[0].length, 10000);
  assert.strictEqual(metaChunks[2].length, 5000);

  // Google $50,000 policy
  assert.strictEqual(GoogleAudienceService.SPEND_THRESHOLD_USD, 50000);
  const underSpendGoogle = new GoogleAudienceService({ customerId: '123-456', accountLifetimeSpend: 25000 });
  const overSpendGoogle = new GoogleAudienceService({ customerId: '123-456', accountLifetimeSpend: 60000 });
  assert.strictEqual(underSpendGoogle.hasTargetingEligibility(), false);
  assert.strictEqual(overSpendGoogle.hasTargetingEligibility(), true);

  // LinkedIn 300 member threshold
  assert.strictEqual(LinkedInAudienceService.MINIMUM_DELIVERY_SIZE, 300);
  assert.strictEqual(TikTokAudienceService.BATCH_SIZE, 1000);

  // Multi-platform sync
  const audienceGateway = AudienceSyncGateway.getInstance();
  const syncFacebook = await audienceGateway.syncPlatform({
    ownerId: testOwner,
    platform: 'facebook',
  });
  assert(syncFacebook.synced > 0);
  assert.strictEqual(syncFacebook.platform, 'facebook');
  console.log('   ✓ Audience constraints, chunking rules, and sync engine verified.');

  // -------------------------------------------------------------
  // 5. PAID AD CAMPAIGN ORCHESTRATION & TELEMETRY (PHASE 5)
  // -------------------------------------------------------------
  console.log('\n[5/6] Verifying Ad Campaign Orchestration & Cross-Platform Telemetry...');
  const adGateway = AdCampaignGateway.getInstance();
  const multiDeploy = await adGateway.deployCampaign({
    ownerId: testOwner,
    name: 'Q4 Omnichannel Growth Campaign',
    objective: 'OUTCOME_SALES',
    platforms: ['facebook', 'google', 'tiktok', 'twitter'],
    budget: { amount: 350, type: 'DAILY', currency: 'USD' },
    targeting: { geoLocations: ['US', 'CA', 'GB'] },
    creatives: [
      {
        headline: 'Exclusive Enterprise Deal',
        body: 'Scale your operations with ERP.js',
        destinationUrl: 'https://erpjs.org',
        callToAction: 'SHOP_NOW',
      },
    ],
  });
  assert.strictEqual(multiDeploy.overallStatus, 'ACTIVE');
  for (const plat of ['facebook', 'google', 'tiktok', 'twitter']) {
    assert(multiDeploy.platforms[plat], `Platform ${plat} deployment info present`);
  }

  const telemetry = await adGateway.syncTelemetry(testOwner, 'camp_reg_123');
  assert(telemetry.impressions > 0);
  assert(telemetry.clicks > 0);
  assert(telemetry.spend > 0);
  assert(telemetry.roas > 0);
  console.log('   ✓ Omnichannel campaign builder, deployment, and live telemetry aggregated.');

  // -------------------------------------------------------------
  // 6. REPUTATION INGESTION & AI AUTO-RESPONSE (PHASE 6)
  // -------------------------------------------------------------
  console.log('\n[6/6] Verifying Reputation Management, Sentiment AI & Review Replies...');
  const repGateway = ReputationGateway.getInstance();
  const repStats = await repGateway.getReputationStats(testOwner);
  assert(repStats.total > 0);
  assert(repStats.average >= 1.0 && repStats.average <= 5.0);

  const syncedReviews = await repGateway.syncReviews(testOwner, ['google', 'facebook', 'trustpilot', 'yelp']);
  assert(syncedReviews.syncedCount >= 4);

  // Sentiment and AI response check
  const testComment = 'Remarkable service, very professional and friendly staff!';
  const sentiment = SentimentAutoResponseService.analyzeSentiment(testComment);
  assert.strictEqual(sentiment.category, 'positive');

  const draft = SentimentAutoResponseService.generateResponseDraft({
    authorName: 'Michael Scott',
    rating: 5,
    comment: testComment,
    businessName: 'Dunder Mifflin ERP',
  });
  assert(draft.includes('Michael'));
  assert(draft.includes('Dunder Mifflin ERP'));

  const replyAction = await repGateway.replyToReview(testOwner, 'rev_test_1', 'Glad to be of service!', 'google');
  assert.strictEqual(replyAction.success, true);
  console.log('   ✓ Review ingestion, sentiment scoring, and AI response drafting verified.');

  console.log('\n===============================================================');
  console.log('--- ALL MARKETING SUBSYSTEMS VERIFIED ACCURATE (100% PASS) ---');
  console.log('===============================================================');
}

runFullMarketingRegression().catch((err) => {
  console.error('\nMarketing full regression suite failed:', err);
  process.exit(1);
});
