// @ts-nocheck
const expressionEvaluator = require('../../utils/expressionEvaluator');

/**
 * Service for handling workflow condition evaluation
 */
class WorkflowConditionService {
  /**
   * Evaluates all conditions in a workflow node
   * @param {Object} node - The workflow node containing conditions
   * @param {Object} context - Data context for evaluation
   * @returns {Object} Result with evaluation details
   */
  evaluateNodeConditions(node, context) {
    try {
      // Default to true if no config or no conditions
      if (!node || !node.data || !node.data.config) {
        return { result: true, details: [] };
      }

      const { config } = node.data;
      const evaluationDetails = [];

      // Simple field comparison
      if (config.field && config.operator) {
        const result = this.evaluateCondition(config.field, config.operator, config.value, context);

        evaluationDetails.push({
          type: 'field',
          field: config.field,
          operator: config.operator,
          value: config.value,
          result,
        });

        return {
          result,
          details: evaluationDetails,
        };
      }

      // Complex expression evaluation
      if (config.expression) {
        const result = expressionEvaluator.evaluate(config.expression, context);

        evaluationDetails.push({
          type: 'expression',
          expression: config.expression,
          result,
        });

        return {
          result,
          details: evaluationDetails,
        };
      }

      // If we reach here, no valid condition was found
      return { result: true, details: [] };
    } catch (error) {
      console.error('Error evaluating node conditions:', error);
      return {
        result: false,
        error: error.message,
        details: [{ type: 'error', error: error.message }],
      };
    }
  }

  /**
   * Evaluates a simple condition based on field, operator, and value
   * @param {string} field - Field path in dot notation (e.g., 'user.name')
   * @param {string} operator - Comparison operator
   * @param {*} value - Value to compare against
   * @param {Object} context - Data context
   * @returns {boolean} Result of the condition evaluation
   */
  evaluateCondition(field, operator, value, context) {
    try {
      // Get the actual field value from context using path notation
      const fieldValue = this.getNestedValue(context, field);

      // Handle null/undefined values
      if (fieldValue === undefined || fieldValue === null) {
        if (operator === 'exists') return false;
        if (operator === 'notExists') return true;
        return false;
      }

      // Perform the appropriate comparison based on operator
      switch (operator) {
        case 'equals':
          return fieldValue == value;
        case 'notEquals':
          return fieldValue != value;
        case 'greaterThan':
          return fieldValue > value;
        case 'greaterThanOrEqual':
          return fieldValue >= value;
        case 'lessThan':
          return fieldValue < value;
        case 'lessThanOrEqual':
          return fieldValue <= value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'notContains':
          return !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase());
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase());
        case 'in':
          return Array.isArray(value) && value.includes(fieldValue);
        case 'notIn':
          return Array.isArray(value) && !value.includes(fieldValue);
        case 'exists':
          return true; // We already handled the null/undefined case above
        case 'notExists':
          return false; // We already handled the null/undefined case above
        default:
          return false;
      }
    } catch (error) {
      console.error('Error in condition evaluation:', error);
      return false;
    }
  }

  /**
   * Evaluates a simple condition (async version for compatibility)
   * @param {Object} condition - Condition object
   * @param {Object} context - Evaluation context
   * @returns {Promise<boolean>} Result of condition evaluation
   */
  async evaluateConditionAsync(condition, context) {
    try {
      if (!condition) return true;

      // Handle different condition formats
      if (
        condition.field &&
        condition.operator &&
        Object.prototype.hasOwnProperty.call(condition, 'value')
      ) {
        return this.evaluateCondition(
          condition.field,
          condition.operator,
          condition.value,
          context
        );
      }

      // Handle expression-based conditions
      if (condition.expression) {
        return this.evaluateExpression(condition.expression, context);
      }

      // Legacy format support
      const { field, operator, value } = condition;
      if (field && operator) {
        return this.evaluateCondition(field, operator, value, context);
      }

      // Default to true if no valid condition format
      return true;
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Evaluates a JavaScript expression with context
   * @param {string} expression - JavaScript expression to evaluate
   * @param {Object} context - Data context
   * @returns {boolean} Result of the expression evaluation
   */
  evaluateExpression(expression, context) {
    try {
      // Create a safe evaluation function
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return Boolean(func(...Object.values(context)));
    } catch (error) {
      console.error('Error evaluating expression:', error);
      return false;
    }
  }

  /**
   * Gets a nested value from an object using dot notation
   * @param {Object} obj - Object to extract value from
   * @param {string} path - Path in dot notation (e.g., 'user.address.city')
   * @returns {*} The value at the specified path
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) return undefined;
      result = result[key];
    }

    return result;
  }

  /**
   * Determines the next nodes to process based on condition evaluations
   * @param {Object} currentNode - Current workflow node
   * @param {Array} edges - All edges in the workflow
   * @param {Object} context - Evaluation context
   * @returns {Array} List of next node IDs to process
   */
  getNextNodes(currentNode, edges, context) {
    // If this is a condition node, evaluate and determine which path to follow
    if (currentNode.type === 'conditionNode') {
      const evaluation = this.evaluateNodeConditions(currentNode, context);

      // Find outgoing edges
      const outgoingEdges = edges.filter((edge) => edge.source === currentNode.id);

      // Handle the true/false paths
      if (evaluation.result) {
        // Follow the 'a' handle (usually "Yes" or "True" path)
        const trueEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'a');
        return trueEdge ? [trueEdge.target] : [];
      } else {
        // Follow the 'b' handle (usually "No" or "False" path)
        const falseEdge = outgoingEdges.find((edge) => edge.sourceHandle === 'b');
        return falseEdge ? [falseEdge.target] : [];
      }
    }

    // For non-condition nodes, follow all outgoing connections
    const outgoingEdges = edges.filter((edge) => edge.source === currentNode.id);
    return outgoingEdges.map((edge) => edge.target);
  }
}

module.exports = WorkflowConditionService;
