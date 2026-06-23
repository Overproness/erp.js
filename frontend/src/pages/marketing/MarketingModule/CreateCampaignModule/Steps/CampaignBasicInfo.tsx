import React from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  Card,
  Row,
  Col,
  Typography,
  InputNumber,
} from '@/components/ui';
import { MailOutlined, MobileOutlined, GlobalOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CampaignBasicInfo = ({ form, formData, onChange }) => {
  const translate = useLanguage();

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{translate('Campaign Details')}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {translate('Enter the basic information for your marketing campaign')}
      </Text>

      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Form.Item
            name="name"
            label={translate('Campaign Name')}
            rules={[
              {
                required: true,
                message: translate('Please enter a campaign name'),
              },
            ]}
          >
            <Input placeholder={translate('Enter campaign name')} maxLength={100} showCount />
          </Form.Item>

          <Form.Item name="description" label={translate('Description')}>
            <TextArea
              placeholder={translate('Briefly describe the campaign objective')}
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="dateRange"
                label={translate('Campaign Duration')}
                rules={[
                  {
                    required: true,
                    message: translate('Please select the campaign duration'),
                  },
                ]}
              >
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={[translate('Start Date'), translate('End Date')]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="budget" label={translate('Budget')}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="type"
            label={translate('Campaign Type')}
            rules={[
              {
                required: true,
                message: translate('Please select a campaign type'),
              },
            ]}
          >
            <Radio.Group>
              <Card style={{ marginBottom: '12px', borderRadius: '8px' }}>
                <Radio value="email" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MailOutlined
                      style={{ fontSize: '18px', marginRight: '8px', color: '#4f46e5' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{translate('Email Campaign')}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {translate('Send emails to your audience')}
                      </div>
                    </div>
                  </div>
                </Radio>
              </Card>

              <Card style={{ marginBottom: '12px', borderRadius: '8px' }}>
                <Radio value="sms" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MobileOutlined
                      style={{ fontSize: '18px', marginRight: '8px', color: '#10b981' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{translate('SMS Campaign')}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {translate('Send SMS to mobile phones')}
                      </div>
                    </div>
                  </div>
                </Radio>
              </Card>

              <Card style={{ marginBottom: '12px', borderRadius: '8px' }}>
                <Radio value="multi" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <GlobalOutlined
                      style={{ fontSize: '18px', marginRight: '8px', color: '#8b5cf6' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500 }}>{translate('Multi-channel')}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {translate('Combine multiple channels')}
                      </div>
                    </div>
                  </div>
                </Radio>
              </Card>
            </Radio.Group>
          </Form.Item>

          <Form.Item name="status" label={translate('Campaign Status')}>
            <Select defaultValue="draft">
              <Option value="draft">{translate('Draft')}</Option>
              <Option value="scheduled">{translate('Scheduled')}</Option>
              <Option value="active">{translate('Active')}</Option>
            </Select>
          </Form.Item>

          <Form.Item name="priority" label={translate('Priority')}>
            <Select defaultValue="medium">
              <Option value="low">{translate('Low')}</Option>
              <Option value="medium">{translate('Medium')}</Option>
              <Option value="high">{translate('High')}</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};

export default CampaignBasicInfo;
