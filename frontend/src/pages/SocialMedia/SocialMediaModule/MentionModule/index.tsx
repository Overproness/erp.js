import React, { useState } from 'react';
import { Tabs, Button, Space } from '@/components/ui';
import { ArrowLeftOutlined, MessageOutlined, EyeOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import MentionList from './MentionList';
import MentionDetail from './MentionDetail';
import CompetitorAnalysis from './CompetitorAnalysis';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;

const MentionModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mentions');
  const [selectedMention, setSelectedMention] = useState(null);

  const handleBack = () => {
    navigate('/social-media');
  };

  const handleViewMention = (mention) => {
    setSelectedMention(mention);
    setActiveTab('detail');
  };

  const handleBackToList = () => {
    setSelectedMention(null);
    setActiveTab('mentions');
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
            {translate('Social Listening & Mentions')}
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Monitor brand mentions and track competitor activity
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
              <MessageOutlined />
              {translate('Mentions')}
            </span>
          }
          key="mentions"
        >
          <MentionList onViewMention={handleViewMention} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <BarChartOutlined />
              {translate('Competitor Analysis')}
            </span>
          }
          key="competitors"
        >
          <CompetitorAnalysis />
        </TabPane>

        {selectedMention && (
          <TabPane
            tab={
              <span>
                <EyeOutlined />
                {translate('Mention Details')}
              </span>
            }
            key="detail"
          >
            <MentionDetail 
              mention={selectedMention}
              onBack={handleBackToList}
            />
          </TabPane>
        )}
      </Tabs>
    </div>
  );
};

export default MentionModule;
