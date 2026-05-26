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
  Divider,
  Tag
} from '@/components/ui';
import { 
  BarChartOutlined, 
  InfoCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { Text } = Typography;

const UpdateUtmBuilder = ({ data, onChange, disabled = false, initialValues = {} }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
      generatePreviewUrl();
    }
  }, [data]);

  useEffect(() => {
    // Check if UTM settings have changed
    const utmFields = ['enableUtm', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent'];
    const hasUtmChanges = utmFields.some(field => data[field] !== initialValues[field]);
    setHasChanges(hasUtmChanges);
  }, [data, initialValues]);

  const handleFieldChange = (field, value) => {
    const newData = { ...data, [field]: value };
    
    // Update form field immediately
    form.setFieldValue(field, value);
    
    onChange(newData);
    
    if (field === 'enableUtm' || (field.startsWith('utm') && newData.enableUtm)) {
      setTimeout(() => {
        if (newData.originalUrl && newData.enableUtm) {
          generatePreviewUrlWithData(newData);
        }
      }, 100);
    }
  };

  const generatePreviewUrlWithData = (urlData = data) => {
    if (!urlData.originalUrl) return;

    try {
      const url = new URL(urlData.originalUrl);
      const params = new URLSearchParams(url.search);

      if (urlData.utmSource) params.set('utm_source', urlData.utmSource);
      if (urlData.utmMedium) params.set('utm_medium', urlData.utmMedium);
      if (urlData.utmCampaign) params.set('utm_campaign', urlData.utmCampaign);
      if (urlData.utmTerm) params.set('utm_term', urlData.utmTerm);
      if (urlData.utmContent) params.set('utm_content', urlData.utmContent);

      url.search = params.toString();
      setPreviewUrl(url.toString());
    } catch (error) {
      setPreviewUrl(urlData.originalUrl);
    }
  };

  const generatePreviewUrl = () => generatePreviewUrlWithData(data);

  const handlePresetSelect = (preset) => {
    const updates = {
      utmSource: preset.source,
      utmMedium: preset.medium,
      utmCampaign: preset.campaign || data.utmCampaign
    };
    
    // Update form fields
    form.setFieldsValue(updates);
    
    const newData = { ...data, ...updates };
    onChange(newData);
  };

  const copyPreviewUrl = () => {
    navigator.clipboard.writeText(previewUrl);
  };

  const renderCurrentUtmInfo = () => {
    const hasCurrentUtm = initialValues.utmSource || initialValues.utmMedium || initialValues.utmCampaign;
    
    if (!hasCurrentUtm) return null;

    return (
      <Alert
        message={translate('Current UTM Parameters')}
        description={
          <div>
            <Space wrap>
              {initialValues.utmSource && <Tag>Source: {initialValues.utmSource}</Tag>}
              {initialValues.utmMedium && <Tag>Medium: {initialValues.utmMedium}</Tag>}
              {initialValues.utmCampaign && <Tag>Campaign: {initialValues.utmCampaign}</Tag>}
              {initialValues.utmTerm && <Tag>Term: {initialValues.utmTerm}</Tag>}
              {initialValues.utmContent && <Tag>Content: {initialValues.utmContent}</Tag>}
            </Space>
            {hasChanges && (
              <div style={{ marginTop: '8px' }}>
                <Tag color="orange" icon={<EditOutlined />}>
                  {translate('UTM parameters have been modified')}
                </Tag>
              </div>
            )}
          </div>
        }
        type="info"
        style={{ marginBottom: '16px' }}
      />
    );
  };

  const utmPresets = [
    { label: 'Facebook Social', source: 'facebook', medium: 'social', campaign: 'social_campaign' },
    { label: 'Google Ads', source: 'google', medium: 'cpc', campaign: 'search_campaign' },
    { label: 'Email Newsletter', source: 'newsletter', medium: 'email', campaign: 'email_campaign' },
    { label: 'Twitter Social', source: 'twitter', medium: 'social', campaign: 'social_campaign' },
    { label: 'LinkedIn Ads', source: 'linkedin', medium: 'cpc', campaign: 'linkedin_campaign' }
  ];

  const utmSources = ['google', 'facebook', 'twitter', 'linkedin', 'newsletter', 'website', 'blog', 'youtube', 'instagram'];
  const utmMediums = ['cpc', 'email', 'social', 'organic', 'referral', 'display', 'banner', 'affiliate'];

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        initialValues={data}
      >
        {/* Current UTM Info */}
        {renderCurrentUtmInfo()}

        {/* UTM Tracking Toggle */}
        <Card 
          title={
            <Space>
              <BarChartOutlined />
              {translate('UTM Parameter Tracking')}
              {hasChanges && <Tag color="orange" size="small">{translate('Modified')}</Tag>}
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
                      value={data.utmSource}
                      onChange={(value) => handleFieldChange('utmSource', value)}
                      disabled={disabled}
                    >
                      {utmSources.map(source => (
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
                      value={data.utmMedium}
                      onChange={(value) => handleFieldChange('utmMedium', value)}
                      disabled={disabled}
                    >
                      {utmMediums.map(medium => (
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
                      value={data.utmCampaign}
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
                      value={data.utmTerm}
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
                      value={data.utmContent}
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
                {translate('Updated URL Preview')}
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
      </Form>
    </div>
  );
};

export default UpdateUtmBuilder;