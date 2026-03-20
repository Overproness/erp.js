// @ts-nocheck
/**
 * Service for handling workflow validation
 */
class WorkflowValidationService {
  /**
   * Validates a workflow definition structure
   * @param {Object} definition - The workflow definition to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  async validateWorkflowDefinition(definition) {
    const errors = [];
    let isValid = true;

    try {
      // Check if definition is provided
      if (!definition) {
        errors.push('Workflow definition is required');
        return { isValid: false, errors };
      }

      // Check required fields
      if (!definition.id && !definition._id) {
        errors.push('Workflow definition must have an id');
        isValid = false;
      }

      if (!definition.name) {
        errors.push('Workflow definition must have a name');
        isValid = false;
      }

      // Support both new format (nodes/edges) and legacy format (tasks/flows)
      const nodes = definition.nodes || definition.tasks || [];
      const edges = definition.edges || definition.flows || [];

      // Check nodes/tasks
      if (!Array.isArray(nodes) || nodes.length === 0) {
        errors.push('Workflow definition must have nodes/tasks array');
        isValid = false;
      } else {
        // Validate individual nodes
        const nodeValidation = this.validateNodes(nodes);
        if (!nodeValidation.isValid) {
          errors.push(...nodeValidation.errors);
          isValid = false;
        }
      }

      // Check edges/flows (optional for some workflows)
      if (Array.isArray(edges) && edges.length > 0) {
        // Validate individual edges
        const edgeValidation = this.validateEdges(edges, nodes);
        if (!edgeValidation.isValid) {
          errors.push(...edgeValidation.errors);
          isValid = false;
        }
      }

      // Check for at least one start node/task
      const startNodes = nodes.filter(
        (node) => node.type === 'startNode' || node.type === 'start' || node.type === 'start_event'
      );
      if (startNodes.length === 0) {
        errors.push('Workflow must have at least one start task');
        isValid = false;
      }

      // Check for at least one end node/task
      const endNodes = nodes.filter(
        (node) => node.type === 'endNode' || node.type === 'end' || node.type === 'end_event'
      );
      if (endNodes.length === 0) {
        errors.push('Workflow must have at least one end task');
        isValid = false;
      }

      // Check for nonexistent references in flows/edges
      const nodeIds = new Set(nodes.map((node) => node.id));
      for (const edge of edges) {
        const sourceId = edge.source || edge.from;
        const targetId = edge.target || edge.to;

        if (sourceId && !nodeIds.has(sourceId)) {
          errors.push(`Edge references nonexistent source node: ${sourceId}`);
          isValid = false;
        }

        if (targetId && !nodeIds.has(targetId)) {
          errors.push(`Edge references nonexistent target node: ${targetId}`);
          isValid = false;
        }
      }

      // Additional validation properties for tests
      const result = {
        isValid,
        errors,
        hasGateways: false,
        gatewayCount: 0,
      };

      // Check for gateways
      if (nodes.length > 0) {
        const gateways = nodes.filter(
          (node) =>
            node.type === 'gateway' ||
            node.type === 'exclusiveGateway' ||
            node.type === 'exclusive_gateway' ||
            node.type === 'parallelGateway' ||
            node.type === 'parallel_gateway' ||
            node.type === 'inclusiveGateway' ||
            node.type === 'inclusive_gateway' ||
            node.type === 'conditionNode'
        );
        result.hasGateways = gateways.length > 0;
        result.gatewayCount = gateways.length;
      }

      return result;
    } catch (error) {
      console.error('Error validating workflow definition:', error);
      errors.push(`Validation error: ${error.message}`);
      return {
        isValid: false,
        errors,
        hasGateways: false,
        gatewayCount: 0,
      };
    }
  }

  /**
   * Validates workflow nodes
   * @param {Array} nodes - Array of workflow nodes
   * @returns {Object} Validation result
   */
  validateNodes(nodes) {
    const errors = [];
    let isValid = true;

    for (const node of nodes) {
      if (!node.id) {
        errors.push(`Node missing required 'id' field`);
        isValid = false;
      }

      if (!node.type) {
        errors.push(`Node ${node.id || 'unknown'} missing required 'type' field`);
        isValid = false;
      }

      // Validate node-specific requirements
      if (node.type === 'conditionNode') {
        if (!node.data || !node.data.config) {
          errors.push(`Condition node ${node.id} missing configuration`);
          isValid = false;
        }
      }

      if (node.type === 'actionNode') {
        if (!node.data || !node.data.config || !node.data.config.action) {
          errors.push(`Action node ${node.id} missing action configuration`);
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }

  /**
   * Validates workflow edges
   * @param {Array} edges - Array of workflow edges
   * @param {Array} nodes - Array of workflow nodes
   * @returns {Object} Validation result
   */
  validateEdges(edges, nodes) {
    const errors = [];
    let isValid = true;
    const nodeIds = new Set(nodes.map((node) => node.id));

    for (const edge of edges) {
      // Support both formats: {source, target} and {from, to}
      const sourceId = edge.source || edge.from;
      const targetId = edge.target || edge.to;
      const edgeId = edge.id || `${sourceId}->${targetId}`;

      if (!sourceId) {
        errors.push(`Edge ${edgeId} missing required 'source'/'from' field`);
        isValid = false;
      } else if (!nodeIds.has(sourceId)) {
        errors.push(`Edge ${edgeId} references non-existent source node: ${sourceId}`);
        isValid = false;
      }

      if (!targetId) {
        errors.push(`Edge ${edgeId} missing required 'target'/'to' field`);
        isValid = false;
      } else if (!nodeIds.has(targetId)) {
        errors.push(`Edge ${edgeId} references non-existent target node: ${targetId}`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Validates for orphaned nodes
   * @param {Array} nodes - Array of workflow nodes
   * @param {Array} edges - Array of workflow edges
   * @returns {Object} Validation result
   */
  validateOrphanedNodes(nodes, edges) {
    const errors = [];
    let isValid = true;

    const connectedNodes = new Set();
    edges.forEach((edge) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    for (const node of nodes) {
      // Start and end nodes can be orphaned in certain directions
      if (node.type === 'startNode' || node.type === 'endNode') {
        continue;
      }

      if (!connectedNodes.has(node.id)) {
        errors.push(`Orphaned node detected: ${node.id} (${node.type})`);
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  /**
   * Validates for circular dependencies
   * @param {Array} nodes - Array of workflow nodes
   * @param {Array} edges - Array of workflow edges
   * @returns {Object} Validation result
   */
  validateCircularDependencies(nodes, edges) {
    const errors = [];
    let isValid = true;

    // Build adjacency list
    const adjacencyList = {};
    nodes.forEach((node) => {
      adjacencyList[node.id] = [];
    });

    edges.forEach((edge) => {
      if (adjacencyList[edge.source]) {
        adjacencyList[edge.source].push(edge.target);
      }
    });

    // Use DFS to detect cycles
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        return true; // Back edge found, cycle detected
      }

      if (visited.has(nodeId)) {
        return false; // Already processed
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      for (const neighbor of adjacencyList[nodeId] || []) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of Object.keys(adjacencyList)) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          errors.push(`Circular dependency detected in workflow`);
          isValid = false;
          break;
        }
      }
    }

    return { isValid, errors };
  }
}

module.exports = WorkflowValidationService;
