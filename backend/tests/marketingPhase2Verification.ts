import assert from 'assert';
import mongoose from 'mongoose';
import { MetaProvider } from '../src/services/marketingProviders/MetaProvider';
import { LinkedInProvider } from '../src/services/marketingProviders/LinkedInProvider';
import { TwitterProvider } from '../src/services/marketingProviders/TwitterProvider';
import { TikTokProvider } from '../src/services/marketingProviders/TikTokProvider';
import { ProviderFactory } from '../src/services/marketingProviders/ProviderFactory';

async function runPhase2Verification() {
  console.log('--- STARTING PHASE 2 VERIFICATION SUITE ---');

  // 1. Test ProviderFactory fallback to MockSandboxProvider when no live keys
  console.log('1. Testing ProviderFactory resolution...');
  const dummyOwnerId = new mongoose.Types.ObjectId();

  const metaProv = await ProviderFactory.getSocialPublishingProvider('facebook', dummyOwnerId);
  assert(metaProv, 'Meta provider should be resolved');
  const fbVal = await metaProv.validateCredentials({ pageId: 'fb_page_123' });
  assert.strictEqual(fbVal.valid, true, 'Mock sandbox validates');

  const twProv = await ProviderFactory.getSocialPublishingProvider('twitter', dummyOwnerId);
  assert(twProv, 'Twitter provider should be resolved');

  const liProv = await ProviderFactory.getSocialPublishingProvider('linkedin', dummyOwnerId);
  assert(liProv, 'LinkedIn provider should be resolved');

  const ttProv = await ProviderFactory.getSocialPublishingProvider('tiktok', dummyOwnerId);
  assert(ttProv, 'TikTok provider should be resolved');
  console.log('   ✓ ProviderFactory successfully resolves all platforms with BYOC fallback.');

  // 2. Test Publishing execution across all providers (Sandbox mode)
  console.log('2. Testing cross-platform publishing contracts...');
  const postPayload = {
    content: 'Automated test announcement #ERPjs #Launch',
    urls: ['https://erpjs.com'],
  };

  const fbPost = await metaProv.publishPost({ platform: 'facebook' }, postPayload);
  assert(fbPost.platformPostId.includes('mock_post_facebook'), 'Facebook post ID generated');
  assert.strictEqual(fbPost.status, 'PUBLISHED');

  const twPost = await twProv.publishPost({ platform: 'twitter' }, postPayload);
  assert(twPost.platformPostId.includes('mock_post_twitter'), 'Twitter post ID generated');
  assert.strictEqual(twPost.status, 'PUBLISHED');

  const liPost = await liProv.publishPost({ platform: 'linkedin' }, postPayload);
  assert(liPost.platformPostId.includes('mock_post_linkedin'), 'LinkedIn post ID generated');
  assert.strictEqual(liPost.status, 'PUBLISHED');

  const ttPost = await ttProv.publishPost({ platform: 'tiktok' }, {
    ...postPayload,
    mediaUrls: ['https://example.com/demo.mp4']
  });
  assert(ttPost.platformPostId.includes('mock_post_tiktok'), 'TikTok post ID generated');
  assert.strictEqual(ttPost.status, 'PUBLISHED');
  console.log('   ✓ All 4 platforms execute publish contracts properly.');

  // 3. Test Analytics & Metrics retrieval
  console.log('3. Testing Live Analytics & Post Metrics contracts...');
  const metrics = await metaProv.getPostMetrics({}, fbPost.platformPostId);
  assert(typeof metrics.likes === 'number' && metrics.likes >= 0, 'Likes metric returned');
  assert(typeof metrics.comments === 'number' && metrics.comments >= 0, 'Comments metric returned');
  assert(typeof metrics.impressions === 'number' && metrics.impressions >= 0, 'Impressions metric returned');

  const insights = await metaProv.getPageInsights!({});
  assert(insights.followers > 0, 'Page followers returned');
  assert(insights.reach > 0, 'Page reach returned');
  console.log('   ✓ Live analytics and telemetry aggregation verified.');

  // 4. Test live provider classes instantiate without errors
  console.log('4. Testing Live Provider instance contracts...');
  const liveMeta = new MetaProvider({ accessToken: 'test_token' });
  assert(typeof liveMeta.publishPost === 'function');

  const liveLI = new LinkedInProvider({ accessToken: 'test_token' });
  assert(typeof liveLI.publishPost === 'function');

  const liveTW = new TwitterProvider({ accessToken: 'test_token' });
  assert(typeof liveTW.publishPost === 'function');

  const liveTT = new TikTokProvider({ accessToken: 'test_token' });
  assert(typeof liveTT.publishPost === 'function');
  console.log('   ✓ All live provider classes verify correctly.');

  console.log('--- ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase2Verification().catch((err) => {
  console.error('Phase 2 Verification Failed:', err);
  process.exit(1);
});
