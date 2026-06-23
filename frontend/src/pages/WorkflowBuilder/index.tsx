import { useWorkflowStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  ShareAltOutlined,
} from '@/components/icons';
import { Button, Card, Col, message, Modal, Row, Space, Spin, Statistic, Typography } from '@/components/ui';
import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import WorkflowCanvas from '../../components/Workflow/WorkflowCanvas';
import WorkflowSidebar from '../../components/Workflow/WorkflowSidebar';
import WorkflowService from '../../services/WorkflowService';

const { Title, Text } = Typography;

const WorkflowBuilder = () => {
  const translate = useLanguage();
  const [workflow, setWorkflow] = useState({
    nodes: [],
    edges: [],
  });

  // Use dynamic statistics from API
  const {
    data: workflowStats,
    loading: statsLoading,
    error: statsError,
  } = useWorkflowStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Calculate stats from API data
  const stats = {
    totalWorkflows: workflowStats?.totalWorkflows || 0,
    activeWorkflows: workflowStats?.activeWorkflows || 0,
    completedTasks: workflowStats?.completedTasks || 0,
    avgExecutionTime: workflowStats?.averageExecutionTime || '0m',
  };

  // Function to handle template selection
  const handleTemplateSelect = (template) => {
    if (template && template.nodes && template.edges) {
      // Apply template to workflow with a small delay to ensure proper rendering
      setTimeout(() => {
        setWorkflow({
          nodes: [...template.nodes],
          edges: [...template.edges],
        });
        message.success(`${template.name} template loaded successfully!`);
      }, 100);
    } else {
      message.error('Invalid template format');
    }
  };

  // Clear the workflow with confirmation
  const handleClearWorkflow = () => {
    if (workflow.nodes.length > 0 || workflow.edges.length > 0) {
      Modal.confirm({
        title: translate('Clear Workflow'),
        content: translate(
          'Are you sure you want to clear the workflow? This action cannot be undone.'
        ),
        okText: translate('Yes'),
        cancelText: translate('No'),
        onOk: () => {
          setWorkflow({ nodes: [], edges: [] });
          message.info('Workflow cleared');
        },
      });
    } else {
      message.info('Workflow is already empty');
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      // Convert the workflow to match backend schema
      const workflowData = {
        name: `Workflow_${Date.now()}`, // Generate a default name
        description: 'Created from Workflow Builder',
        status: 'active',
        nodes: workflow.nodes || [],
        connections: (workflow.edges || []).map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
        })),
      };

      const result = await WorkflowService.createWorkflow(workflowData);
      message.success('Workflow saved successfully!');
      console.log('Saved workflow:', result);
    } catch (error) {
      console.error('Error saving workflow:', error);
      message.error('Failed to save workflow. Please try again.');
    }
  };

  const handleRunWorkflow = async () => {
    if (!workflow.nodes || workflow.nodes.length === 0) {
      message.warning('Please add some nodes to the workflow before running.');
      return;
    }

    try {
      // First save the workflow to get an ID
      const workflowData = {
        name: `Workflow_${Date.now()}`,
        description: 'Created from Workflow Builder',
        status: 'active',
        nodes: workflow.nodes || [],
        connections: (workflow.edges || []).map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          label: edge.label,
        })),
      };

      const savedWorkflow = await WorkflowService.createWorkflow(workflowData);

      // Execute the workflow
      const result = await WorkflowService.executeWorkflow(savedWorkflow._id, {});
      message.success('Workflow executed successfully!');
      console.log('Execution result:', result);
    } catch (error) {
      console.error('Error executing workflow:', error);
      message.error('Failed to execute workflow. Please try again.');
    }
  };

  const handleShareWorkflow = () => {
    // Implement share logic
    message.info('Share functionality coming soon!');
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#fafbfc',
      }}
    >
      {/* Header Section */}
      <div
        style={{
          marginBottom: '16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 4px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Workflow Builder')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Design and automate your business processes
            </Text>
          </div>
          <Space>
            <Button
              type="dashed"
              onClick={() => {
                // Test adding a node programmatically
                const testNode = {
                  id: `test_${Date.now()}`,
                  type: 'trigger',
                  position: { x: 200, y: 200 },
                  data: {
                    label: 'Test Trigger Node',
                    nodeType: 'trigger',
                    handles: { source: ['default'], target: [] },
                    onConfigUpdate: (nodeId, newConfig) => {
                      setWorkflow((prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((node) =>
                          node.id === nodeId
                            ? { ...node, data: { ...node.data, config: newConfig } }
                            : node
                        ),
                      }));
                    },
                    onDelete: (nodeId) => {
                      setWorkflow((prev) => ({
                        ...prev,
                        nodes: prev.nodes.filter((node) => node.id !== nodeId),
                        edges: prev.edges.filter(
                          (edge) => edge.source !== nodeId && edge.target !== nodeId
                        ),
                      }));
                    },
                  },
                };
                setWorkflow((prev) => ({
                  ...prev,
                  nodes: [...prev.nodes, testNode],
                }));
                message.success('Test node added!');
              }}
              style={{
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              Add Test Node
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleRunWorkflow}
              style={{
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
                background: '#52c41a',
                borderColor: '#52c41a',
              }}
            >
              {translate('Run')}
            </Button>
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveWorkflow}
              style={{
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {translate('Save')}
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={handleShareWorkflow}
              style={{
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {translate('Share')}
            </Button>
            <Button
              danger
              icon={<ClearOutlined />}
              onClick={handleClearWorkflow}
              style={{
                borderRadius: '10px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {translate('Clear')}
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#6b7280' }}>
                  {translate('Loading statistics...')}
                </div>
              </Card>
            </Col>
          </Row>
        ) : statsError ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px', borderColor: '#f5222d' }}>
                <div style={{ color: '#f5222d', marginBottom: '8px' }}>
                  {translate('Error loading statistics')}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{statsError}</div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Total Workflows')}
                  value={stats.totalWorkflows}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<BranchesOutlined style={{ color: '#8b45ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Active')}
                  value={stats.activeWorkflows}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<PlayCircleOutlined style={{ color: '#10b981' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Completed Tasks')}
                  value={stats.completedTasks}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#6366f1' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Avg Time')}
                  value={stats.avgExecutionTime}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<ClockCircleOutlined style={{ color: '#a855f7' }} />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Main Workflow Builder */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '16px',
          overflow: 'hidden',
          height: 'calc(100vh - 280px)',
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: '280px',
            height: '100%',
            background: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #e8e8e8',
              flexShrink: 0,
            }}
          >
            <Title
              level={5}
              style={{
                color: '#2c2c2c',
                margin: 0,
                fontSize: '14px',
              }}
            >
              {translate('Workflow Templates')}
            </Title>
          </div>
          <div
            style={{
              flex: 1,
              height: 'calc(100% - 60px)',
              overflow: 'hidden',
            }}
          >
            <WorkflowSidebar onTemplateSelect={handleTemplateSelect} />
          </div>
        </div>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            height: '100%',
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <ReactFlowProvider>
            <WorkflowCanvas workflow={workflow} setWorkflow={setWorkflow} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
