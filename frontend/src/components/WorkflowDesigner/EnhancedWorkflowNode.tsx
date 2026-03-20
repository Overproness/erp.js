import {
  ApiOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
  MailOutlined,
  MergeOutlined,
  NotificationOutlined,
  PlayCircleOutlined,
  PushpinOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SwapOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Modal, Space, Tooltip, Typography } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import NodeConfigModal from './NodeConfigModal';
import './WorkflowNode.css';

const { Text } = Typography;

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

// Enhanced WorkflowNode component inspired by n8n architecture
export const EnhancedWorkflowNode = ({ id, type, data, selected }) => {
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [executionState] = useState(data.executionState || 'idle');

  const nodeType = type;
  const config = useMemo(() => data.config || {}, [data.config]);
  const label = data.label || `${nodeType} Node`;
  const subtitle = data.subtitle || '';
  const isDisabled = data.disabled || false;
  const hasPinnedData = data.pinnedData || false;
  const hasIssues = data.hasIssues || false;

  // Get node icon and color
  const IconComponent = nodeIcons[nodeType] || nodeIcons.default;
  const nodeColor = nodeColors[nodeType] || nodeColors.default;

  // Node state classes (inspired by n8n)
  const nodeClasses = useMemo(() => {
    const classes = ['workflow-node'];

    if (selected) classes.push('selected');
    if (isDisabled) classes.push('disabled');
    if (executionState === 'success') classes.push('success');
    if (executionState === 'error') classes.push('error');
    if (executionState === 'running') classes.push('running');
    if (executionState === 'waiting') classes.push('waiting');
    if (hasPinnedData) classes.push('pinned');
    if (hasIssues) classes.push('has-issues');

    // Node type specific classes
    if (nodeType === 'trigger') classes.push('trigger');
    if (['condition', 'httpRequest', 'email', 'database'].includes(nodeType)) {
      classes.push('configurable');
    }

    return classes.join(' ');
  }, [selected, isDisabled, executionState, hasPinnedData, hasIssues, nodeType]);

  // Handle configuration
  const handleConfigure = useCallback(() => {
    setConfigModalVisible(true);
  }, []);

  const handleConfigSave = useCallback(
    (newConfig) => {
      if (data.onConfigUpdate) {
        data.onConfigUpdate(id, newConfig);
      }
      setConfigModalVisible(false);
    },
    [id, data]
  );

  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: 'Delete Node',
      content: 'Are you sure you want to delete this node?',
      onOk: () => {
        if (data.onDelete) {
          data.onDelete(id);
        }
      },
    });
  }, [id, data]);

  // Render handles based on node type (inspired by n8n's handle system)
  const renderHandles = useCallback(() => {
    const handles = data.handles || { source: ['default'], target: ['default'] };
    const sourceHandles = handles.source || [];
    const targetHandles = handles.target || [];

    return (
      <>
        {/* Input handles (targets) */}
        {targetHandles.map((handleId, index) => (
          <Handle
            key={`target-${handleId}`}
            type="target"
            position={Position.Left}
            id={handleId}
            style={{
              top:
                targetHandles.length === 1
                  ? '50%'
                  : `${((index + 1) * 100) / (targetHandles.length + 1)}%`,
              background: '#555',
              border: '2px solid #fff',
              width: 10,
              height: 10,
            }}
          />
        ))}

        {/* Output handles (sources) */}
        {sourceHandles.map((handleId, index) => (
          <Handle
            key={`source-${handleId}`}
            type="source"
            position={Position.Right}
            id={handleId}
            style={{
              top:
                sourceHandles.length === 1
                  ? '50%'
                  : `${((index + 1) * 100) / (sourceHandles.length + 1)}%`,
              background: nodeColor,
              border: '2px solid #fff',
              width: 10,
              height: 10,
            }}
          />
        ))}
      </>
    );
  }, [data.handles, nodeColor]);

  // Node status indicators
  const renderStatusIndicators = useCallback(() => {
    const indicators = [];

    if (executionState === 'running') {
      indicators.push(
        <Tooltip title="Running" key="running">
          <LoadingOutlined style={{ color: '#1890ff' }} />
        </Tooltip>
      );
    }

    if (executionState === 'success') {
      indicators.push(
        <Tooltip title="Success" key="success">
          <CheckOutlined style={{ color: '#52c41a' }} />
        </Tooltip>
      );
    }

    if (executionState === 'error' || hasIssues) {
      indicators.push(
        <Tooltip title="Error" key="error">
          <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
        </Tooltip>
      );
    }

    if (hasPinnedData) {
      indicators.push(
        <Tooltip title="Pinned Data" key="pinned">
          <PushpinOutlined style={{ color: '#fa8c16' }} />
        </Tooltip>
      );
    }

    return indicators.length > 0 ? (
      <div className="node-status-indicators">
        <Space size={4}>{indicators}</Space>
      </div>
    ) : null;
  }, [executionState, hasIssues, hasPinnedData]);

  // Get node configuration summary
  const getNodeSummary = useCallback(() => {
    if (!config || Object.keys(config).length === 0) {
      return (
        <Text type="secondary" style={{ fontSize: 10 }}>
          Not configured
        </Text>
      );
    }

    switch (nodeType) {
      case 'httpRequest':
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {config.method || 'GET'} {config.url || 'URL not set'}
          </Text>
        );
      case 'condition':
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {config.field} {config.operator} {config.value}
          </Text>
        );
      case 'delay':
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {config.amount} {config.unit}
          </Text>
        );
      case 'email':
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            To: {config.to}
          </Text>
        );
      case 'database':
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            {config.operation} on {config.table}
          </Text>
        );
      default:
        return (
          <Text type="secondary" style={{ fontSize: 10 }}>
            Configured
          </Text>
        );
    }
  }, [nodeType, config]);

  return (
    <>
      <div
        className={nodeClasses}
        style={{
          '--node-color': nodeColor,
          '--node-size':
            nodeType === 'trigger'
              ? '80px'
              : ['condition', 'httpRequest', 'email', 'database'].includes(nodeType)
                ? 'auto'
                : '120px',
        }}
        onClick={handleConfigure}
      >
        {/* Node Icon */}
        <div className="node-icon">
          <IconComponent
            style={{
              fontSize: nodeType === 'trigger' ? 24 : 20,
              color: isDisabled ? '#bbb' : '#fff',
            }}
          />
        </div>

        {/* Node Label and Description */}
        <div className="node-description">
          <div className="node-label">
            {label}
            {isDisabled && <span className="disabled-label"> (disabled)</span>}
          </div>
          {subtitle && <div className="node-subtitle">{subtitle}</div>}
          <div className="node-summary">{getNodeSummary()}</div>
        </div>

        {/* Node Status Indicators */}
        {!isDisabled && renderStatusIndicators()}

        {/* Node Actions */}
        {!isDisabled && (
          <div className="node-actions">
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
          </div>
        )}

        {/* Connection Handles */}
        {renderHandles()}

        {/* Disabled strikethrough effect */}
        {isDisabled && <div className="disabled-strikethrough" />}
      </div>

      {/* Configuration Modal */}
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

export default EnhancedWorkflowNode;
