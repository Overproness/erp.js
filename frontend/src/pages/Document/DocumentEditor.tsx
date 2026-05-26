import {
  Button,
  Card,
  Divider,
  Input,
  List,
  message,
  Modal,
  Space,
  Spin,
  Tabs,
  Typography,
} from '@/components/ui';
import { API_BASE_URL } from '@/config/serverApiConfig';
import apolloClient from '@/graphql/client';
import {
  DOCUMENT_ESIGN,
  DOCUMENT_REVERT,
  DOCUMENT_VERSIONS,
  GET_DOCUMENT,
} from '@/graphql/operations/document';
import useLanguage from '@/locale/useLanguage';
import {
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SaveOutlined,
  SignatureOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Import document components
import PDFViewer from '@/components/DocumentEditor/PDFViewer';
import SafeTextEditor from '@/components/DocumentEditor/SafeTextEditor';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DocumentEditor = () => {
  const translate = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [editSummary, setEditSummary] = useState('');
  const [annotations, setAnnotations] = useState([]);

  const [versions, setVersions] = useState([]);
  const [versionModalVisible, setVersionModalVisible] = useState(false);

  const [signModalVisible, setSignModalVisible] = useState(false);
  const [signature, setSignature] = useState('');
  const [signPage, setSignPage] = useState(0);
  const [signPosition, setSignPosition] = useState({ x: 0.1, y: 0.1 });
  const [signReason, setSignReason] = useState('');

  // Fetch document content and metadata
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const { data: docData } = await apolloClient.query({
          query: GET_DOCUMENT,
          variables: { id },
        });

        if (docData.documentRead.success) {
          setDocument(docData.documentRead.result);

          // Try to fetch document content for editing (no GraphQL op — use REST)
          try {
            const axios = (await import('axios')).default;
            const contentResponse = await axios.get(`${API_BASE_URL}document/${id}/content`);
            if (contentResponse.data.success) {
              setContent(contentResponse.data.result.content);
              setContentType(contentResponse.data.result.contentType);

              // Load annotations if available
              if (contentResponse.data.result.document?.annotations) {
                setAnnotations(contentResponse.data.result.document.annotations);
              } else if (contentResponse.data.result.annotations) {
                setAnnotations(contentResponse.data.result.annotations);
              }
            }
          } catch (contentError) {
            console.error('Error fetching document content:', contentError);
            message.warning(
              `Document content could not be loaded for editing. You can still view document details.`
            );
          }

          // Try to fetch versions
          try {
            const { data: verData } = await apolloClient.query({
              query: DOCUMENT_VERSIONS,
              variables: { id },
            });
            if (verData.documentListVersions.success) {
              setVersions(verData.documentListVersions.result.items);
            }
          } catch (versionsError) {
            console.error('Error fetching versions:', versionsError);
          }
        } else {
          message.error('Failed to load document');
          navigate('/document');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        message.error(
          'Failed to load document: ' +
            (error.response?.data?.message || error.message || 'Unknown error')
        );
        navigate('/document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  // Function to save changes including PDF annotations
  const handleSave = async () => {
    try {
      setSaving(true);
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API_BASE_URL}document/${id}/edit`, {
        content,
        annotations: document?.fileType?.toLowerCase() === 'pdf' ? annotations : undefined,
        editSummary: editSummary || 'Document updated',
      });

      if (response.data.success) {
        message.success('Document saved successfully');
        setEditSummary('');

        // Refresh versions
        try {
          const { data: verData } = await apolloClient.query({
            query: DOCUMENT_VERSIONS,
            variables: { id },
            fetchPolicy: 'cache-first',
          });
          if (verData.documentListVersions.success) {
            setVersions(verData.documentListVersions.result.items);
          }
        } catch (error) {
          console.error('Error refreshing versions:', error);
        }
      } else {
        message.error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      message.error(
        'Error saving document: ' +
          (error.response?.data?.message || error.message || 'Unknown error')
      );
    } finally {
      setSaving(false);
    }
  };

  // Function to sign document
  const handleSignDocument = async () => {
    if (!signature) {
      message.error('Please provide a signature');
      return;
    }

    try {
      setSaving(true);
      const { data: signData } = await apolloClient.mutate({
        mutation: DOCUMENT_ESIGN,
        variables: {
          id,
          input: {
            signature,
            position: signPosition,
            page: signPage,
            reason: signReason || 'Document approved',
          },
        },
      });

      if (signData.documentESign.success) {
        message.success('Document signed successfully');
        setSignModalVisible(false);

        // Refresh document
        const { data: docData } = await apolloClient.query({
          query: GET_DOCUMENT,
          variables: { id },
          fetchPolicy: 'cache-first',
        });
        if (docData.documentRead.success) {
          setDocument(docData.documentRead.result);
        }

        // Refresh versions
        const { data: verData } = await apolloClient.query({
          query: DOCUMENT_VERSIONS,
          variables: { id },
          fetchPolicy: 'cache-first',
        });
        if (verData.documentListVersions.success) {
          setVersions(verData.documentListVersions.result.items);
        }

        // Refresh content to show the signed PDF (no GraphQL op — use REST)
        const axios = (await import('axios')).default;
        const contentResponse = await axios.get(`${API_BASE_URL}document/${id}/content`);
        if (contentResponse.data.success) {
          setContent(contentResponse.data.result.content);
          setContentType(contentResponse.data.result.contentType);
        }
      } else {
        message.error('Failed to sign document');
      }
    } catch (error) {
      message.error('Error signing document: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Function to handle annotations changes from PDF viewer
  const handleAnnotationsChange = (newAnnotations) => {
    setAnnotations(newAnnotations);
  };

  // Function to save PDF annotations
  const handleSaveAnnotations = async () => {
    try {
      setSaving(true);
      const axios = (await import('axios')).default;
      const response = await axios.post(`${API_BASE_URL}document/${id}/annotate`, {
        annotations,
        editSummary: editSummary || 'Added annotations',
      });

      if (response.data.success) {
        message.success('Annotations saved successfully');
        setEditSummary('');

        // Refresh versions
        const { data: verData } = await apolloClient.query({
          query: DOCUMENT_VERSIONS,
          variables: { id },
          fetchPolicy: 'cache-first',
        });
        if (verData.documentListVersions.success) {
          setVersions(verData.documentListVersions.result.items);
        }
      } else {
        message.error('Failed to save annotations');
      }
    } catch (error) {
      message.error('Error saving annotations: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Function to revert to a specific version
  const handleRevertToVersion = async (versionNumber) => {
    try {
      const confirm = window.confirm(
        `Are you sure you want to revert to ${
          versionNumber === 0 ? 'the original document' : `version ${versionNumber}`
        }? This will replace the current document content.`
      );

      if (!confirm) return;

      setSaving(true);
      message.loading({ content: 'Reverting document...', key: 'revert' });

      let response;

      if (versionNumber === 0) {
        const { data: revData } = await apolloClient.mutate({
          mutation: DOCUMENT_REVERT,
          variables: { id, version: 0 },
        });
        response = { data: revData.documentRevertToVersion };
      } else {
        const numVersion = parseInt(versionNumber, 10);
        if (isNaN(numVersion) || numVersion < 1) {
          throw new Error('Invalid version number');
        }
        const { data: revData } = await apolloClient.mutate({
          mutation: DOCUMENT_REVERT,
          variables: { id, version: numVersion },
        });
        response = { data: revData.documentRevertToVersion };
      }

      if (response.data.success) {
        message.success({
          content: `Successfully reverted to ${
            versionNumber === 0 ? 'original document' : `version ${versionNumber}`
          }`,
          key: 'revert',
        });
        setVersionModalVisible(false);

        // Refresh document and content
        try {
          // Get updated document metadata
          const { data: docData } = await apolloClient.query({
            query: GET_DOCUMENT,
            variables: { id },
            fetchPolicy: 'cache-first',
          });
          if (docData.documentRead.success) {
            setDocument(docData.documentRead.result);

            // Get updated document content (no GraphQL op — use REST)
            const axios = (await import('axios')).default;
            const contentResponse = await axios.get(`${API_BASE_URL}document/${id}/content`);
            if (contentResponse.data.success) {
              setContent(contentResponse.data.result.content);
              setContentType(contentResponse.data.result.contentType);

              // Update annotations if available
              if (contentResponse.data.result.annotations) {
                setAnnotations(contentResponse.data.result.annotations);
              } else {
                setAnnotations([]);
              }
            }
          }

          // Refresh versions list
          const { data: verData } = await apolloClient.query({
            query: DOCUMENT_VERSIONS,
            variables: { id },
            fetchPolicy: 'cache-first',
          });
          if (verData.documentListVersions.success) {
            setVersions(verData.documentListVersions.result.items);
          }
        } catch (refreshError) {
          console.error('Error refreshing document after reversion:', refreshError);
          // Force reload the page as a fallback
          window.location.reload();
        }
      } else {
        message.error({
          content: 'Failed to revert document: ' + (response.data.message || 'Unknown error'),
          key: 'revert',
        });
      }
    } catch (error) {
      message.error({
        content:
          'Error reverting document: ' +
          (error.response?.data?.message || error.message || 'Unknown error'),
        key: 'revert',
      });
      console.error('Revert error details:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = () => {
    if (!document) return null;

    const fileType = document.fileType?.toLowerCase() || '';

    if (fileType === 'pdf' && contentType === 'base64') {
      return (
        <PDFViewer
          pdfBase64={content}
          onAnnotationsChange={handleAnnotationsChange}
          annotations={annotations}
        />
      );
    } else if (['txt', 'csv', 'json', 'md', 'html', 'css', 'js', 'xml'].includes(fileType)) {
      return (
        <SafeTextEditor content={content} setContent={setContent} fileType={fileType} />
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Text type="warning">
            {translate('This file type')} ({fileType}){' '}
            {translate('is not supported for direct editing.')}
          </Text>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card>
      <div
        style={{
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3}>{document?.title || translate('Document Editor')}</Title>

        <Space>
          <Button icon={<FileTextOutlined />} onClick={() => navigate(`/document/read/${id}`)}>
            {translate('Document Details')}
          </Button>

          <Button icon={<HistoryOutlined />} onClick={() => setVersionModalVisible(true)}>
            {translate('Version History')}
          </Button>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="edit"
        items={[
          {
            key: 'edit',
            label: translate('Edit Document'),
            children: (
              <>
                {renderEditor()}

                <div style={{ marginTop: 20 }}>
                  <Divider />
                  <Text strong>{translate('Edit Summary')}:</Text>
                  <TextArea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    placeholder={translate('Describe your changes...')}
                    rows={2}
                    style={{ marginTop: 8, marginBottom: 16 }}
                  />
                  <Space>
                    {document?.fileType?.toLowerCase() === 'pdf' ? (
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleSaveAnnotations}
                        loading={saving}
                      >
                        {translate('Save Annotations')}
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={saving}
                        disabled={
                          !['txt', 'csv', 'json', 'md', 'html', 'css', 'js', 'xml'].includes(
                            document?.fileType?.toLowerCase()
                          )
                        }
                      >
                        {translate('Save Changes')}
                      </Button>
                    )}

                    {document?.fileType?.toLowerCase() === 'pdf' && (
                      <Button
                        icon={<SignatureOutlined />}
                        onClick={() => setSignModalVisible(true)}
                      >
                        {translate('E-Sign Document')}
                      </Button>
                    )}
                  </Space>
                </div>
              </>
            ),
          },
        ]}
      />

      {/* Version History Modal */}
      <Modal
        title={translate('Version History')}
        open={versionModalVisible}
        onCancel={() => setVersionModalVisible(false)}
        footer={null}
        width={700}
      >
        {versions.length === 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                versionNumber: 0,
                changeDescription: 'Original document',
                createdAt: document?.created || new Date(),
                createdBy: document?.createdBy || { name: 'System' },
              },
            ]}
            renderItem={(version) => (
              <List.Item
                actions={[
                  <Button
                    key="revert"
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={() => handleRevertToVersion(version.versionNumber)}
                  >
                    {translate('Revert')}
                  </Button>,
                ]}
                className="version-item original-version"
              >
                <List.Item.Meta
                  title={
                    <>
                      {translate('Original Document')}
                      <span className="version-label original">{translate('Original')}</span>
                    </>
                  }
                  description={
                    <>
                      <div>{version.changeDescription}</div>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        {new Date(version.createdAt).toLocaleString()} {translate('by')}{' '}
                        {version.createdBy?.name || 'Unknown'}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={[
              {
                versionNumber: 0,
                changeDescription: 'Original document',
                createdAt: document?.created || new Date(),
                createdBy: document?.createdBy || { name: 'System' },
              },
              ...versions,
            ]}
            renderItem={(version) => (
              <List.Item
                actions={[
                  <Button
                    key="revert"
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={() => handleRevertToVersion(version.versionNumber)}
                  >
                    {translate('Revert')}
                  </Button>,
                ]}
                className={
                  version.versionNumber === 0 ? 'version-item original-version' : 'version-item'
                }
              >
                <List.Item.Meta
                  title={
                    <>
                      {version.versionNumber === 0
                        ? translate('Original Document')
                        : `${translate('Version')} ${version.versionNumber}`}
                      {version.versionNumber === 0 && (
                        <span className="version-label original">{translate('Original')}</span>
                      )}
                    </>
                  }
                  description={
                    <>
                      <div>{version.changeDescription}</div>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        {new Date(version.createdAt).toLocaleString()} {translate('by')}{' '}
                        {version.createdBy?.name || 'Unknown'}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Sign Document Modal */}
      <Modal
        title={translate('E-Sign Document')}
        open={signModalVisible}
        onCancel={() => setSignModalVisible(false)}
        onOk={handleSignDocument}
        confirmLoading={saving}
        okText={translate('Sign Document')}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>{translate('Signature Text')}:</Text>
          <Input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={translate('Your name or signature text')}
            style={{ marginTop: 8 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{translate('Page Number')}:</Text>
          <Input
            type="number"
            min={0}
            value={signPage}
            onChange={(e) => setSignPage(parseInt(e.target.value))}
            style={{ width: 100, marginTop: 8 }}
          />
          <Text type="secondary" style={{ marginLeft: 8 }}>
            (0 {translate('for first page')})
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong>{translate('Signature Position')}:</Text>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <Input
              addonBefore="X"
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={signPosition.x}
              onChange={(e) => setSignPosition({ ...signPosition, x: parseFloat(e.target.value) })}
            />
            <Input
              addonBefore="Y"
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={signPosition.y}
              onChange={(e) => setSignPosition({ ...signPosition, y: parseFloat(e.target.value) })}
            />
          </div>
          <Text type="secondary">
            {translate('Values from 0-1, where 0,0 is bottom-left and 1,1 is top-right')}
          </Text>
        </div>

        <div>
          <Text strong>{translate('Reason for Signing')}:</Text>
          <Input
            value={signReason}
            onChange={(e) => setSignReason(e.target.value)}
            placeholder={translate('e.g., Approved, Reviewed, etc.')}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentEditor;
