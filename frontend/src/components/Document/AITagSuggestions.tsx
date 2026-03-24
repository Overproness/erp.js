import {
  CheckOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  RobotOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { Button, List, message, Modal, Space, Spin, Tag, Tooltip } from 'antd';
import { useState } from 'react';

/**
 * AI Tag Suggestions Component
 * Shows AI-suggested tags for selected documents
 */
export default function AITagSuggestions({ selectedDocuments, onSuccess }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleGetSuggestions = async () => {
    if (!selectedDocuments || selectedDocuments.length === 0) {
      message.warning('Please select at least one document');
      return;
    }

    if (selectedDocuments.length > 50) {
      message.warning('Maximum 50 documents can be processed at once');
      return;
    }

    setLoading(true);
    setVisible(true);

    try {
      const { request } = await import('@/request');
      const response = await request.post({
        entity: 'document/ai/suggest-tags',
        jsonData: {
          documentIds: selectedDocuments,
        },
      });

      if (response.success) {
        setSuggestions(response.result || []);
        message.success(
          `Generated tag suggestions for ${response.result?.length || 0} document(s)`
        );
      } else {
        message.error(response.message || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('Tag suggestion error:', error);
      message.error('Failed to generate tag suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTags = async (documentId, tags, merge = true) => {
    try {
      const { request } = await import('@/request');
      const response = await request.post({
        entity: `document/${documentId}/ai/apply-tags`,
        jsonData: {
          tags: tags,
          merge: merge, // true = add to existing tags, false = replace
        },
      });

      if (response.success) {
        message.success('Tags applied successfully');
        // Update the suggestion list to mark as applied
        setSuggestions((prev) =>
          prev.map((s) => (s.documentId === documentId ? { ...s, applied: true } : s))
        );
        if (onSuccess) onSuccess();
      } else {
        message.error(response.message || 'Failed to apply tags');
      }
    } catch (error) {
      console.error('Apply tags error:', error);
      message.error('Failed to apply tags');
    }
  };

  return (
    <>
      <Tooltip title="Get AI-powered tag suggestions for selected documents">
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={handleGetSuggestions}
          disabled={!selectedDocuments || selectedDocuments.length === 0}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
          }}
        >
          AI Suggestions
          {selectedDocuments && selectedDocuments.length > 0 && ` (${selectedDocuments.length})`}
        </Button>
      </Tooltip>

      <Modal
        title={
          <Space>
            <TagsOutlined style={{ color: '#667eea' }} />
            <span>AI Tag Suggestions</span>
          </Space>
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px', color: '#667eea', fontWeight: 500 }}>
              AI is analyzing your documents...
            </div>
            <div style={{ marginTop: '8px', color: '#9ca3af' }}>This may take a few moments</div>
          </div>
        ) : suggestions.length > 0 ? (
          <List
            dataSource={suggestions}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: item.applied ? '#f0fdf4' : '#f9fafb',
                  border: '1px solid',
                  borderColor: item.applied ? '#86efac' : '#e5e7eb',
                }}
              >
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Current tags:{' '}
                        {item.currentTags?.length > 0 ? (
                          item.currentTags.map((tag) => (
                            <Tag key={tag} color="default" style={{ margin: '2px' }}>
                              {tag}
                            </Tag>
                          ))
                        ) : (
                          <span style={{ color: '#9ca3af' }}>None</span>
                        )}
                      </div>
                    </div>
                    {item.applied && (
                      <Tag color="success" icon={<CheckOutlined />}>
                        Applied
                      </Tag>
                    )}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: '8px',
                      }}
                    >
                      Suggested Tags:
                    </div>
                    <Space wrap>
                      {item.suggestedTags?.map((tag) => (
                        <Tag key={tag} color="purple" style={{ padding: '4px 10px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>

                  {item.reasoning && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        padding: '8px 12px',
                        background: '#ffffff',
                        borderRadius: '6px',
                        marginBottom: '12px',
                      }}
                    >
                      <InfoCircleOutlined style={{ marginRight: '6px', color: '#667eea' }} />
                      {item.reasoning}
                    </div>
                  )}

                  {!item.applied && (
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleApplyTags(item.documentId, item.suggestedTags, true)}
                      >
                        Add to Existing
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleApplyTags(item.documentId, item.suggestedTags, false)}
                      >
                        Replace All Tags
                      </Button>
                    </Space>
                  )}
                </div>
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <TagsOutlined style={{ fontSize: '48px', color: '#d1d5db' }} />
            <div style={{ marginTop: '16px', color: '#6b7280' }}>No suggestions yet</div>
            <div style={{ marginTop: '8px', color: '#9ca3af', fontSize: '14px' }}>
              Select documents and click "AI Suggestions" to get started
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
