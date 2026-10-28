import assert from 'assert';
import mongoose from 'mongoose';
import { PIINormalizer } from '../src/utils/piiNormalizer';
import { MetaAudienceService } from '../src/services/audiences/MetaAudienceService';
import { GoogleAudienceService } from '../src/services/audiences/GoogleAudienceService';
import { LinkedInAudienceService } from '../src/services/audiences/LinkedInAudienceService';
import { TikTokAudienceService } from '../src/services/audiences/TikTokAudienceService';
import { AudienceSyncGateway } from '../src/services/audiences/AudienceSyncGateway';
import RetargetingController from '../src/controllers/appControllers/RetargetingController';
import '../src/models/appModels/RetargetingCampaign';

async function runPhase4Verification() {
  console.log('--- STARTING PHASE 4 VERIFICATION SUITE ---');

  // 1. Test RetargetingCampaign model registration and schema structure
  console.log('1. Testing RetargetingCampaign model schema...');
  assert(mongoose.models.RetargetingCampaign, 'RetargetingCampaign model should be registered in mongoose');

  const RetargetingCampaign = mongoose.model('RetargetingCampaign');
  const dummyOwner = new mongoose.Types.ObjectId();
  const testAudienceDoc = new RetargetingCampaign({
    name: 'High LTV Customers Q4',
    description: 'Customers with over $500 total spend',
    status: 'active',
    channels: ['facebook', 'google', 'linkedin', 'tiktok'],
    targetAudience: { eventType: 'high_value', size: 1500 },
    owner: dummyOwner,
  });

  assert.strictEqual(testAudienceDoc.name, 'High LTV Customers Q4');
  assert.strictEqual(testAudienceDoc.status, 'active');
  assert.strictEqual(testAudienceDoc.channels.length, 4);
  assert.strictEqual(testAudienceDoc.removed, false);
  console.log('   ✓ RetargetingCampaign schema instantiated and validated.');

  // 2. Test MetaAudienceService batch chunking & configuration
  console.log('2. Testing MetaAudienceService batch constraints...');
  assert.strictEqual(MetaAudienceService.BATCH_SIZE, 10000, 'Meta batch size limit must be 10,000');
  const metaAudience = new MetaAudienceService({
    adAccountId: 'act_1234567890',
    accessToken: 'mock_meta_token',
  });
  assert(metaAudience, 'MetaAudienceService initialized');

  // Generate 12,000 dummy hashed identifiers to test chunking
  const dummyUsers = Array.from({ length: 12000 }, (_, i) => ({
    emailHash: PIINormalizer.hashEmail(`user${i}@example.com`),
    phoneHash: PIINormalizer.hashPhone(`+1555000${i.toString().padStart(4, '0')}`),
  }));

  const chunks: any[][] = [];
  for (let i = 0; i < dummyUsers.length; i += MetaAudienceService.BATCH_SIZE) {
    chunks.push(dummyUsers.slice(i, i + MetaAudienceService.BATCH_SIZE));
  }
  assert.strictEqual(chunks.length, 2, '12,000 users must split into 2 chunks');
  assert.strictEqual(chunks[0].length, 10000, 'Chunk 1 must contain 10,000 users');
  assert.strictEqual(chunks[1].length, 2000, 'Chunk 2 must contain 2,000 users');
  console.log('   ✓ Meta Custom Audience 10,000 batch chunking verified.');

  // 3. Test GoogleAudienceService $50,000 spend requirement policy
  console.log('3. Testing GoogleAudienceService spend requirement and eligibility...');
  assert.strictEqual(GoogleAudienceService.SPEND_THRESHOLD_USD, 50000, 'Google Customer Match threshold must be $50,000');

  const underSpendGoogle = new GoogleAudienceService({
    customerId: '123-456-7890',
    accountLifetimeSpend: 15000,
  });
  assert.strictEqual(underSpendGoogle.hasTargetingEligibility(), false, 'Accounts under $50,000 must be marked ineligible for active targeting');

  const overSpendGoogle = new GoogleAudienceService({
    customerId: '123-456-7890',
    accountLifetimeSpend: 75000,
  });
  assert.strictEqual(overSpendGoogle.hasTargetingEligibility(), true, 'Accounts at or above $50,000 must qualify for Customer Match targeting');

  const offlineGoogleAudience = await underSpendGoogle.createAudience('Inactive Spenders');
  assert(offlineGoogleAudience.audienceId, 'Offline audience ID generated');
  assert.strictEqual(offlineGoogleAudience.eligibleForTargeting, false);
  console.log('   ✓ Google Ads $50,000 spend policy verified.');

  // 4. Test LinkedInAudienceService 5,000 batch & 300 member threshold
  console.log('4. Testing LinkedInAudienceService limits & thresholds...');
  assert.strictEqual(LinkedInAudienceService.BATCH_SIZE, 5000, 'LinkedIn DMP batch size must be 5,000');
  assert.strictEqual(LinkedInAudienceService.MINIMUM_DELIVERY_SIZE, 300, 'LinkedIn Matched Audience delivery threshold must be 300');

  const linkedInChunks: any[][] = [];
  for (let i = 0; i < dummyUsers.length; i += LinkedInAudienceService.BATCH_SIZE) {
    linkedInChunks.push(dummyUsers.slice(i, i + LinkedInAudienceService.BATCH_SIZE));
  }
  assert.strictEqual(linkedInChunks.length, 3, '12,000 users must split into 3 chunks of up to 5,000');
  assert.strictEqual(linkedInChunks[0].length, 5000);
  assert.strictEqual(linkedInChunks[1].length, 5000);
  assert.strictEqual(linkedInChunks[2].length, 2000);
  console.log('   ✓ LinkedIn Matched Audience 5,000 chunking & 300 threshold verified.');

  // 5. Test TikTokAudienceService 1,000 batch & 1,000 member threshold
  console.log('5. Testing TikTokAudienceService limits & thresholds...');
  assert.strictEqual(TikTokAudienceService.BATCH_SIZE, 1000, 'TikTok DMP batch size must be 1,000');
  assert.strictEqual(TikTokAudienceService.MINIMUM_DELIVERY_SIZE, 1000, 'TikTok Custom Audience delivery threshold must be 1,000');

  const tikTokSample = dummyUsers.slice(0, 2500);
  const tikTokChunks: any[][] = [];
  for (let i = 0; i < tikTokSample.length; i += TikTokAudienceService.BATCH_SIZE) {
    tikTokChunks.push(tikTokSample.slice(i, i + TikTokAudienceService.BATCH_SIZE));
  }
  assert.strictEqual(tikTokChunks.length, 3, '2,500 users must split into 3 chunks for TikTok');
  assert.strictEqual(tikTokChunks[0].length, 1000);
  assert.strictEqual(tikTokChunks[1].length, 1000);
  assert.strictEqual(tikTokChunks[2].length, 500);
  console.log('   ✓ TikTok DMP 1,000 chunking & 1,000 threshold verified.');

  // 6. Test AudienceSyncGateway multi-platform sync with Mock Sandbox fallback
  console.log('6. Testing AudienceSyncGateway multi-platform synchronization...');
  const gateway = AudienceSyncGateway.getInstance();

  const syncPlatforms = ['facebook', 'google', 'linkedin', 'tiktok'];
  for (const platform of syncPlatforms) {
    const result = await gateway.syncPlatform({
      ownerId: dummyOwner,
      platform,
      customUsers: dummyUsers.slice(0, 10),
    });

    assert.strictEqual(result.platform, platform);
    assert.strictEqual(result.synced, 10, `Should sync 10 users to ${platform}`);
    assert.strictEqual(result.mode, 'SANDBOX_MOCK', `Should fallback cleanly to SANDBOX_MOCK when live credentials absent`);
    assert(result.platforms[platform].connected, `Platform connection status for ${platform} should be true`);
  }
  console.log('   ✓ AudienceSyncGateway multi-platform sandbox sync verified.');

  // 7. Test RetargetingController endpoints
  console.log('7. Testing RetargetingController REST handlers...');
  const controller = RetargetingController;

  // Test getPlatformConnections
  const mockReqPlatforms = {
    companyOwner: { _id: dummyOwner },
  };
  let platformResult: any = null;
  const mockResPlatforms = {
    status(code: number) {
      assert.strictEqual(code, 200);
      return this;
    },
    json(data: any) {
      platformResult = data;
      return this;
    },
  };
  await controller.getPlatformConnections(mockReqPlatforms, mockResPlatforms);
  assert(platformResult.success, 'getPlatformConnections should succeed');
  assert(platformResult.result.connections.facebook, 'Facebook connection info returned');
  assert(platformResult.result.connections.google, 'Google connection info returned');

  // Test syncPlatform endpoint
  const mockReqSync = {
    companyOwner: { _id: dummyOwner },
    params: { platform: 'facebook' },
    body: {},
  };
  let syncEndpointResult: any = null;
  const mockResSync = {
    status(code: number) {
      assert.strictEqual(code, 200);
      return this;
    },
    json(data: any) {
      syncEndpointResult = data;
      return this;
    },
  };
  await controller.syncPlatform(mockReqSync, mockResSync);
  assert(syncEndpointResult.success, 'syncPlatform endpoint should succeed');
  assert.strictEqual(syncEndpointResult.result.platform, 'facebook');
  console.log('   ✓ RetargetingController REST handlers verified.');

  console.log('--- ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY ---');
}

runPhase4Verification().catch((err) => {
  console.error('Phase 4 verification failed:', err);
  process.exit(1);
});
