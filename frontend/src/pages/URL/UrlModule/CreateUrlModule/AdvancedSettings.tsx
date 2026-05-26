import React from 'react';
import { 
  Form, 
  Switch, 
  Input, 
  InputNumber, 
  DatePicker, 
  Select,
  Row, 
  Col, 
  Card,
  Space,
  Typography,
  Alert
} from '@/components/ui';
import { 
  LockOutlined, 
  ClockCircleOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  InfoCircleOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Password } = Input;
const { Option } = Select;
const { Text } = Typography;

const AdvancedSettings = ({ data, onChange, disabled = false }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();

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

  return (
    <div>
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
                    placeholder={translate('Enter password')}
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
                    {
                      validator: (_, value) => {
                        if (!data.hasClickLimit) return Promise.resolve();
                        if (typeof value !== 'number' || isNaN(value) || value < 1) {
                          return Promise.reject(new Error(translate('Click limit must be at least 1')));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={1000000}
                    placeholder="1000"
                    style={{ width: '100%' }}
                    onChange={(value) => handleFieldChange('clickLimit', value)}
                    disabled={disabled}
                  />
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
              type="warning"
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

export default AdvancedSettings;