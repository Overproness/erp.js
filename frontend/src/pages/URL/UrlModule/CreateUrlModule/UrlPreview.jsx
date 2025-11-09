import React from 'react';
import { Card, Typography, Divider, Tag, Space } from 'antd';

const { Title, Text } = Typography;

const UrlPreview = ({ data, formData, onEdit }) => {
  if (!data) return null;

  return (
    <Card>
      <Title level={4}>Preview Short URL</Title>
      <Divider />
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Short URL:</Text>
          <Text code copyable style={{ marginLeft: 8 }}>{data.shortUrl}</Text>
        </div>
        <div>
          <Text strong>Final Destination URL:</Text>
          <Text code copyable style={{ marginLeft: 8 }}>{data.finalUrl}</Text>
        </div>
        <Divider />
        <div>
          <Text strong>Title:</Text> {data.metadata?.title || formData.title || '-'}
        </div>
        <div>
          <Text strong>Description:</Text> {data.metadata?.description || formData.description || '-'}
        </div>
        <div>
          <Text strong>Security:</Text>
          <Space>
            {data.metadata?.security?.passwordProtected && <Tag color="red">Password Protected</Tag>}
            {data.metadata?.security?.clickLimit && (
              <Tag color="orange">Click Limit: {data.metadata.security.clickLimit}</Tag>
            )}
            {data.metadata?.security?.expiration && (
              <Tag color="gold">
                Expires: {data.metadata.security.expiration ? new Date(data.metadata.security.expiration).toLocaleString() : '-'}
              </Tag>
            )}
          </Space>
        </div>
        {data.metadata?.utm && (
          <div>
            <Text strong>UTM Parameters:</Text>
            <Space>
              {Object.entries(data.metadata.utm).map(([key, value]) => (
                <Tag key={key}>{key}: {value}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Space>
      {onEdit && (
        <Divider />
      )}
      {onEdit && (
        <Space>
          <Text type="secondary">Want to edit?</Text>
          <a onClick={onEdit}>Go back to edit</a>
        </Space>
      )}
    </Card>
  );
};

export default UrlPreview;