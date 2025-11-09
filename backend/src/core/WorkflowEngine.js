const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const EnhancedWorkflow = require('../models/appModels/EnhancedWorkflow');
const WorkflowExecution = require('../models/appModels/WorkflowExecution');
const NodeExecutor = require('../services/NodeExecutor');

class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.activeExecutions = new Map();
    this.nodeExecutor = new NodeExecutor();
    this.maxConcurrentExecutions = 100;
    this.executionQueue = [];
    this.isProcessingQueue = false;

    // Start queue processor
    this.processQueue();
  }

  /**
   * Execute a workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} inputData - Input data for the workflow
   * @param {Object} triggerInfo - Information about what triggered the execution
   * @param {string} userId - User who initiated the execution
   * @returns {Promise<WorkflowExecution>}
   */
  async executeWorkflow(workflowId, inputData = {}, triggerInfo = {}, userId = null) {
    try {
      // Fetch workflow
      const workflow = await EnhancedWorkflow.findById(workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      if (workflow.status !== 'active') {
        throw new Error(`Workflow is not active: ${workflow.status}`);
      }

      // Generate execution ID
      const executionId = uuidv4();

      // Create execution record
      const execution = new WorkflowExecution({
        workflowId: workflow._id,
        workflowName: workflow.name,
        workflowVersion: workflow.version,
        executionId,
        trigger: triggerInfo,
        inputData,
        initiatedBy: userId,
        context: {
          variables: { ...inputData },
          environment: workflow.metadata.environment,
          sessionId: uuidv4(),
          traceId: executionId,
        },
        queueInfo: {
          queuedAt: new Date(),
          priority: triggerInfo.priority || 0,
        },
      });

      await execution.save();

      // Check concurrency limits
      if (!workflow.executionSettings.concurrent && this.isWorkflowRunning(workflowId)) {
        execution.status = 'pending';
        await execution.save();
        this.executionQueue.push({ execution, workflow });
        return execution;
      }

      // Execute immediately
      this.executeWorkflowAsync(execution, workflow);
      return execution;
    } catch (error) {
      console.error('Error starting workflow execution:', error);
      throw error;
    }
  }

  /**
   * Execute workflow asynchronously
   * @param {WorkflowExecution} execution
   * @param {EnhancedWorkflow} workflow
   */
  async executeWorkflowAsync(execution, workflow) {
    try {
      // Mark as running
      this.activeExecutions.set(execution.executionId, execution);
      await execution.start();

      // Emit execution started event
      this.emit('execution:started', { execution, workflow });

      // Build execution graph
      const executionGraph = this.buildExecutionGraph(workflow.nodes, workflow.connections);

      // Execute nodes
      const result = await this.executeNodes(execution, workflow, executionGraph);

      // Complete execution
      await execution.complete(result);
      await workflow.incrementExecutionCount(true, execution.executionTime);

      // Emit execution completed event
      this.emit('execution:completed', { execution, workflow, result });
    } catch (error) {
      console.error('Workflow execution failed:', error);

      // Mark execution as failed
      await execution.fail(error);
      await workflow.incrementExecutionCount(false, execution.executionTime);

      // Emit execution failed event
      this.emit('execution:failed', { execution, workflow, error });
    } finally {
      // Clean up
      this.activeExecutions.delete(execution.executionId);

      // Process queue if needed
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    }
  }

  /**
   * Build execution graph from nodes and connections
   * @param {Array} nodes - Workflow nodes
   * @param {Array} connections - Node connections
   * @returns {Object} Execution graph
   */
  buildExecutionGraph(nodes, connections) {
    const graph = {
      nodes: new Map(),
      dependencies: new Map(),
      dependents: new Map(),
      entryPoints: [],
    };

    // Initialize nodes
    nodes.forEach((node) => {
      graph.nodes.set(node.id, { ...node, status: 'pending' });
      graph.dependencies.set(node.id, []);
      graph.dependents.set(node.id, []);
    });

    // Build dependency graph
    connections.forEach((connection) => {
      const sourceId = connection.source.nodeId;
      const targetId = connection.target.nodeId;

      graph.dependencies.get(targetId).push({
        nodeId: sourceId,
        outputName: connection.source.outputName,
        inputName: connection.target.inputName,
        condition: connection.condition,
      });

      graph.dependents.get(sourceId).push({
        nodeId: targetId,
        outputName: connection.source.outputName,
        inputName: connection.target.inputName,
        condition: connection.condition,
      });
    });

    // Find entry points (nodes with no dependencies)
    nodes.forEach((node) => {
      if (graph.dependencies.get(node.id).length === 0) {
        graph.entryPoints.push(node.id);
      }
    });

    return graph;
  }

  /**
   * Execute nodes in the workflow
   * @param {WorkflowExecution} execution
   * @param {EnhancedWorkflow} workflow
   * @param {Object} executionGraph
   * @returns {Promise<Object>} Final output data
   */
  async executeNodes(execution, workflow, executionGraph) {
    const nodeOutputs = new Map();
    const executedNodes = new Set();
    const pendingNodes = new Set(executionGraph.entryPoints);

    let finalOutput = {};

    while (pendingNodes.size > 0) {
      const currentBatch = Array.from(pendingNodes);
      pendingNodes.clear();

      // Execute current batch of nodes in parallel if allowed
      const nodePromises = currentBatch.map(async (nodeId) => {
        const node = executionGraph.nodes.get(nodeId);

        try {
          // Prepare input data for the node
          const nodeInput = this.prepareNodeInput(
            node,
            executionGraph.dependencies.get(nodeId),
            nodeOutputs,
            execution.context.variables
          );

          // Execute the node
          const startTime = Date.now();
          const nodeResult = await this.nodeExecutor.executeNode(node, nodeInput, execution);
          const executionTime = Date.now() - startTime;

          // Store node execution result
          await execution.addNodeExecution({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            status: 'success',
            startedAt: new Date(startTime),
            finishedAt: new Date(),
            executionTime,
            inputData: nodeInput,
            outputData: nodeResult,
          });

          // Store output for dependent nodes
          nodeOutputs.set(nodeId, nodeResult);
          executedNodes.add(nodeId);

          // Update final output if this is an output node
          if (node.type === 'output' || executionGraph.dependents.get(nodeId).length === 0) {
            finalOutput = { ...finalOutput, ...nodeResult };
          }

          // Add dependent nodes to pending queue
          const dependents = executionGraph.dependents.get(nodeId);
          dependents.forEach((dependent) => {
            // Check if all dependencies are satisfied
            const allDepsExecuted = executionGraph.dependencies
              .get(dependent.nodeId)
              .every((dep) => executedNodes.has(dep.nodeId));

            if (allDepsExecuted && !executedNodes.has(dependent.nodeId)) {
              pendingNodes.add(dependent.nodeId);
            }
          });

          await execution.addLog('info', `Node ${node.name} executed successfully`, nodeId, {
            executionTime,
          });
        } catch (error) {
          console.error(`Node execution failed: ${node.name}`, error);

          // Record failed node execution
          await execution.addNodeExecution({
            nodeId: node.id,
            nodeName: node.name,
            nodeType: node.type,
            status: 'error',
            startedAt: new Date(),
            finishedAt: new Date(),
            errorMessage: error.message,
            errorStack: error.stack,
          });

          await execution.addLog('error', `Node ${node.name} failed: ${error.message}`, nodeId, {
            error: error.message,
          });

          // Handle error based on workflow settings
          if (workflow.executionSettings.errorHandling.onError === 'stop') {
            throw error;
          } else if (workflow.executionSettings.errorHandling.onError === 'continue') {
            // Skip this node and continue
            executedNodes.add(nodeId);
          }
        }
      });

      // Wait for current batch to complete
      await Promise.all(nodePromises);

      // Timeout check
      const executionTime = Date.now() - execution.startedAt.getTime();
      if (executionTime > workflow.executionSettings.timeout) {
        throw new Error(`Workflow execution timeout after ${executionTime}ms`);
      }
    }

    return finalOutput;
  }

  /**
   * Prepare input data for a node
   * @param {Object} node - Node definition
   * @param {Array} dependencies - Node dependencies
   * @param {Map} nodeOutputs - Outputs from previous nodes
   * @param {Object} contextVariables - Context variables
   * @returns {Object} Node input data
   */
  prepareNodeInput(node, dependencies, nodeOutputs, contextVariables) {
    let nodeInput = { ...contextVariables };

    // Merge outputs from dependent nodes
    dependencies.forEach((dependency) => {
      const depOutput = nodeOutputs.get(dependency.nodeId);
      if (depOutput) {
        // Apply input mapping if specified
        if (dependency.inputName && dependency.inputName !== 'default') {
          nodeInput[dependency.inputName] = depOutput;
        } else {
          nodeInput = { ...nodeInput, ...depOutput };
        }
      }
    });

    return nodeInput;
  }

  /**
   * Process execution queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.executionQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (
        this.executionQueue.length > 0 &&
        this.activeExecutions.size < this.maxConcurrentExecutions
      ) {
        const { execution, workflow } = this.executionQueue.shift();

        // Check if workflow is still not running (for single-instance workflows)
        if (!workflow.executionSettings.concurrent && this.isWorkflowRunning(workflow._id)) {
          this.executionQueue.unshift({ execution, workflow });
          break;
        }

        // Execute workflow
        this.executeWorkflowAsync(execution, workflow);
      }
    } finally {
      this.isProcessingQueue = false;
    }

    // Schedule next queue processing
    if (this.executionQueue.length > 0) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  /**
   * Check if a workflow is currently running
   * @param {string} workflowId - Workflow ID
   * @returns {boolean}
   */
  isWorkflowRunning(workflowId) {
    for (const execution of this.activeExecutions.values()) {
      if (execution.workflowId.toString() === workflowId.toString()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Cancel workflow execution
   * @param {string} executionId - Execution ID
   * @returns {Promise<boolean>}
   */
  async cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      await execution.cancel();
      this.activeExecutions.delete(executionId);

      this.emit('execution:cancelled', { execution });
      return true;
    } catch (error) {
      console.error('Error cancelling execution:', error);
      return false;
    }
  }

  /**
   * Get execution status
   * @param {string} executionId - Execution ID
   * @returns {Object|null}
   */
  getExecutionStatus(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return null;
    }

    return {
      executionId: execution.executionId,
      status: execution.status,
      startedAt: execution.startedAt,
      currentNode: this.getCurrentNode(execution),
      progress: this.calculateProgress(execution),
    };
  }

  /**
   * Calculate execution progress
   * @param {WorkflowExecution} execution
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress(execution) {
    if (!execution.nodeExecutions || execution.nodeExecutions.length === 0) {
      return 0;
    }

    const completedNodes = execution.nodeExecutions.filter(
      (ne) => ne.status === 'success' || ne.status === 'error' || ne.status === 'skipped'
    ).length;

    return Math.round((completedNodes / execution.nodeExecutions.length) * 100);
  }

  /**
   * Get currently executing node
   * @param {WorkflowExecution} execution
   * @returns {string|null}
   */
  getCurrentNode(execution) {
    const runningNode = execution.nodeExecutions.find((ne) => ne.status === 'running');
    return runningNode ? runningNode.nodeId : null;
  }

  /**
   * Get engine statistics
   * @returns {Object}
   */
  getStats() {
    return {
      activeExecutions: this.activeExecutions.size,
      queuedExecutions: this.executionQueue.length,
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      isProcessingQueue: this.isProcessingQueue,
    };
  }
}

module.exports = WorkflowEngine;
