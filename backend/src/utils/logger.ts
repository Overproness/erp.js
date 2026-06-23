// @ts-nocheck
/**
 * Simple logger implementation to replace winston dependency
 */

const fs = require('fs');
const path = require('path');

const defaultLogsDir =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join('/tmp', 'erpjs-logs')
    : path.join(__dirname, '../../logs');

const logsDir = process.env.LOG_DIR || defaultLogsDir;
let fileLoggingEnabled = false;

try {
  fs.mkdirSync(logsDir, { recursive: true });
  fileLoggingEnabled = true;
} catch (error) {
  console.warn(`File logging disabled: unable to create log directory ${logsDir}`, error.message);
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
  if (!fileLoggingEnabled) return;

  try {
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, message);
  } catch (error) {
    fileLoggingEnabled = false;
    console.error('File logging disabled: unable to write log file:', error.message);
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
