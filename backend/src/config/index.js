/**
 * Marketing Automation Configuration
 * 
 * Exports all configuration files for the marketing automation system
 */

const channels = require('./channels');
const triggers = require('./triggers');
const aiSettings = require('./aiSettings');

module.exports = {
  channels,
  triggers,
  aiSettings
};
