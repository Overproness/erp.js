import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Button, Space, List, Card, Tag, Typography, Spin } from '@/components/ui';
import {
  RobotOutlined,
  ExperimentOutlined,
  TagsOutlined,
  FileTextOutlined,
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import { useDispatch, useSelector } from 'react-redux';
import { erp } from '@/redux/erp/actions';

const { Text, Paragraph } = Typography;

/**
 * AI-powered document management modal
 * Allows users to batch analyze documents and manage document metadata
 */
const AiDocumentManagerModal = ({ visible, onCancel }) => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  // Load documents when modal opens
  useEffect(() => {
    if (visible) {
      loadDocuments();
    }
  }, [visible]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await dispatch(
        erp.list({
          entity: 'document',
          options: {
            page: 1,
            limit: 50,
            sort: 'created',
            order: -1, // newest first
          },
        })
      );

      if (response?.result?.items) {
        setDocuments(response.result.items);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tabs configuration using the new items API
  const items = [
    {
      key: '1',
      label: (
        <span>
          <RobotOutlined /> {translate('AI Document Assistant')}
        </span>
      ),
      children: (
        <>
          <Paragraph>
            {translate(
              'Use AI to help organize and classify your documents. The AI can automatically detect document types, extract relevant tags, and generate summaries.'
            )}
          </Paragraph>

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title={translate('Analyze Documents')}>
              <Paragraph>
                {translate(
                  'Select documents to analyze with our AI system. The AI will suggest document types, tags, and create summaries based on document content.'
                )}
              </Paragraph>
              <Button type="primary" icon={<ExperimentOutlined />}>
                {translate('Start Batch Analysis')}
              </Button>
            </Card>

            <Card title={translate('Document Organization')}>
              <Paragraph>
                {translate(
                  'Automatically organize documents by type and content. The AI can help categorize and tag your documents for better searchability.'
                )}
              </Paragraph>
              <Button type="default" icon={<TagsOutlined />}>
                {translate('Auto-Organize Documents')}
              </Button>
            </Card>
          </Space>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <span>
          <FileTextOutlined /> {translate('Analyzable Documents')}
        </span>
      ),
      children: (
        <>
          <Paragraph>
            {translate(
              'These documents can be processed by our AI system. Select documents to analyze individually or in batches.'
            )}
          </Paragraph>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <List
              dataSource={documents}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="analyze" type="primary" size="small" icon={<RobotOutlined />}>
                      {translate('Analyze')}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space direction="vertical">
                        <Text type="secondary">
                          {item.documentType || translate('Unclassified')}
                        </Text>
                        <Space>
                          {item.tags && item.tags.length > 0 ? (
                            item.tags.slice(0, 3).map((tag) => (
                              <Tag key={tag} color="blue">
                                {tag}
                              </Tag>
                            ))
                          ) : (
                            <Text type="secondary">{translate('No tags')}</Text>
                          )}
                          {item.tags && item.tags.length > 3 && (
                            <Tag color="purple">+{item.tags.length - 3}</Tag>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              pagination={{
                pageSize: 5,
                size: 'small',
              }}
            />
          )}
        </>
      ),
    },
  ];

  return (
    <Modal
      title={
        <>
          <RobotOutlined /> {translate('AI-Assisted Document Management')}
        </>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {translate('Close')}
        </Button>,
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </Modal>
  );
};

export default AiDocumentManagerModal;
