import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ActionNode from './nodes/ActionNode';
import ConditionNode from './nodes/ConditionNode';
import DelayNode from './nodes/DelayNode';
import TriggerNode from './nodes/TriggerNode';
import WorkflowContextMenu from './WorkflowContextMenu';

// Import enhanced workflow nodes
import { WorkflowNode } from '../WorkflowDesigner/CustomNodes';

// Define custom node types - support both legacy and enhanced node types
const nodeTypes = {
  // Legacy node types for backward compatibility
  triggerNode: TriggerNode,
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  delayNode: DelayNode,

  // Enhanced backend node types - using the WorkflowNode component for consistency
  trigger: WorkflowNode,
  httpRequest: WorkflowNode,
  dataTransform: WorkflowNode,
  condition: WorkflowNode,
  delay: WorkflowNode,
  email: WorkflowNode,
  webhook: WorkflowNode,
  database: WorkflowNode,
  customScript: WorkflowNode,
  notification: WorkflowNode,
  fileOperation: WorkflowNode,
  dataValidation: WorkflowNode,
  loop: WorkflowNode,
  merge: WorkflowNode,
  split: WorkflowNode,

  // Keep legacy WorkflowNode for fallback
  workflowNode: WorkflowNode,

  // Add a default fallback
  default: WorkflowNode,
};

