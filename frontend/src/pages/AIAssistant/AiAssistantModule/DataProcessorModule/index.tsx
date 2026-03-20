import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Tabs, Button, Space, Typography, Row, Col, Statistic } from 'antd';
import { 
  ArrowLeftOutlined, 
  ScanOutlined, 
  FileTextOutlined, 
  RobotOutlined,
  DatabaseOutlined,
  BarChartOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ErpLayout } from '@/layout';
import OCRProcessor from './OCRProcessor';
import DataExtractor from './DataExtractor';
import ProcessingWorkflows from './ProcessingWorkflows';
import ProcessingAnalytics from './ProcessingAnalytics';
import { fetchProcessingStats } from '@/redux/ai/aiThunks';
import { selectAnalyticsData, selectAnalyticsLoading } from '@/redux/ai/aiSelectors';
import useLanguage from '@/locale/useLanguage';

const { Title } = Typography;

const DataProcessorModule = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('ocr');
  
  const analyticsData = useSelector(selectAnalyticsData);
  const loading = useSelector(selectAnalyticsLoading);

  useEffect(() => {
    dispatch(fetchProcessingStats());
  }, [dispatch]);

  const mockStats = {
    documentsProcessed: 1247,
    dataPointsExtracted: 8963,
    automationsSaved: 156,
    accuracyRate: 94.8,
  };

  const tabItems = [
    {
      key: 'ocr',
      label: (
        <Space>
          <ScanOutlined />
          {translate('OCR Scanner')}
        </Space>
      ),
      children: <OCRProcessor />,
    },
    {
      key: 'extractor',
      label: (
        <Space>
          <DatabaseOutlined />
          {translate('Data Extractor')}
        </Space>
      ),
      children: <DataExtractor />,
    },
    {
      key: 'workflows',
      label: (
        <Space>
          <RobotOutlined />
          {translate('Processing Workflows')}
        </Space>
      ),
      children: <ProcessingWorkflows />,
    },
    {
      key: 'analytics',
      label: (
        <Space>
          <BarChartOutlined />
          {translate('Processing Analytics')}
        </Space>
      ),
      children: <ProcessingAnalytics />,
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
              {translate('Data Entry Automation')}
            </Title>
          </Space>
        </div>

        {/* Statistics Overview */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Documents Processed')}
                value={analyticsData?.documentsProcessed || mockStats.documentsProcessed}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Data Points Extracted')}
                value={analyticsData?.dataPointsExtracted || mockStats.dataPointsExtracted}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Hours Saved')}
                value={analyticsData?.automationsSaved || mockStats.automationsSaved}
                prefix={<RobotOutlined />}
                suffix="hrs"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Accuracy Rate')}
                value={analyticsData?.accuracyRate || mockStats.accuracyRate}
                prefix={<BarChartOutlined />}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

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

export default DataProcessorModule;
