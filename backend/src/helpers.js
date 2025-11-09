/*
  ─────────────────────────────────────────────────────────────
  Helper Utilities & Site Data for Templating
  ─────────────────────────────────────────────────────────────
  This file contains reusable functions and site-level constants 
  that can be used inside templates or other parts of the app.
*/

// ─────────────────────────────────────────────────────────────
// Node & External Dependencies
// ─────────────────────────────────────────────────────────────
const fs = require('fs'); // File system access for reading static assets
const moment = require('moment'); // Date formatting and manipulation
const currency = require('currency.js'); // Accurate currency calculations

// ─────────────────────────────────────────────────────────────
// Exported Constants
// ─────────────────────────────────────────────────────────────
exports.moment = moment;

exports.siteName = 'Express.js / MongoBD / Rest Api';

// ─────────────────────────────────────────────────────────────
// Asset Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Read and return an inline SVG icon from /public/images/icons
 * @param {string} name - Name of the icon file (without extension)
 * @returns {Buffer|null}
 */
exports.icon = (name) => {
  try {
    return fs.readFileSync(`./public/images/icons/${name}.svg`);
  } catch (error) {
    return null; // Return null if file not found or unreadable
  }
};

/**
 * Read and return a JPG image from /public/images/photos
 * @param {string} name - Name of the image file (without extension)
 * @returns {Buffer}
 */
exports.image = (name) => {
  return fs.readFileSync(`./public/images/photos/${name}.jpg`);
};

// ─────────────────────────────────────────────────────────────
// Time Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Generate a list of formatted time slots between two moments
 * @param {string|moment} start - Start time
 * @param {string|moment} end - End time
 * @param {string} [format='HH:mm'] - Format to display each time
 * @param {number} [interval=60] - Interval in minutes
 * @returns {string[]} Array of time slots (formatted)
 */
exports.timeRange = (start, end, format = 'HH:mm', interval = 60) => {
  interval = interval > 0 ? interval : 60;
  const range = [];

  while (moment(start).isBefore(moment(end))) {
    range.push(moment(start).format(format));
    start = moment(start).add(interval, 'minutes');
  }

  return range;
};

// ─────────────────────────────────────────────────────────────
// Currency Calculations
// ─────────────────────────────────────────────────────────────

/**
 * Currency-safe arithmetic operations using `currency.js`
 */
exports.calculate = {
  /**
   * Add two values
   */
  add: (a, b) => currency(a).add(b).value,

  /**
   * Subtract second value from first
   */
  sub: (a, b) => currency(a).subtract(b).value,

  /**
   * Multiply two values
   */
  multiply: (a, b) => currency(a).multiply(b).value,

  /**
   * Divide first value by second
   */
  divide: (a, b) => currency(a).divide(b).value,
};