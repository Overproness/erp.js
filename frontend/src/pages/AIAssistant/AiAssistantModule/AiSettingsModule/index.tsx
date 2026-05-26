import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Typography } from '@/components/ui';
import { ArrowLeftOutlined, SettingOutlined, DatabaseOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ErpLayout } from '@/layout';
import AiPreferences from './AiPreferences';
import ModelConfiguration from './ModelConfiguration';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import useLanguage from '@/locale/useLanguage';

const { Title } = Typography;
const { TabPane } = Tabs;

const AiSettingsModule = () => {
  const navigate = useNavigate();
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('preferences');

  const tabItems = [
    {
      key: 'preferences',
      label: (
        <Space>
          <UserOutlined />
          {translate('User Preferences')}
        </Space>
      ),
      children: <AiPreferences />,
    },
    {
      key: 'models',
      label: (
        <Space>
          <SettingOutlined />
          {translate('Model Configuration')}
        </Space>
      ),
      children: <ModelConfiguration />,
    },
    {
      key: 'knowledge',
      label: (
        <Space>
          <DatabaseOutlined />
          {translate('Knowledge Base')}
        </Space>
      ),
      children: <KnowledgeBaseManager />,
    },
  ];

  return (
    <ErpLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/ai-assistant')}
            >
              {translate('Back')}
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {translate('AI Settings')}
            </Title>
          </Space>
        </div>

        {/* Main Content */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </div>
    </ErpLayout>
  );
};

export default AiSettingsModule;
