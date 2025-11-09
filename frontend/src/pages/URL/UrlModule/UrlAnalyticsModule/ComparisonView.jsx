import React, { useState } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Table,
  Typography,
  Tag,
  Progress,
  Space,
  Button,
  Tooltip
} from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { Line, Column, Bar } from '@ant-design/charts';
import useLanguage from '@/locale/useLanguage';
import { useUrlManagement } from '@/hooks/useUrl';

const { Option } = Select;
const { Title, Text } = Typography;

const ComparisonView = ({ 
  data, 
  loading, 
  selectedUrls, 
  onUrlSelectionChange, 
  dateRange, 
  timeframe 
}) => {
  const translate = useLanguage();
  const { urls } = useUrlManagement();
  const [compareMetric, setCompareMetric] = useState('totalClicks');

  const handleAddUrl = (urlId) => {
    if (!selectedUrls.includes(urlId)) {
      onUrlSelectionChange([...selectedUrls, urlId]);
    }
  };

  const handleRemoveUrl = (urlId) => {
    onUrlSelectionChange(selectedUrls.filter(id => id !== urlId));
  };

  const getUrlInfo = (urlId) => {
    return urls?.find(url => url._id === urlId) || { shortCode: urlId, title: 'Unknown URL' };
  };

  // Comparison table columns
  const comparisonColumns = [
    {
      title: translate('URL'),
      dataIndex: 'url',
      key: 'url',
      render: (_, record) => {
        const urlInfo = getUrlInfo(record.urlId);
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#8b5cf6' }}>
              {urlInfo.shortCode}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {urlInfo.title || urlInfo.originalUrl?.substring(0, 50) + '...'}
            </div>
          </div>
        );
      },
    },
    {
      title: translate('Total Clicks'),
      dataIndex: 'totalClicks',
      key: 'totalClicks',
      sorter: (a, b) => a.totalClicks - b.totalClicks,
      render: (clicks) => (
        <Text strong style={{ color: '#8b5cf6' }}>
          {clicks?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: translate('Unique Clicks'),
      dataIndex: 'uniqueClicks',
      key: 'uniqueClicks',
      sorter: (a, b) => a.uniqueClicks - b.uniqueClicks,
      render: (clicks) => (
        <Text style={{ color: '#10b981' }}>
          {clicks?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Tooltip title={translate('Remove from comparison')}>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleRemoveUrl(record.urlId)}
            danger
          />
        </Tooltip>
      ),
    },
  ];

  // Chart configurations
  const comparisonChartConfig = {
    data: data?.comparisonData || [],
    xField: 'date',
    yField: compareMetric,
    seriesField: 'urlId',
    smooth: true,
    color: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'],
  };

  const performanceChartConfig = {
    data: data?.performanceComparison || [],
    xField: 'urlId',
    yField: compareMetric,
    color: '#8b5cf6',
  };

  if (!selectedUrls.length) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ marginBottom: '24px' }}>
          <SwapOutlined style={{ fontSize: '48px', color: '#d1d5db' }} />
        </div>
        <Title level={4} style={{ color: '#6b7280' }}>
          {translate('Select URLs to Compare')}
        </Title>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
          {translate('Choose multiple URLs to compare their performance')}
        </p>
        <Select
          placeholder={translate('Select URLs to compare')}
          style={{ width: '300px' }}
          mode="multiple"
          onChange={onUrlSelectionChange}
          value={selectedUrls}
        >
          {urls?.map(url => (
            <Option key={url._id} value={url._id}>
              {url.shortCode} - {url.title || url.originalUrl?.substring(0, 30) + '...'}
            </Option>
          ))}
        </Select>
      </Card>
    );
  }

  return (
    <div>
      {/* URL Selection */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>{translate('URLs in Comparison')}</Text>
            </div>
            <Space wrap>
              {selectedUrls.map(urlId => {
                const urlInfo = getUrlInfo(urlId);
                return (
                  <Tag
                    key={urlId}
                    closable
                    onClose={() => handleRemoveUrl(urlId)}
                    color="purple"
                  >
                    {urlInfo.shortCode}
                  </Tag>
                );
              })}
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>{translate('Compare Metric')}</Text>
            </div>
            <Select
              value={compareMetric}
              onChange={setCompareMetric}
              style={{ width: '100%' }}
            >
              <Option value="totalClicks">{translate('Total Clicks')}</Option>
              <Option value="uniqueClicks">{translate('Unique Clicks')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>{translate('Add URL')}</Text>
            </div>
            <Select
              placeholder={translate('Add URL')}
              style={{ width: '100%' }}
              onChange={handleAddUrl}
              value={undefined}
            >
              {urls?.filter(url => !selectedUrls.includes(url._id)).map(url => (
                <Option key={url._id} value={url._id}>
                  {url.shortCode}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Comparison Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title={translate('Performance Over Time')} loading={loading}>
            <Line {...comparisonChartConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={translate('Performance Comparison')} loading={loading}>
            <Bar {...performanceChartConfig} height={300} />
          </Card>
        </Col>
      </Row>

      {/* Comparison Table */}
      <Card title={translate('Detailed Comparison')} loading={loading}>
        <Table
          columns={comparisonColumns}
          dataSource={data?.urlComparisons || []}
          rowKey="urlId"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ComparisonView;