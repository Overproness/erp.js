import {
  ApiOutlined,
  BellOutlined,
  BranchesOutlined,
  CalculatorOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  ControlOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  FilterOutlined,
  MailOutlined,
  PlayCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Card, Space, Typography } from 'antd';

const { Text } = Typography;

const nodeTypes = [
  {
    type: 'trigger',
    label: 'Trigger',
    icon: <PlayCircleOutlined />,
    description: 'Start a workflow',
    color: '#52c41a',
  },
  {
    type: 'httpRequest',
    label: 'HTTP Request',
    icon: <ApiOutlined />,
    description: 'Make HTTP requests',
    color: '#1890ff',
  },
  {
    type: 'email',
    label: 'Email',
    icon: <MailOutlined />,
    description: 'Send emails',
    color: '#fa541c',
  },
  {
    type: 'database',
    label: 'Database',
    icon: <DatabaseOutlined />,
    description: 'Query database',
    color: '#722ed1',
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <BranchesOutlined />,
    description: 'Conditional logic',
    color: '#faad14',
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: <ClockCircleOutlined />,
    description: 'Add delays',
    color: '#eb2f96',
  },
  {
    type: 'fileOperation',
    label: 'File Operation',
    icon: <FileTextOutlined />,
    description: 'File operations',
    color: '#13c2c2',
  },
  {
    type: 'notification',
    label: 'Notification',
    icon: <BellOutlined />,
    description: 'Send notifications',
    color: '#f5222d',
  },
  {
    type: 'customScript',
    label: 'Custom Script',
    icon: <CodeOutlined />,
    description: 'Execute JavaScript',
    color: '#2f54eb',
  },
  {
    type: 'dataValidation',
    label: 'Data Validation',
    icon: <FilterOutlined />,
    description: 'Validate data',
    color: '#52c41a',
  },
  {
    type: 'dataTransform',
    label: 'Data Transform',
    icon: <ControlOutlined />,
    description: 'Transform data',
    color: '#fa8c16',
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: <SendOutlined />,
    description: 'Receive webhooks',
    color: '#1890ff',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <ClockCircleOutlined />,
    description: 'Iterate over data',
    color: '#722ed1',
  },
  {
    type: 'merge',
    label: 'Merge',
    icon: <CalculatorOutlined />,
    description: 'Merge data sources',
    color: '#13c2c2',
  },
  {
    type: 'split',
    label: 'Split',
    icon: <FilterOutlined />,
    description: 'Split data',
    color: '#fa8c16',
  },
];

const NodePalette = ({ onDragStart }) => {
  const handleDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType.type);
    event.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(event, nodeType);
    }
  };

  return (
    <div style={{ width: 250, height: '100%', overflow: 'auto', padding: '8px' }}>
      <Typography.Title level={5} style={{ marginBottom: 16 }}>
        Node Palette
      </Typography.Title>

      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {nodeTypes.map((nodeType) => (
          <Card
            key={nodeType.type}
            size="small"
            hoverable
            draggable
            onDragStart={(event) => handleDragStart(event, nodeType)}
            style={{
              cursor: 'grab',
              borderLeft: `4px solid ${nodeType.color}`,
              userSelect: 'none',
            }}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Space align="start">
              <div style={{ color: nodeType.color, fontSize: '16px' }}>{nodeType.icon}</div>
              <div>
                <Text strong style={{ fontSize: '12px' }}>
                  {nodeType.label}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  {nodeType.description}
                </Text>
              </div>
            </Space>
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default NodePalette;
