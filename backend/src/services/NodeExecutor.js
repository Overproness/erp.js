const axios = require('axios');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

class NodeExecutor {
  constructor() {
    this.logger = require('../utils/logger');
  }

  async executeNode(node, inputData, context) {
    try {
      this.logger.info(`Executing node: ${node.type} (${node.id})`);

      const handler = this.getNodeHandler(node.type);
      if (!handler) {
        throw new Error(`Unknown node type: ${node.type}`);
      }

      const result = await handler.call(this, node, inputData, context);

      this.logger.info(`Node ${node.id} executed successfully`);
      return {
        success: true,
        data: result,
        nodeId: node.id,
      };
    } catch (error) {
      this.logger.error(`Node ${node.id} execution failed:`, error);
      return {
        success: false,
        error: error.message,
        nodeId: node.id,
      };
    }
  }

  getNodeHandler(nodeType) {
    const handlers = {
      httpRequest: this.executeHttpRequest,
      dataTransform: this.executeDataTransform,
      condition: this.executeCondition,
      delay: this.executeDelay,
      email: this.executeEmail,
      webhook: this.executeWebhook,
      database: this.executeDatabase,
      customScript: this.executeCustomScript,
      notification: this.executeNotification,
      fileOperation: this.executeFileOperation,
      dataValidation: this.executeDataValidation,
      loop: this.executeLoop,
      merge: this.executeMerge,
      split: this.executeSplit,
    };

    return handlers[nodeType];
  }

  async executeHttpRequest(node, inputData) {
    const { url, method = 'GET', headers = {}, body, timeout = 30000 } = node.config;

    const config = {
      method,
      url: this.interpolateString(url, inputData),
      headers: this.interpolateObject(headers, inputData),
      timeout,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.data = this.interpolateObject(body, inputData);
    }

    const response = await axios(config);
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }

  async executeDataTransform(node, inputData) {
    const { transformations = [] } = node.config;
    let result = { ...inputData };

    for (const transform of transformations) {
      const { operation, field, value, target } = transform;

      switch (operation) {
        case 'set': {
          result[target || field] = this.interpolateString(value, result);
          break;
        }
        case 'delete': {
          delete result[field];
          break;
        }
        case 'rename': {
          if (result[field] !== undefined) {
            result[target] = result[field];
            delete result[field];
          }
          break;
        }
        case 'uppercase': {
          if (result[field]) {
            result[field] = result[field].toString().toUpperCase();
          }
          break;
        }
        case 'lowercase': {
          if (result[field]) {
            result[field] = result[field].toString().toLowerCase();
          }
          break;
        }
        case 'trim': {
          if (result[field]) {
            result[field] = result[field].toString().trim();
          }
          break;
        }
        default:
          break;
      }
    }

    return result;
  }

  async executeCondition(node, inputData) {
    const { conditions = [], operator = 'AND' } = node.config;

    const results = conditions.map((condition) => {
      const { field, operator: condOp, value } = condition;
      const fieldValue = this.getNestedValue(inputData, field);
      const compareValue = this.interpolateString(value, inputData);

      switch (condOp) {
        case 'equals':
          return fieldValue == compareValue;
        case 'not_equals':
          return fieldValue != compareValue;
        case 'greater_than':
          return Number(fieldValue) > Number(compareValue);
        case 'less_than':
          return Number(fieldValue) < Number(compareValue);
        case 'contains':
          return String(fieldValue).includes(String(compareValue));
        case 'not_contains':
          return !String(fieldValue).includes(String(compareValue));
        case 'starts_with':
          return String(fieldValue).startsWith(String(compareValue));
        case 'ends_with':
          return String(fieldValue).endsWith(String(compareValue));
        case 'is_empty':
          return !fieldValue || fieldValue === '';
        case 'is_not_empty':
          return fieldValue && fieldValue !== '';
        default:
          return false;
      }
    });

    const conditionMet = operator === 'AND' ? results.every((r) => r) : results.some((r) => r);

    return {
      conditionMet,
      results,
      data: inputData,
    };
  }

