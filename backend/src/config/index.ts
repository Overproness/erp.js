/**
 * Marketing Automation Configuration
 *
 * Exports all configuration files for the marketing automation system
 */

import channels from './channels';
import triggers from './triggers';
import aiSettings from './aiSettings';
import analyticsConfig from './analyticsConfig';
import notificationConfig from './notificationConfig';
import urlConfig from './urlConfig';

export { channels, triggers, aiSettings, analyticsConfig, notificationConfig, urlConfig };

export default {
  channels,
  triggers,
  aiSettings,
  analyticsConfig,
  notificationConfig,
  urlConfig,
};
