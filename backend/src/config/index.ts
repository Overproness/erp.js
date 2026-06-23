/**
 * Marketing Automation Configuration
 *
 * Exports all configuration files for the marketing automation system
 */

const channels = require('./channels');
const triggers = require('./triggers');
const aiSettings = require('./aiSettings');
const analyticsConfig = require('./analyticsConfig');
const notificationConfig = require('./notificationConfig');
const urlConfig = require('./urlConfig');

export { channels, triggers, aiSettings, analyticsConfig, notificationConfig, urlConfig };

export default {
  channels,
  triggers,
  aiSettings,
  analyticsConfig,
  notificationConfig,
  urlConfig,
};
