import assert from 'assert';
import mongoose from 'mongoose';
import { TokenVaultService } from '../src/utils/tokenVault';
import { MarketingIntegration } from '../src/models/appModels/MarketingIntegration';
import { MockSandboxProvider } from '../src/services/marketingProviders/MockSandboxProvider';
import { QueueManager } from '../src/utils/queueManager';

async function runPhase1Verification() {
  console.log('--- STARTING PHASE 1 VERIFICATION SUITE ---');

  // 1. Test TokenVaultService
  console.log('1. Testing TokenVaultService...');
  const testString = 'EAAGNO43194830198401394secret_token_abc123';
  const encrypted = TokenVaultService.encrypt(testString);
  assert(encrypted.encryptedData, 'Encrypted data should exist');
  assert(encrypted.iv, 'IV should exist');
  assert(encrypted.authTag, 'AuthTag should exist');
  assert.notStrictEqual(encrypted.encryptedData, testString, 'Encrypted data should not match plaintext');

  const decrypted = TokenVaultService.decrypt(encrypted);
  assert.strictEqual(decrypted, testString, 'Decrypted string should match original');

  // Test object encryption/decryption
  const credentialsObject = {
    accessToken: 'EAAG9999access_token',
    clientSecret: 'secret_client_key_9999',
    pageId: '109283019283',
    appId: '987654321',
  };
  const encObject = TokenVaultService.encryptObject(credentialsObject);
  const decObject = TokenVaultService.decryptObject<typeof credentialsObject>(encObject);
  assert.deepStrictEqual(decObject, credentialsObject, 'Decrypted object should deep match original');

  // Test masking helper
  const maskedSecret = TokenVaultService.maskSecret('my_super_secret_token_12345');
  assert(maskedSecret.includes('••••'), 'Masked secret should contain masking bullets');
  assert(maskedSecret.endsWith('2345'), 'Masked secret should end with last 4 characters');
  assert(maskedSecret.startsWith('my_s'), 'Masked secret should start with first 4 characters');
  console.log('   ✓ TokenVaultService AES-256-GCM encryption/decryption passed.');

  // 2. Test MarketingIntegration Model
  console.log('2. Testing MarketingIntegration model methods...');
  const dummyOwnerId = new mongoose.Types.ObjectId();
  const integrationDoc = new MarketingIntegration({
    owner: dummyOwnerId,
    platform: 'facebook',
    mode: 'SANDBOX_MOCK',
    accountName: 'Acme FB Page',
  });

  integrationDoc.setCredentials(credentialsObject);
  assert(integrationDoc.encryptedCredentials?.encryptedData, 'Model should contain encrypted credentials');
  assert.strictEqual(
    integrationDoc.maskedConfig.get('pageId'),
    '109283019283',
    'Public ID keys should be preserved as-is'
  );
  assert(
    integrationDoc.maskedConfig.get('accessToken')?.includes('••••'),
    'Secret keys should be masked with bullets'
  );

  const recoveredCreds = integrationDoc.getDecryptedCredentials();
  assert.deepStrictEqual(recoveredCreds, credentialsObject, 'Recovered credentials should match original');
  console.log('   ✓ MarketingIntegration model setCredentials and getDecryptedCredentials passed.');

  // 3. Test MockSandboxProvider across all 5 provider interfaces
  console.log('3. Testing MockSandboxProvider across all interfaces...');
  const sandbox = new MockSandboxProvider('facebook');

  // 3.1 ISocialPublishingProvider
  const credCheck = await sandbox.validateCredentials(credentialsObject);
  assert.strictEqual(credCheck.valid, true, 'Mock credentials should validate');
  assert(credCheck.accountInfo?.name, 'Account info should be returned');

  const postResult = await sandbox.publishPost({}, { content: 'Hello world from test!' });
  assert(postResult.platformPostId.startsWith('mock_post_facebook_'), 'Post ID should match platform');
  assert.strictEqual(postResult.status, 'PUBLISHED');

  const postMetrics = await sandbox.getPostMetrics({}, postResult.platformPostId);
  assert(postMetrics.likes > 0 && postMetrics.impressions! > 0, 'Post metrics should return numbers');

  const pageInsights = await sandbox.getPageInsights({});
  assert(pageInsights.followers > 0, 'Page insights should return valid follower count');

  // 3.2 IAdCampaignProvider
  const campaign = await sandbox.createCampaign({}, {
    name: 'Summer Promo 2026',
    objective: 'OUTCOME_LEADS',
    budget: { amount: 50, type: 'DAILY', currency: 'USD' }
  });
  assert(campaign.externalCampaignId.startsWith('mock_camp_facebook_'), 'Campaign ID created');
  assert.strictEqual(campaign.status, 'ACTIVE');

  const telemetry = await sandbox.getCampaignTelemetry({}, campaign.externalCampaignId);
  assert(telemetry.clicks > 0 && telemetry.roas > 0, 'Telemetry metrics should be populated');

  // 3.3 IAudienceSyncProvider
  const aud = await sandbox.createAudience({}, { name: 'VIP Buyers' });
  assert(aud.externalAudienceId.startsWith('mock_aud_facebook_'));
  const syncResult = await sandbox.addUsersToAudience({}, aud.externalAudienceId, [
    { emailHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
  ]);
  assert.strictEqual(syncResult.added, 1);

  // 3.4 IConversionTrackingProvider
  const conversionResult = await sandbox.sendServerEvent({}, {
    eventName: 'Purchase',
    eventTime: Math.floor(Date.now() / 1000),
    eventId: 'order_12345',
    actionSource: 'website',
    userData: { emailHash: 'hash123' },
    customData: { currency: 'USD', value: 149.99 }
  });
  assert.strictEqual(conversionResult.success, true);
  assert.strictEqual(conversionResult.eventId, 'order_12345');

  // 3.5 IReputationProvider
  const reviews = await sandbox.fetchReviews({});
  assert(reviews.length >= 3, 'Should return sandbox reviews');
  assert.strictEqual(reviews[0].platform, 'facebook');
  const replyResult = await sandbox.replyToReview({}, reviews[0].id, 'Thanks!');
  assert.strictEqual(replyResult.success, true);
  console.log('   ✓ MockSandboxProvider passed all 5 interface contracts.');

  // 4. Test QueueManager
  console.log('4. Testing QueueManager in-process fallback and retry engine...');
  const queue = QueueManager.getInstance();
  let jobExecuted = false;

  queue.registerHandler('test-job', async (job) => {
    jobExecuted = true;
    return { processed: true, input: job.data };
  });

  const job = await queue.enqueue('test-job', { payload: 'hello-queue' });
  assert(job.id, 'Job should receive a generated ID');

  // Wait a short time for in-process queue runner to execute
  await new Promise((resolve) => setTimeout(resolve, 800));
  assert.strictEqual(jobExecuted, true, 'Queue handler should have executed');
  console.log('   ✓ QueueManager in-process queue processing passed.');

  console.log('--- ALL PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase1Verification().catch((err) => {
  console.error('Phase 1 Verification Failed:', err);
  process.exit(1);
});
