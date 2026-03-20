import {
  ArrowLeftOutlined,
  BugOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  SettingOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Layout,
  message,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { customEdgeTypes, customNodeTypes } from '../../components/WorkflowDesigner/CustomNodes';
import NodePalette from '../../components/WorkflowDesigner/NodePalette';
import WorkflowService from '../../services/WorkflowService';
// import NodePalette from '../../components/Workflow/NodePalette';
import NodeConfigPanel from '../../components/Workflow/NodeConfigPanel';
import WorkflowMonitoringDashboard from '../../components/Workflow/WorkflowMonitoringDashboard';
// import { customNodeTypes } from '../../components/Workflow/nodes';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const WorkflowDesigner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Workflow state
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // UI state
  const [selectedNode, setSelectedNode] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [showExecutions, setShowExecutions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form for workflow metadata
  const [form] = Form.useForm();

  // Load workflow data
  const loadWorkflow = useCallback(async () => {
    if (!id || id === 'create') return;

    setLoading(true);
    try {
      const response = await WorkflowService.getWorkflow(id);
      if (response.success) {
        const workflowData = response.workflow;
        setWorkflow(workflowData);

        // Set form values
        form.setFieldsValue({
          name: workflowData.name,
          description: workflowData.description,
          tags: workflowData.tags || [],
        });

        // Set nodes and edges from backend data
        setNodes(workflowData.nodes || []);
        setEdges(
          workflowData.connections?.map((conn) => ({
            id: conn.id,
            source: conn.source?.nodeId || conn.sourceNodeId,
            target: conn.target?.nodeId || conn.targetNodeId,
            sourceHandle: conn.source?.outputName || 'default',
            targetHandle: conn.target?.inputName || 'default',
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            data: { condition: conn.condition, label: conn.label },
          })) || []
        );
      }
    } catch (error) {
      message.error(error.message);
      navigate('/workflows');
    } finally {
      setLoading(false);
    }
  }, [id, form, setNodes, setEdges, navigate]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  // Save workflow
  const handleSave = useCallback(async () => {
    try {
      await form.validateFields();
      const formValues = form.getFieldsValue();

      setSaving(true);

      const workflowData = {
        ...formValues,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type === 'workflowNode' ? node.data?.type || 'trigger' : node.type,
          name: node.data?.label || node.type,
          description: node.data?.description || '',
          position: node.position,
          configuration: node.data?.config || {},
          inputs: node.data?.inputs || [],
          outputs: node.data?.outputs || [],
          isDisabled: node.data?.isDisabled || false,
          retryPolicy: node.data?.retryPolicy || {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2,
          },
          timeout: node.data?.timeout || 30000,
        })),
        connections: edges.map((edge) => ({
          id: edge.id,
          source: {
            nodeId: edge.source,
            outputName: edge.sourceHandle || 'default',
          },
          target: {
            nodeId: edge.target,
            inputName: edge.targetHandle || 'default',
          },
          condition: edge.data?.condition?.expression || '',
          label: edge.data?.label || '',
        })),
      };

      let response;
      if (id === 'create') {
        response = await WorkflowService.createWorkflow(workflowData);
        if (response.success) {
          message.success('Workflow created successfully');
          navigate(`/workflows/${response.workflow._id}/edit`);
        }
      } else {
        response = await WorkflowService.updateWorkflow(id, workflowData);
        if (response.success) {
          message.success('Workflow saved successfully');
          setWorkflow(response.workflow);
        }
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        message.error(error.message || 'Failed to save workflow');
      }
    } finally {
      setSaving(false);
    }
  }, [form, nodes, edges, id, navigate]);

  const executeWorkflow = useCallback(async () => {
    setExecuting(true);
    try {
      const response = await WorkflowService.executeWorkflow(workflow._id, {});
      if (response.success) {
        message.success('Workflow execution started');
        setShowExecutions(true);
        setActiveTab('monitor');
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setExecuting(false);
    }
  }, [workflow]);

  // Execute workflow
  const handleExecute = useCallback(async () => {
    if (!workflow?._id) {
      message.error('Please save the workflow first');
      return;
    }

    if (!workflow.isActive) {
      Modal.confirm({
        title: 'Workflow is Inactive',
        content: 'This workflow is currently inactive. Do you want to activate it and execute?',
        onOk: async () => {
          try {
            await WorkflowService.toggleWorkflowStatus(workflow._id);
            executeWorkflow();
          } catch (error) {
            message.error('Failed to activate workflow');
          }
        },
      });
      return;
    }

    executeWorkflow();
  }, [workflow, executeWorkflow]);

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handle connection creation
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `e${params.source}-${params.target}`,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { condition: { type: 'always' } },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle node drag and drop from palette
  const onDragStart = useCallback((event, nodeType) => {
    // This is just for the node palette, actual data is set in NodePalette component
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData('application/reactflow');

      if (!nodeType) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeTypeInfo = WorkflowService.getNodeTypes().find((type) => type.type === nodeType);

      const newNode = {
        id: `node-${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          type: nodeType,
          label: nodeTypeInfo?.name || nodeType,
          description: nodeTypeInfo?.description || '',
          config: {},
          configured: false,
          status: 'idle',
          onConfigure: (data) => {
            // Handle node configuration
            console.log('Configure node:', data);
          },
          onDelete: (nodeId) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) =>
              eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
            );
          },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, setEdges]
  );

  // Update node configuration
  const updateNodeConfig = useCallback(
    (nodeId, config) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, config } } : node))
      );
    },
    [setNodes]
  );

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'r':
            event.preventDefault();
            handleExecute();
            break;
          default:
            break;
        }
      } else if (event.key === 'Delete' && selectedNode) {
        deleteSelectedNode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleSave, handleExecute, deleteSelectedNode]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <Layout style={{ height: '100vh' }}>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/workflows')}>
              Back to Workflows
            </Button>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {id === 'create' ? 'Create New Workflow' : workflow?.name || 'Workflow Designer'}
              </Title>
              {workflow && (
                <Text type="secondary">
                  Last modified {dayjs(workflow.updatedAt).fromNow()}
                  {workflow.isActive && (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      Active
                    </Tag>
                  )}
                </Text>
              )}
            </div>
          </div>

          <Space>
            <Button icon={<BugOutlined />} onClick={() => setActiveTab('debug')}>
              Debug
            </Button>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {
                setShowExecutions(true);
                setActiveTab('monitor');
              }}
            >
              Executions
            </Button>
            <Button icon={<SettingOutlined />} onClick={() => setShowSettings(true)}>
              Settings
            </Button>
            <Button icon={<ShareAltOutlined />} disabled={!workflow?._id}>
              Share
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={executing}
              disabled={!workflow?._id}
              onClick={handleExecute}
            >
              Execute
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Save
            </Button>
          </Space>
        </Header>

        <Layout>
          {/* Left Sidebar - Node Palette */}
          <Sider
            width={280}
            theme="light"
            collapsible
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
            style={{ borderRight: '1px solid #f0f0f0' }}
          >
            {!sidebarCollapsed && <NodePalette onDragStart={onDragStart} />}
          </Sider>

          {/* Main Content Area */}
          <Layout>
            <Content style={{ position: 'relative' }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ height: '100%' }}
                items={[
                  {
                    key: 'design',
                    label: 'Design',
                    children: (
                      <div style={{ height: 'calc(100vh - 112px)' }}>
                        <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
                          <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            // nodeTypes={customNodeTypes}
                            nodeTypes={customNodeTypes}
                            edgeTypes={customEdgeTypes}
                            fitView
                            attributionPosition="bottom-left"
                          >
                            <Background />
                            <Controls />
                            <Panel position="top-right">
                              <Card size="small" style={{ minWidth: 200 }}>
                                <div style={{ textAlign: 'center' }}>
                                  <Text type="secondary">
                                    Drag nodes from the sidebar to add them to your workflow
                                  </Text>
                                </div>
                              </Card>
                            </Panel>
                          </ReactFlow>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: 'monitor',
                    label: 'Monitor',
                    children: workflow?._id ? (
                      <WorkflowMonitoringDashboard workflowId={workflow._id} />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '50vh',
                        }}
                      >
                        <Text type="secondary">Save the workflow to view execution monitoring</Text>
                      </div>
                    ),
                  },
                  {
                    key: 'debug',
                    label: 'Debug',
                    children: (
                      <div style={{ padding: '24px' }}>
                        <Card title="Workflow Debug Information">
                          <Row gutter={16}>
                            <Col span={12}>
                              <Card size="small" title="Nodes">
                                <pre
                                  style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}
                                >
                                  {JSON.stringify(nodes, null, 2)}
                                </pre>
                              </Card>
                            </Col>
                            <Col span={12}>
                              <Card size="small" title="Connections">
                                <pre
                                  style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}
                                >
                                  {JSON.stringify(edges, null, 2)}
                                </pre>
                              </Card>
                            </Col>
                          </Row>
                        </Card>
                      </div>
                    ),
                  },
                ]}
              />
            </Content>

            {/* Right Sidebar - Node Configuration */}
            {selectedNode && (
              <Sider width={320} theme="light" style={{ borderLeft: '1px solid #f0f0f0' }}>
                <NodeConfigPanel
                  node={selectedNode}
                  onConfigChange={(config) => updateNodeConfig(selectedNode.id, config)}
                  onDelete={deleteSelectedNode}
                />
              </Sider>
            )}
          </Layout>
        </Layout>

        {/* Workflow Settings Modal */}
        <Modal
          title="Workflow Settings"
          open={showSettings}
          onCancel={() => setShowSettings(false)}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Workflow Name"
              rules={[{ required: true, message: 'Please enter workflow name' }]}
            >
              <Input placeholder="Enter workflow name" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Describe what this workflow does" />
            </Form.Item>
            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add tags to organize your workflows"
                tokenSeparators={[',']}
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Executions Drawer */}
        <Drawer
          title="Workflow Executions"
          placement="right"
          width={600}
          open={showExecutions}
          onClose={() => setShowExecutions(false)}
        >
          {workflow?._id && <WorkflowMonitoringDashboard workflowId={workflow._id} />}
        </Drawer>
      </Layout>
    </ReactFlowProvider>
  );
};

export default WorkflowDesigner;
