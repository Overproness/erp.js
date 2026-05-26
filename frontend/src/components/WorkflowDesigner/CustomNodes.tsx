import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MailOutlined,
  MergeOutlined,
  NotificationOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from '@/components/ui';
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import './WorkflowNode.css';

const { Text } = Typography;
const { Option } = Select;

// Node icons mapping
const nodeIcons = {
  trigger: ThunderboltOutlined,
  httpRequest: ApiOutlined,
  dataTransform: SyncOutlined,
  condition: QuestionCircleOutlined,
  delay: ClockCircleOutlined,
  email: MailOutlined,
  webhook: ThunderboltOutlined,
  database: DatabaseOutlined,
  customScript: CodeOutlined,
  notification: NotificationOutlined,
  fileOperation: FileTextOutlined,
  dataValidation: CheckCircleOutlined,
  loop: BranchesOutlined,
  merge: MergeOutlined,
  split: SwapOutlined,
  default: PlayCircleOutlined,
};

// Node colors mapping
const nodeColors = {
  trigger: '#52c41a',
  httpRequest: '#722ed1',
  dataTransform: '#1890ff',
  condition: '#fa8c16',
  delay: '#13c2c2',
  email: '#fa8c16',
  webhook: '#1890ff',
  database: '#1890ff',
  customScript: '#52c41a',
  notification: '#f5222d',
  fileOperation: '#fa541c',
  dataValidation: '#fa8c16',
  loop: '#722ed1',
  merge: '#52c41a',
  split: '#f5222d',
  default: '#8c8c8c',
};

const NodeConfigModal = ({ visible, nodeType, config, onSave, onCancel }) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (visible && config) {
      form.setFieldsValue(config);
    }
  }, [visible, config, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  const renderConfigFields = () => {
    switch (nodeType) {
      case 'condition':
        return (
          <>
            <Form.Item name="field" label="Field" rules={[{ required: true }]}>
              <Input placeholder="Enter field name (e.g., user.age)" />
            </Form.Item>
            <Form.Item name="operator" label="Operator" rules={[{ required: true }]}>
              <Select placeholder="Select operator">
                <Option value="equals">Equals (=)</Option>
                <Option value="notEquals">Not Equals (≠)</Option>
                <Option value="greaterThan">Greater Than (&gt;)</Option>
                <Option value="lessThan">Less Than (&lt;)</Option>
                <Option value="contains">Contains</Option>
              </Select>
            </Form.Item>
            <Form.Item name="value" label="Value" rules={[{ required: true }]}>
              <Input placeholder="Enter value to compare" />
            </Form.Item>
          </>
        );

      case 'httpRequest':
        return (
          <>
            <Form.Item name="method" label="Method" rules={[{ required: true }]}>
              <Select placeholder="Select HTTP method">
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>
            <Form.Item name="url" label="URL" rules={[{ required: true }]}>
              <Input placeholder="https://api.example.com/endpoint" />
            </Form.Item>
          </>
        );

      case 'email':
        return (
          <>
            <Form.Item name="to" label="To" rules={[{ required: true }]}>
              <Input placeholder="recipient@example.com" />
            </Form.Item>
            <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
              <Input placeholder="Email subject" />
            </Form.Item>
            <Form.Item name="body" label="Body">
              <Input.TextArea rows={4} placeholder="Email body content" />
            </Form.Item>
          </>
        );

      case 'delay':
        return (
          <>
            <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
              <InputNumber min={1} placeholder="1" />
            </Form.Item>
            <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
              <Select placeholder="Select time unit">
                <Option value="seconds">Seconds</Option>
                <Option value="minutes">Minutes</Option>
                <Option value="hours">Hours</Option>
                <Option value="days">Days</Option>
              </Select>
            </Form.Item>
          </>
        );

      case 'database':
        return (
          <>
            <Form.Item name="operation" label="Operation" rules={[{ required: true }]}>
              <Select placeholder="Select operation">
                <Option value="select">Select</Option>
                <Option value="insert">Insert</Option>
                <Option value="update">Update</Option>
                <Option value="delete">Delete</Option>
              </Select>
            </Form.Item>
            <Form.Item name="table" label="Table" rules={[{ required: true }]}>
              <Input placeholder="table_name" />
            </Form.Item>
          </>
        );

      default:
        return (
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Node description" />
          </Form.Item>
        );
    }
  };

  return (
    <Modal
      title={`Configure ${nodeType} Node`}
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      width={500}
    >
      <Form form={form} layout="vertical">
        {renderConfigFields()}
      </Form>
    </Modal>
  );
};

