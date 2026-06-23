import React, { useState } from 'react';
import { Tabs, Button, Space } from '@/components/ui';
import { ArrowLeftOutlined, BulbOutlined, ThunderboltOutlined } from '@/components/icons';
import { useNavigate } from 'react-router-dom';
import ContentIdeas from './ContentIdeas';
import ContentOptimizer from './ContentOptimizer';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;

const AIContentModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ideas');

  const handleBack = () => {
    navigate('/social-media');
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            {translate('Back to Social Media')}
          </Button>
        </Space>
        
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            {translate('AI Content Assistant')}
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Generate and optimize content with AI assistance
          </p>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        tabPosition="top"
      >
        <TabPane
          tab={
            <span>
              <BulbOutlined />
              {translate('Content Ideas')}
            </span>
          }
          key="ideas"
        >
          <ContentIdeas />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ThunderboltOutlined />
              {translate('Content Optimizer')}
            </span>
          }
          key="optimizer"
        >
          <ContentOptimizer />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AIContentModule;
