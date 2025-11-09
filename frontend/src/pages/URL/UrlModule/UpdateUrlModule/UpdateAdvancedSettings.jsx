import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Switch, 
  Input, 
  InputNumber, 
  DatePicker, 
  Row, 
  Col, 
  Card,
  Space,
  Typography,
  Alert,
  Tag,
  Progress
} from 'antd';
import { 
  LockOutlined, 
  ClockCircleOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  InfoCircleOutlined,
  WarningOutlined,
  EditOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Password } = Input;
const { Text } = Typography;

const UpdateAdvancedSettings = ({ data, onChange, disabled = false, initialValues = {} }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [hasChanges, setHasChanges] = useState(false);
  const [warnings, setWarnings] = useState([]);

  useEffect(() => {
    if (data) {
      // Convert date objects to dayjs for DatePicker
      const formData = { ...data };
      if (formData.expirationDate && !dayjs.isDayjs(formData.expirationDate)) {
        formData.expirationDate = dayjs(formData.expirationDate);
      }
      
      form.setFieldsValue(formData);
      checkForWarnings();
    }
  }, [data, form]);

  useEffect(() => {
    // Check if advanced settings have changed
    const advancedFields = ['isPasswordProtected', 'password', 'hasClickLimit', 'clickLimit', 'hasExpiration', 'expirationDate', 'isActive', 'enableAnalytics'];
    const hasAdvancedChanges = advancedFields.some(field => {
      if (field === 'expirationDate') {
        return dayjs(data[field]).valueOf() !== dayjs(initialValues[field]).valueOf();
      }
      return data[field] !== initialValues[field];
    });
    setHasChanges(hasAdvancedChanges);
  }, [data, initialValues]);

  const checkForWarnings = () => {
    const newWarnings = [];
    
    // Check for potential issues
    if (data.isPasswordProtected && !data.password) {
      newWarnings.push(translate('Password protection is enabled but no password is set'));
    }
    
    if (data.hasExpiration && data.expirationDate && 
        dayjs(data.expirationDate).isBefore(dayjs().add(1, 'day'))) {
      newWarnings.push(translate('URL will expire within 24 hours'));
    }
    
    if (data.hasClickLimit && data.clickLimit && 
        (initialValues.clickCount || 0) >= data.clickLimit * 0.9) {
      newWarnings.push(translate('URL is approaching its click limit'));
    }

    if (!data.isActive) {
      newWarnings.push(translate('URL is currently inactive and not accessible'));
    }

    setWarnings(newWarnings);
  };

  useEffect(() => {
    checkForWarnings();
  }, [data]);

  const handleFieldChange = (field, value) => {
    // Always send all relevant fields, using the latest value for the changed field
    const updated = {
      ...data,
      [field]: value,
      isPasswordProtected: field === 'isPasswordProtected' ? value : data.isPasswordProtected || false,
      password:
        field === 'password'
          ? value
          : field === 'isPasswordProtected'
            ? (value ? data.password : '')
            : (data.isPasswordProtected ? data.password : ''),
      hasClickLimit: field === 'hasClickLimit' ? value : data.hasClickLimit || false,
      clickLimit:
        field === 'clickLimit'
          ? value
          : field === 'hasClickLimit'
            ? (value ? data.clickLimit : 0)
            : (data.hasClickLimit ? data.clickLimit : 0),
      hasExpiration: field === 'hasExpiration' ? value : data.hasExpiration || false,
      expirationDate:
        field === 'expirationDate'
          ? value
          : field === 'hasExpiration'
            ? (value ? data.expirationDate : null)
            : (data.hasExpiration ? data.expirationDate : null),
    };
    onChange(updated);
  };

  const renderCurrentSettings = () => {
    return (
      <Alert
        message={translate('Current Security Settings')}
        description={
          <div>
            <Space wrap style={{ marginBottom: '8px' }}>
              {initialValues.isPasswordProtected && <Tag color="red">{translate('Password Protected')}</Tag>}
              {initialValues.hasClickLimit && (
                <Tag color="orange">
                  {translate('Click Limit')}: {initialValues.clickLimit}
                  {initialValues.clickCount && (
                    <span> ({initialValues.clickCount}/{initialValues.clickLimit})</span>
                  )}
                </Tag>
              )}
              {initialValues.hasExpiration && (
                <Tag color="gold">
                  {translate('Expires')}: {dayjs(initialValues.expirationDate).format('YYYY-MM-DD HH:mm')}
                </Tag>
              )}
              {!initialValues.isActive && <Tag color="default">{translate('Inactive')}</Tag>}
            </Space>
            {hasChanges && (
              <div>
                <Tag color="orange" icon={<EditOutlined />}>
                  {translate('Security settings have been modified')}
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

  const renderClickLimitProgress = () => {
    if (!data.hasClickLimit || !data.clickLimit) return null;

    const clickCount = initialValues.clickCount || 0;
    const percentage = (clickCount / data.clickLimit) * 100;
    
    return (
      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {translate('Current usage')}: {clickCount} / {data.clickLimit} {translate('clicks')}
        </Text>
        <Progress
          percent={percentage}
          size="small"
          status={percentage >= 90 ? 'exception' : percentage >= 70 ? 'active' : 'normal'}
          style={{ marginTop: '4px' }}
        />
      </div>
    );
  };

  return (
    <div>
      {/* Current Settings Summary */}
      {renderCurrentSettings()}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert
          message={translate('Configuration Warnings')}
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={data}
      >
        {/* Security Settings */}
        <Card 
          title={
            <Space>
              <LockOutlined />
              {translate('Security & Access Control')}
              {hasChanges && <Tag color="orange" size="small">{translate('Modified')}</Tag>}
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isPasswordProtected"
                label={translate('Password Protection')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.isPasswordProtected}
                    onChange={(checked) => handleFieldChange('isPasswordProtected', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('Require a password to access this URL')}
                  </div>
                  {initialValues.isPasswordProtected && !data.isPasswordProtected && (
                    <Text type="warning" style={{ fontSize: '11px' }}>
                      {translate('Removing password protection will make URL publicly accessible')}
                    </Text>
                  )}
                </div>
              </Form.Item>
              
              {data.isPasswordProtected && (
                <Form.Item
                  name="password"
                  label={translate('Password')}
                  rules={[
                    { required: data.isPasswordProtected, message: translate('Password is required') },
                    { min: 6, message: translate('Password must be at least 6 characters') }
                  ]}
                >
                  <Password
                    placeholder={initialValues.isPasswordProtected ? translate('Enter new password (leave empty to keep current)') : translate('Enter password')}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    onChange={(e) => handleFieldChange('password', e.target.value)}
                    disabled={disabled}
                  />
                </Form.Item>
              )}
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="hasClickLimit"
                label={translate('Click Limit')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.hasClickLimit}
                    onChange={(checked) => handleFieldChange('hasClickLimit', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('Limit the number of times this URL can be accessed')}
                  </div>
                </div>
              </Form.Item>
              
              {data.hasClickLimit && (
                <Form.Item
                  name="clickLimit"
                  label={translate('Maximum Clicks')}
                  rules={[
                    { required: data.hasClickLimit, message: translate('Click limit is required') },
                    { min: 1, message: translate('Click limit must be at least 1') }
                  ]}
                >
                  <InputNumber
                    min={Math.max(1, initialValues.clickCount || 0)}
                    max={1000000}
                    placeholder="1000"
                    style={{ width: '100%' }}
                    onChange={(value) => handleFieldChange('clickLimit', value)}
                    disabled={disabled}
                  />
                  {renderClickLimitProgress()}
                </Form.Item>
              )}
            </Col>
          </Row>
        </Card>

        {/* Expiration Settings */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined />
              {translate('Expiration Settings')}
            </Space>
          }
          style={{ marginBottom: '24px' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="hasExpiration"
                label={translate('Set Expiration Date')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.hasExpiration}
                    onChange={(checked) => handleFieldChange('hasExpiration', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('Set when this URL should expire and become inactive')}
                  </div>
                </div>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              {data.hasExpiration && (
                <Form.Item
                  name="expirationDate"
                  label={translate('Expiration Date & Time')}
                  rules={[
                    { required: data.hasExpiration, message: translate('Expiration date is required') }
                  ]}
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder={translate('Select expiration date and time')}
                    style={{ width: '100%' }}
                    disabledDate={(current) => current && current.valueOf() < Date.now()}
                    value={data.expirationDate ? dayjs(data.expirationDate) : null}
                    onChange={(date) => handleFieldChange('expirationDate', date)}
                    disabled={disabled}
                  />
                </Form.Item>
              )}
            </Col>
          </Row>
          
          {data.hasExpiration && data.expirationDate && (
            <Alert
              message={translate('Expiration Notice')}
              description={`${translate('This URL will expire on')} ${dayjs(data.expirationDate).format('YYYY-MM-DD HH:mm:ss')}`}
              type={dayjs(data.expirationDate).isBefore(dayjs().add(1, 'day')) ? 'warning' : 'info'}
              showIcon
            />
          )}
        </Card>

        {/* Additional Settings */}
        <Card 
          title={
            <Space>
              <InfoCircleOutlined />
              {translate('Additional Settings')}
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isActive"
                label={translate('Active Status')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.isActive}
                    onChange={(checked) => handleFieldChange('isActive', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('URL is active and accessible')}
                  </div>
                  {!data.isActive && (
                    <Text type="warning" style={{ fontSize: '11px' }}>
                      {translate('Inactive URLs will return a 404 error')}
                    </Text>
                  )}
                </div>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="enableAnalytics"
                label={translate('Enable Analytics')}
                valuePropName="checked"
              >
                <div>
                  <Switch
                    checked={data.enableAnalytics}
                    onChange={(checked) => handleFieldChange('enableAnalytics', checked)}
                    disabled={disabled}
                  />
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    {translate('Track clicks and gather analytics data')}
                  </div>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default UpdateAdvancedSettings;