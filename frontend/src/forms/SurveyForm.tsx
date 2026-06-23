import useLanguage from '@/locale/useLanguage';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@/components/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Switch,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Option } = Select;

const questionTypes = [
  { value: 'rating', label: 'Rating (1-5 stars)' },
  { value: 'nps', label: 'NPS (0-10 scale)' },
  { value: 'text', label: 'Text Response' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'scale', label: 'Scale (1-10)' },
  { value: 'boolean', label: 'Yes/No' },
];

const surveyTypes = [
  { value: 'nps', label: 'NPS Survey' },
  { value: 'csat', label: 'Customer Satisfaction' },
  { value: 'feedback', label: 'General Feedback' },
  { value: 'custom', label: 'Custom Survey' },
];

export default function SurveyForm({ current = null, onSubmit, isUpdate = false }) {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (current && isUpdate) {
      form.setFieldsValue({
        title: current.title,
        description: current.description,
        type: current.type,
        status: current.status,
        'settings.allowAnonymous': current.settings?.allowAnonymous,
        'settings.requireEmail': current.settings?.requireEmail,
        'settings.oneResponsePerUser': current.settings?.oneResponsePerUser,
        'settings.showProgressBar': current.settings?.showProgressBar,
        'settings.showQuestionNumbers': current.settings?.showQuestionNumbers,
        'settings.randomizeQuestions': current.settings?.randomizeQuestions,
        'settings.thankYouMessage': current.settings?.thankYouMessage,
        'settings.redirectUrl': current.settings?.redirectUrl,
        'distribution.startDate': current.distribution?.startDate
          ? dayjs(current.distribution.startDate)
          : null,
        'distribution.endDate': current.distribution?.endDate
          ? dayjs(current.distribution.endDate)
          : null,
      });
      setQuestions(current.questions || []);
    } else {
      // Set default values for new survey
      form.setFieldsValue({
        type: 'custom',
        status: 'draft',
        'settings.allowAnonymous': true,
        'settings.showProgressBar': true,
        'settings.showQuestionNumbers': true,
        'settings.thankYouMessage': 'Thank you for your feedback!',
      });
    }
  }, [current, isUpdate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const surveyData = {
        title: values.title,
        description: values.description,
        type: values.type,
        status: values.status || 'draft',
        questions: questions,
        settings: {
          allowAnonymous: values['settings.allowAnonymous'],
          requireEmail: values['settings.requireEmail'],
          oneResponsePerUser: values['settings.oneResponsePerUser'],
          showProgressBar: values['settings.showProgressBar'],
          showQuestionNumbers: values['settings.showQuestionNumbers'],
          randomizeQuestions: values['settings.randomizeQuestions'],
          thankYouMessage: values['settings.thankYouMessage'],
          redirectUrl: values['settings.redirectUrl'],
          customTheme: {
            primaryColor: values['settings.customTheme.primaryColor'],
            backgroundColor: values['settings.customTheme.backgroundColor'],
            textColor: values['settings.customTheme.textColor'],
            buttonColor: values['settings.customTheme.buttonColor'],
          },
        },
        distribution: {
          startDate: values['distribution.startDate']
            ? values['distribution.startDate'].toISOString()
            : null,
          endDate: values['distribution.endDate']
            ? values['distribution.endDate'].toISOString()
            : null,
        },
        tags: values.tags || [],
      };

      if (questions.length === 0) {
        message.error('Please add at least one question');
        return;
      }

      onSubmit(surveyData);
    } catch (error) {
      console.error('Form validation error:', error);
      message.error('Please fill in all required fields');
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      questionId: `q_${Date.now()}`,
      type: 'text',
      question: '',
      required: false,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const moveQuestion = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }

    const updated = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((q, i) => (q.order = i));
    setQuestions(updated);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateQuestionOptions = (index, options) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], options };
    setQuestions(updated);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Card title={translate('Basic Information')} style={{ marginBottom: 24 }}>
        <Form.Item
          name="title"
          label={translate('Survey Title')}
          rules={[{ required: true, message: 'Please enter survey title' }]}
        >
          <Input placeholder="Enter survey title" size="large" />
        </Form.Item>

        <Form.Item name="description" label={translate('Description')}>
          <TextArea rows={3} placeholder="Enter survey description" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="type" label={translate('Survey Type')}>
              <Select size="large">
                {surveyTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label={translate('Status')}>
              <Select size="large">
                <Option value="draft">Draft</Option>
                <Option value="active">Active</Option>
                <Option value="paused">Paused</Option>
                <Option value="closed">Closed</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={translate('Questions')} style={{ marginBottom: 24 }}>
        {questions.map((question, index) => (
          <Card
            key={question.questionId}
            type="inner"
            title={`Question ${index + 1}`}
            extra={
              <Space>
                <Button
                  icon={<ArrowUpOutlined />}
                  size="small"
                  onClick={() => moveQuestion(index, 'up')}
                  disabled={index === 0}
                />
                <Button
                  icon={<ArrowDownOutlined />}
                  size="small"
                  onClick={() => moveQuestion(index, 'down')}
                  disabled={index === questions.length - 1}
                />
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => removeQuestion(index)}
                />
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={16}>
                <Input
                  placeholder="Enter question text"
                  value={question.question}
                  onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  style={{ marginBottom: 12 }}
                />
              </Col>
              <Col span={8}>
                <Select
                  value={question.type}
                  onChange={(value) => updateQuestion(index, 'type', value)}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {questionTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {(question.type === 'multiple_choice' || question.type === 'single_choice') && (
              <div style={{ marginTop: 12 }}>
                <TextArea
                  placeholder="Enter options (one per line)"
                  rows={3}
                  value={question.options?.map((o) => o.label).join('\n') || ''}
                  onChange={(e) => {
                    const options = e.target.value
                      .split('\n')
                      .filter((line) => line.trim())
                      .map((line) => ({
                        label: line.trim(),
                        value: line.trim().toLowerCase().replace(/\s+/g, '_'),
                      }));
                    updateQuestionOptions(index, options);
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Space>
                <span>Required:</span>
                <Switch
                  checked={question.required}
                  onChange={(checked) => updateQuestion(index, 'required', checked)}
                />
              </Space>
            </div>
          </Card>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addQuestion}
          block
          style={{ marginTop: 16 }}
        >
          {translate('Add Question')}
        </Button>
      </Card>

      <Card title={translate('Settings')} style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="settings.allowAnonymous"
              label={translate('Allow Anonymous Responses')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="settings.requireEmail"
              label={translate('Require Email')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="settings.oneResponsePerUser"
              label={translate('One Response Per User')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="settings.showProgressBar"
              label={translate('Show Progress Bar')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="settings.thankYouMessage" label={translate('Thank You Message')}>
          <TextArea rows={2} placeholder="Thank you for your feedback!" />
        </Form.Item>

        <Form.Item name="settings.redirectUrl" label={translate('Redirect URL (Optional)')}>
          <Input placeholder="https://example.com/thank-you" />
        </Form.Item>
      </Card>

      <Card title={translate('Distribution')} style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="distribution.startDate" label={translate('Start Date')}>
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="distribution.endDate" label={translate('End Date')}>
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" size="large">
            {isUpdate ? translate('Update Survey') : translate('Create Survey')}
          </Button>
          <Button size="large" onClick={() => form.resetFields()}>
            {translate('Reset')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
