import React from 'react';
import { Button, Space, Dropdown, message, Popconfirm } from '@/components/ui';
import {
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  MoreOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const BulkActions = ({ 
  selectedCount, 
  onBulkDelete, 
  onBulkEnable, 
  onBulkDisable,
  onBulkExport,
  onBulkCopy 
}) => {
  const translate = useLanguage();

  const handleBulkAction = (action) => {
    switch (action) {
      case 'enable':
        onBulkEnable();
        message.success(translate(`${selectedCount} URLs enabled`));
        break;
      case 'disable':
        onBulkDisable();
        message.success(translate(`${selectedCount} URLs disabled`));
        break;
      case 'export':
        onBulkExport();
        message.success(translate('Export started'));
        break;
      case 'copy':
        onBulkCopy();
        message.success(translate('URLs copied to clipboard'));
        break;
      default:
        break;
    }
  };

  const moreActions = [
    {
      key: 'export',
      label: translate('Export Selected'),
      icon: <DownloadOutlined />,
      onClick: () => handleBulkAction('export'),
    },
    {
      key: 'copy',
      label: translate('Copy URLs'),
      icon: <CopyOutlined />,
      onClick: () => handleBulkAction('copy'),
    },
    {
      type: 'divider',
    },
    {
      key: 'enable',
      label: translate('Enable Selected'),
      icon: <PlayCircleOutlined />,
      onClick: () => handleBulkAction('enable'),
    },
    {
      key: 'disable',
      label: translate('Disable Selected'),
      icon: <PauseCircleOutlined />,
      onClick: () => handleBulkAction('disable'),
    },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '12px 16px',
      background: '#f8fafc',
      borderRadius: '8px'
    }}>
      <div>
        <span style={{ fontWeight: 600 }}>
          {selectedCount} {translate('URLs selected')}
        </span>
      </div>
      
      <Space>
        <Button
          icon={<PlayCircleOutlined />}
          onClick={() => handleBulkAction('enable')}
        >
          {translate('Enable')}
        </Button>
        
        <Button
          icon={<PauseCircleOutlined />}
          onClick={() => handleBulkAction('disable')}
        >
          {translate('Disable')}
        </Button>
        
        <Popconfirm
          title={translate('Are you sure you want to delete these URLs?')}
          description={translate(`This will permanently delete ${selectedCount} URLs and all their analytics data.`)}
          onConfirm={onBulkDelete}
          okText={translate('Yes')}
          cancelText={translate('No')}
          okType="danger"
        >
          <Button
            danger
            icon={<DeleteOutlined />}
          >
            {translate('Delete')}
          </Button>
        </Popconfirm>
        
        <Dropdown
          menu={{ items: moreActions }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<MoreOutlined />}>
            {translate('More')}
          </Button>
        </Dropdown>
      </Space>
    </div>
  );
};

export default BulkActions;
