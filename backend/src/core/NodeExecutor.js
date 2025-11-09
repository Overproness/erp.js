const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const { VM } = require('vm2');

class NodeExecutor {
  constructor() {
    this.nodeHandlers = new Map();
    this.registerDefaultHandlers();
  }

  /**
   * Register default node handlers
   */
  registerDefaultHandlers() {
    this.nodeHandlers.set('httpRequest', this.executeHttpRequest.bind(this));
    this.nodeHandlers.set('dataTransform', this.executeDataTransform.bind(this));
    this.nodeHandlers.set('condition', this.executeCondition.bind(this));
    this.nodeHandlers.set('delay', this.executeDelay.bind(this));
    this.nodeHandlers.set('email', this.executeEmail.bind(this));
    this.nodeHandlers.set('webhook', this.executeWebhook.bind(this));
    this.nodeHandlers.set('database', this.executeDatabase.bind(this));
    this.nodeHandlers.set('customScript', this.executeCustomScript.bind(this));
    this.nodeHandlers.set('notification', this.executeNotification.bind(this));
    this.nodeHandlers.set('fileOperation', this.executeFileOperation.bind(this));
    this.nodeHandlers.set('dataValidation', this.executeDataValidation.bind(this));
    this.nodeHandlers.set('loop', this.executeLoop.bind(this));
    this.nodeHandlers.set('merge', this.executeMerge.bind(this));
    this.nodeHandlers.set('split', this.executeSplit.bind(this));
  }

  /**
   * Execute a node
   * @param {Object} node - Node definition
   * @param {Object} inputData - Input data
   * @param {Object} execution - Execution context
   * @returns {Promise<Object>} Node output
   */
  async executeNode(node, inputData, execution) {
    if (node.isDisabled) {
      return { skipped: true, reason: 'Node is disabled' };
    }

    const handler = this.nodeHandlers.get(node.type);
    if (!handler) {
      throw new Error(`Unknown node type: ${node.type}`);
    }

    try {
      // Apply timeout
      const timeout = node.timeout || 30000;
      const result = await this.withTimeout(
        handler(node, inputData, execution),
        timeout
      );

      return result;
    } catch (error) {
      // Apply retry policy if configured
      if (node.retryPolicy && node.retryPolicy.maxRetries > 0) {
        return await this.retryExecution(node, inputData, execution, error);
      }
      throw error;
    }
  }

  /**
   * Execute HTTP Request node
   */
  async executeHttpRequest(node, inputData) {
    const config = node.configuration;
    const { method = 'GET', url, headers = {}, params = {}, body } = config;

    // Replace variables in configuration
    const processedUrl = this.replaceVariables(url, inputData);
    const processedHeaders = this.replaceVariables(headers, inputData);
    const processedBody = this.replaceVariables(body, inputData);

    const requestConfig = {
      method: method.toLowerCase(),
      url: processedUrl,
      headers: processedHeaders,
      params,
      timeout: node.timeout || 30000,
    };

    if (method.toUpperCase() !== 'GET' && processedBody) {
      requestConfig.data = processedBody;
    }

    const response = await axios(requestConfig);

    return {
      statusCode: response.status,
      headers: response.headers,
      data: response.data,
      url: response.config.url,
      method: response.config.method,
    };
  }

  /**
   * Execute Data Transform node
   */
  async executeDataTransform(node, inputData) {
    const config = node.configuration;
    const { transformType, script, mapping, filter } = config;

    switch (transformType) {
      case 'javascript':
        return this.executeJavaScriptTransform(script, inputData);
      
      case 'mapping':
        return this.executeFieldMapping(mapping, inputData);
      
      case 'filter':
        return this.executeDataFilter(filter, inputData);
      
      case 'aggregate':
        return this.executeDataAggregation(config.aggregation, inputData);
      
      default:
        throw new Error(`Unknown transform type: ${transformType}`);
    }
  }

