import React from 'react';
import { Card, Table, Button, Space, Upload, message } from '@/components/ui';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const KnowledgeBaseManager = () => {
  const translate = useLanguage();

  const knowledgeItems = [
    {
      id: '1',
      title: 'Customer Service Guidelines',
      category: 'documentation',
      lastUpdated: '2024-01-15',
      size: '2.3 MB',
    },
    {
      id: '2',
      title: 'Product Information',
      category: 'catalog',
      lastUpdated: '2024-01-10',
      size: '1.8 MB',
    },
  ];

  const columns = [
    {
      title: translate('Title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: translate('Category'),
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: translate('Last Updated'),
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
    },
    {
      title: translate('Size'),
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<DownloadOutlined />} size="small">
            {translate('Download')}
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger>
            {translate('Delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const uploadProps = {
    name: 'file',
    action: '/api/knowledge-base/upload',
    headers: {
      authorization: 'Bearer ' + localStorage.getItem('token'),
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} upload failed.`);
      }
    },
  };

  return (
    <div>
      <Card title={translate('Upload Knowledge')} style={{ marginBottom: 16 }}>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>
            {translate('Upload Files')}
          </Button>
        </Upload>
      </Card>
      
      <Table
        dataSource={knowledgeItems}
        columns={columns}
        rowKey="id"
        title={() => (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{translate('Knowledge Base Items')}</span>
            <Button type="primary" icon={<PlusOutlined />}>
              {translate('Add Item')}
            </Button>
          </div>
        )}
      />
    </div>
  );
};

export default KnowledgeBaseManager;
