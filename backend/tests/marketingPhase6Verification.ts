import assert from 'assert';
import mongoose from 'mongoose';
import { GoogleBusinessProfileService } from '../src/services/reputation/GoogleBusinessProfileService';
import { MetaPageReviewsService } from '../src/services/reputation/MetaPageReviewsService';
import { TrustpilotService } from '../src/services/reputation/TrustpilotService';
import { YelpFusionService } from '../src/services/reputation/YelpFusionService';
import { SentimentAutoResponseService } from '../src/services/reputation/SentimentAutoResponseService';
import { ReputationGateway } from '../src/services/reputation/ReputationGateway';
import reputationManagementController from '../src/controllers/appControllers/reputationManagementController';

async function runPhase6Verification() {
  console.log('--- STARTING PHASE 6 VERIFICATION SUITE ---');

  // 1. Test GoogleBusinessProfileService
  console.log('1. Testing GoogleBusinessProfileService (API v4.9 / v1)...');
  const googleRep = new GoogleBusinessProfileService({
    accountId: 'accounts/1029384756',
    locationId: 'locations/5647382910',
    accessToken: '', // Offline mode
  });
  assert(googleRep, 'GoogleBusinessProfileService initialized');

  const gReviews = await googleRep.getReviews();
  assert(Array.isArray(gReviews), 'Should return list of reviews');

  const gOfflineReply = await googleRep.replyToReview('review_g_1', 'Thank you for your business!');
  assert.strictEqual(gOfflineReply, true, 'Offline reply should succeed');
  console.log('   ✓ Google Business Profile review adapter verified.');

  // 2. Test MetaPageReviewsService
  console.log('2. Testing MetaPageReviewsService (Graph API v21.0)...');
  const metaRep = new MetaPageReviewsService({
    pageId: '1234567890',
    pageAccessToken: '', // Offline mode
  });
  assert(metaRep, 'MetaPageReviewsService initialized');

  const mReviews = await metaRep.getReviews();
  assert(Array.isArray(mReviews), 'Should return list of Meta recommendations');

  const mOfflineReply = await metaRep.replyToReview('open_graph_post_1', 'We appreciate your support!');
  assert.strictEqual(mOfflineReply, true, 'Offline reply should succeed');
  console.log('   ✓ Meta Page Recommendations review adapter verified.');

  // 3. Test TrustpilotService
  console.log('3. Testing TrustpilotService (Trustpilot B2B API)...');
  const tpRep = new TrustpilotService({
    businessUnitId: 'tp_unit_123',
    apiKey: '', // Offline mode
  });
  assert(tpRep, 'TrustpilotService initialized');

  const tpReviews = await tpRep.getReviews();
  assert(Array.isArray(tpReviews), 'Should return list of Trustpilot reviews');

  const tpOfflineReply = await tpRep.replyToReview('tp_rev_1', 'Thanks for trusting us!');
  assert.strictEqual(tpOfflineReply, true, 'Offline reply should succeed');
  console.log('   ✓ Trustpilot Business review adapter verified.');

  // 4. Test YelpFusionService
  console.log('4. Testing YelpFusionService (Yelp Fusion v3 API)...');
  const yelpRep = new YelpFusionService({
    businessId: 'acme-corp-san-francisco',
    apiKey: '', // Offline mode
  });
  assert(yelpRep, 'YelpFusionService initialized');

  const yelpReviews = await yelpRep.getReviews();
  assert(Array.isArray(yelpReviews), 'Should return list of Yelp reviews');
  console.log('   ✓ Yelp Fusion review adapter verified.');

  // 5. Test SentimentAutoResponseService
  console.log('5. Testing SentimentAutoResponseService (Sentiment Lexicon & Generative Engine)...');
  
  const positiveSentiment = SentimentAutoResponseService.analyzeSentiment(
    'Outstanding work! Highly recommended, quick service and brilliant support!'
  );
  assert.strictEqual(positiveSentiment.category, 'positive');
  assert(positiveSentiment.score > 0, 'Score should be positive');

  const negativeSentiment = SentimentAutoResponseService.analyzeSentiment(
    'Terrible experience, horrible delays, poor communication and very disappointed.'
  );
  assert.strictEqual(negativeSentiment.category, 'negative');
  assert(negativeSentiment.score < 0, 'Score should be negative');

  const neutralSentiment = SentimentAutoResponseService.analyzeSentiment(
    'The product was delivered on Tuesday as scheduled.'
  );
  assert.strictEqual(neutralSentiment.category, 'neutral');

  // Test AI Generative Response Drafting
  const posDraft = SentimentAutoResponseService.generateResponseDraft({
    authorName: 'Sarah Jenkins',
    rating: 5,
    comment: 'Exceptional product, highly recommended!',
    businessName: 'ERP.js Global',
  });
  assert(posDraft.includes('Sarah'), 'Draft should personalize by author name');
  assert(posDraft.includes('ERP.js Global'), 'Draft should include business name');

  const negDraft = SentimentAutoResponseService.generateResponseDraft({
    authorName: 'Mark Vance',
    rating: 1,
    comment: 'Horrible customer service, very disappointed.',
    businessName: 'ERP.js Global',
  });
  assert(negDraft.includes('Mark'), 'Draft should personalize by author name');
  assert(negDraft.toLowerCase().includes('apologize') || negDraft.toLowerCase().includes('sorry'), 'Negative draft should offer apology');
  assert(negDraft.includes('support@'), 'Negative draft should route to support');
  console.log('   ✓ Sentiment classification and generative auto-response engine verified.');

  // 6. Test ReputationGateway Aggregation & Dispatch
  console.log('6. Testing ReputationGateway...');
  const gateway = ReputationGateway.getInstance();

  const stats = await gateway.getReputationStats('test_owner_id');
  assert(typeof stats.total === 'number', 'Total reviews must be number');
  assert(typeof stats.average === 'number', 'Average rating must be number');
  assert(stats.sentiment.positive >= 0, 'Positive sentiment count present');
  assert(stats.sentiment.negative >= 0, 'Negative sentiment count present');
  assert(stats.byPlatform.google, 'Google platform stats present');
  assert(stats.byPlatform.facebook, 'Facebook platform stats present');

  const syncResult = await gateway.syncReviews('test_owner_id', ['google', 'facebook', 'trustpilot', 'yelp']);
  assert.strictEqual(typeof syncResult.syncedCount, 'number', 'Synced count returned');
  assert(syncResult.syncedCount > 0, 'Should sync offline reviews');

  const replyResult = await gateway.replyToReview('test_owner_id', 'rev_101', 'Thank you for your feedback!', 'google');
  assert.strictEqual(replyResult.success, true, 'Gateway reply should succeed');
  console.log('   ✓ ReputationGateway ingestion & dispatch verified.');

  // 7. Test reputationManagementController REST endpoints
  console.log('7. Testing reputationManagementController HTTP handlers...');

  // Mock Request & Response helper
  const createMockRes = () => {
    const res: any = {};
    res.statusCode = 200;
    res.status = (code: number) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data: any) => {
      res.jsonData = data;
      return res;
    };
    return res;
  };

  // Controller: getStats
  const statsRes = createMockRes();
  await reputationManagementController.getStats({ companyOwner: { _id: 'owner_1' } } as any, statsRes);
  assert.strictEqual(statsRes.statusCode, 200);
  assert.strictEqual(statsRes.jsonData.success, true);
  assert(statsRes.jsonData.result.average > 0);

  // Controller: getReviews
  const reviewsRes = createMockRes();
  await reputationManagementController.getReviews({ companyOwner: { _id: 'owner_1' }, query: {} } as any, reviewsRes);
  assert.strictEqual(reviewsRes.statusCode, 200);
  assert.strictEqual(reviewsRes.jsonData.success, true);
  assert(Array.isArray(reviewsRes.jsonData.result));
  assert(reviewsRes.jsonData.result.length > 0);

  // Controller: generateAIReply
  const aiRes = createMockRes();
  await reputationManagementController.generateAIReply(
    {
      params: { id: 'rev_99' },
      body: { authorName: 'Alice Cooper', rating: 5, comment: 'Fantastic service!' },
    } as any,
    aiRes
  );
  assert.strictEqual(aiRes.statusCode, 200);
  assert.strictEqual(aiRes.jsonData.success, true);
  assert(aiRes.jsonData.result.draft.includes('Alice'));
  assert.strictEqual(aiRes.jsonData.result.sentiment.category, 'positive');

  // Controller: replyToReview
  const replyRes = createMockRes();
  await reputationManagementController.replyToReview(
    {
      params: { id: 'rev_99' },
      body: { replyText: 'Thank you for your support!', platform: 'google' },
      companyOwner: { _id: 'owner_1' },
    } as any,
    replyRes
  );
  assert.strictEqual(replyRes.statusCode, 200);
  assert.strictEqual(replyRes.jsonData.success, true);

  // Controller: getConnectedPlatforms
  const platformsRes = createMockRes();
  await reputationManagementController.getConnectedPlatforms({ companyOwner: { _id: 'owner_1' } } as any, platformsRes);
  assert.strictEqual(platformsRes.statusCode, 200);
  assert.strictEqual(platformsRes.jsonData.success, true);
  assert.strictEqual(platformsRes.jsonData.result.length, 4);

  // Controller: syncPlatformReviews
  const syncRes = createMockRes();
  await reputationManagementController.syncPlatformReviews(
    {
      companyOwner: { _id: 'owner_1' },
      body: { platforms: ['google', 'facebook'] },
    } as any,
    syncRes
  );
  assert.strictEqual(syncRes.statusCode, 200);
  assert.strictEqual(syncRes.jsonData.success, true);
  assert(syncRes.jsonData.syncedCount > 0);

  console.log('   ✓ reputationManagementController endpoints verified.');

  console.log('--- ALL PHASE 6 VERIFICATION CHECKS PASSED (7/7) ---');
}

runPhase6Verification().catch((err) => {
  console.error('Phase 6 verification failed:', err);
  process.exit(1);
});
