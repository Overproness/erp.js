import { API_BASE_URL } from '@/config/serverApiConfig';
import {
  FileTextOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SaveOutlined,
  SignatureOutlined,
} from '@ant-design/icons';
import { Button, Card, Divider, Input, message, Modal, Space, Spin, Tabs, Typography } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PDFViewer from './PDFViewer';
import SignaturePad from './SignaturePad';
import TextEditor from './TextEditor';

const { Text } = Typography;
const { TextArea } = Input;
const { Title } = Typography;

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [versions, setVersions] = useState([]);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [signature, setSignature] = useState('');
  const [signPosition, setSignPosition] = useState({ x: 0.1, y: 0.1 });
  const [signPage, setSignPage] = useState(0);
  const [signReason, setSignReason] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        // Fetch document metadata
        const response = await axios.get(`${API_BASE_URL}document/read/${id}`);
        if (response.data.success) {
          setDocument(response.data.result);

          // Fetch document content separately
          try {
            // Changed endpoint format to match the backend API structure
            const contentResponse = await axios.get(`${API_BASE_URL}document/content/${id}`);

            if (contentResponse.data.success) {
              setContent(contentResponse.data.result.content);
              setContentType(contentResponse.data.result.contentType);
            }
          } catch (contentError) {
            // If first attempt fails, try alternative endpoint format
            try {
              const altContentResponse = await axios.get(`${API_BASE_URL}document/${id}/download`);
              if (altContentResponse.data.success) {
                setContent(altContentResponse.data.result.content);
                setContentType(altContentResponse.data.result.contentType || 'text');
              }
            } catch (altContentError) {
              console.error('Error fetching document content:', contentError);
              console.error('Alternative endpoint also failed:', altContentError);
              message.warning('Unable to load document content for editing');
            }
          }
        } else {
          message.error('Failed to load document');
        }

        // Fetch versions
        try {
          const versionsResponse = await axios.get(`${API_BASE_URL}document/${id}/versions`);
          if (versionsResponse.data.success) {
            setVersions(versionsResponse.data.result.items);
          }
        } catch (versionsError) {
          console.error('Error fetching versions:', versionsError);
          // Not showing error for versions as it's non-critical
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        message.error('Failed to load document: ' + (error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}document/edit/${id}`, {
        content,
        editSummary: editSummary || 'Document updated',
      });

      if (response.data.success) {
        message.success('Document saved successfully');
        // Refresh versions
        const versionsResponse = await axios.get(`${API_BASE_URL}document/${id}/versions`);
        if (versionsResponse.data.success) {
          setVersions(versionsResponse.data.result.items);
        }
        setEditSummary('');
      } else {
        message.error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      message.error('Failed to save document: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignDocument = async () => {
    try {
      setLoading(true);
      // Use the proper endpoint format for signing
      const response = await axios.post(`${API_BASE_URL}document/sign/${id}`, {
        signature,
        position: signPosition,
        page: signPage,
        reason: signReason,
      });

      if (response.data.success) {
        message.success('Document signed successfully');
        setSignModalVisible(false);

        // Refresh document and versions with updated endpoints
        try {
          const docResponse = await axios.get(`${API_BASE_URL}document/content/${id}`);
          if (docResponse.data.success) {
            setContent(docResponse.data.result.content);
            setContentType(docResponse.data.result.contentType);
          }
        } catch (contentError) {
          console.error('Error refreshing content:', contentError);
        }

        const versionsResponse = await axios.get(`${API_BASE_URL}document/${id}/versions`);
        if (versionsResponse.data.success) {
          setVersions(versionsResponse.data.result.items);
        }
      } else {
        message.error('Failed to sign document');
      }
    } catch (error) {
      console.error('Error signing document:', error);
      message.error('Failed to sign document: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToVersion = async (versionNumber) => {
    try {
      const confirm = window.confirm(
        `Are you sure you want to revert to version ${versionNumber}?${
          versionNumber === 0 ? ' This will restore the original document.' : ''
        }`
      );
      if (!confirm) return;

      setLoading(true);
      let response;

      // Handle original version (0) differently from other versions
      if (versionNumber === 0) {
        response = await axios.post(`${API_BASE_URL}document/${id}/revert/original`);
      } else {
        // Make sure versionNumber is a valid number
        const numVersion = parseInt(versionNumber, 10);
        if (isNaN(numVersion)) {
          throw new Error('Invalid version number');
        }
        response = await axios.post(`${API_BASE_URL}document/${id}/revert/${numVersion}`);
      }

      if (response.data.success) {
        message.success(
          `Reverted to ${versionNumber === 0 ? 'original document' : `version ${versionNumber}`}`
        );

        // Refresh document and versions
        try {
          const docResponse = await axios.get(`${API_BASE_URL}document/content/${id}`);
          if (docResponse.data.success) {
            setContent(docResponse.data.result.content);
            setContentType(docResponse.data.result.contentType);
          }
        } catch (contentError) {
          console.error('Error refreshing content after revert:', contentError);
        }

        const versionsResponse = await axios.get(`${API_BASE_URL}document/${id}/versions`);
        if (versionsResponse.data.success) {
          setVersions(versionsResponse.data.result.items);
        }
      } else {
        message.error('Failed to revert document: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error reverting document:', error);
      message.error(
        'Failed to revert document: ' +
          (error.response?.data?.message || error.message || 'Unknown error')
      );
    } finally {
      setLoading(false);
      setVersionModalVisible(false);
    }
  };

  if (loading && !document) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading document..." />
      </div>
    );
  }

  const renderEditor = () => {
    if (!document) return null;

    // PDF content
    if (document.fileType.toLowerCase() === 'pdf' && contentType === 'base64') {
      return <PDFViewer pdfBase64={content} />;
    }

    // Text-based content
    if (['txt', 'csv', 'json', 'md', 'html'].includes(document.fileType.toLowerCase())) {
      return (
        <TextEditor
          content={content}
          setContent={setContent}
          fileType={document.fileType.toLowerCase()}
        />
      );
    }

    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Typography.Text type="warning">
          This file type ({document.fileType}) is not supported for direct editing. You can download
          the file, edit it externally, and then upload a new version.
        </Typography.Text>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <Title level={3}>{document?.title}</Title>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={
              !['txt', 'csv', 'json', 'md', 'html'].includes(document?.fileType?.toLowerCase())
            }
          >
            Save
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => setVersionModalVisible(true)}>
            Version History
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => navigate(`/document/read/${id}`)}>
            Document Details
          </Button>
          {document?.fileType?.toLowerCase() === 'pdf' && (
            <Button icon={<SignatureOutlined />} onClick={() => setSignModalVisible(true)}>
              E-Sign
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Tabs
          defaultActiveKey="edit"
          items={[
            {
              key: 'edit',
              label: 'Edit Document',
              children: (
                <div>
                  <div style={{ marginBottom: '20px' }}>{renderEditor()}</div>
                  {['txt', 'csv', 'json', 'md', 'html'].includes(
                    document?.fileType?.toLowerCase()
                  ) && (
                    <div>
                      <Divider />
                      <Typography.Text>Edit Summary:</Typography.Text>
                      <TextArea
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        placeholder="Describe your changes..."
                        rows={2}
                        style={{ marginTop: '10px', marginBottom: '10px' }}
                      />
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Version History Modal */}
      <Modal
        title="Version History"
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        width={700}
      >
        {/* Original Version (0) Card */}
        <Card
          key="original"
          size="small"
          style={{ marginBottom: '10px', backgroundColor: '#f0f7ff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography.Text strong>Original Document (Version 0)</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ margin: '5px 0' }}>
                Original document upload
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                {new Date(document?.created).toLocaleString()} by{' '}
                {document?.owner?.name || 'Unknown'}
              </Typography.Text>
            </div>
            <Space>
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => handleRevertToVersion(0)}
              >
                Revert to Original
              </Button>
            </Space>
          </div>
        </Card>

        {versions.length === 0 ? (
          <Typography.Text>No edits have been made to this document.</Typography.Text>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {versions.map((version) => (
              <Card key={version._id} size="small" style={{ marginBottom: '10px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <Typography.Text strong>Version {version.versionNumber}</Typography.Text>
                    <Typography.Paragraph type="secondary" style={{ margin: '5px 0' }}>
                      {version.changeDescription}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary">
                      {new Date(version.createdAt).toLocaleString()} by{' '}
                      {version.createdBy?.name || 'Unknown'}
                    </Typography.Text>
                  </div>
                  <Space>
                    <Button
                      size="small"
                      icon={<RollbackOutlined />}
                      onClick={() => handleRevertToVersion(version.versionNumber)}
                    >
                      Revert
                    </Button>
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      {/* E-Sign Modal */}
      <Modal
        title="E-Sign Document"
        open={signModalVisible}
        onCancel={() => setSignModalVisible(false)}
        onOk={handleSignDocument}
        okText="Sign Document"
        width={600}
      >
        <div style={{ marginBottom: '20px' }}>
          <Typography.Text strong>Signature Method:</Typography.Text>
          <Tabs defaultActiveKey="text">
            <Tabs.TabPane tab="Text Signature" key="text">
              <div style={{ marginTop: '10px' }}>
                <Typography.Text>Enter your name or signature text:</Typography.Text>
                <Input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Your name or signature text"
                  style={{ marginTop: '5px' }}
                />
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Draw Signature" key="draw">
              <SignaturePad onSignatureCapture={(signatureData) => setSignature(signatureData)} />
            </Tabs.TabPane>
          </Tabs>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Typography.Text strong>Position on Page:</Typography.Text>
          <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={signPosition.x}
              onChange={(e) => setSignPosition({ ...signPosition, x: parseFloat(e.target.value) })}
              addonBefore="X"
              addonAfter="(0-1)"
              style={{ width: '50%' }}
            />
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={signPosition.y}
              onChange={(e) => setSignPosition({ ...signPosition, y: parseFloat(e.target.value) })}
              addonBefore="Y"
              addonAfter="(0-1)"
              style={{ width: '50%' }}
            />
          </div>
          <Typography.Text type="secondary">
            Values are normalized (0-1) where 0,0 is bottom-left and 1,1 is top-right
          </Typography.Text>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <Typography.Text strong>Page Number:</Typography.Text>
          <Input
            type="number"
            min={0}
            value={signPage}
            onChange={(e) => setSignPage(parseInt(e.target.value))}
            style={{ width: '100px', marginTop: '5px' }}
          />
          <Typography.Text type="secondary" style={{ marginLeft: '10px' }}>
            (0 for first page)
          </Typography.Text>
        </div>

        <div>
          <Typography.Text strong>Reason for Signing:</Typography.Text>
          <Input
            value={signReason}
            onChange={(e) => setSignReason(e.target.value)}
            placeholder="e.g., Approved, Reviewed, etc."
            style={{ marginTop: '5px' }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DocumentEditor;
