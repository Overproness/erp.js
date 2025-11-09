import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const RealTimeView = () => {
  return (
    <Card>
      <Title level={4}>Real-time Analytics</Title>
      <Paragraph>
        Real-time analytics are not available with the current data.
      </Paragraph>
      <Paragraph type="secondary">
        (Feature not implemented. No real-time data returned from backend.)
      </Paragraph>
    </Card>
  );
};

export default RealTimeView;