const WorkflowCanvas = ({ workflow, setWorkflow }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Track previous workflow state to detect intentional clears
  const prevWorkflowRef = useRef(workflow);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Update node configuration (used by node components)
  const updateNodeConfig = useCallback(
    (nodeId, newConfig) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                config: newConfig,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Delete node function
  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  // Update parent state when nodes or edges change, but use a debounce effect
  useEffect(() => {
    console.log('WorkflowCanvas: nodes changed, count:', nodes.length);
    console.log(
      'Current nodes:',
      nodes.map((n) => ({ id: n.id, type: n.type, position: n.position }))
    );

    const timer = setTimeout(() => {
      setWorkflow({
        nodes: nodes.map((node) => ({ ...node })),
        edges: edges.map((edge) => ({ ...edge })),
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [nodes, edges, setWorkflow]);

  // When workflow prop changes from outside, update local state
  useEffect(() => {
    if (workflow) {
      const prevWorkflow = prevWorkflowRef.current;

      // Only clear if:
      // 1. Previous workflow had nodes AND current workflow is explicitly empty
      // 2. AND this isn't just a debounced update from our own changes
      const shouldClearNodes =
        workflow.nodes &&
        Array.isArray(workflow.nodes) &&
        workflow.nodes.length === 0 &&
        nodes.length > 0 &&
        prevWorkflow &&
        prevWorkflow.nodes &&
        prevWorkflow.nodes.length > 0; // Previous state had nodes, now it's explicitly cleared

      if (shouldClearNodes) {
        console.log('Clearing nodes due to workflow clear command');
        setNodes([]);
      }

      const shouldClearEdges =
        workflow.edges &&
        Array.isArray(workflow.edges) &&
        workflow.edges.length === 0 &&
        edges.length > 0 &&
        prevWorkflow &&
        prevWorkflow.edges &&
        prevWorkflow.edges.length > 0; // Previous state had edges, now it's explicitly cleared

      if (shouldClearEdges) {
        console.log('Clearing edges due to workflow clear command');
        setEdges([]);
      }

      // Handle loading new workflows - when workflow has nodes but local state doesn't
      if (workflow.nodes && workflow.nodes.length > 0 && nodes.length === 0) {
        console.log('Loading nodes from workflow prop:', workflow.nodes.length);
        const updatedNodes = workflow.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onConfigUpdate: updateNodeConfig,
            onDelete: deleteNode,
          },
        }));
        setNodes(updatedNodes);
      }

      // Handle loading new edges - when workflow has edges but local state doesn't
      if (workflow.edges && workflow.edges.length > 0 && edges.length === 0) {
        console.log('Loading edges from workflow prop:', workflow.edges.length);
        setEdges(workflow.edges.map((edge) => ({ ...edge })));
      }

      // Update the ref with current workflow
      prevWorkflowRef.current = workflow;
    }
  }, [workflow, nodes.length, edges.length, updateNodeConfig, deleteNode, setNodes, setEdges]);

  // Handle connections between nodes
  const onConnect = useCallback(
    (params) => {
      // Create edge with animated style and arrow marker
      const edge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        animated: true,
        style: { stroke: '#1890ff' },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#1890ff',
        },
      };

      // Special handling for condition nodes - label the edges with "yes"/"no"
      const sourceNode = nodes.find((n) => n.id === params.source);
      if (sourceNode?.type === 'conditionNode') {
        if (params.sourceHandle === 'a') {
          edge.label = 'Yes';
          edge.labelStyle = { fill: '#00a651', fontWeight: 700 };
          edge.style = { stroke: '#52c41a' };
        } else if (params.sourceHandle === 'b') {
          edge.label = 'No';
          edge.labelStyle = { fill: '#d63031', fontWeight: 700 };
          edge.style = { stroke: '#f5222d' };
        }
      }

      setEdges((eds) => addEdge(edge, eds));
    },
    [nodes, setEdges]
  );

  // Drop handling for new nodes from sidebar
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        console.log('reactFlowInstance or wrapper not available');
        return;
      }

      // Get nodeType and nodeData from dataTransfer
      const nodeType = event.dataTransfer.getData('application/reactflow/nodeType');
      let nodeData = {};

      console.log('Dropped nodeType:', nodeType);

      try {
        const dataStr = event.dataTransfer.getData('application/reactflow/nodeData');
        if (dataStr) {
          nodeData = JSON.parse(dataStr);
        }
      } catch (error) {
        console.error('Error parsing node data:', error);
      }

      // Check if the dropped element is valid
      if (!nodeType) {
        console.log('No nodeType found in dataTransfer');
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Ensure position is within reasonable bounds
      const safePosition = {
        x: Math.max(0, position.x),
        y: Math.max(0, position.y),
      };

      console.log('Drop position calculated:', position);
      console.log('Safe position used:', safePosition);
      console.log('Event coordinates:', { x: event.clientX, y: event.clientY });

      // Generate unique ID based on type and timestamp
      const newNodeId = `${nodeType}_${Date.now()}`;
      const newNode = {
        id: newNodeId,
        type: nodeType,
        position: safePosition,
        data: {
          label: nodeData.label || `New ${nodeType}`,
          nodeType: nodeType, // Add explicit nodeType to data
          ...nodeData,
          onConfigUpdate: updateNodeConfig,
          onDelete: deleteNode,
        },
      };

      console.log('Creating new node with data:', newNode);

      // Add handles based on node type
      if (nodeType === 'conditionNode' || nodeType === 'condition') {
        newNode.data.handles = { source: ['a', 'b'], target: ['default'] };

        // Initialize with empty config
        if (!newNode.data.config) {
          newNode.data.config = {
            type: 'field',
            field: '',
            operator: 'equals',
            value: '',
          };
        }
      } else if (nodeType === 'triggerNode' || nodeType === 'trigger') {
        newNode.data.handles = { source: ['default'], target: [] };
      } else if (nodeType === 'merge') {
        newNode.data.handles = { source: ['default'], target: ['a', 'b', 'c'] };
      } else if (nodeType === 'split') {
        newNode.data.handles = { source: ['a', 'b', 'c'], target: ['default'] };
      } else if (nodeType === 'loop') {
        newNode.data.handles = { source: ['default', 'loop'], target: ['default'] };
        if (!newNode.data.config) {
          newNode.data.config = {
            mode: 'count',
            count: 5,
            field: '',
          };
        }
      } else if (nodeType === 'httpRequest') {
        if (!newNode.data.config) {
          newNode.data.config = {
            method: 'GET',
            url: '',
            headers: {},
            body: {},
          };
        }
        newNode.data.handles = { source: ['default'], target: ['default'] };
      } else if (nodeType === 'email') {
        if (!newNode.data.config) {
          newNode.data.config = {
            to: '',
            subject: '',
            body: '',
            template: '',
          };
        }
        newNode.data.handles = { source: ['default'], target: ['default'] };
      } else if (nodeType === 'database') {
        if (!newNode.data.config) {
          newNode.data.config = {
            operation: 'select',
            table: '',
            query: '',
            data: {},
          };
        }
        newNode.data.handles = { source: ['default'], target: ['default'] };
      } else if (nodeType === 'dataTransform') {
        if (!newNode.data.config) {
          newNode.data.config = {
            transformations: [],
            mode: 'map',
          };
        }
        newNode.data.handles = { source: ['default'], target: ['default'] };
      } else if (nodeType === 'delay' || nodeType === 'delayNode') {
        if (!newNode.data.config) {
          newNode.data.config = {
            amount: 1,
            unit: 'minutes',
          };
        }
        newNode.data.handles = { source: ['default'], target: ['default'] };
      } else {
        newNode.data.handles = { source: ['default'], target: ['default'] };
      }

      // Add the node to our state
      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        console.log('Added new node:', newNode);
        console.log('Total nodes after addition:', updatedNodes.length);

        return updatedNodes;
      });
    },
    [reactFlowInstance, setNodes, updateNodeConfig, deleteNode]
  );

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle context menu
  const onContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance
          ? reactFlowInstance.project({
              x: event.clientX - reactFlowBounds.left,
              y: event.clientY - reactFlowBounds.top,
            })
          : { x: 0, y: 0 };

        setContextMenu({
          x: event.clientX,
          y: event.clientY,
          flowPosition: position,
        });
      }
    },
    [reactFlowInstance]
  );

  // Close context menu on background click
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle node deletion from context menu
  const onDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nodes) => nodes.filter((node) => node.id !== selectedNode.id));
      setEdges((edges) =>
        edges.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
      );
      setContextMenu(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  // Handle node duplication from context menu
  const onDuplicateNode = useCallback(() => {
    if (selectedNode) {
      const newNode = {
        ...selectedNode,
        id: `${selectedNode.type}_${Date.now()}`,
        position: {
          x: selectedNode.position.x + 50,
          y: selectedNode.position.y + 50,
        },
      };
      setNodes((nodes) => [...nodes, newNode]);
      setContextMenu(null);
    }
  }, [selectedNode, setNodes]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        margin: 0,
        padding: 0,
      }}
      ref={reactFlowWrapper}
      onContextMenu={onContextMenu}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        deleteKeyCode="Delete"
        minZoom={0.1}
        maxZoom={2}
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>

      {contextMenu && (
        <WorkflowContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedNode={selectedNode}
          onDeleteNode={onDeleteNode}
          onDuplicateNode={onDuplicateNode}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default WorkflowCanvas;
