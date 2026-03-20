// @ts-nocheck
const { Parser } = require('expr-eval');

/**
 * Safely evaluates expressions within a workflow context
 * This uses expr-eval library which provides a secure sandboxed environment
 * for evaluating mathematical and logical expressions
 */
class ExpressionEvaluator {
  constructor() {
    // Create parser with custom operators
    this.parser = new Parser({
      operators: {
        // Add additional operators if needed
        in: true,
        contains: true,
      },
    });

    // Register custom functions and operators
    this.registerCustomFunctions();
  }

  /**
   * Register custom functions to extend the evaluator capabilities
   */
  registerCustomFunctions() {
    // String operations
    this.parser.functions.contains = (str, search) =>
      String(str).toLowerCase().includes(String(search).toLowerCase());

    this.parser.functions.startsWith = (str, search) =>
      String(str).toLowerCase().startsWith(String(search).toLowerCase());

    this.parser.functions.endsWith = (str, search) =>
      String(str).toLowerCase().endsWith(String(search).toLowerCase());

    // Array operations
    this.parser.functions.includes = (arr, item) => Array.isArray(arr) && arr.includes(item);

    this.parser.functions.length = (val) =>
      val && typeof val === 'object' ? Object.keys(val).length : String(val).length;

    // Type checking
    this.parser.functions.isNull = (val) => val === null || val === undefined;
    this.parser.functions.isNumber = (val) => typeof val === 'number' && !isNaN(val);
    this.parser.functions.isString = (val) => typeof val === 'string';
    this.parser.functions.isBoolean = (val) => typeof val === 'boolean';

    // Date functions
    this.parser.functions.now = () => new Date().getTime();
    this.parser.functions.timestamp = (dateStr) => new Date(dateStr).getTime();
    this.parser.functions.dateDiff = (date1, date2, unit = 'days') => {
      const d1 = new Date(date1).getTime();
      const d2 = new Date(date2).getTime();
      const diffMs = Math.abs(d2 - d1);

      switch (unit.toLowerCase()) {
        case 'seconds':
          return Math.floor(diffMs / 1000);
        case 'minutes':
          return Math.floor(diffMs / (1000 * 60));
        case 'hours':
          return Math.floor(diffMs / (1000 * 60 * 60));
        case 'days':
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        default:
          return diffMs;
      }
    };
  }

  /**
   * Evaluates an expression within the provided context
   *
   * @param {string} expression - The expression to evaluate
   * @param {Object} context - The context object containing variables
   * @returns {*} Result of the evaluation
   */
  evaluate(expression, context = {}) {
    try {
      // Sanitize expression - only allow specific patterns
      if (!this.isValidExpression(expression)) {
        throw new Error('Invalid expression format');
      }

      // Parse and evaluate the expression with the provided context
      const parsedExpression = this.parser.parse(expression);
      return parsedExpression.evaluate(context);
    } catch (error) {
      console.error('Expression evaluation error:', error.message);
      return false; // Default to false on errors
    }
  }

  /**
   * Validates that an expression has acceptable format and doesn't contain
   * potentially harmful patterns
   *
   * @param {string} expression - Expression to validate
   * @returns {boolean} Whether the expression is valid
   */
  isValidExpression(expression) {
    if (!expression || typeof expression !== 'string') {
      return false;
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/i,
      /function\s*\(/i,
      /Function\s*\(/i,
      /[^.]constructor/i,
      /import\s*\(/i,
      /require\s*\(/i,
      /process/i,
      /global/i,
      /__proto__/i,
      /prototype/i,
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(expression));
  }
}

module.exports = new ExpressionEvaluator();
