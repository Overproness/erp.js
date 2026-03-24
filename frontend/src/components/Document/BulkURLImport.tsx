import { API_BASE_URL } from '@/config/serverApiConfig';
import { CheckCircleOutlined, DeleteOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, List, message, Modal, Progress, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * Bulk URL Import Component
 * Allows importing documents from multiple URLs
 */
export default function BulkURLImport({ onSuccess }) {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [urls, setUrls] = useState(['']);

  const handleAddUrl = () => {
    setUrls([...urls, '']);
  };

  const handleRemoveUrl = (index) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length > 0 ? newUrls : ['']);
  };

  const handleUrlChange = (index, value) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleImport = async () => {
    const validUrls = urls.filter((url) => url.trim() && url.startsWith('http'));

    if (validUrls.length === 0) {
      message.warning('Please enter at least one valid URL');
      return;
    }

    if (validUrls.length > 20) {
      message.warning('Maximum 20 URLs can be imported at once');
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token') || window.localStorage.getItem('token');
      const values = await form.validateFields();

      const axios = (await import('axios')).default;
      const response = await axios.post(
        `${API_BASE_URL}document/bulk-import-urls`,
        {
          urls: validUrls,
          defaultDocumentType: values.documentType || 'Imported',
          defaultTags: values.tags ? values.tags.split(',').map((t) => t.trim()) : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setResults(response.data.result);
        message.success(response.data.message);
        if (onSuccess) onSuccess();
      } else {
        message.error(response.data.message || 'Import failed');
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      message.error(error.response?.data?.message || 'Failed to import documents');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setUrls(['']);
    setResults(null);
    form.resetFields();
  };

  const handleClose = () => {
    setVisible(false);
    handleReset();
  };

  return (
    <>
      <Button icon={<LinkOutlined />} onClick={() => setVisible(true)}>
        Bulk Import from URLs
      </Button>

      <Modal
        title={
          <Space>
            <LinkOutlined style={{ color: '#667eea' }} />
            <span>Bulk Import from URLs</span>
          </Space>
        }
        open={visible}
        onCancel={handleClose}
        footer={[
          <Button key="reset" onClick={handleReset} disabled={importing}>
            Reset
          </Button>,
          <Button key="close" onClick={handleClose} disabled={importing}>
            Close
          </Button>,
          <Button
            key="import"
            type="primary"
            onClick={handleImport}
            loading={importing}
            icon={<PlusOutlined />}
          >
            Import{' '}
            {urls.filter((u) => u.trim()).length > 0 && `(${urls.filter((u) => u.trim()).length})`}
          </Button>,
        ]}
        width={800}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {!results ? (
          <div>
            <Form form={form} layout="vertical">
              <Form.Item label="Default Document Type" name="documentType" initialValue="Imported">
                <Input placeholder="e.g., Contract, Invoice, Report" />
              </Form.Item>

              <Form.Item
                label="Default Tags (comma-separated)"
                name="tags"
                tooltip="These tags will be applied to all imported documents"
              >
                <Input placeholder="e.g., imported, external, archive" />
              </Form.Item>
            </Form>

            <div style={{ marginBottom: '16px', fontWeight: 500 }}>URLs to Import (Max 20):</div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {urls.map((url, index) => (
                <Space key={index} style={{ width: '100%' }}>
                  <Input
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder={`https://example.com/document${index + 1}.pdf`}
                    style={{ flex: 1, minWidth: '500px' }}
                    prefix={<LinkOutlined />}
                  />
                  {urls.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveUrl(index)}
                    />
                  )}
                </Space>
              ))}
            </Space>

            {urls.length < 20 && (
              <Button
                type="dashed"
                onClick={handleAddUrl}
                icon={<PlusOutlined />}
                style={{ marginTop: '16px', width: '100%' }}
              >
                Add Another URL
              </Button>
            )}

            {importing && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Progress percent={50} status="active" />
                <div style={{ marginTop: '12px', color: '#667eea' }}>
                  Downloading and processing documents...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Results Summary */}
            <div
              style={{
                background: '#f0fdf4',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #86efac',
              }}
            >
              <Space>
                <CheckCircleOutlined style={{ fontSize: '24px', color: '#10b981' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>Import Complete</div>
                  <Text type="secondary">
                    {results.successCount} of {results.totalRequested} documents imported
                    successfully
                  </Text>
                </div>
              </Space>
            </div>

            {/* Successful Imports */}
            {results.imported && results.imported.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontWeight: 500, marginBottom: '12px', color: '#10b981' }}>
                  Successfully Imported:
                </div>
                <List
                  size="small"
                  dataSource={results.imported}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                          <Text strong>{item.title}</Text>
                        </div>
                        <div style={{ paddingLeft: '24px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {item.fileName} ({(item.fileSize / 1024).toFixed(2)} KB)
                          </Text>
                        </div>
                      </Space>
                    </List.Item>
                  )}
                  style={{
                    background: '#f9fafb',
                    padding: '12px',
                    borderRadius: '8px',
                  }}
                />
              </div>
            )}

            {/* Failed Imports */}
            {results.failed && results.failed.length > 0 && (
              <div>
                <div style={{ fontWeight: 500, marginBottom: '12px', color: '#ef4444' }}>
                  Failed Imports:
                </div>
                <List
                  size="small"
                  dataSource={results.failed}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text type="danger">{item.url}</Text>
                        </div>
                        <div style={{ paddingLeft: '24px' }}>
                          <Tag color="error">{item.error}</Tag>
                        </div>
                      </Space>
                    </List.Item>
                  )}
                  style={{
                    background: '#fef2f2',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
