import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Switch, 
  Card, 
  Button, 
  Select, 
  Typography, 
  Collapse,
  Space,
  Divider,
  Alert
} from '@/components/ui';
import { 
  RobotOutlined, 
  MessageOutlined, 
  PlusOutlined, 
  SaveOutlined,
  StarOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const AutoResponseSettings = ({ onSave, initialValues = {}, loading = false }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [autoRespond, setAutoRespond] = useState(initialValues.autoRespond || false);
  
  const handleFinish = (values) => {
    if (onSave) {
      onSave(values);
    }
  };
  
  return (
    <Card 
      title={
        <Space>
          <RobotOutlined />
          {translate('Auto Response Settings')}
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoRespond: false,
          responseDelay: 60,
          responseType: 'template',
          positiveTemplate: 'Thank you for your positive feedback! We appreciate your support.',
          neutralTemplate: 'Thank you for your feedback. We value your input.',
          negativeTemplate: 'We apologize for your experience. Please contact us directly so we can address your concerns.',
          ...initialValues
        }}
        onFinish={handleFinish}
      >
        <Form.Item
          name="autoRespond"
          valuePropName="checked"
          label={translate('Enable Automatic Responses')}
        >
          <Switch 
            onChange={(checked) => setAutoRespond(checked)} 
            checkedChildren={translate('On')} 
            unCheckedChildren={translate('Off')}
          />
        </Form.Item>
        
        {autoRespond && (
          <>
            <Form.Item
              name="responseDelay"
              label={translate('Response Delay (minutes)')}
              tooltip={translate('Set a delay before auto-responding to appear more natural')}
              rules={[{ required: true, message: translate('Please set a delay time') }]}
            >
              <Select>
                <Option value={0}>{translate('Immediate')}</Option>
                <Option value={15}>15 {translate('minutes')}</Option>
                <Option value={30}>30 {translate('minutes')}</Option>
                <Option value={60}>1 {translate('hour')}</Option>
                <Option value={120}>2 {translate('hours')}</Option>
                <Option value={360}>6 {translate('hours')}</Option>
                <Option value={720}>12 {translate('hours')}</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="responseType"
              label={translate('Response Type')}
            >
              <Select>
                <Option value="template">{translate('Use Templates')}</Option>
                <Option value="ai">{translate('AI Generated')} (Beta)</Option>
              </Select>
            </Form.Item>
            
            <Collapse defaultActiveKey={['positive']}>
              <Panel 
                header={
                  <Space>
                    <StarOutlined style={{ color: '#52c41a' }} />
                    {translate('Positive Reviews')} (4-5 {translate('stars')})
                  </Space>
                } 
                key="positive"
              >
                <Form.Item
                  name="positiveTemplate"
                  rules={[{ required: true, message: translate('Please enter a template') }]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder={translate('Enter response template for positive reviews')}
                  />
                </Form.Item>
              </Panel>
              
              <Panel 
                header={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    {translate('Neutral Reviews')} (3 {translate('stars')})
                  </Space>
                } 
                key="neutral"
              >
                <Form.Item
                  name="neutralTemplate"
                  rules={[{ required: true, message: translate('Please enter a template') }]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder={translate('Enter response template for neutral reviews')}
                  />
                </Form.Item>
              </Panel>
              
              <Panel 
                header={
                  <Space>
                    <StarOutlined style={{ color: '#ff4d4f' }} />
                    {translate('Negative Reviews')} (1-2 {translate('stars')})
                  </Space>
                } 
                key="negative"
              >
                <Form.Item
                  name="negativeTemplate"
                  rules={[{ required: true, message: translate('Please enter a template') }]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder={translate('Enter response template for negative reviews')}
                  />
                </Form.Item>
              </Panel>
            </Collapse>
            
            <Alert
              message={translate('Template Variables')}
              description={
                <>
                  <p>{translate('You can use the following variables in your templates:')}</p>
                  <ul>
                    <li><Text code>{{customerName}}</Text> - {translate('Reviewer name')}</li>
                    <li><Text code>{{businessName}}</Text> - {translate('Your business name')}</li>
                    <li><Text code>{{reviewDate}}</Text> - {translate('Date of review')}</li>
                    <li><Text code>{{platform}}</Text> - {translate('Review platform')}</li>
                  </ul>
                </>
              }
              type="info"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          </>
        )}
        
        <Divider />
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />} 
            loading={loading}
          >
            {translate('Save Settings')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AutoResponseSettings;
