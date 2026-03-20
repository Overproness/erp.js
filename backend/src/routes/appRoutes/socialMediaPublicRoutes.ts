// @ts-nocheck
const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');

// Public webhook handlers for social media platforms
const handleFacebookWebhook = async (req, res) => {
  try {
    // Verify Facebook webhook
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
      if (req.query['hub.verify_token'] === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
        return;
      } else {
        res.status(403).send('Forbidden');
        return;
      }
    }

    // Handle Facebook webhook payload
    const body = req.body;
    if (body.object === 'page') {
      // Process Facebook page events
      body.entry.forEach(entry => {
        const webhookEvent = entry.messaging[0];
        console.log('Facebook webhook event:', webhookEvent);
        // Process the event (mentions, messages, etc.)
      });
      
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const handleInstagramWebhook = async (req, res) => {
  try {
    // Verify Instagram webhook
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token']) {
      if (req.query['hub.verify_token'] === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
        return;
      } else {
        res.status(403).send('Forbidden');
        return;
      }
    }

    // Handle Instagram webhook payload
    const body = req.body;
    if (body.object === 'instagram') {
      // Process Instagram events
      body.entry.forEach(entry => {
        entry.changes.forEach(change => {
          console.log('Instagram webhook event:', change);
          // Process the event (mentions, comments, etc.)
        });
      });
      
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

const handleTwitterWebhook = async (req, res) => {
  try {
    // Verify Twitter webhook (Challenge Response Check)
    if (req.query.crc_token) {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', process.env.TWITTER_WEBHOOK_SECRET)
        .update(req.query.crc_token)
        .digest('base64');
      
      res.status(200).json({
        response_token: `sha256=${hash}`
      });
      return;
    }

    // Handle Twitter webhook payload
    const body = req.body;
    if (body.tweet_create_events) {
      // Process tweet events
      body.tweet_create_events.forEach(tweet => {
        console.log('Twitter webhook event:', tweet);
        // Process the event (mentions, tweets, etc.)
      });
    }
    
    if (body.direct_message_events) {
      // Process direct message events
      body.direct_message_events.forEach(dm => {
        console.log('Twitter DM event:', dm);
        // Process direct messages
      });
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Twitter webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
};

// OAuth callback handlers
const handleFacebookCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    // In a real implementation, you would:
    // 1. Exchange code for access token
    // 2. Get user/page information
    // 3. Store credentials securely
    // 4. Redirect to frontend with success/error

    // For now, redirect to frontend with the code
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/facebook?code=${code}&state=${state}`);
  } catch (error) {
    console.error('Facebook callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/facebook?error=callback_failed`);
  }
};

const handleInstagramCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/instagram?code=${code}&state=${state}`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/instagram?error=callback_failed`);
  }
};

const handleTwitterCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code not provided'
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/twitter?code=${code}&state=${state}`);
  } catch (error) {
    console.error('Twitter callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/social-media/connect/twitter?error=callback_failed`);
  }
};

// Public status endpoint
const getStatus = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      result: {
        status: 'active',
        timestamp: new Date().toISOString(),
        webhooks: {
          facebook: !!process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN,
          instagram: !!process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN,
          twitter: !!process.env.TWITTER_WEBHOOK_SECRET,
        }
      },
      message: 'Social media service is operational'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      result: null,
      message: 'Service status check failed'
    });
  }
};

// Webhook routes (no authentication required)
router.route('/webhooks/facebook')
  .get(catchErrors(handleFacebookWebhook))  // Verification
  .post(catchErrors(handleFacebookWebhook)); // Event handling

router.route('/webhooks/instagram')
  .get(catchErrors(handleInstagramWebhook))  // Verification
  .post(catchErrors(handleInstagramWebhook)); // Event handling

router.route('/webhooks/twitter')
  .get(catchErrors(handleTwitterWebhook))    // CRC verification
  .post(catchErrors(handleTwitterWebhook));  // Event handling

// OAuth callback routes
router.route('/oauth/facebook/callback')
  .get(catchErrors(handleFacebookCallback));

router.route('/oauth/instagram/callback')
  .get(catchErrors(handleInstagramCallback));

router.route('/oauth/twitter/callback')
  .get(catchErrors(handleTwitterCallback));

// Status route
router.route('/status')
  .get(catchErrors(getStatus));

// Health check
router.route('/health')
  .get((req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

module.exports = router;
