import { FormOutlined, QuestionCircleOutlined } from '@/components/icons';
import { Button, Card, Space, Tag, Tooltip, Typography } from '@/components/ui';
import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import ConditionEditor from '../ConditionEditor';

const { Title, Text } = Typography;

const ConditionNode = ({ id, data, selected }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const config = data.config || {};

  // Default configuration for condition
  if (!config.type) {
    config.type = 'field'; // Default to field comparison
  }

  const hasExpression = config.type === 'expression' && config.expression;
  const hasFieldCondition = config.type === 'field' && config.field && config.operator;

  // Render different content based on condition type
  const getConditionSummary = () => {
    if (hasExpression) {
      return <Tag color="blue">Expression: {config.expression}</Tag>;
    }

    if (hasFieldCondition) {
      // Format operator for display
      const formatOperator = (op) => {
        switch (op) {
          case 'equals':
            return '=';
          case 'notEquals':
            return '≠';
          case 'greaterThan':
            return '>';
          case 'lessThan':
            return '<';
          case 'greaterThanOrEqual':
            return '≥';
          case 'lessThanOrEqual':
            return '≤';
          case 'contains':
            return 'contains';
          case 'startsWith':
            return 'starts with';
          case 'endsWith':
            return 'ends with';
          default:
            return op;
        }
      };

      // Format value for display
      const formatValue = (val) => {
        if (val === undefined || val === null) return 'null';
        if (Array.isArray(val)) return `[${val.join(', ')}]`;
        return String(val);
      };

      return (
        <Tag color="green">
          {config.field} {formatOperator(config.operator)} {formatValue(config.value)}
        </Tag>
      );
    }

    return <Tag color="orange">No condition configured</Tag>;
  };

  // Open the condition editor
  const openEditor = () => {
    setIsEditorOpen(true);
  };

  // Handle saving the updated condition
  const handleSave = (updatedConfig) => {
    // Update the node data
    if (data.onConfigUpdate) {
      data.onConfigUpdate(id, updatedConfig);
    }
    setIsEditorOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="default"
        style={{ background: '#555', width: 10, height: 10 }}
      />

      <Card
        title={
          <Space>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <Text>{data.label || 'Check Condition'}</Text>
          </Space>
        }
        extra={<Button type="text" icon={<FormOutlined />} onClick={openEditor} size="small" />}
        size="small"
        style={{
          width: 220,
          border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: '4px',
        }}
      >
        <div style={{ minHeight: '40px' }}>{getConditionSummary()}</div>
      </Card>

      {/* "Yes" output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{
          left: '30%',
          background: '#52c41a',
          width: 10,
          height: 10,
        }}
      >
        <Tooltip title="Yes path" placement="bottom">
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              left: -10,
              fontSize: '12px',
              color: '#52c41a',
              fontWeight: 'bold',
            }}
          >
            Yes
          </div>
        </Tooltip>
      </Handle>

      {/* "No" output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={{
          left: '70%',
          background: '#f5222d',
          width: 10,
          height: 10,
        }}
      >
        <Tooltip title="No path" placement="bottom">
          <div
            style={{
              position: 'absolute',
              bottom: -20,
              left: -5,
              fontSize: '12px',
              color: '#f5222d',
              fontWeight: 'bold',
            }}
          >
            No
          </div>
        </Tooltip>
      </Handle>

      {/* Condition Editor Modal */}
      <ConditionEditor
        visible={isEditorOpen}
        config={config}
        onSave={handleSave}
        onCancel={() => setIsEditorOpen(false)}
      />
    </div>
  );
};

export default ConditionNode;
