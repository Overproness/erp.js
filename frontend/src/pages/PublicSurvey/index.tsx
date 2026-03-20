import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Progress,
  Radio,
  Rate,
  Slider,
  Space,
  Spin,
  Typography,
} from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// Create a fresh axios instance for public surveys without authentication
// Use relative paths so the proxy handles the routing to the backend
const publicAxios = axios.create({
  baseURL: window.location.origin,
  withCredentials: true,
});

// Explicitly remove any authorization headers
publicAxios.interceptors.request.use((config) => {
  delete config.headers.Authorization;
  config.headers['X-Public-Request'] = 'true';
  return config;
});

export default function PublicSurvey() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadSurvey();
  }, [shortCode]);

  const loadSurvey = async () => {
    try {
      setLoading(true);
      const response = await publicAxios.get(`/api/public/survey/${shortCode}`);
      if (response.data.success) {
        setSurvey(response.data.result);
      } else {
        message.error('Survey not found or no longer active');
      }
    } catch (error) {
      message.error('Failed to load survey');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Convert answers object to array format
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
        skipped: value === null || value === undefined || value === '',
      }));

      const submitData = {
        answers: answersArray,
        respondent: {
          email: form.getFieldValue('email'),
          name: form.getFieldValue('name'),
        },
        metadata: {
          source: 'link',
        },
        timing: {
          startedAt: new Date(),
          completedAt: new Date(),
        },
      };

      const response = await publicAxios.post(`/api/public/survey/${shortCode}/submit`, submitData);

      if (response.data.success) {
        setSubmitted(true);
        message.success('Thank you for your feedback!');

        // Redirect if specified
        if (survey.settings.redirectUrl) {
          setTimeout(() => {
            window.location.href = survey.settings.redirectUrl;
          }, 2000);
        }
      }
    } catch (error) {
      message.error('Failed to submit survey');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const renderQuestion = (question, index) => {
    const value = answers[question.questionId];

    switch (question.type) {
      case 'text':
        return (
          <TextArea
            rows={4}
            placeholder={question.placeholder || 'Enter your response'}
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
          />
        );

      case 'rating':
        return (
          <Rate
            value={value}
            onChange={(val) => handleAnswerChange(question.questionId, val)}
            style={{ fontSize: 32 }}
          />
        );

      case 'nps':
        return (
          <div>
            <Slider
              min={0}
              max={10}
              value={value || 0}
              onChange={(val) => handleAnswerChange(question.questionId, val)}
              marks={{
                0: '0',
                5: '5',
                10: '10',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Text type="secondary">Not likely</Text>
              <Text type="secondary">Extremely likely</Text>
            </div>
          </div>
        );

      case 'scale':
        return (
          <div>
            <Slider
              min={question.min || 1}
              max={question.max || 10}
              value={value || question.min || 1}
              onChange={(val) => handleAnswerChange(question.questionId, val)}
            />
            {question.scaleLabels && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Text type="secondary">{question.scaleLabels.low}</Text>
                <Text type="secondary">{question.scaleLabels.high}</Text>
              </div>
            )}
          </div>
        );

      case 'single_choice':
        return (
          <Radio.Group
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
          >
            <Space direction="vertical">
              {question.options?.map((opt, i) => (
                <Radio key={i} value={opt.value}>
                  {opt.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'multiple_choice':
        return (
          <Checkbox.Group
            value={value || []}
            onChange={(val) => handleAnswerChange(question.questionId, val)}
          >
            <Space direction="vertical">
              {question.options?.map((opt, i) => (
                <Checkbox key={i} value={opt.value}>
                  {opt.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'boolean':
        return (
          <Radio.Group
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
          >
            <Space>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Space>
          </Radio.Group>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card>
          <Title level={3}>Survey Not Found</Title>
          <Text>This survey is not available or has been closed.</Text>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Card style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
          <Title level={2}>✓</Title>
          <Title level={3}>
            {survey.settings.thankYouMessage || 'Thank you for your feedback!'}
          </Title>
          {survey.settings.redirectUrl && <Text type="secondary">Redirecting...</Text>}
        </Card>
      </div>
    );
  }

  const progress = survey.settings.showProgressBar
    ? ((Object.keys(answers).length / survey.questions.length) * 100).toFixed(0)
    : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card>
          <Title level={2}>{survey.title}</Title>
          {survey.description && <Paragraph>{survey.description}</Paragraph>}

          {survey.settings.showProgressBar && (
            <Progress percent={progress} style={{ marginBottom: 24 }} />
          )}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {survey.settings.requireEmail && (
              <>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input placeholder="your@email.com" />
                </Form.Item>
                <Form.Item label="Name (Optional)" name="name">
                  <Input placeholder="Your name" />
                </Form.Item>
              </>
            )}

            {survey.questions.map((question, index) => (
              <Form.Item
                key={question.questionId}
                label={
                  <span>
                    {survey.settings.showQuestionNumbers && <strong>Q{index + 1}. </strong>}
                    {question.question}
                    {question.required && <span style={{ color: 'red' }}> *</span>}
                  </span>
                }
                required={question.required}
                rules={
                  question.required
                    ? [{ required: true, message: 'This question is required' }]
                    : []
                }
              >
                {renderQuestion(question, index)}
              </Form.Item>
            ))}

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
                Submit Survey
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}
