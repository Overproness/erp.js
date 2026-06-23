import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Card,
  Tag,
  Typography,
  Space,
  Spin,
  Alert,
  Tooltip,
  List,
  Switch,
  App,
} from '@/components/ui';
import {
  RobotOutlined,
  CheckOutlined,
  CloseOutlined,
  ExperimentOutlined,
  TagOutlined,
  FileTextOutlined,
  ApiOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectAnalysisState } from '@/redux/erp/selectors';

const { Title, Paragraph, Text } = Typography;

const DocumentAnalyzer = ({
  documentId,
  onApplySuggestions,
  disabled = false,
  autoApply = false,
}) => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const { result, isLoading, isSuccess } = useSelector(selectAnalysisState);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(autoApply);

  // Get the message instance from App context
  const { message: messageApi } = App.useApp();

  // Auto-apply suggestions when analysis completes if autoApplyEnabled is true
  useEffect(() => {
    if (isSuccess && result && autoApplyEnabled && !analyzing) {
      handleApplySuggestions();
    }
  }, [isSuccess, result, autoApplyEnabled, analyzing]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await dispatch(erp.analyzeDocument({ entity: 'document', id: documentId }));

      // Improved response handling
      if (!response || !response.success) {
        const errorMsg = response?.message || 'Failed to analyze document';
        setError(errorMsg);
        messageApi.error(errorMsg);
      } else {
        messageApi.success('Document analyzed successfully');
        // If auto-apply is enabled, suggestions will be applied via the useEffect
      }
    } catch (error) {
      console.error('Error analyzing document:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error.message ||
        'An error occurred while analyzing the document';
      setError(errorMsg);
      messageApi.error(errorMsg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestions = () => {
    if (result) {
      onApplySuggestions({
        documentType: result.documentType,
        tags: result.tags,
        description: result.summary,
      });
      messageApi.success('AI suggestions applied successfully');
    }
  };

  if (analyzing || isLoading) {
    return (
      <Card
        title={
          <>
            <RobotOutlined /> {translate('AI Document Analysis')}
          </>
        }
      >
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Spin size="large" />
          <Text>{translate('Analyzing document content...')}</Text>
        </Space>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title={
          <>
            <RobotOutlined /> {translate('AI Document Analysis')}
          </>
        }
      >
        <Alert
          message={translate('Analysis Failed')}
          description={translate(error)}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleAnalyze}>
              {translate('Try Again')}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <>
          <RobotOutlined /> {translate('AI Document Analysis')}
        </>
      }
      extra={
        <Space>
          {!isLoading && (
            <Tooltip
              title={translate('When enabled, AI suggestions will be automatically applied')}
            >
              <Switch
                checkedChildren={<ThunderboltOutlined />}
                unCheckedChildren={<CloseOutlined />}
                checked={autoApplyEnabled}
                onChange={(checked) => setAutoApplyEnabled(checked)}
                disabled={disabled}
              />
            </Tooltip>
          )}
          {!isSuccess && (
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={handleAnalyze}
              disabled={disabled}
            >
              {autoApplyEnabled ? translate('Analyze & Apply') : translate('Analyze Document')}
            </Button>
          )}
          {isSuccess && !autoApplyEnabled && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApplySuggestions}
              disabled={disabled}
            >
              {translate('Apply Suggestions')}
            </Button>
          )}
        </Space>
      }
    >
      {!isSuccess ? (
        <Paragraph>
          {translate(
            'Use AI to automatically analyze this document and get suggestions for document type, tags, and a summary of the content.'
          )}
          {autoApplyEnabled && (
            <Text type="success" style={{ display: 'block', marginTop: 8 }}>
              <ThunderboltOutlined />{' '}
              {translate('Auto-apply is enabled - suggestions will be applied automatically')}
            </Text>
          )}
        </Paragraph>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            <Text strong>{translate('AI-Suggested Document Classification')}:</Text>
            {result.analysisMethod && (
              <Tag
                color={result.analysisMethod === 'OpenAI' ? 'green' : 'blue'}
                style={{ marginLeft: 8 }}
                icon={result.analysisMethod === 'OpenAI' ? <ApiOutlined /> : <AppstoreOutlined />}
              >
                {result.analysisMethod === 'OpenAI'
                  ? translate('OpenAI Powered')
                  : translate('In-house NLP')}
              </Tag>
            )}
          </Paragraph>

          <List size="small" bordered itemLayout="horizontal">
            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined />}
                title={translate('Document Type')}
                description={<Tag color="blue">{result.documentType}</Tag>}
              />
            </List.Item>

            <List.Item>
              <List.Item.Meta
                avatar={<TagOutlined />}
                title={translate('Suggested Tags')}
                description={
                  <Space wrap>
                    {result.tags.map((tag) => (
                      <Tag key={tag} color="green">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                }
              />
            </List.Item>

            <List.Item>
              <List.Item.Meta
                avatar={<FileTextOutlined />}
                title={translate('Document Summary')}
                description={result.summary}
              />
            </List.Item>
          </List>
        </Space>
      )}
    </Card>
  );
};

export default DocumentAnalyzer;
