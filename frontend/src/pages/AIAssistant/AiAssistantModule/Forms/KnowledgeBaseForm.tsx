import React from 'react';
import { Form, Input, Select, Upload, Button, Card, Divider, Tag, Space } from '@/components/ui';
import { UploadOutlined, BookOutlined, DeleteOutlined, PlusOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;

export default function KnowledgeBaseForm({ initialValues, isUpdate = false }) {
  const translate = useLanguage();

  const categories = [
    { value: 'documentation', label: translate('Documentation') },
    { value: 'processes', label: translate('Processes') },
    { value: 'policies', label: translate('Policies') },
    { value: 'training', label: translate('Training Materials') },
    { value: 'faq', label: translate('FAQ') },
    { value: 'technical', label: translate('Technical Guides') },
  ];

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt,.md',
    beforeUpload: () => false, // Prevent auto upload
  };

  return (
    <>
      {/* Basic Information */}
      <Card title={<><BookOutlined /> {translate('Knowledge Base Information')}</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="name"
          label={translate('Knowledge Base Name')}
          rules={[{ required: true, message: translate('Please enter knowledge base name') }]}
        >
          <Input placeholder={translate('Enter knowledge base name')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={translate('Description')}
        >
          <TextArea 
            rows={3} 
            placeholder={translate('Describe the purpose and content of this knowledge base')} 
          />
        </Form.Item>

        <Form.Item
          name="domain"
          label={translate('Domain')}
          rules={[{ required: true, message: translate('Please select domain') }]}
        >
          <Select placeholder={translate('Select domain')}>
            <Option value="general">{translate('General')}</Option>
            <Option value="sales">{translate('Sales')}</Option>
            <Option value="support">{translate('Customer Support')}</Option>
            <Option value="hr">{translate('Human Resources')}</Option>
            <Option value="finance">{translate('Finance')}</Option>
            <Option value="operations">{translate('Operations')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="category"
          label={translate('Category')}
        >
          <Select placeholder={translate('Select category')}>
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="tags"
          label={translate('Tags')}
        >
          <Select
            mode="tags"
            placeholder={translate('Add tags to help categorize content')}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Card>

      {/* Content Upload */}
      <Card title={translate('Content Management')} style={{ marginBottom: 16 }}>
        <Form.Item
          name="files"
          label={translate('Upload Documents')}
        >
          <Upload.Dragger {...uploadProps}>
            <p className="upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="upload-text">
              {translate('Click or drag files to this area to upload')}
            </p>
            <p className="upload-hint">
              {translate('Support for PDF, DOC, DOCX, TXT, and MD files')}
            </p>
          </Upload.Dragger>
        </Form.Item>

        <Divider orientation="left">{translate('Manual Entry')}</Divider>

        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card 
                  key={key} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={translate('Knowledge Entry')}
                  extra={
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  }
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'title']}
                    label={translate('Title')}
                    rules={[{ required: true, message: translate('Please enter title') }]}
                  >
                    <Input placeholder={translate('Entry title')} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'content']}
                    label={translate('Content')}
                    rules={[{ required: true, message: translate('Please enter content') }]}
                  >
                    <TextArea rows={4} placeholder={translate('Entry content')} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'tags']}
                    label={translate('Tags')}
                  >
                    <Select mode="tags" placeholder={translate('Add tags')} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'priority']}
                    label={translate('Priority')}
                    initialValue={5}
                  >
                    <Select>
                      <Option value={1}>{translate('Very Low')}</Option>
                      <Option value={3}>{translate('Low')}</Option>
                      <Option value={5}>{translate('Medium')}</Option>
                      <Option value={7}>{translate('High')}</Option>
                      <Option value={10}>{translate('Very High')}</Option>
                    </Select>
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => add()} 
                  block 
                  icon={<PlusOutlined />}
                >
                  {translate('Add Knowledge Entry')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Settings */}
      <Card title={translate('Settings')} style={{ marginBottom: 16 }}>
        <Form.Item
          name="isPublic"
          label={translate('Public Access')}
          valuePropName="checked"
          initialValue={false}
        >
          <input type="checkbox" />
        </Form.Item>

        <Form.Item
          name="autoUpdate"
          label={translate('Auto Update from Sources')}
          valuePropName="checked"
          initialValue={true}
        >
          <input type="checkbox" />
        </Form.Item>

        <Form.Item
          name="searchable"
          label={translate('Searchable')}
          valuePropName="checked"
          initialValue={true}
        >
          <input type="checkbox" />
        </Form.Item>
      </Card>
    </>
  );
}
