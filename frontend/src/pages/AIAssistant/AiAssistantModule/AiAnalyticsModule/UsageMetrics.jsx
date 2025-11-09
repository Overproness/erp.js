import React from 'react';
import { Card, Table, Tag, Progress } from 'antd';
import useLanguage from '@/locale/useLanguage';

const UsageMetrics = ({ data, loading }) => {
  const translate = useLanguage();

  const columns = [
    {
      title: translate('Module'),
      dataIndex: 'module',
      key: 'module',
      render: (module) => <Tag color="blue">{module}</Tag>
    },
    {
      title: translate('Usage Count'),
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: translate('Tokens'),
      dataIndex: 'tokens',
      key: 'tokens',
    },
    {
      title: translate('Cost'),
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `$${cost?.toFixed(4) || '0.0000'}`
    },
    {
      title: translate('Usage %'),
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <Progress 
          percent={percentage || 0} 
          size="small" 
          strokeColor="#1890ff"
        />
      )
    }
  ];

  const moduleData = data?.moduleBreakdown || [];
  const total = moduleData.reduce((sum, item) => sum + (item.count || 0), 0);
  
  const tableData = moduleData.map((item, index) => ({
    key: index,
    module: item._id || 'Unknown',
    count: item.count || 0,
    tokens: item.tokens || 0,
    cost: item.cost || 0,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
  }));

  return (
    <Card title={translate('Usage by Module')} loading={loading}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
      />
    </Card>
  );
};

export default UsageMetrics;