  /**
   * Execute Condition node
   */
  async executeCondition(node, inputData) {
    const config = node.configuration;
    const { conditions, operator = 'AND' } = config;

    const results = conditions.map(condition => {
      return this.evaluateCondition(condition, inputData);
    });

    let conditionMet;
    if (operator === 'AND') {
      conditionMet = results.every(result => result);
    } else if (operator === 'OR') {
      conditionMet = results.some(result => result);
    } else {
      throw new Error(`Unknown condition operator: ${operator}`);
    }

    return {
      conditionMet,
      results,
      path: conditionMet ? 'true' : 'false',
      ...inputData,
    };
  }

  /**
   * Execute Delay node
   */
  async executeDelay(node, inputData) {
    const config = node.configuration;
    const { duration, unit = 'seconds' } = config;

    let delayMs;
    switch (unit) {
      case 'milliseconds':
        delayMs = duration;
        break;
      case 'seconds':
        delayMs = duration * 1000;
        break;
      case 'minutes':
        delayMs = duration * 60 * 1000;
        break;
      case 'hours':
        delayMs = duration * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return {
      delayed: true,
      duration: delayMs,
      ...inputData,
    };
  }

  /**
   * Execute Email node
   */
  async executeEmail(node, inputData) {
    const config = node.configuration;
    const { 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPassword, 
      from, 
      to, 
      subject, 
      body, 
      isHtml = false,
      attachments = []
    } = config;

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Replace variables
    const processedTo = this.replaceVariables(to, inputData);
    const processedSubject = this.replaceVariables(subject, inputData);
    const processedBody = this.replaceVariables(body, inputData);

    const mailOptions = {
      from,
      to: processedTo,
      subject: processedSubject,
      [isHtml ? 'html' : 'text']: processedBody,
      attachments: attachments.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
      })),
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      messageId: result.messageId,
      response: result.response,
      sent: true,
      to: processedTo,
      subject: processedSubject,
    };
  }

  /**
   * Execute Webhook node
   */
  async executeWebhook(node, inputData) {
    const config = node.configuration;
    const { url, method = 'POST', headers = {}, secret } = config;

    let body = inputData;
    
    // Add webhook signature if secret is provided
    if (secret) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await axios({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      data: body,
      timeout: node.timeout || 30000,
    });

    return {
      statusCode: response.status,
      response: response.data,
      sent: true,
      url,
    };
  }

  /**
   * Execute Database node
   */
  async executeDatabase(node, inputData) {

  /**
   * Execute Data Transform node
   */
  async executeDataTransform(node, inputData, execution) {
    const config = node.configuration;
    const { transformType, script, mapping, filter } = config;

    switch (transformType) {
      case 'javascript':
        return this.executeJavaScriptTransform(script, inputData);
      
      case 'mapping':
        return this.executeFieldMapping(mapping, inputData);
      
      case 'filter':
        return this.executeDataFilter(filter, inputData);
      
      case 'aggregate':
        return this.executeDataAggregation(config.aggregation, inputData);
      
      default:
        throw new Error(`Unknown transform type: ${transformType}`);
    }
  }

  /**
   * Execute Condition node
   */
  async executeCondition(node, inputData, execution) {
    const config = node.configuration;
    const { conditions, operator = 'AND' } = config;

    const results = conditions.map(condition => {
      return this.evaluateCondition(condition, inputData);
    });

    let conditionMet;
    if (operator === 'AND') {
      conditionMet = results.every(result => result);
    } else if (operator === 'OR') {
      conditionMet = results.some(result => result);
    } else {
      throw new Error(`Unknown condition operator: ${operator}`);
    }

    return {
      conditionMet,
      results,
      path: conditionMet ? 'true' : 'false',
      ...inputData,
    };
  }

  /**
   * Execute Delay node
   */
  async executeDelay(node, inputData, execution) {
    const config = node.configuration;
    const { delayType, duration, unit = 'seconds' } = config;

    let delayMs;
    switch (unit) {
      case 'milliseconds':
        delayMs = duration;
        break;
      case 'seconds':
        delayMs = duration * 1000;
        break;
      case 'minutes':
        delayMs = duration * 60 * 1000;
        break;
      case 'hours':
        delayMs = duration * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }

    await new Promise(resolve => setTimeout(resolve, delayMs));

    return {
      delayed: true,
      duration: delayMs,
      ...inputData,
    };
  }

  /**
   * Execute Email node
   */
  async executeEmail(node, inputData, execution) {
    const config = node.configuration;
    const { 
      smtpHost, 
      smtpPort, 
      smtpUser, 
      smtpPassword, 
      from, 
      to, 
      subject, 
      body, 
      isHtml = false,
      attachments = []
    } = config;

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    // Replace variables
    const processedTo = this.replaceVariables(to, inputData);
    const processedSubject = this.replaceVariables(subject, inputData);
    const processedBody = this.replaceVariables(body, inputData);

    const mailOptions = {
      from,
      to: processedTo,
      subject: processedSubject,
      [isHtml ? 'html' : 'text']: processedBody,
      attachments: attachments.map(att => ({
        filename: att.filename,
        path: att.path,
        content: att.content,
      })),
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      messageId: result.messageId,
      response: result.response,
      sent: true,
      to: processedTo,
      subject: processedSubject,
    };
  }

  /**
   * Execute Webhook node
   */
  async executeWebhook(node, inputData, execution) {
    const config = node.configuration;
    const { url, method = 'POST', headers = {}, secret } = config;

    let body = inputData;
    
    // Add webhook signature if secret is provided
    if (secret) {
      const crypto = require('crypto');
      const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex');
      
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const response = await axios({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      data: body,
      timeout: node.timeout || 30000,
    });

    return {
      statusCode: response.status,
      response: response.data,
      sent: true,
      url,
    };
  }

  /**
   * Execute Database node
   */
  async executeDatabase(node, inputData, execution) {
    const config = node.configuration;
    const { operation, collection, query, data, options = {} } = config;

    // This would integrate with your existing database
    // For now, this is a placeholder that would need to be implemented
    // based on your specific database setup
    
    const mongoose = require('mongoose');
    const Model = mongoose.model(collection);

    switch (operation) {
      case 'find': {
        const processedQuery = this.replaceVariables(query, inputData);
        const results = await Model.find(processedQuery, null, options);
        return { results, count: results.length };
      }

      case 'findOne': {
        const processedFindQuery = this.replaceVariables(query, inputData);
        const result = await Model.findOne(processedFindQuery);
        return { result };
      }

      case 'create': {
        const processedData = this.replaceVariables(data, inputData);
        const created = await Model.create(processedData);
        return { created };
      }

      case 'update': {
        const processedUpdateQuery = this.replaceVariables(query, inputData);
        const processedUpdateData = this.replaceVariables(data, inputData);
        const updated = await Model.updateMany(processedUpdateQuery, processedUpdateData, options);
        return { updated: updated.nModified };
      }

      case 'delete': {
        const processedDeleteQuery = this.replaceVariables(query, inputData);
        const deleted = await Model.deleteMany(processedDeleteQuery);
        return { deleted: deleted.deletedCount };
      }

      default:
        throw new Error(`Unknown database operation: ${operation}`);
    }
  }

  /**
   * Execute Custom Script node
   */
  async executeCustomScript(node, inputData, execution) {
    const config = node.configuration;
    const { script, language = 'javascript', timeout = 10000 } = config;

    if (language !== 'javascript') {
      throw new Error(`Unsupported script language: ${language}`);
    }

    // Create secure VM context
    const vm = new VM({
      timeout,
      sandbox: {
        inputData,
        console: {
          log: (...args) => console.log('[CustomScript]', ...args),
        },
        require: (module) => {
          // Allow only specific modules
          const allowedModules = ['lodash', 'moment', 'crypto'];
          if (allowedModules.includes(module)) {
            return require(module);
          }
          throw new Error(`Module '${module}' is not allowed`);
        },
      },
    });

    // Execute script
    const result = vm.run(`
      (function() {
        ${script}
      })()
    `);

    return { result, scriptExecuted: true };
  }

  /**
   * Execute Notification node
   */
  async executeNotification(node, inputData, execution) {
    const config = node.configuration;
    const { type, message, title, recipients } = config;

    const processedMessage = this.replaceVariables(message, inputData);
    const processedTitle = this.replaceVariables(title, inputData);

    // This would integrate with your notification system
    // For now, this is a placeholder
    console.log(`[${type.toUpperCase()} NOTIFICATION] ${processedTitle}: ${processedMessage}`);

    return {
      sent: true,
      type,
      message: processedMessage,
      title: processedTitle,
      recipients,
    };
  }

  /**
   * Execute File Operation node
   */
  async executeFileOperation(node, inputData, execution) {
    const config = node.configuration;
    const { operation, filePath, content, encoding = 'utf8' } = config;

    const processedFilePath = this.replaceVariables(filePath, inputData);

    switch (operation) {
      case 'read': {
        const fileContent = await fs.readFile(processedFilePath, encoding);
        return { content: fileContent, filePath: processedFilePath };
      }

      case 'write': {
        const processedContent = this.replaceVariables(content, inputData);
        await fs.writeFile(processedFilePath, processedContent, encoding);
        return { written: true, filePath: processedFilePath };
      }

      case 'exists':
        try {
          await fs.access(processedFilePath);
          return { exists: true, filePath: processedFilePath };
        } catch {
          return { exists: false, filePath: processedFilePath };
        }

      case 'delete':
        await fs.unlink(processedFilePath);
        return { deleted: true, filePath: processedFilePath };

      default:
        throw new Error(`Unknown file operation: ${operation}`);
    }
  }

  /**
   * Execute Data Validation node
   */
  async executeDataValidation(node, inputData, execution) {
    const config = node.configuration;
    const { validations, strictMode = false } = config;

    const errors = [];
    const validatedData = { ...inputData };

    for (const validation of validations) {
      const { field, rules } = validation;
      const value = this.getNestedValue(inputData, field);

      for (const rule of rules) {
        const isValid = this.validateRule(value, rule);
        if (!isValid) {
          errors.push({
            field,
            rule: rule.type,
            message: rule.message || `Validation failed for field: ${field}`,
          });

          if (strictMode) {
            throw new Error(`Validation failed for field: ${field}`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validatedData,
    };
  }

  /**
   * Execute Loop node
   */
  async executeLoop(node, inputData, execution) {
    const config = node.configuration;
    const { loopType, items, condition, maxIterations = 100 } = config;

    const results = [];
    let iteration = 0;

    if (loopType === 'forEach') {
      const itemsArray = this.getNestedValue(inputData, items);
      if (!Array.isArray(itemsArray)) {
        throw new Error('Items must be an array for forEach loop');
      }

      for (const item of itemsArray) {
        if (iteration >= maxIterations) break;
        
        const loopContext = { ...inputData, currentItem: item, iteration };
        results.push(loopContext);
        iteration++;
      }
    } else if (loopType === 'while') {
      while (iteration < maxIterations) {
        const loopContext = { ...inputData, iteration };
        const shouldContinue = this.evaluateExpression(condition, loopContext);
        
        if (!shouldContinue) break;
        
        results.push(loopContext);
        iteration++;
      }
    }

    return {
      results,
      iterations: iteration,
      completed: true,
    };
  }

  /**
   * Execute Merge node
   */
  async executeMerge(node, inputData, execution) {
    const config = node.configuration;
    const { mergeStrategy = 'combine' } = config;

    // This node typically receives input from multiple sources
    // For simplicity, we'll assume inputData contains multiple objects to merge
    const { sources = [] } = inputData;

    let merged = {};

    switch (mergeStrategy) {
      case 'combine':
        sources.forEach(source => {
          merged = { ...merged, ...source };
        });
        break;

      case 'array':
        merged = { items: sources };
        break;

      case 'deep':
        // Deep merge implementation
        merged = this.deepMerge(...sources);
        break;

      default:
        throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
    }

    return merged;
  }

  /**
   * Execute Split node
   */
  async executeSplit(node, inputData, execution) {
    const config = node.configuration;
    const { splitBy, field } = config;

    const dataToSplit = field ? this.getNestedValue(inputData, field) : inputData;

    if (splitBy === 'array') {
      if (!Array.isArray(dataToSplit)) {
        throw new Error('Data must be an array for array split');
      }

      return {
        items: dataToSplit.map((item, index) => ({
          ...inputData,
          currentItem: item,
          index,
        })),
        count: dataToSplit.length,
      };
    } else if (splitBy === 'object') {
      const items = Object.entries(dataToSplit).map(([key, value]) => ({
        ...inputData,
        key,
        value,
      }));

      return { items, count: items.length };
    }

    throw new Error(`Unknown split type: ${splitBy}`);
  }

  // Helper methods

  /**
   * Replace variables in a string or object
   */
  replaceVariables(template, variables) {
    if (typeof template === 'string') {
      return template.replace(/\$\{([^}]+)\}/g, (match, variable) => {
        return this.getNestedValue(variables, variable) || match;
      });
    } else if (typeof template === 'object' && template !== null) {
      const result = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.replaceVariables(value, variables);
      }
      return result;
    }
    return template;
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Evaluate condition
   */
  evaluateCondition(condition, data) {
    const { field, operator, value } = condition;
    const fieldValue = this.getNestedValue(data, field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'notEquals':
        return fieldValue !== value;
      case 'greaterThan':
        return fieldValue > value;
      case 'lessThan':
        return fieldValue < value;
      case 'contains':
        return String(fieldValue).includes(value);
      case 'startsWith':
        return String(fieldValue).startsWith(value);
      case 'endsWith':
        return String(fieldValue).endsWith(value);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'notExists':
        return fieldValue === undefined || fieldValue === null;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Execute JavaScript transform
   */
  executeJavaScriptTransform(script, inputData) {
    const vm = new VM({
      timeout: 5000,
      sandbox: { inputData },
    });

    return vm.run(`
      (function(data) {
        ${script}
      })(inputData)
    `);
  }

  /**
   * Execute field mapping
   */
  executeFieldMapping(mapping, inputData) {
    const result = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      result[targetField] = this.getNestedValue(inputData, sourceField);
    }

    return result;
  }

  /**
   * Execute data filter
   */
  executeDataFilter(filter, inputData) {
    if (!Array.isArray(inputData.items)) {
      throw new Error('Filter requires an array of items');
    }

    const filtered = inputData.items.filter(item => {
      return this.evaluateCondition(filter, item);
    });

    return { items: filtered, count: filtered.length };
  }

  /**
   * With timeout wrapper
   */
  withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  /**
   * Retry execution with backoff
   */
  async retryExecution(node, inputData, execution, lastError) {
    const { maxRetries, retryDelay, backoffMultiplier = 2 } = node.retryPolicy;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(backoffMultiplier, attempt - 1)));
        
        const handler = this.nodeHandlers.get(node.type);
        return await handler(node, inputData, execution);
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Node failed after ${maxRetries} retries. Last error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Deep merge objects
   */
  deepMerge(...objects) {
    const result = {};
    
    objects.forEach(obj => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          result[key] = this.deepMerge(result[key] || {}, obj[key]);
        } else {
          result[key] = obj[key];
        }
      });
    });

    return result;
  }

  /**
   * Validate rule
   */
  validateRule(value, rule) {
    const { type, parameter } = rule;

    switch (type) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'minLength':
        return String(value).length >= parameter;
      case 'maxLength':
        return String(value).length <= parameter;
      case 'min':
        return Number(value) >= parameter;
      case 'max':
        return Number(value) <= parameter;
      default:
        return true;
    }
  }

  /**
   * Evaluate expression
   */
  evaluateExpression(expression, context) {
    const vm = new VM({
      timeout: 1000,
      sandbox: context,
    });

    return vm.run(expression);
  }
}

module.exports = NodeExecutor;
