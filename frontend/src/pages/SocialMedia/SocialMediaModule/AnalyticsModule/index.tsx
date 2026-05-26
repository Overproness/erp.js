import React, { useState } from 'react';
import { Tabs, Button, Space } from '@/components/ui';
import { ArrowLeftOutlined, BarChartOutlined, LineChartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Overview from './Overview';
import PlatformAnalytics from './PlatformAnalytics';
import ReportGenerator from './ReportGenerator';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;

const AnalyticsModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
            {translate('Social Media Analytics')}
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Track performance and analyze your social media metrics
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
              <BarChartOutlined />
              {translate('Overview')}
            </span>
          }
          key="overview"
        >
          <Overview />
        </TabPane>

        <TabPane
          tab={
            <span>
              <LineChartOutlined />
              {translate('Platform Analytics')}
            </span>
          }
          key="platforms"
        >
          <PlatformAnalytics />
        </TabPane>

        <TabPane
          tab={
            <span>
              <FileTextOutlined />
              {translate('Reports')}
            </span>
          }
          key="reports"
        >
          <ReportGenerator />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AnalyticsModule;
