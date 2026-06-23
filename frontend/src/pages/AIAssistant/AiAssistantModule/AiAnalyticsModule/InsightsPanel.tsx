import React from 'react';
import { Card, List, Tag, Avatar, Typography } from '@/components/ui';
import { 
  BulbOutlined, 
  TrophyOutlined, 
  WarningOutlined,
  InfoCircleOutlined 
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Text } = Typography;

const InsightsPanel = ({ data, loading }) => {
  const translate = useLanguage();

  const insights = data?.insights || [
    {
      id: 1,
      type: 'optimization',
      title: translate('Optimize Usage Patterns'),
      description: translate('Peak usage detected during business hours'),
      priority: 'medium',
      icon: <BulbOutlined />
    },
    {
      id: 2,
      type: 'performance',
      title: translate('Good Response Times'),
      description: translate('Average response time is within acceptable range'),
      priority: 'low',
      icon: <TrophyOutlined />
    },
    {
      id: 3,
      type: 'cost',
      title: translate('Monitor Costs'),
      description: translate('Monthly costs are approaching limit'),
      priority: 'high',
      icon: <WarningOutlined />
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'optimization': return <BulbOutlined />;
      case 'performance': return <TrophyOutlined />;
      case 'cost': return <WarningOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  return (
    <Card title={translate('AI Insights')} loading={loading}>
      <List
        itemLayout="horizontal"
        dataSource={insights}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={getPriorityIcon(item.type)} 
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                />
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.title}
                  <Tag color={getPriorityColor(item.priority)}>
                    {translate(item.priority)}
                  </Tag>
                </div>
              }
              description={
                <Text type="secondary">{item.description}</Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default InsightsPanel;