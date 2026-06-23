import { PlayCircleOutlined } from '@/components/icons';
import BaseNode from './BaseNode';

const ActionNode = ({ data, selected }) => {
  return (
    <BaseNode
      data={data}
      selected={selected}
      nodeStyle={{
        padding: '10px',
        borderRadius: '5px',
        minWidth: '150px',
        background: '#e6f7ff',
        borderColor: '#91d5ff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <PlayCircleOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{data.label || 'Action'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {data.config?.template && `Template: ${data.config.template}`}
            {data.config?.entity && `Entity: ${data.config.entity}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default ActionNode;
