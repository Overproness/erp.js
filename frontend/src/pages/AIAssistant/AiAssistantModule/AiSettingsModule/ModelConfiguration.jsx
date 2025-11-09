import React from 'react';
import { Card, Table, Tag, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const ModelConfiguration = () => {
  const translate = useLanguage();

  const models = [
    {
      id: '1',
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      status: 'active',
      costPerToken: 0.001,
      maxTokens: 4096,
    },
    {
      id: '2',
      name: 'GPT-4',
      provider: 'OpenAI',
      status: 'active',
      costPerToken: 0.03,
      maxTokens: 8192,
    },
  ];

  const columns = [
    {
      title: translate('Model Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: translate('Provider'),
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {translate(status)}
        </Tag>
      ),
    },
    {
      title: translate('Cost per Token'),
      dataIndex: 'costPerToken',
      key: 'costPerToken',
      render: (cost) => `$${cost}`,
    },
    {
      title: translate('Max Tokens'),
      dataIndex: 'maxTokens',
      key: 'maxTokens',
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small">
            {translate('Edit')}
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger>
            {translate('Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />}>
          {translate('Add Model')}
        </Button>
      </div>
      
      <Table
        dataSource={models}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
};

export default ModelConfiguration;
