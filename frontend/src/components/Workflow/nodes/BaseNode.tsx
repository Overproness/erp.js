import { memo } from 'react';
import { Handle } from 'reactflow';

const BaseNode = ({
  id,
  data,
  children,
  selected,
  sourceHandlePositions = { default: 'bottom' },
  targetHandlePositions = { default: 'top' },
  nodeStyle = {
    padding: '10px',
    borderRadius: '5px',
    minWidth: '150px',
  },
}) => {
  const sourceHandles = data?.handles?.source || ['default'];
  const targetHandles = data?.handles?.target || ['default'];

  const getPosition = (handleId, positions) => {
    return positions[handleId] || 'bottom';
  };

  const getSourcePosition = (handleId) => getPosition(handleId, sourceHandlePositions);
  const getTargetPosition = (handleId) => getPosition(handleId, targetHandlePositions);

  return (
    <div
      style={{
        ...nodeStyle,
        border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        background: 'white',
        zIndex: selected ? 10 : 0,
      }}
    >
      {/* Render target handles */}
      {targetHandles.map((handleId) => (
        <Handle
          key={`target-${handleId}-${id}`}
          type="target"
          position={getTargetPosition(handleId)}
          id={handleId}
          style={{ background: '#1890ff', width: '8px', height: '8px' }}
        />
      ))}

      {/* Node content */}
      {children}

      {/* Render source handles */}
      {sourceHandles.map((handleId) => (
        <Handle
          key={`source-${handleId}-${id}`}
          type="source"
          position={getSourcePosition(handleId)}
          id={handleId}
          style={{ background: '#1890ff', width: '8px', height: '8px' }}
        />
      ))}
    </div>
  );
};

export default memo(BaseNode);
