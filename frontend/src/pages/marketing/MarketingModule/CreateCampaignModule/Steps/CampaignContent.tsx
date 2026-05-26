import React, { useState } from 'react';
import {
  Form,
  Input,
  Card,
  Row,
  Col,
  Typography,
  Tabs,
  Radio,
  Select,
  Button,
  Space,
  Upload,
  message,
  Divider,
} from '@/components/ui';
import {
  MailOutlined,
  FileTextOutlined,
  PictureOutlined,
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { RichTextEditor } from '@/components/common/RichTextEditor'; // Assuming you have this component

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

// Mock templates data - replace with actual API data
const MOCK_TEMPLATES = [
  { id: 1, name: 'Welcome Email', type: 'email', thumbnail: 'https://via.placeholder.com/100x120' },
  { id: 2, name: 'Newsletter', type: 'email', thumbnail: 'https://via.placeholder.com/100x120' },
  { id: 3, name: 'Special Offer', type: 'email', thumbnail: 'https://via.placeholder.com/100x120' },
  {
    id: 4,
    name: 'Product Launch',
    type: 'email',
    thumbnail: 'https://via.placeholder.com/100x120',
  },
  { id: 5, name: 'Welcome SMS', type: 'sms', thumbnail: 'https://via.placeholder.com/100x120' },
  { id: 6, name: 'Promotion SMS', type: 'sms', thumbnail: 'https://via.placeholder.com/100x120' },
];

const CampaignContent = ({ form, formData, onChange }) => {
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('email');
  const [contentMode, setContentMode] = useState(formData?.contentMode || 'editor');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Filter templates based on active tab
  const filteredTemplates = MOCK_TEMPLATES.filter((template) => template.type === activeTab);

  const handleContentModeChange = (e) => {
    setContentMode(e.target.value);
    form.setFieldsValue({ contentMode: e.target.value });
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    // In a real app, you would fetch the template content and set it in the form
    const template = MOCK_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      message.success(`${template.name} template selected`);
    }
  };

  // Get content fields based on active tab
  const renderContentFields = () => {
    switch (activeTab) {
      case 'email':
        return (
          <>
            <Form.Item
              name={['content', 'email', 'subject']}
              label={translate('Email Subject')}
              rules={[
                {
                  required: activeTab === 'email',
                  message: translate('Please enter an email subject'),
                },
              ]}
            >
              <Input placeholder={translate('Enter email subject')} maxLength={150} showCount />
            </Form.Item>

            <Form.Item
              name={['content', 'email', 'preheader']}
              label={translate('Preheader')}
              tooltip={translate('Text shown in email clients as preview')}
            >
              <Input
                placeholder={translate('Brief summary of your email')}
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              name={['content', 'email', 'body']}
              label={translate('Email Body')}
              rules={[
                {
                  required: activeTab === 'email',
                  message: translate('Please enter email content'),
                },
              ]}
            >
              {contentMode === 'editor' ? (
                <RichTextEditor
                  initialContent={formData?.content?.email?.body || ''}
                  onChange={(content) => {
                    // Need to manually update form field since RichTextEditor might be custom
                    const values = form.getFieldsValue();
                    form.setFieldsValue({
                      content: {
                        ...values.content,
                        email: {
                          ...values.content?.email,
                          body: content,
                        },
                      },
                    });
                  }}
                />
              ) : (
                <TextArea rows={6} placeholder={translate('Enter or paste HTML code here')} />
              )}
            </Form.Item>
          </>
        );

      case 'sms':
        return (
          <>
            <Form.Item
              name={['content', 'sms', 'message']}
              label={translate('SMS Message')}
              rules={[
                {
                  required: activeTab === 'sms',
                  message: translate('Please enter an SMS message'),
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder={translate('Enter SMS content')}
                maxLength={160}
                showCount
              />
            </Form.Item>

            <Form.Item name={['content', 'sms', 'includeUnsubscribeLink']}>
              <Radio.Group defaultValue={true}>
                <Radio value={true}>{translate('Include opt-out link (Recommended)')}</Radio>
                <Radio value={false}>{translate('No opt-out link')}</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{translate('Campaign Content')}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {translate('Create the content for your marketing campaign')}
      </Text>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabPosition="left"
        style={{ minHeight: '500px' }}
      >
        <TabPane
          tab={
            <span>
              <MailOutlined /> {translate('Email')}
            </span>
          }
          key="email"
        >
          <div style={{ marginBottom: '20px' }}>
            <Text strong style={{ marginBottom: '10px', display: 'block' }}>
              {translate('Content Creation Method')}
            </Text>
            <Radio.Group value={contentMode} onChange={handleContentModeChange}>
              <Radio value="editor">{translate('Visual Editor')}</Radio>
              <Radio value="html">{translate('HTML Code')}</Radio>
              <Radio value="template">{translate('Use Template')}</Radio>
            </Radio.Group>
          </div>

          {contentMode === 'template' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <Text>{translate('Select a template to use')}</Text>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    style={{
                      border:
                        selectedTemplate === template.id
                          ? '2px solid #1890ff'
                          : '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '8px',
                      width: '120px',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        marginBottom: '8px',
                      }}
                    />
                    <div style={{ fontSize: '13px' }}>{template.name}</div>
                  </div>
                ))}
              </div>

              <Button
                type="primary"
                disabled={!selectedTemplate}
                onClick={() => setContentMode('editor')}
              >
                {translate('Customize Template')}
              </Button>
            </div>
          ) : (
            renderContentFields()
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <MobileOutlined /> {translate('SMS')}
            </span>
          }
          key="sms"
        >
          {renderContentFields()}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default CampaignContent;
