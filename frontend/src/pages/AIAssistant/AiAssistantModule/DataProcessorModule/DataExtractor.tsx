import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Table, 
  Typography, 
  Space, 
  Tag, 
  Alert,
  Row,
  Col,
  Tabs,
  Progress
} from '@/components/ui';
import { 
  DatabaseOutlined, 
  PlayCircleOutlined, 
  DownloadOutlined,
  EyeOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DataExtractor = () => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [extractedData, setExtractedData] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('invoice');

  const extractionTemplates = {
    invoice: {
      name: 'Invoice Template',
      fields: [
        { key: 'invoice_number', label: 'Invoice Number', type: 'text' },
        { key: 'date', label: 'Date', type: 'date' },
        { key: 'vendor', label: 'Vendor', type: 'text' },
        { key: 'total_amount', label: 'Total Amount', type: 'currency' },
        { key: 'tax_amount', label: 'Tax Amount', type: 'currency' },
        { key: 'due_date', label: 'Due Date', type: 'date' },
      ]
    },
    receipt: {
      name: 'Receipt Template',
      fields: [
        { key: 'store_name', label: 'Store Name', type: 'text' },
        { key: 'transaction_id', label: 'Transaction ID', type: 'text' },
        { key: 'date_time', label: 'Date & Time', type: 'datetime' },
        { key: 'items', label: 'Items', type: 'array' },
        { key: 'subtotal', label: 'Subtotal', type: 'currency' },
        { key: 'total', label: 'Total', type: 'currency' },
      ]
    },
    contract: {
      name: 'Contract Template',
      fields: [
        { key: 'contract_id', label: 'Contract ID', type: 'text' },
        { key: 'parties', label: 'Parties', type: 'array' },
        { key: 'start_date', label: 'Start Date', type: 'date' },
        { key: 'end_date', label: 'End Date', type: 'date' },
        { key: 'terms', label: 'Key Terms', type: 'text' },
        { key: 'value', label: 'Contract Value', type: 'currency' },
      ]
    }
  };

  const handleExtractData = async (values) => {
    setProcessing(true);
    
    // Simulate data extraction process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockExtractedData = generateMockExtractedData(activeTemplate, values.inputText);
      setExtractedData(mockExtractedData);
      
    } catch (error) {
      console.error('Extraction failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const generateMockExtractedData = (template, text) => {
    const templates = extractionTemplates[template];
    const mockData = [];

    // Generate mock extracted data based on template
    for (let i = 0; i < 3; i++) {
      const row = {};
      templates.fields.forEach(field => {
        switch (field.type) {
          case 'text':
            row[field.key] = `Sample ${field.label} ${i + 1}`;
            break;
          case 'date':
            row[field.key] = new Date().toISOString().split('T')[0];
            break;
          case 'datetime':
            row[field.key] = new Date().toISOString();
            break;
          case 'currency':
            row[field.key] = (Math.random() * 1000 + 100).toFixed(2);
            break;
          case 'array':
            row[field.key] = ['Item 1', 'Item 2', 'Item 3'].join(', ');
            break;
          default:
            row[field.key] = `Value ${i + 1}`;
        }
      });
      row.confidence = Math.random() * 20 + 80; // 80-100%
      row.source = `Document ${i + 1}`;
      mockData.push(row);
    }

    return mockData;
  };

  const columns = [
    {
      title: translate('Field'),
      dataIndex: 'field',
      key: 'field',
    },
    {
      title: translate('Extracted Value'),
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: translate('Confidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence) => (
        <Progress 
          percent={confidence} 
          size="small" 
          status={confidence > 90 ? 'success' : confidence > 70 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: translate('Source'),
      dataIndex: 'source',
      key: 'source',
    },
  ];

  const tabItems = [
    {
      key: 'extract',
      label: translate('Data Extraction'),
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title={translate('Input & Configuration')}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleExtractData}
              >
                <Form.Item
                  name="template"
                  label={translate('Extraction Template')}
                  initialValue={activeTemplate}
                >
                  <Select
                    value={activeTemplate}
                    onChange={setActiveTemplate}
                    placeholder={translate('Select template')}
                  >
                    {Object.entries(extractionTemplates).map(([key, template]) => (
                      <Select.Option key={key} value={key}>
                        {template.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="inputText"
                  label={translate('Input Text/Data')}
                  rules={[{ required: true, message: translate('Please enter text to extract data from') }]}
                >
                  <TextArea 
                    rows={10}
                    placeholder={translate('Paste your document text here or upload processed OCR results...')}
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<PlayCircleOutlined />}
                    loading={processing}
                    block
                  >
                    {processing ? translate('Extracting...') : translate('Extract Data')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={12}>
            <Card title={translate('Template Fields')}>
              {extractionTemplates[activeTemplate] && (
                <div>
                  <Title level={5}>{extractionTemplates[activeTemplate].name}</Title>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {extractionTemplates[activeTemplate].fields.map(field => (
                      <div key={field.key} style={{ 
                        padding: '8px 12px', 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '4px' 
                      }}>
                        <Text strong>{field.label}</Text>
                        <br />
                        <Tag color="blue">{field.type}</Tag>
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {field.key}
                        </Text>
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'results',
      label: translate('Extraction Results'),
      children: (
        <Card 
          title={translate('Extracted Data')}
          extra={
            extractedData.length > 0 && (
              <Space>
                <Button icon={<EyeOutlined />}>
                  {translate('Preview')}
                </Button>
                <Button icon={<DownloadOutlined />} type="primary">
                  {translate('Export CSV')}
                </Button>
              </Space>
            )
          }
        >
          {extractedData.length > 0 ? (
            <Table
              dataSource={extractedData}
              columns={columns}
              rowKey="field"
              pagination={false}
            />
          ) : (
            <Alert
              message={translate('No data extracted yet')}
              description={translate('Use the extraction tool to process your documents and extract structured data.')}
              type="info"
              showIcon
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Alert
        message={translate('Intelligent Data Extraction')}
        description={translate('Extract structured data from unstructured text using AI-powered templates. Perfect for invoices, receipts, contracts, and more.')}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs items={tabItems} />
    </div>
  );
};

export default DataExtractor;
