import useLanguage from '@/locale/useLanguage';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
} from '@/components/icons';
import { Card, Collapse, Tabs, Typography, message } from '@/components/ui';
import { useState } from 'react';

const { TabPane } = Tabs;
const { Title } = Typography;
const { Panel } = Collapse;

// Workflow templates definitions
const workflowTemplates = {
  leadNurturing: {
    name: 'Lead Nurturing',
    nodes: [
      {
        id: 'triggerNode_1',
        type: 'triggerNode',
        position: { x: 100, y: 150 },
        data: {
          label: 'Form Submission',
          config: { formId: 'leadForm' },
          handles: { source: ['default'], target: [] },
        },
      },
      {
        id: 'delayNode_1',
        type: 'delayNode',
        position: { x: 400, y: 150 },
        data: {
          label: 'Wait Fixed Time',
          config: { amount: 1, unit: 'days' },
          handles: { source: ['default'], target: ['default'] },
        },
      },
      {
        id: 'actionNode_1',
        type: 'actionNode',
        position: { x: 700, y: 150 },
        data: {
          label: 'Send Email',
          config: {
            template: 'welcome',
            recipient: '{{record.email}}',
            subject: 'Welcome to Our Service',
          },
          handles: { source: ['default'], target: ['default'] },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'triggerNode_1',
        target: 'delayNode_1',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
      {
        id: 'edge-2',
        source: 'delayNode_1',
        target: 'actionNode_1',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
    ],
  },
  orderProcessing: {
    name: 'Order Processing',
    nodes: [
      {
        id: 'triggerNode_1',
        type: 'triggerNode',
        position: { x: 100, y: 150 },
        data: {
          label: 'Record Created',
          config: { entity: 'invoice' },
          handles: { source: ['default'], target: [] },
        },
      },
      {
        id: 'conditionNode_1',
        type: 'conditionNode',
        position: { x: 400, y: 150 },
        data: {
          label: 'Check Field Value',
          config: {
            field: 'record.total',
            operator: 'greaterThan',
            value: '1000',
          },
          handles: { source: ['a', 'b'], target: ['default'] },
        },
      },
      {
        id: 'actionNode_1',
        type: 'actionNode',
        position: { x: 700, y: 50 },
        data: {
          label: 'Send Email',
          config: {
            template: 'invoice',
            recipient: '{{record.client.email}}',
            subject: 'Your Invoice',
          },
          handles: { source: ['default'], target: ['default'] },
        },
      },
      {
        id: 'actionNode_2',
        type: 'actionNode',
        position: { x: 700, y: 250 },
        data: {
          label: 'Send Email',
          config: {
            template: 'large_invoice',
            recipient: '{{record.client.email}}',
            subject: 'Your Large Invoice',
          },
          handles: { source: ['default'], target: ['default'] },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'triggerNode_1',
        target: 'conditionNode_1',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
      {
        id: 'edge-2',
        source: 'conditionNode_1',
        target: 'actionNode_1',
        sourceHandle: 'b',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#f5222d' },
        label: 'No',
        labelStyle: { fill: '#d63031', fontWeight: 700 },
      },
      {
        id: 'edge-3',
        source: 'conditionNode_1',
        target: 'actionNode_2',
        sourceHandle: 'a',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#52c41a' },
        label: 'Yes',
        labelStyle: { fill: '#00a651', fontWeight: 700 },
      },
    ],
  },
  customerOnboarding: {
    name: 'Customer Onboarding',
    nodes: [
      {
        id: 'triggerNode_1',
        type: 'triggerNode',
        position: { x: 100, y: 150 },
        data: {
          label: 'Record Created',
          config: { entity: 'client' },
          handles: { source: ['default'], target: [] },
        },
      },
      {
        id: 'actionNode_1',
        type: 'actionNode',
        position: { x: 400, y: 150 },
        data: {
          label: 'Send Email',
          config: {
            template: 'welcome',
            recipient: '{{record.email}}',
            subject: 'Welcome Onboard!',
          },
          handles: { source: ['default'], target: ['default'] },
        },
      },
      {
        id: 'delayNode_1',
        type: 'delayNode',
        position: { x: 700, y: 150 },
        data: {
          label: 'Wait Fixed Time',
          config: { amount: 7, unit: 'days' },
          handles: { source: ['default'], target: ['default'] },
        },
      },
      {
        id: 'actionNode_2',
        type: 'actionNode',
        position: { x: 1000, y: 150 },
        data: {
          label: 'Send Email',
          config: {
            template: 'followup',
            recipient: '{{record.email}}',
            subject: 'How is everything going?',
          },
          handles: { source: ['default'], target: ['default'] },
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'triggerNode_1',
        target: 'actionNode_1',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
      {
        id: 'edge-2',
        source: 'actionNode_1',
        target: 'delayNode_1',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
      {
        id: 'edge-3',
        source: 'delayNode_1',
        target: 'actionNode_2',
        sourceHandle: 'default',
        targetHandle: 'default',
        animated: true,
        style: { stroke: '#1890ff' },
      },
    ],
  },
};

const WorkflowSidebar = ({ onTemplateSelect }) => {
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('nodes');

  const onDragStart = (event, nodeType, nodeData = {}) => {
    console.log('Drag started:', nodeType, nodeData);

    // Clear previous data
    event.dataTransfer.clearData();

    // Set node type and data in the transfer
    event.dataTransfer.setData('application/reactflow/nodeType', nodeType);
    event.dataTransfer.setData('application/reactflow/nodeData', JSON.stringify(nodeData));

    // Set the drag image to the element itself
    event.dataTransfer.effectAllowed = 'move';

    console.log('DataTransfer set with:', {
      nodeType: event.dataTransfer.getData('application/reactflow/nodeType'),
      nodeData: event.dataTransfer.getData('application/reactflow/nodeData'),
    });
  };

  const handleTemplateClick = (templateKey) => {
    const template = workflowTemplates[templateKey];
    if (template) {
      if (typeof onTemplateSelect === 'function') {
        onTemplateSelect(template);
      } else {
        message.error('Template functionality not available');
      }
    }
  };

  const renderDraggableNode = (type, icon, label, data = {}) => (
    <Card
      draggable
      onDragStart={(event) => onDragStart(event, type, { label, ...data })}
      style={{ marginBottom: 8, cursor: 'grab', userSelect: 'none' }}
      size="small"
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {icon}
        <span style={{ marginLeft: 8 }}>{translate(label)}</span>
      </div>
    </Card>
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        overflow: 'scroll',
        flexDirection: 'column',
        padding: '16px',
        minHeight: '0',
      }}
    >
      <Tabs
        defaultActiveKey="nodes"
        onChange={setActiveTab}
        size="small"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '0',
        }}
        tabBarStyle={{
          flexShrink: 0,
          marginBottom: '16px',
          borderBottom: '1px solid #e8e8e8',
          margin: '0 -16px 16px -16px',
          padding: '0 16px',
        }}
      >
        <TabPane
          tab={translate('Nodes')}
          key="nodes"
          style={{
            height: '100%',
            flex: 1,
            margin: '0 -16px',
            padding: '0 16px',
            minHeight: '0',
          }}
        >
          <div
            style={{
              height: '100%',
              paddingBottom: '16px',
              paddingRight: '8px',
            }}
          >
            <Collapse
              defaultActiveKey={['triggers', 'actions', 'conditions', 'delays']}
              size="small"
              style={{ border: 'none' }}
            >
              <Panel
                header={
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#2c2c2c',
                      fontSize: '12px',
                    }}
                  >
                    {translate('Triggers')}
                  </span>
                }
                key="triggers"
                style={{
                  marginBottom: '8px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                }}
              >
                <div>
                  {renderDraggableNode(
                    'trigger',
                    <ThunderboltOutlined style={{ color: '#52c41a' }} />,
                    'Manual Trigger'
                  )}
                  {renderDraggableNode(
                    'webhook',
                    <ThunderboltOutlined style={{ color: '#1890ff' }} />,
                    'Webhook'
                  )}
                  {renderDraggableNode(
                    'triggerNode',
                    <ThunderboltOutlined style={{ color: '#8b5cf6' }} />,
                    'Form Submission'
                  )}
                  {renderDraggableNode(
                    'triggerNode',
                    <ThunderboltOutlined style={{ color: '#8b5cf6' }} />,
                    'Record Created'
                  )}
                  {renderDraggableNode(
                    'triggerNode',
                    <ThunderboltOutlined style={{ color: '#8b5cf6' }} />,
                    'Record Updated'
                  )}
                  {renderDraggableNode(
                    'triggerNode',
                    <ThunderboltOutlined style={{ color: '#8b5cf6' }} />,
                    'Scheduled Event'
                  )}
                </div>
              </Panel>
              <Panel
                header={
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#2c2c2c',
                      fontSize: '12px',
                    }}
                  >
                    {translate('Actions')}
                  </span>
                }
                key="actions"
                style={{
                  marginBottom: '8px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                }}
              >
                <div>
                  {renderDraggableNode(
                    'email',
                    <PlayCircleOutlined style={{ color: '#fa8c16' }} />,
                    'Send Email'
                  )}
                  {renderDraggableNode(
                    'httpRequest',
                    <PlayCircleOutlined style={{ color: '#722ed1' }} />,
                    'HTTP Request'
                  )}
                  {renderDraggableNode(
                    'notification',
                    <PlayCircleOutlined style={{ color: '#f5222d' }} />,
                    'Send Notification'
                  )}
                  {renderDraggableNode(
                    'database',
                    <PlayCircleOutlined style={{ color: '#1890ff' }} />,
                    'Database Operation'
                  )}
                  {renderDraggableNode(
                    'customScript',
                    <PlayCircleOutlined style={{ color: '#52c41a' }} />,
                    'Custom Script'
                  )}
                  {renderDraggableNode(
                    'fileOperation',
                    <PlayCircleOutlined style={{ color: '#fa541c' }} />,
                    'File Operation'
                  )}
                  {renderDraggableNode(
                    'actionNode',
                    <PlayCircleOutlined style={{ color: '#10b981' }} />,
                    'Create Record'
                  )}
                  {renderDraggableNode(
                    'actionNode',
                    <PlayCircleOutlined style={{ color: '#10b981' }} />,
                    'Update Record'
                  )}
                </div>
              </Panel>
              <Panel
                header={
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#2c2c2c',
                      fontSize: '12px',
                    }}
                  >
                    {translate('Logic & Control')}
                  </span>
                }
                key="conditions"
                style={{
                  marginBottom: '8px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                }}
              >
                <div>
                  {renderDraggableNode(
                    'condition',
                    <QuestionCircleOutlined style={{ color: '#fa8c16' }} />,
                    'Condition'
                  )}
                  {renderDraggableNode(
                    'conditionNode',
                    <QuestionCircleOutlined style={{ color: '#f59e0b' }} />,
                    'Check Field Value'
                  )}
                  {renderDraggableNode(
                    'loop',
                    <PlayCircleOutlined style={{ color: '#722ed1' }} />,
                    'Loop'
                  )}
                  {renderDraggableNode(
                    'merge',
                    <PlayCircleOutlined style={{ color: '#52c41a' }} />,
                    'Merge'
                  )}
                  {renderDraggableNode(
                    'split',
                    <PlayCircleOutlined style={{ color: '#f5222d' }} />,
                    'Split'
                  )}
                  {renderDraggableNode(
                    'conditionNode',
                    <QuestionCircleOutlined style={{ color: '#f59e0b' }} />,
                    'Check Record Exists'
                  )}
                </div>
              </Panel>
              <Panel
                header={
                  <span
                    style={{
                      fontWeight: '600',
                      color: '#2c2c2c',
                      fontSize: '12px',
                    }}
                  >
                    {translate('Utilities & Data')}
                  </span>
                }
                key="delays"
                style={{
                  marginBottom: '8px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                }}
              >
                <div>
                  {renderDraggableNode(
                    'delay',
                    <ClockCircleOutlined style={{ color: '#13c2c2' }} />,
                    'Delay'
                  )}
                  {renderDraggableNode(
                    'delayNode',
                    <ClockCircleOutlined style={{ color: '#6366f1' }} />,
                    'Wait Fixed Time'
                  )}
                  {renderDraggableNode(
                    'dataTransform',
                    <PlayCircleOutlined style={{ color: '#1890ff' }} />,
                    'Data Transform'
                  )}
                  {renderDraggableNode(
                    'dataValidation',
                    <PlayCircleOutlined style={{ color: '#fa8c16' }} />,
                    'Data Validation'
                  )}
                  {renderDraggableNode(
                    'delayNode',
                    <ClockCircleOutlined style={{ color: '#6366f1' }} />,
                    'Wait Until'
                  )}
                </div>
              </Panel>
            </Collapse>
          </div>
        </TabPane>
        <TabPane
          tab={translate('Templates')}
          key="templates"
          style={{
            height: '100%',
            flex: 1,
            margin: '0 -16px',
            padding: '0 16px',
            minHeight: '0',
          }}
        >
          <div
            style={{
              height: '100%',
              paddingBottom: '16px',
              paddingRight: '8px',
            }}
          >
            <Title
              level={5}
              style={{
                marginBottom: '12px',
                color: '#2c2c2c',
                fontSize: '13px',
              }}
            >
              {translate('Common Workflow Templates')}
            </Title>
            <div
              style={{
                height: 'calc(100% - 40px)',
                paddingRight: '4px',
              }}
            >
              <Card
                style={{
                  marginBottom: 6,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.2s ease',
                }}
                size="small"
                onClick={() => handleTemplateClick('leadNurturing')}
                hoverable
              >
                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                  {translate('Lead Nurturing')}
                </div>
              </Card>
              <Card
                style={{
                  marginBottom: 6,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.2s ease',
                }}
                size="small"
                onClick={() => handleTemplateClick('orderProcessing')}
                hoverable
              >
                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                  {translate('Order Processing')}
                </div>
              </Card>
              <Card
                style={{
                  marginBottom: 6,
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: '1px solid #e8e8e8',
                  transition: 'all 0.2s ease',
                }}
                size="small"
                onClick={() => handleTemplateClick('customerOnboarding')}
                hoverable
              >
                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                  {translate('Customer Onboarding')}
                </div>
              </Card>
            </div>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default WorkflowSidebar;
