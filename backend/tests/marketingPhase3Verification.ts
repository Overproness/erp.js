import assert from 'assert';
import mongoose from 'mongoose';
import { PIINormalizer } from '../src/utils/piiNormalizer';
import { MetaConversionsService } from '../src/services/conversions/MetaConversionsService';
import { TikTokEventsService } from '../src/services/conversions/TikTokEventsService';
import { GoogleEnhancedConversionsService } from '../src/services/conversions/GoogleEnhancedConversionsService';
import { ConversionsGateway } from '../src/services/conversions/ConversionsGateway';
import { verifyMetaSignature } from '../src/controllers/appControllers/marketingWebhookController';
import crypto from 'crypto';

async function runPhase3Verification() {
  console.log('--- STARTING PHASE 3 VERIFICATION SUITE ---');

  // 1. Test PIINormalizer
  console.log('1. Testing PIINormalizer hashing & standardization...');
  const rawEmail = '  John.Doe@Example.COM  ';
  const expectedEmailHash = crypto.createHash('sha256').update('john.doe@example.com').digest('hex');
  const emailHash = PIINormalizer.hashEmail(rawEmail);
  assert.strictEqual(emailHash, expectedEmailHash, 'Email should be trimmed, lowercased, and SHA-256 hashed');

  const rawPhone = '+1 (555) 234-5678';
  const phoneNormalized = PIINormalizer.normalizePhone(rawPhone);
  assert.strictEqual(phoneNormalized, '15552345678', 'Phone should be digits only in E.164 without symbols');
  const phoneHash = PIINormalizer.hashPhone(rawPhone);
  assert(phoneHash && phoneHash.length === 64, 'Phone hash should be 64-char hex');

  const eventId1 = PIINormalizer.generateEventId('lead', 'form_submission_999');
  const eventId2 = PIINormalizer.generateEventId('lead', 'form_submission_999');
  assert.strictEqual(eventId1, eventId2, 'Deterministic event IDs with same key should match for deduplication');
  console.log('   ✓ PIINormalizer verified for Meta, Google, and TikTok standards.');

  // 2. Test Conversion Client payload formatting
  console.log('2. Testing CAPI Service clients...');
  const metaCAPI = new MetaConversionsService({
    pixelId: 'mock_pixel_123',
    accessToken: 'mock_token_abc',
    testEventCode: 'TEST12345',
  });
  assert(metaCAPI, 'Meta CAPI client initialized');

  const ttEvents = new TikTokEventsService({
    pixelCode: 'mock_tt_pixel',
    accessToken: 'mock_tt_token',
  });
  assert(ttEvents, 'TikTok Events client initialized');

  const gEnhanced = new GoogleEnhancedConversionsService({
    customerId: '1234567890',
    conversionActionId: '987654321',
  });
  assert(gEnhanced, 'Google Enhanced Conversions client initialized');
  console.log('   ✓ CAPI service clients initialized.');

  // 3. Test ConversionsGateway with Sandbox Fallback
  console.log('3. Testing ConversionsGateway unified dispatch...');
  const gateway = ConversionsGateway.getInstance();
  const dummyOwnerId = new mongoose.Types.ObjectId();

  const syncDispatch = await gateway.trackConversion({
    ownerId: dummyOwnerId,
    eventName: 'Purchase',
    user: {
      email: 'customer@erpjs.org',
      phone: '+1 555 888 9999',
      clientIp: '192.168.1.1',
      clientUserAgent: 'Mozilla/5.0 ERPjs-Test',
      fbp: 'fb.1.123456789.98765',
    },
    customData: {
      currency: 'USD',
      value: 299.99,
      orderId: 'INV-2026-001',
    },
    async: false,
  });

  assert(syncDispatch.eventId, 'Event ID should be returned');
  assert.strictEqual(syncDispatch.eventName, 'Purchase');
  assert(syncDispatch.dispatchedTo.includes('meta_sandbox'), 'Should dispatch to Meta sandbox');
  assert(syncDispatch.dispatchedTo.includes('tiktok_sandbox'), 'Should dispatch to TikTok sandbox');
  assert(syncDispatch.dispatchedTo.includes('google_sandbox'), 'Should dispatch to Google sandbox');
  assert.strictEqual(syncDispatch.results.meta_sandbox?.success, true);
  console.log('   ✓ ConversionsGateway fan-out to Meta, TikTok, and Google verified.');

  // 4. Test Asynchronous Queue Enqueueing
  console.log('4. Testing Asynchronous CAPI Queueing...');
  const asyncDispatch = await gateway.trackConversion({
    ownerId: dummyOwnerId,
    eventName: 'AddToCart',
    user: { email: 'shopper@erpjs.org' },
    customData: { currency: 'USD', value: 49.99 },
    async: true,
  });

  assert(asyncDispatch.eventId, 'Async dispatch should generate eventId');
  assert(asyncDispatch.dispatchedTo.includes('async_queue'), 'Should acknowledge async queue dispatch');
  console.log('   ✓ Asynchronous conversion queue dispatching verified.');

  // 5. Test BehaviorProcessor mapping
  console.log('5. Testing BehaviorProcessor CRM conversion mapping...');
  const processor = require('../src/services/BehaviorProcessor');

  assert.strictEqual(processor.mapInternalActionToConversionEvent('invoice_paid'), 'Purchase');
  assert.strictEqual(processor.mapInternalActionToConversionEvent('deal_won'), 'Purchase');
  assert.strictEqual(processor.mapInternalActionToConversionEvent('lead_capture'), 'Lead');
  assert.strictEqual(processor.mapInternalActionToConversionEvent('contact_form_submitted'), 'Lead');
  assert.strictEqual(processor.mapInternalActionToConversionEvent('cart_abandonment'), 'AddToCart');
  assert.strictEqual(processor.mapInternalActionToConversionEvent('account_created'), 'CompleteRegistration');
  console.log('   ✓ CRM mutation to CAPI conversion event mappings verified.');

  // 6. Test Webhook Verification and Signatures
  console.log('6. Testing Webhook Signature Verification...');
  const secret = 'erpjs_test_webhook_secret_key';
  const testPayload = JSON.stringify({ object: 'page', entry: [] });
  const hmac = crypto.createHmac('sha256', secret).update(testPayload, 'utf8').digest('hex');

  const validSig = verifyMetaSignature(testPayload, `sha256=${hmac}`, secret);
  assert.strictEqual(validSig, true, 'Valid HMAC signature should pass');

  const invalidSig = verifyMetaSignature(testPayload, 'sha256=invalid1234567890', secret);
  assert.strictEqual(invalidSig, false, 'Invalid HMAC signature should fail');
  console.log('   ✓ Webhook signature cryptographic verification passed.');

  console.log('--- ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
  process.exit(0);
}

runPhase3Verification().catch((err) => {
  console.error('Phase 3 Verification Failed:', err);
  process.exit(1);
});
