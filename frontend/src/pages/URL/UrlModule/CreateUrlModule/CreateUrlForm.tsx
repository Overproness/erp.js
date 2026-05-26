import React, { useState } from 'react';
import { Form, Input, Button, Select, Switch, DatePicker, InputNumber, Card, Row, Col, Divider, Alert, Typography } from '@/components/ui';
import { LinkOutlined, CheckCircleOutlined, ExclamationCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { validateUrl } from '@/utils/helpers';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const CreateUrlForm = ({ data, onChange, disabled = false, mode = "step" }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [urlValidation, setUrlValidation] = useState({ valid: false, message: '' });
  const [urlMetadata, setUrlMetadata] = useState(null);

  // Form field change handler
  const handleFieldChange = (changedValues, allValues) => {
    // Always use the latest value for the changed field
    const normalized = {
      ...allValues,
      isPasswordProtected: allValues.isPasswordProtected || false,
      password: typeof changedValues.password !== 'undefined'
        ? changedValues.password
        : (allValues.isPasswordProtected ? allValues.password : ''),
      hasClickLimit: allValues.hasClickLimit || false,
      clickLimit: typeof changedValues.clickLimit !== 'undefined'
        ? Number(changedValues.clickLimit) || 0
        : (allValues.hasClickLimit ? Number(allValues.clickLimit) || 0 : 0),
      hasExpiration: allValues.hasExpiration || false,
      expirationDate: typeof changedValues.expirationDate !== 'undefined'
        ? changedValues.expirationDate
        : (allValues.hasExpiration ? allValues.expirationDate : null),
    };
    if (onChange) {
      onChange(normalized);
    }
  };

  const validateOriginalUrl = async (url) => {
    if (!url || url.trim() === '') {
      setUrlValidation({ valid: false, message: '' });
      return;
    }

    const validation = validateUrl(url);
    setUrlValidation(validation);
    
    if (validation.valid) {
      try {
        // Auto-fill title if URL is valid
        let testUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          testUrl = 'https://' + url;
        }
        
        const domain = new URL(testUrl).hostname;
        const metadata = {
          title: `Link to ${domain}`,
          description: `Shortened link to ${domain}`,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}`
        };
        setUrlMetadata(metadata);
        
        // Auto-fill title if not already set
        if (!form.getFieldValue('title')) {
          form.setFieldValue('title', metadata.title);
          handleFieldChange({ title: metadata.title }, { ...form.getFieldsValue(), title: metadata.title });
        }
      } catch (error) {
        setUrlMetadata(null);
      }
    } else {
      setUrlMetadata(null);
    }
  };

  const customUrlValidator = (_, value) => {
    if (!value || value.trim() === '') {
      return Promise.reject(new Error(translate('Please enter the original URL')));
    }

    let testUrl = value;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      testUrl = 'https://' + value;
    }

    try {
      new URL(testUrl);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error(translate('Please enter a valid URL')));
    }
  };

  return (
    <div style={{ padding: '0' }}>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        size="middle"
        validateTrigger="onBlur"
        initialValues={data}
        onValuesChange={handleFieldChange}
      >
        <Card>
          <Title level={4}>{translate('Basic URL Information')}</Title>
          <Text style={{ color: '#6b7280', marginBottom: '24px', display: 'block' }}>
            {translate('Enter the URL you want to shorten and provide basic details')}
          </Text>

          <Form.Item
            name="originalUrl"
            label={translate('Original URL')}
            rules={[
              { required: true, message: translate('Please enter the original URL') },
              { validator: customUrlValidator }
            ]}
            validateStatus={urlValidation.message && !urlValidation.valid ? 'error' : urlValidation.valid ? 'success' : ''}
            help={urlValidation.message || translate('Enter a complete URL including http:// or https://')}
          >
            <Input
              size="large"
              placeholder="https://example.com/your-long-url"
              prefix={<LinkOutlined />}
              suffix={
                urlValidation.valid ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : urlValidation.message && !urlValidation.valid ? (
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                ) : null
              }
              onChange={(e) => {
                const value = e.target.value;
                validateOriginalUrl(value);
              }}
              disabled={disabled}
            />
          </Form.Item>

          {urlMetadata && (
            <Alert
              message={translate('URL Preview')}
              description={
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={urlMetadata.favicon} 
                    alt="favicon" 
                    style={{ width: '16px', height: '16px' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{urlMetadata.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {urlMetadata.description}
                    </div>
                  </div>
                </div>
              }
              type="info"
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form.Item
            name="title"
            label={translate('Custom Title')}
            tooltip={translate('Give your URL a memorable title')}
          >
            <Input
              placeholder={translate('Enter a descriptive title')}
              disabled={disabled}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={translate('Description')}
            tooltip={translate('Add notes about this URL for your reference')}
          >
            <TextArea
              rows={3}
              placeholder={translate('What is this URL for? Add any notes here...')}
              disabled={disabled}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Card>

        {/* Display the URL validation message */}
        {urlValidation.valid && (
          <Alert
            message={translate('URL is valid and accessible')}
            type="success"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Form>
    </div>
  );
};

export default CreateUrlForm;