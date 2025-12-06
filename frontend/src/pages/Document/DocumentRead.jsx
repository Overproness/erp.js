import AuditTrailViewer from '@/components/AuditTrail/AuditTrailViewer';
import DocumentSummarizer from '@/components/Document/DocumentSummarizer';
import ShareDocumentModal from '@/components/Document/ShareDocumentModal';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { selectDownloadState } from '@/redux/erp/selectors';
import downloadDocument from '@/request/downloadDocument';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FileOutlined,
  HistoryOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Divider, message, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export default function DocumentRead() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const { result, isLoading } = useSelector((state) => state.erp.read);
  const { isLoading: downloadLoading } = useSelector(selectDownloadState);
  const [documentData, setDocumentData] = useState(null);
  const [auditTrailVisible, setAuditTrailVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    dispatch(erp.read({ entity: 'document', id }));
  }, [id, dispatch]);

  useEffect(() => {
    // Handle the structure returned from the backend
    if (result && result.result) {
      setDocumentData(result.result);
    } else if (result) {
      setDocumentData(result);
    }
  }, [result]);

  const handleEdit = () => {
    navigate(`/document/update/${id}`);
  };

  const handleDelete = () => {
    dispatch(erp.delete({ entity: 'document', id }));
    navigate('/document');
  };

  const handleDownload = async () => {
    try {
      message.loading({ content: 'Downloading document...', key: 'download' });
      await downloadDocument({ entity: 'document', id });
      message.success({ content: 'Download complete', key: 'download' });
    } catch (error) {
      message.error({ content: 'Error downloading document. Please try again.', key: 'download' });
      console.error('Download error:', error);
    }
  };

  const handleOpenEditor = () => {
    navigate(`/document/editor/${id}`);
  };

  const handleViewAuditTrail = () => {
    setAuditTrailVisible(true);
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  if (isLoading || !documentData) {
    return <div>{translate('Loading...')}</div>;
  }

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileOutlined style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileOutlined />;
    }
  };

  const fileType = documentData.fileType || documentData.fileName?.split('.').pop() || 'unknown';
  const uploadDate = dayjs(documentData.created).format('YYYY-MM-DD');
  const expiryDate = documentData.expiryDate
    ? dayjs(documentData.expiryDate).format('YYYY-MM-DD')
    : 'N/A';

  // Check if file type is supported for direct editing
  const editableTypes = ['pdf', 'txt', 'csv', 'json', 'md', 'html'];
  const canEdit = editableTypes.includes(fileType.toLowerCase());

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={3}>
            {getFileIcon(fileType)} {documentData.title}
          </Title>
          <Space>
            {/* AI Summarize Button */}
            <DocumentSummarizer document={documentData} />

            {canEdit && (
              <Button onClick={handleOpenEditor} type="default">
                {fileType.toLowerCase() === 'pdf'
                  ? translate('View & Sign')
                  : translate('Edit Content')}
              </Button>
            )}
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              {translate('Share')}
            </Button>
            <Button icon={<HistoryOutlined />} onClick={handleViewAuditTrail}>
              {translate('Audit Trail')}
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              {translate('Edit Metadata')}
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
              {translate('Delete')}
            </Button>
            <Button
              icon={<DownloadOutlined />}
              type="primary"
              loading={downloadLoading}
              onClick={handleDownload}
            >
              {translate('Download')}
            </Button>
          </Space>
        </Space>

        <Divider />

        <Descriptions variant="bordered" column={2}>
          <Descriptions.Item label={translate('Document Type')}>
            {documentData.documentType}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Upload Date')}>{uploadDate}</Descriptions.Item>
          <Descriptions.Item label={translate('File Type')}>
            {fileType.toUpperCase()}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Expiry Date')}>{expiryDate}</Descriptions.Item>
          <Descriptions.Item label={translate('Description')} span={2}>
            {documentData.description || 'No description provided'}
          </Descriptions.Item>
          <Descriptions.Item label={translate('Tags')} span={2}>
            {documentData.tags &&
            Array.isArray(documentData.tags) &&
            documentData.tags.length > 0 ? (
              documentData.tags.map((tag) => (
                <Tag key={tag} color="blue">
                  {tag}
                </Tag>
              ))
            ) : (
              <span>{translate('No tags')}</span>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Space>

      {/* Audit Trail Modal */}
      <AuditTrailViewer
        documentId={id}
        visible={auditTrailVisible}
        onClose={() => setAuditTrailVisible(false)}
        title={`Audit Trail - ${documentData.title}`}
      />

      {/* Share Document Modal with Security Controls */}
      <ShareDocumentModal
        visible={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        documentId={id}
        documentTitle={documentData?.title || 'Document'}
      />
    </Card>
  );
}
