import { request } from '@/request';
import { BulbOutlined, RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Modal, Spin, Typography } from 'antd';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

const { Text, Title } = Typography;

export default function AISuggestionsModal({ visible, onClose }) {
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  const modules = [
    {
      label: 'CRM (Customers)',
      value: 'crm',
      description: 'Customer relationship and sales pipeline analysis',
    },
    { label: 'Sales', value: 'sales', description: 'Revenue, invoices, and payment trends' },
    { label: 'Marketing', value: 'marketing', description: 'Campaign performance and engagement' },
    {
      label: 'Reputation',
      value: 'reputation',
      description: 'Reviews, ratings, and customer satisfaction',
    },
    { label: 'Tasks', value: 'tasks', description: 'Productivity and task completion' },
  ];

  const handleAnalyze = async () => {
    if (selectedModules.length === 0) {
      setError('Please select at least one module to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInsights(null);

      const response = await request.post('/global-analytics/ai-insights', {
        modules: selectedModules,
        analysisType: 'comprehensive',
      });

      if (response.success) {
        setInsights(response.data);
      } else {
        setError('Failed to generate insights. Please try again.');
      }
    } catch (err) {
      console.error('Error getting AI insights:', err);
      setError('An error occurred while analyzing the data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedModules([]);
    setInsights(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span>AI-Powered Business Insights</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={null}
      style={{ top: 20 }}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      <div style={{ padding: '12px 0' }}>
        {!insights ? (
          <>
            <Alert
              message="Select modules to analyze"
              description="Our AI will analyze non-sensitive data from the selected modules and provide actionable insights, trends, and recommendations to improve your business performance."
              type="info"
              showIcon
              icon={<BulbOutlined />}
              style={{ marginBottom: '24px' }}
            />

            <Title level={5}>Select Modules to Analyze:</Title>
            <div style={{ marginBottom: '24px' }}>
              {modules.map((module) => (
                <Card
                  key={module.value}
                  size="small"
                  style={{ marginBottom: '12px', cursor: 'pointer' }}
                  hoverable
                  onClick={() => {
                    const newSelection = selectedModules.includes(module.value)
                      ? selectedModules.filter((m) => m !== module.value)
                      : [...selectedModules, module.value];
                    setSelectedModules(newSelection);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Checkbox
                      checked={selectedModules.includes(module.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModules([...selectedModules, module.value]);
                        } else {
                          setSelectedModules(selectedModules.filter((m) => m !== module.value));
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div style={{ flex: 1 }}>
                      <Text strong>{module.label}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {module.description}
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleAnalyze}
                loading={loading}
                disabled={selectedModules.length === 0}
              >
                Generate AI Insights
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert
              message={`Analysis completed for: ${insights.analyzedModules
                .join(', ')
                .toUpperCase()}`}
              description={`Generated at ${new Date(
                insights.timestamp
              ).toLocaleString()} | Data points analyzed: ${insights.dataPoints}`}
              type="success"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BulbOutlined style={{ color: '#52c41a' }} />
                  <span>AI Insights & Recommendations</span>
                </div>
              }
              style={{ marginBottom: '24px' }}
            >
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.8',
                  '& h1, & h2, & h3': { marginTop: '16px', marginBottom: '8px' },
                  '& ul, & ol': { paddingLeft: '24px' },
                  '& p': { marginBottom: '12px' },
                }}
              >
                <ReactMarkdown>{insights.insights}</ReactMarkdown>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setInsights(null)}>Analyze Different Modules</Button>
              <Button type="primary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px', color: '#666' }}>
              Analyzing your business data with AI...
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>This may take a few moments</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
