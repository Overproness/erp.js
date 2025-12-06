import { Button, Modal, message, Spin, Typography, Divider, Space, Tag } from 'antd';
import {
  FileTextOutlined,
  RobotOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title, Paragraph, Text } = Typography;

/**
 * Document Summarization Component
 * Shows AI-generated summary for a document
 */
export default function DocumentSummarizer({ document, onClose }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleSummarize = async (forceRegenerate = false) => {
    if (!document || !document._id) {
      message.warning('No document selected');
      return;
    }

    setVisible(true);

    // Check if document already has a stored summary and we're not forcing regeneration
    if (!forceRegenerate && document.aiSummary) {
      setSummary({
        documentId: document._id,
        title: document.title,
        summary: document.aiSummary,
        analyzedAt: document.aiAnalyzedAt,
        extractionStatus: document.textExtractionStatus,
        hasExtractedText: !!document.extractedText,
        textLength: document.extractedText?.length || 0,
        fromCache: true,
      });
      return;
    }

    // Generate new summary
    setLoading(true);
    setSummary(null);

    try {
      const token = localStorage.getItem('token') || window.localStorage.getItem('token');
      const url = forceRegenerate
        ? `${API_BASE_URL}document/${document._id}/ai/summarize?force=true`
        : `${API_BASE_URL}document/${document._id}/ai/summarize`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSummary({
          ...response.data.result,
          fromCache: false,
        });
        message.success(
          forceRegenerate ? 'Summary regenerated successfully' : 'Summary generated successfully'
        );
      } else {
        message.error(response.data.message || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to generate summary';
      message.error(errorMessage);

      // Close modal on error
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleSummarize(true);
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <>
      <Button
        type="primary"
        icon={<RobotOutlined />}
        onClick={handleSummarize}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
        }}
      >
        Summarize
      </Button>

      <Modal
        title={
          <Space>
            <FileTextOutlined style={{ color: '#667eea' }} />
            <span>AI Document Summary</span>
            {summary?.fromCache && (
              <Tag color="green" style={{ marginLeft: '8px' }}>
                Cached
              </Tag>
            )}
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
          summary && (
            <Button key="regenerate" type="primary" onClick={handleRegenerate} loading={loading}>
              Regenerate
            </Button>
          ),
        ]}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px', color: '#667eea', fontWeight: 500 }}>
              AI is analyzing your document...
            </div>
            <div style={{ marginTop: '8px', color: '#9ca3af' }}>This may take a few moments</div>
          </div>
        ) : summary ? (
          <div>
            {/* Document Info */}
            <div
              style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
              }}
            >
              <Title level={5} style={{ margin: '0 0 12px 0' }}>
                {summary.title}
              </Title>
              <Space direction="vertical" size={4}>
                <Text type="secondary">
                  <InfoCircleOutlined style={{ marginRight: '6px' }} />
                  Extraction Status: {summary.extractionStatus || 'Unknown'}
                </Text>
                {summary.hasExtractedText && (
                  <Text type="secondary">
                    <CheckCircleOutlined style={{ marginRight: '6px', color: '#10b981' }} />
                    Text Extracted ({summary.textLength?.toLocaleString() || 0} characters)
                  </Text>
                )}
              </Space>
            </div>

            <Divider orientation="left">Summary</Divider>

            {/* Summary Content */}
            <div
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                lineHeight: '1.8',
              }}
            >
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {summary.summary}
              </Paragraph>
            </div>

            {/* Metadata */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Analyzed on {new Date(summary.analyzedAt).toLocaleString()}
              </Text>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#d1d5db' }} />
            <div style={{ marginTop: '16px', color: '#6b7280' }}>No summary yet</div>
          </div>
        )}
      </Modal>
    </>
  );
}
