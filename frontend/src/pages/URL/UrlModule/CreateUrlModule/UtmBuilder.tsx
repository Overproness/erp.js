import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Switch, 
  Input, 
  Select,
  Row, 
  Col, 
  Card,
  Space,
  Typography,
  Alert,
  Button,
  Divider
} from 'antd';
import { 
  BarChartOutlined, 
  InfoCircleOutlined,
  CopyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import urlConfig from '../config/urlConfig';

const { Option } = Select;
const { Text } = Typography;

const UtmBuilder = ({ data, onChange, disabled = false }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (data.originalUrl && data.enableUtm) {
      generatePreviewUrl();
    }
  }, [data]);

  const generatePreviewUrl = () => {
    if (!data.originalUrl) return;

    try {
      const url = new URL(data.originalUrl);
      const params = new URLSearchParams(url.search);

      if (data.utmSource) params.set('utm_source', data.utmSource);
      if (data.utmMedium) params.set('utm_medium', data.utmMedium);
      if (data.utmCampaign) params.set('utm_campaign', data.utmCampaign);
      if (data.utmTerm) params.set('utm_term', data.utmTerm);
      if (data.utmContent) params.set('utm_content', data.utmContent);

      url.search = params.toString();
      setPreviewUrl(url.toString());
    } catch (error) {
      setPreviewUrl(data.originalUrl);
    }
  };

  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handlePresetSelect = (preset) => {
    onChange({
      utmSource: preset.source,
      utmMedium: preset.medium,
      utmCampaign: preset.campaign || data.utmCampaign
    });
  };

  const copyPreviewUrl = () => {
    navigator.clipboard.writeText(previewUrl);
  };

  const utmPresets = [
    { label: 'Facebook Social', source: 'facebook', medium: 'social', campaign: 'social_campaign' },
    { label: 'Google Ads', source: 'google', medium: 'cpc', campaign: 'search_campaign' },
    { label: 'Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'email_campaign' },
    { label: 'Twitter Social', source: 'twitter', medium: 'social', campaign: 'social_campaign' },
    { label: 'LinkedIn Ads', source: 'linkedin', medium: 'cpc', campaign: 'linkedin_campaign' }
  ];

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        initialValues={data}
      >
        {/* UTM Tracking Toggle */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              {translate('UTM Parameter Tracking')}
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="enableUtm"
                label={translate('Enable UTM Parameters')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.enableUtm}
                    onChange={(checked) => handleFieldChange('enableUtm', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('Add tracking parameters to track the effectiveness of your campaigns')}
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>

          {data.enableUtm && (
            <>
              <Divider />
              
              {/* Quick Presets */}
              <div style={{ marginBottom: '24px' }}>
                <Text strong>{translate('Quick Presets')}</Text>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    {utmPresets.map((preset, index) => (
                      <Button
                        key={preset.label || index}
                        size="small"
                        onClick={() => handlePresetSelect(preset)}
                        disabled={disabled}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </Space>
                </div>
              </div>

              {/* Required UTM Parameters */}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="utmSource"
                    label={translate('UTM Source')}
                    rules={[
                      { required: data.enableUtm, message: translate('UTM Source is required') }
                    ]}
                  >
                    <Select
                      placeholder={translate('e.g., google, facebook')}
                      mode="combobox"
                      onChange={(value) => handleFieldChange('utmSource', value)}
                      disabled={disabled}
                    >
                      {urlConfig.utm.sources.map(source => (
                        <Option key={source} value={source}>{source}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="utmMedium"
                    label={translate('UTM Medium')}
                    rules={[
                      { required: data.enableUtm, message: translate('UTM Medium is required') }
                    ]}
                  >
                    <Select
                      placeholder={translate('e.g., cpc, email, social')}
                      mode="combobox"
                      onChange={(value) => handleFieldChange('utmMedium', value)}
                      disabled={disabled}
                    >
                      {urlConfig.utm.mediums.map(medium => (
                        <Option key={medium} value={medium}>{medium}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={8}>
                  <Form.Item
                    name="utmCampaign"
                    label={translate('UTM Campaign')}
                    rules={[
                      { required: data.enableUtm, message: translate('UTM Campaign is required') }
                    ]}
                  >
                    <Input
                      placeholder={translate('e.g., summer_sale, product_launch')}
                      onChange={(e) => handleFieldChange('utmCampaign', e.target.value)}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
              </Row>

              {/* Optional UTM Parameters */}
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="utmTerm"
                    label={translate('UTM Term (Optional)')}
                  >
                    <Input
                      placeholder={translate('e.g., running+shoes')}
                      onChange={(e) => handleFieldChange('utmTerm', e.target.value)}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="utmContent"
                    label={translate('UTM Content (Optional)')}
                  >
                    <Input
                      placeholder={translate('e.g., logolink, textlink')}
                      onChange={(e) => handleFieldChange('utmContent', e.target.value)}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Card>

        {/* URL Preview */}
        {data.enableUtm && previewUrl && (
          <Card 
            title={
              <Space>
                <EyeOutlined />
                {translate('Final URL Preview')}
              </Space>
            }
          >
            <Alert
              message={translate('Final URL with UTM Parameters')}
              description={
                <div>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    marginTop: '8px'
                  }}>
                    {previewUrl}
                  </div>
                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={copyPreviewUrl}
                    >
                      {translate('Copy URL')}
                    </Button>
                  </div>
                </div>
              }
              type="info"
              showIcon
            />
          </Card>
        )}

        {/* UTM Information */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined />
              {translate('About UTM Parameters')}
            </Space>
          }
          style={{ marginTop: '24px' }}
        >
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <p>
              {translate('UTM parameters help you track the effectiveness of your marketing campaigns:')}
            </p>
            <ul style={{ paddingLeft: '20px' }}>
              <li><strong>Source:</strong> {translate('Identifies which site sent the traffic (e.g., google, facebook)')}</li>
              <li><strong>Medium:</strong> {translate('Identifies what type of link was used (e.g., cpc, email, social)')}</li>
              <li><strong>Campaign:</strong> {translate('Identifies a specific product promotion or strategic campaign')}</li>
              <li><strong>Term:</strong> {translate('Identifies search terms (mainly for paid search)')}</li>
              <li><strong>Content:</strong> {translate('Identifies what specifically was clicked (useful for A/B testing)')}</li>
            </ul>
          </div>
        </Card>
      </Form>
    </div>
  );
};

export default UtmBuilder;