  async executeDelay(node) {
    const { duration = 1000 } = node.config;
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { delayed: duration };
  }

  async executeEmail(node, inputData) {
    const { from, to, subject, body, smtpConfig = {}, attachments = [] } = node.config;

    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host || process.env.SMTP_HOST,
      port: smtpConfig.port || process.env.SMTP_PORT,
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.user || process.env.SMTP_USER,
        pass: smtpConfig.pass || process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: this.interpolateString(from, inputData),
      to: this.interpolateString(to, inputData),
      subject: this.interpolateString(subject, inputData),
      html: this.interpolateString(body, inputData),
      attachments: attachments.map((att) => ({
        filename: att.filename,
        path: att.path,
      })),
    };

    const info = await transporter.sendMail(mailOptions);
    return { messageId: info.messageId, sent: true };
  }

  async executeWebhook(node, inputData) {
    const { url, method = 'POST', headers = {} } = node.config;

    const response = await axios({
      method,
      url: this.interpolateString(url, inputData),
      headers: this.interpolateObject(headers, inputData),
      data: inputData,
    });

    return {
      status: response.status,
      data: response.data,
    };
  }

  async executeDatabase(node, inputData) {
    const { operation, collection, query = {}, data = {} } = node.config;
    const mongoose = require('mongoose');

    const Model = mongoose.model(collection);

    switch (operation) {
      case 'find': {
        const interpolatedQuery = this.interpolateObject(query, inputData);
        const results = await Model.find(interpolatedQuery);
        return { results, count: results.length };
      }
      case 'findOne': {
        const interpolatedQuery = this.interpolateObject(query, inputData);
        const result = await Model.findOne(interpolatedQuery);
        return { result };
      }
      case 'create': {
        const interpolatedData = this.interpolateObject(data, inputData);
        const result = await Model.create(interpolatedData);
        return { result };
      }
      case 'update': {
        const interpolatedQuery = this.interpolateObject(query, inputData);
        const interpolatedData = this.interpolateObject(data, inputData);
        const result = await Model.updateMany(interpolatedQuery, interpolatedData);
        return { modifiedCount: result.modifiedCount };
      }
      case 'delete': {
        const interpolatedQuery = this.interpolateObject(query, inputData);
        const result = await Model.deleteMany(interpolatedQuery);
        return { deletedCount: result.deletedCount };
      }
      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
  }

  async executeCustomScript(node, inputData) {
    const { script, timeout = 5000 } = node.config;
    const { VM } = require('vm2');

    const vm = new VM({
      timeout,
      sandbox: {
        data: inputData,
        console: {
          log: (...args) => this.logger.info('Script:', ...args),
        },
        require: (module) => {
          const allowedModules = ['lodash', 'moment', 'crypto'];
          if (allowedModules.includes(module)) {
            return require(module);
          }
          throw new Error(`Module ${module} is not allowed`);
        },
      },
    });

    const result = vm.run(`
      (function() {
        ${script}
      })()
    `);

    return { result };
  }

  async executeNotification(node, inputData) {
    const { type, message, recipients = [] } = node.config;

    const notification = {
      id: uuidv4(),
      type,
      message: this.interpolateString(message, inputData),
      recipients: recipients.map((r) => this.interpolateString(r, inputData)),
      timestamp: new Date(),
      data: inputData,
    };

    // Here you would integrate with your notification service
    this.logger.info('Notification created:', notification);

    return { notification };
  }

  async executeFileOperation(node, inputData) {
    const { operation, filePath, content, encoding = 'utf8' } = node.config;
    const resolvedPath = this.interpolateString(filePath, inputData);

    switch (operation) {
      case 'read': {
        const fileContent = await fs.readFile(resolvedPath, encoding);
        return { content: fileContent, path: resolvedPath };
      }
      case 'write': {
        const writeContent = this.interpolateString(content, inputData);
        await fs.writeFile(resolvedPath, writeContent, encoding);
        return { written: true, path: resolvedPath };
      }
      case 'append': {
        const appendContent = this.interpolateString(content, inputData);
        await fs.appendFile(resolvedPath, appendContent, encoding);
        return { appended: true, path: resolvedPath };
      }
      case 'delete': {
        await fs.unlink(resolvedPath);
        return { deleted: true, path: resolvedPath };
      }
      case 'exists': {
        try {
          await fs.access(resolvedPath);
          return { exists: true, path: resolvedPath };
        } catch {
          return { exists: false, path: resolvedPath };
        }
      }
      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
  }

  async executeDataValidation(node, inputData) {
    const { validations = [] } = node.config;
    const errors = [];

    for (const validation of validations) {
      const { field, rules = [] } = validation;
      const value = this.getNestedValue(inputData, field);

      for (const rule of rules) {
        const { type, params = {} } = rule;

        switch (type) {
          case 'required':
            if (value === undefined || value === null || value === '') {
              errors.push({ field, rule: 'required', message: `${field} is required` });
            }
            break;
          case 'minLength':
            if (String(value).length < params.min) {
              errors.push({
                field,
                rule: 'minLength',
                message: `${field} must be at least ${params.min} characters`,
              });
            }
            break;
          case 'maxLength':
            if (String(value).length > params.max) {
              errors.push({
                field,
                rule: 'maxLength',
                message: `${field} must be at most ${params.max} characters`,
              });
            }
            break;
          case 'pattern':
            if (!new RegExp(params.pattern).test(String(value))) {
              errors.push({
                field,
                rule: 'pattern',
                message: `${field} does not match required pattern`,
              });
            }
            break;
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
              errors.push({ field, rule: 'email', message: `${field} must be a valid email` });
            }
            break;
          default:
            break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: inputData,
    };
  }

  async executeLoop(node, inputData) {
    const { items, itemField = 'item', indexField = 'index' } = node.config;
    const loopItems = this.getNestedValue(inputData, items) || [];
    const results = [];

    for (let i = 0; i < loopItems.length; i++) {
      const loopData = {
        ...inputData,
        [itemField]: loopItems[i],
        [indexField]: i,
      };
      results.push(loopData);
    }

    return { results, count: results.length };
  }

  async executeMerge(node, inputData) {
    const { mergeKey, strategy = 'merge' } = node.config;

    if (!Array.isArray(inputData)) {
      return { merged: inputData };
    }

    switch (strategy) {
      case 'merge': {
        const merged = {};
        for (const item of inputData) {
          Object.assign(merged, item);
        }
        return { merged };
      }
      case 'array': {
        return { merged: inputData };
      }
      case 'groupBy': {
        const grouped = {};
        for (const item of inputData) {
          const key = this.getNestedValue(item, mergeKey);
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(item);
        }
        return { merged: grouped };
      }
      default:
        return { merged: inputData };
    }
  }

  async executeSplit(node, inputData) {
    const { splitField, delimiter = ',', strategy = 'array' } = node.config;
    const value = this.getNestedValue(inputData, splitField);

    if (!value) {
      return { splits: [] };
    }

    switch (strategy) {
      case 'array': {
        const splits = String(value)
          .split(delimiter)
          .map((item) => item.trim());
        return { splits };
      }
      case 'objects': {
        const splits = String(value)
          .split(delimiter)
          .map((item, index) => ({
            value: item.trim(),
            index,
            original: value,
          }));
        return { splits };
      }
      default:
        return { splits: [value] };
    }
  }

  // Helper methods
  interpolateString(template, data) {
    if (typeof template !== 'string') return template;

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      return this.getNestedValue(data, path.trim()) || match;
    });
  }

  interpolateObject(obj, data) {
    if (typeof obj !== 'object' || obj === null) {
      return this.interpolateString(obj, data);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.interpolateObject(item, data));
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.interpolateObject(value, data);
    }
    return result;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

module.exports = NodeExecutor;
