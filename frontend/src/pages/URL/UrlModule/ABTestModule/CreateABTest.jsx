import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Card,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Switch,
  Divider,
  Typography,
  Slider,
  Alert,
  Tag,
  Spin,
  Empty
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const CreateABTest = ({ onSubmit, onCancel }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();

  // Local state for URLs and loading
  const [urls, setUrls] = useState([]);
  const [urlsLoading, setUrlsLoading] = useState(false);

  // Fetch URLs on mount (like UrlDataTableModule)
  useEffect(() => {
    const fetchUrls = async () => {
      setUrlsLoading(true);
      try {
        const response = await request.list({
          entity: 'url',
          options: { page: 1, limit: 1000 }, // fetch all, or adjust as needed
        });
        if (response.success) {
          setUrls(Array.isArray(response.result) ? response.result : []);
        } else {
          setUrls([]);
        }
      } catch (err) {
        setUrls([]);
      } finally {
        setUrlsLoading(false);
      }
    };
    fetchUrls();
  }, []);

  const [variants, setVariants] = useState([
    { name: 'Control', url: '', trafficSplit: 50 },
    { name: 'Variant A', url: '', trafficSplit: 50 }
  ]);

  const handleAddVariant = () => {
    const newVariant = {
      name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`,
      url: '',
      trafficSplit: Math.floor(100 / (variants.length + 1))
    };
    
    // Redistribute traffic evenly
    const updatedVariants = variants.map(v => ({
      ...v,
      trafficSplit: Math.floor(100 / (variants.length + 1))
    }));
    
    setVariants([...updatedVariants, newVariant]);
  };

  const handleRemoveVariant = (index) => {
    if (variants.length <= 2) return;
    
    const updatedVariants = variants.filter((_, i) => i !== index);
    // Redistribute traffic evenly
    const redistributed = updatedVariants.map(v => ({
      ...v,
      trafficSplit: Math.floor(100 / updatedVariants.length)
    }));
    
    setVariants(redistributed);
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const handleTrafficSplitChange = (index, value) => {
    const updatedVariants = [...variants];
    updatedVariants[index].trafficSplit = value;
    
    // Ensure total doesn't exceed 100%
    const total = updatedVariants.reduce((sum, v) => sum + v.trafficSplit, 0);
    if (total > 100) {
      const excess = total - 100;
      updatedVariants[index].trafficSplit = value - excess;
    }
    
    setVariants(updatedVariants);
  };

  const handleSubmit = async (values) => {
    const totalTraffic = variants.reduce((sum, v) => sum + v.trafficSplit, 0);

    if (totalTraffic !== 100) {
      form.setFields([{
        name: 'trafficSplit',
        errors: [translate('Traffic split must total 100%')]
      }]);
      return;
    }

    // Map frontend fields to backend fields
    // First variant is control, rest are variants
    const [control, ...restVariants] = variants;
    const controlUrlObj = urls?.find(u => u._id === control.url);
    const controlUrlId = controlUrlObj?._id || control.url;

    const mappedVariants = restVariants
      .filter(v => v.url)
      .map(v => {
        const urlObj = urls?.find(u => u._id === v.url);
        return {
          name: v.name,
          url: urlObj?._id || v.url,
          trafficAllocation: v.trafficSplit
        };
      });

    const payload = {
      testName: values.name,
      description: values.description,
      hypothesis: values.hypothesis,
      controlUrl: controlUrlId,
      variants: mappedVariants,
      controlTrafficAllocation: control.trafficSplit,
      startDate: values.duration?.[0]?.toISOString(),
      endDate: values.duration?.[1]?.toISOString(),
      duration: values.duration
        ? dayjs(values.duration[1]).diff(dayjs(values.duration[0]), 'day')
        : undefined,
      primaryMetric: values.goal,
      minimumSampleSize: values.minSampleSize,
      confidenceLevel: values.confidence,
      // Remove unnecessary fields
    };

    await onSubmit(payload);
  };

  const getTotalTraffic = () => {
    return variants.reduce((sum, v) => sum + v.trafficSplit, 0);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        confidence: 95,
        minSampleSize: 100
      }}
    >
      {/* Basic Information */}
      <Card title={translate('Test Configuration')} style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label={translate('Test Name')}
              rules={[{ required: true, message: translate('Please enter test name') }]}
            >
              <Input placeholder={translate('e.g., Homepage CTA Test')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label={translate('Description')}
        >
          <TextArea 
            rows={3} 
            placeholder={translate('Describe what you are testing and your hypothesis')}
          />
        </Form.Item>

        <Form.Item
          name="hypothesis"
          label={translate('Hypothesis')}
        >
          <Input placeholder={translate('What do you expect to happen?')} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="goal"
              label={translate('Primary Goal')}
              rules={[{ required: true, message: translate('Please select a goal') }]}
            >
              <Select placeholder={translate('What are you measuring?')}>
                <Option value="click_rate">{translate('Click Rate')}</Option>
                <Option value="conversion_rate">{translate('Conversion Rate')}</Option>
                <Option value="engagement">{translate('Engagement Time')}</Option>
                <Option value="signups">{translate('Sign-ups')}</Option>
                <Option value="purchases">{translate('Purchases')}</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item
              name="duration"
              label={translate('Test Duration')}
            >
              <RangePicker 
                style={{ width: '100%' }}
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                placeholder={[translate('Start Date'), translate('End Date')]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Variants Configuration */}
      <Card title={translate('Test Variants')} style={{ marginBottom: '16px' }}>
        {urlsLoading ? (
          <Spin style={{ width: '100%', margin: '24px 0' }} />
        ) : urls.length === 0 ? (
          <Alert
            message={translate('No URLs available')}
            description={translate('Please create at least one URL before creating an A/B test.')}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : null}
        {variants.map((variant, index) => (
          <Card
            key={index}
            type="inner"
            title={
              <Space>
                <Tag color={index === 0 ? 'blue' : 'green'}>
                  {variant.name}
                </Tag>
                {index === 0 && <Text type="secondary">({translate('Control')})</Text>}
              </Space>
            }
            extra={
              variants.length > 2 && index > 0 && (
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveVariant(index)}
                  danger
                />
              )
            }
            style={{ marginBottom: '12px' }}
          >
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item label={translate('Variant Name')}>
                  <Input
                    value={variant.name}
                    onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                    placeholder={translate('Enter variant name')}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={10}>
                <Form.Item label={translate('Target URL')}>
                  <Select
                    value={variant.url}
                    onChange={(value) => handleVariantChange(index, 'url', value)}
                    placeholder={translate('Select URL')}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    disabled={urlsLoading || urls.length === 0}
                  >
                    {urls.map((url, idx) => (
                      <Option
                        key={url._id ? url._id : `url-option-${idx}`}
                        value={url._id ? url._id : `url-option-${idx}`}
                      >
                        {url.title || url.originalUrl}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={6}>
                <Form.Item label={translate('Traffic Split (%)')}>
                  <InputNumber
                    min={0}
                    max={100}
                    value={variant.trafficSplit}
                    onChange={(value) => handleTrafficSplitChange(index, value)}
                    style={{ width: '100%' }}
                    formatter={value => `${value}%`}
                    parser={value => value.replace('%', '')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}

        <div style={{ marginBottom: '16px' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={handleAddVariant}
            style={{ width: '100%' }}
            disabled={variants.length >= 5 || urlsLoading || !urls || urls.length === 0}
          >
            {translate('Add Variant')}
          </Button>
        </div>

        {/* Traffic Split Summary */}
        <Alert
          message={translate('Traffic Distribution')}
          description={
            <div>
              <div style={{ marginBottom: '8px' }}>
                {translate('Total traffic allocation')}: <strong>{getTotalTraffic()}%</strong>
                {getTotalTraffic() !== 100 && (
                  <Text type="danger" style={{ marginLeft: '8px' }}>
                    ({translate('Must total 100%')})
                  </Text>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {variants.map((variant, index) => (
                  <Tag key={index} color={variant.trafficSplit > 0 ? 'blue' : 'default'}>
                    {variant.name}: {variant.trafficSplit}%
                  </Tag>
                ))}
              </div>
            </div>
          }
          type={getTotalTraffic() === 100 ? 'success' : 'warning'}
          style={{ marginBottom: '16px' }}
        />
      </Card>

      {/* Statistical Settings */}
      <Card title={translate('Statistical Settings')} style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="confidence"
              label={translate('Confidence Level (%)')}
            >
              <Slider
                min={90}
                max={99}
                step={1}
                marks={{ 90: '90%', 95: '95%', 99: '99%' }}
                tooltip={{ formatter: value => `${value}%` }}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={8}>
            <Form.Item
              name="minSampleSize"
              label={translate('Minimum Sample Size')}
            >
              <InputNumber
                min={50}
                max={10000}
                style={{ width: '100%' }}
                placeholder={translate('Minimum visitors per variant')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Submit Buttons */}
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>
            {translate('Cancel')}
          </Button>
          <Button type="primary" htmlType="submit" disabled={urlsLoading || !urls || urls.length === 0}>
            {translate('Create Test')}
          </Button>
        </Space>
      </div>
    </Form>
  );
};

export default CreateABTest;