export const WorkflowNode = ({ id, data, selected, type }) => {
  const [configModalVisible, setConfigModalVisible] = useState(false);

  console.log('WorkflowNode rendering:', { id, type, data, selected });

  const nodeType = type || data.nodeType || 'default';
  const IconComponent = nodeIcons[nodeType] || nodeIcons.default;
  const nodeColor = nodeColors[nodeType] || nodeColors.default;
  const config = data.config || {};

  const handleConfigure = () => {
    setConfigModalVisible(true);
  };

  const handleConfigSave = (newConfig) => {
    if (data.onConfigUpdate) {
      data.onConfigUpdate(id, newConfig);
    }
    setConfigModalVisible(false);
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Node',
      content: 'Are you sure you want to delete this node?',
      onOk: () => {
        if (data.onDelete) {
          data.onDelete(id);
        }
      },
    });
  };

  const getNodeSummary = () => {
    switch (nodeType) {
      case 'condition':
        if (config.field && config.operator && config.value) {
          return (
            <Tag color="orange" size="small">
              {config.field} {config.operator} {config.value}
            </Tag>
          );
        }
        return <Text type="secondary">Click to configure</Text>;

      case 'httpRequest':
        if (config.method && config.url) {
          return (
            <Tag color="purple" size="small">
              {config.method}{' '}
              {config.url.length > 20 ? config.url.substring(0, 20) + '...' : config.url}
            </Tag>
          );
        }
        return <Text type="secondary">Click to configure</Text>;

      case 'email':
        if (config.to) {
          return (
            <Tag color="orange" size="small">
              To: {config.to}
            </Tag>
          );
        }
        return <Text type="secondary">Click to configure</Text>;

      case 'delay':
        if (config.amount && config.unit) {
          return (
            <Tag color="cyan" size="small">
              {config.amount} {config.unit}
            </Tag>
          );
        }
        return <Text type="secondary">Click to configure</Text>;

      default:
        return <Text type="secondary">{data.label || nodeType}</Text>;
    }
  };

  const getHandles = () => {
    const handles = data.handles || { source: ['default'], target: [] };
    const sourceHandles = handles.source || [];
    const targetHandles = handles.target || [];

    return (
      <>
        {/* Target Handles - only render if there are target handles */}
        {targetHandles.length > 0 &&
          targetHandles.map((handleId, index) => (
            <Handle
              key={`target-${handleId}`}
              type="target"
              position={Position.Top}
              id={handleId}
              style={{
                background: nodeColor,
                left:
                  targetHandles.length === 1
                    ? '50%'
                    : `${((index + 1) / (targetHandles.length + 1)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          ))}

        {/* Source Handles - only render if there are source handles */}
        {sourceHandles.length > 0 &&
          sourceHandles.map((handleId, index) => (
            <Handle
              key={`source-${handleId}`}
              type="source"
              position={Position.Bottom}
              id={handleId}
              style={{
                background: nodeColor,
                left:
                  sourceHandles.length === 1
                    ? '50%'
                    : `${((index + 1) / (sourceHandles.length + 1)) * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          ))}
      </>
    );
  };

  return (
    <>
      <div
        style={{
          minWidth: 180,
          minHeight: 100,
          border: selected ? `2px solid ${nodeColor}` : '1px solid #d9d9d9',
          borderRadius: 8,
          boxShadow: selected ? `0 0 10px ${nodeColor}40` : '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          position: 'relative',
          zIndex: 1,
          background: '#ffffff', // Restored normal background
          padding: '12px',
        }}
        onClick={handleConfigure}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <IconComponent style={{ color: nodeColor, fontSize: 16, marginRight: 8 }} />
          <Text strong style={{ fontSize: 12 }}>
            {data.label || nodeType.toUpperCase()}
          </Text>
        </div>

        <div style={{ marginBottom: 8 }}>{getNodeSummary()}</div>

        <Space size="small">
          <Tooltip title="Configure">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleConfigure();
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            />
          </Tooltip>
        </Space>

        {getHandles()}
      </div>

      <NodeConfigModal
        visible={configModalVisible}
        nodeType={nodeType}
        config={config}
        onSave={handleConfigSave}
        onCancel={() => setConfigModalVisible(false)}
      />
    </>
  );
};
