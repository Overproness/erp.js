// @ts-nocheck
/**
 * Simple logger implementation to replace winston dependency
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level, message, meta) => {
  const timestamp = getTimestamp();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}\n`;
};

const writeToFile = (message, level) => {
  try {
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, message);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Simple logger implementation
const logger = {
  info: (message, meta = null) => {
    const formattedMessage = formatMessage('info', message, meta);
    console.log(formattedMessage);
    writeToFile(formattedMessage, 'info');
  },
  
  error: (message, meta = null) => {
    const formattedMessage = formatMessage('error', message, meta);
    console.error(formattedMessage);
    writeToFile(formattedMessage, 'error');
  },
  
  warn: (message, meta = null) => {
    const formattedMessage = formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    writeToFile(formattedMessage, 'warn');
  },
  
  debug: (message, meta = null) => {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = formatMessage('debug', message, meta);
      console.debug(formattedMessage);
      writeToFile(formattedMessage, 'debug');
    }
  }
};

module.exports = logger;
