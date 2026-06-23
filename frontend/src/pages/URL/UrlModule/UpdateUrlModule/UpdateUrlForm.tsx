// This file is no longer needed - using CreateUrlModule components instead
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Row, Col, Alert, Typography, Space, Tag, Tooltip } from '@/components/ui';
import { LinkOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined, HistoryOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import { validateUrl } from '@/utils/helpers';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

const UpdateUrlForm = ({ data, onChange, disabled = false, initialValues = {} }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [urlValidation, setUrlValidation] = useState({ valid: true, message: '' });
  const [urlMetadata, setUrlMetadata] = useState(null);
  const [changedFields, setChangedFields] = useState({});

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
      if (data.originalUrl) {
        validateOriginalUrl(data.originalUrl);
      }
    }
  }, [data, form]);

  // Form field change handler
  const handleFieldChange = (changedValues, allValues) => {
    // Track changed fields
    const newChangedFields = { ...changedFields };
    Object.keys(changedValues).forEach(key => {
      if (allValues[key] !== initialValues[key]) {
        newChangedFields[key] = {
          old: initialValues[key],
          new: allValues[key]
        };
      } else {
        delete newChangedFields[key];
      }
    });
    setChangedFields(newChangedFields);

    // Always use the latest value for the changed field
    const normalized = {
      ...allValues,
      isPasswordProtected: allValues.isPasswordProtected || false,
      password: typeof changedValues.password !== 'undefined'
        ? changedValues.password
        : (allValues.isPasswordProtected ? allValues.password : ''),
      hasClickLimit: allValues.hasClickLimit || false,
      clickLimit: typeof changedValues.clickLimit !== 'undefined'
        ? changedValues.clickLimit
        : (allValues.hasClickLimit ? allValues.clickLimit : 0),
      hasExpiration: allValues.hasExpiration || false,
      expirationDate: typeof changedValues.expirationDate !== 'undefined'
        ? changedValues.expirationDate
        : (allValues.hasExpiration ? allValues.expirationDate : null),
    };

    if (onChange) {
      onChange(normalized); // Pass complete normalized form data
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
        let testUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          testUrl = 'https://' + url;
        }
        
        const domain = new URL(testUrl).hostname;
        const metadata = {
          title: `Link to ${domain}`,
          description: `Updated link to ${domain}`,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}`
        };
        setUrlMetadata(metadata);
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

  const renderChangeSummary = () => {
    if (Object.keys(changedFields).length === 0) return null;

    return (
      <Alert
        message={translate('Pending Changes')}
        description={
          <div>
            <Text>{translate('The following fields have been modified:')}</Text>
            <div style={{ marginTop: '8px' }}>
              {Object.entries(changedFields).map(([fieldName, change]) => (
                <div key={fieldName} style={{ marginBottom: '4px' }}>
                  <Text strong>{translate(fieldName)}:</Text>
                  <div style={{ marginLeft: '16px', fontSize: '12px' }}>
                    <Text delete type="secondary">{String(change.old || translate('Empty'))}</Text>
                    <br />
                    <Text type="success">{String(change.new || translate('Empty'))}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
        type="info"
        showIcon
        icon={<HistoryOutlined />}
        style={{ marginBottom: '24px' }}
        action={
          <Button
            size="small"
            type="text"
            onClick={() => {
              form.setFieldsValue(initialValues);
              setChangedFields({});
              if (onChange) onChange(initialValues);
            }}
          >
            {translate('Reset Changes')}
          </Button>
        }
      />
    );
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Current URL Info */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size="small">
              <div>
                <Text strong>{translate('Current Short URL:')}</Text>
                <Text code copyable style={{ marginLeft: '8px' }}>
                  {initialValues.shortUrl}
                </Text>
              </div>
              <div>
                <Text type="secondary">{translate('Created:')}</Text>
                <Text style={{ marginLeft: '8px' }}>
                  {dayjs(initialValues.createdAt).format('YYYY-MM-DD HH:mm')}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" size="small" style={{ textAlign: 'right' }}>
              <div>
                <Text type="secondary">{translate('Total Clicks:')}</Text>
                <Text strong style={{ marginLeft: '8px' }}>
                  {initialValues.clickCount || 0}
                </Text>
              </div>
              <div>
                <Text type="secondary">{translate('Status:')}</Text>
                <Tag 
                  color={initialValues.isActive ? 'success' : 'default'}
                  style={{ marginLeft: '8px' }}
                >
                  {translate(initialValues.isActive ? 'Active' : 'Inactive')}
                </Tag>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Changes Summary */}
      {renderChangeSummary()}

      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        size="middle"
        validateTrigger="onBlur"
        initialValues={data}
        onValuesChange={handleFieldChange}
        disabled={disabled}
      >
        <Card>
          <Title level={4}>{translate('Basic URL Information')}</Title>
          <Text style={{ color: '#6b7280', marginBottom: '24px', display: 'block' }}>
            {translate('Update the URL information and settings')}
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
      </Form>
    </div>
  );
};

export default UpdateUrlForm;