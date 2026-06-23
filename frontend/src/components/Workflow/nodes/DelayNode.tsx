import { ClockCircleOutlined } from '@/components/icons';
import BaseNode from './BaseNode';

const DelayNode = ({ data, selected }) => {
  return (
    <BaseNode
      data={data}
      selected={selected}
      nodeStyle={{
        padding: '10px',
        borderRadius: '5px',
        minWidth: '150px',
        background: '#f9f0ff',
        borderColor: '#d3adf7',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ClockCircleOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{data.label || 'Delay'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {data.config?.amount &&
              data.config?.unit &&
              `Wait: ${data.config.amount} ${data.config.unit}`}
            {data.config?.date && `Until: ${data.config.date}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default DelayNode;
