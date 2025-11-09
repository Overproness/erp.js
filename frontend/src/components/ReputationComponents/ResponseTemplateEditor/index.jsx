import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Space, 
  Select, 
  Switch, 
  Tooltip, 
  Divider,
  Alert
} from 'antd';
import { 
  SaveOutlined, 
  FileTextOutlined, 
  CodeOutlined, 
  EyeOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;

/**
 * A component for creating and editing response templates
 * with variable support and live preview
 */
const ResponseTemplateEditor = ({
  template,
  onSave,
  availableVariables = [],
  loading = false,
  disablePreview = false
}) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [showVariables, setShowVariables] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  
  // Initialize form with template values
  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        name: template.name,
        content: template.content,
        category: template.category || 'general',
        sentiment: template.sentiment || 'all',
        isActive: template.isActive !== undefined ? template.isActive : true
      });
    }
  }, [template, form]);
  
  // Handle form submission
  const handleSubmit = async (values) => {
    if (onSave) {
      onSave({
        id: template?.id,
        ...values
      });
    }
  };
  
  // Handle template preview
  // const handlePreview = async () => {
  //   try {
  //     setPreviewLoading(true);
  //     setPreviewError(null);
      
  //     const content = form.getFieldValue('content');
  //     if (!content) {
  //       setPreviewContent(translate('No content to preview'));
  //       return;
  //     }
      
  //     // Generate sample values for each variable
  //     const sampleData = availableVariables.reduce((acc, variable) => {
  //       // Remove {{ and }} from variable name
  //       const cleanVar = variable.replace(/{{|}}/g, '').trim();
        
  //       // Generate sample value based on variable name
  //       if (cleanVar.includes('name')) acc[cleanVar] = 'John Doe';
  //       else if (cleanVar.includes('rating')) acc[cleanVar] = '4.5';
  //       else if (cleanVar.includes('date')) acc[cleanVar] = new Date().toLocaleDateString();
  //       else if (cleanVar.includes('company')) acc[cleanVar] = 'Acme Inc.';
  //       else acc[cleanVar] = `Sample ${cleanVar}`;
        
  //       return acc;
  //     }, {});
      
  //     const result = await previewTemplate(content, sampleData);
      
  //     if (result.success) {
  //       setPreviewContent(result.data);
  //     } else {
  //       setPreviewError(result.error || translate('Failed to generate preview'));
  //     }
  //   } catch (error) {
  //     console.error('Template preview error:', error);
  //     setPreviewError(translate('An error occurred during preview generation'));
  //   } finally {
  //     setPreviewLoading(false);
  //   }
  // };
  
  // Insert a variable at the cursor position
  const insertVariable = (variable) => {
    // Get the current cursor position
    const textArea = document.querySelector('textarea[name="content"]');
    if (!textArea) return;
    
    const cursorPos = textArea.selectionStart;
    const content = form.getFieldValue('content') || '';
    
    // Insert the variable at cursor position
    const newContent = content.substring(0, cursorPos) + variable + content.substring(cursorPos);
    form.setFieldValue('content', newContent);
    
    // Focus back on the textarea and set cursor position after the inserted variable
    setTimeout(() => {
      textArea.focus();
      textArea.setSelectionRange(cursorPos + variable.length, cursorPos + variable.length);
    }, 0);
  };
  
  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: '',
          content: '',
          category: 'general',
          sentiment: 'all',
          isActive: true
        }}
      >
        <Form.Item
          name="name"
          label={translate('Template Name')}
          rules={[
            { required: true, message: translate('Please enter a template name') }
          ]}
        >
          <Input
            prefix={<FileTextOutlined />}
            placeholder={translate('Enter template name')}
          />
        </Form.Item>
        
        <Form.Item
          label={
            <Space>
              {translate('Template Content')}
              <Tooltip title={translate('You can use variables in your template')}>
                <Button
                  type="text"
                  icon={<CodeOutlined />}
                  onClick={() => setShowVariables(!showVariables)}
                  size="small"
                >
                  {showVariables ? translate('Hide Variables') : translate('Show Variables')}
                </Button>
              </Tooltip>
            </Space>
          }
        >
          {showVariables && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>{translate('Available Variables')}:</strong>
              </div>
              <Space wrap>
                {availableVariables.map((variable, index) => (
                  <Button
                    key={index}
                    size="small"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Button>
                ))}
              </Space>
            </Card>
          )}
          
          <Form.Item
            name="content"
            noStyle
            rules={[
              { required: true, message: translate('Please enter template content') },
              { min: 10, message: translate('Content must be at least 10 characters') }
            ]}
          >
            <TextArea
              rows={6}
              placeholder={translate('Enter your response template here...')}
            />
          </Form.Item>
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="category"
              label={translate('Category')}
              rules={[
                { required: true, message: translate('Please select a category') }
              ]}
            >
              <Select placeholder={translate('Select category')}>
                <Option value="general">{translate('General')}</Option>
                <Option value="positive">{translate('Positive Reviews')}</Option>
                <Option value="negative">{translate('Negative Reviews')}</Option>
                <Option value="neutral">{translate('Neutral Reviews')}</Option>
                <Option value="thanks">{translate('Thank You')}</Option>
                <Option value="apology">{translate('Apology')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="sentiment"
              label={translate('Review Sentiment')}
              rules={[
                { required: true, message: translate('Please select applicable sentiment') }
              ]}
            >
              <Select placeholder={translate('Select applicable sentiment')}>
                <Option value="all">{translate('All Reviews')}</Option>
                <Option value="positive">{translate('Positive Only')}</Option>
                <Option value="negative">{translate('Negative Only')}</Option>
                <Option value="neutral">{translate('Neutral Only')}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="isActive"
              label={translate('Status')}
              valuePropName="checked"
              tooltip={translate('Active templates are available for use')}
            >
              <Switch
                checkedChildren={translate('Active')}
                unCheckedChildren={translate('Inactive')}
              />
            </Form.Item>
          </Col>
        </Row>
        
        {/* {!disablePreview && (
          <>
            <Divider>{translate('Preview')}</Divider>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={handlePreview}
                loading={previewLoading}
              >
                {translate('Generate Preview')}
              </Button>
            </div>
            
            {previewError ? (
              <Alert
                message={translate('Preview Error')}
                description={previewError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            ) : previewContent ? (
              <Card size="small" style={{ marginBottom: 16 }}>
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              </Card>
            ) : null}
          </>
        )} */}
        
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
          >
            {template?.id ? translate('Update Template') : translate('Save Template')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

ResponseTemplateEditor.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    content: PropTypes.string,
    category: PropTypes.string,
    sentiment: PropTypes.string,
    isActive: PropTypes.bool
  }),
  onSave: PropTypes.func.isRequired,
  availableVariables: PropTypes.array,
  loading: PropTypes.bool,
  disablePreview: PropTypes.bool
};

export default ResponseTemplateEditor;
