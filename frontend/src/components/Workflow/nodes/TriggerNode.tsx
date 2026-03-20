import { ThunderboltOutlined } from '@ant-design/icons';
import BaseNode from './BaseNode';

const TriggerNode = ({ data, selected }) => {
  return (
    <BaseNode
      data={data}
      selected={selected}
      nodeStyle={{
        padding: '10px',
        borderRadius: '5px',
        minWidth: '150px',
        background: '#f6ffed',
        borderColor: '#b7eb8f',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ThunderboltOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
        <div>
          <div style={{ fontWeight: 600 }}>{data.label || 'Trigger'}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {data.config?.formId && `Form: ${data.config.formId}`}
            {data.config?.entity && `Entity: ${data.config.entity}`}
            {data.config?.cronExpression && `Schedule: ${data.config.cronExpression}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default TriggerNode;
