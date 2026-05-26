import useLanguage from '@/locale/useLanguage';
import {
  EyeOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Empty, List, Pagination, Space, Spin, Tag, Typography } from '@/components/ui';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Text, Title, Paragraph } = Typography;

const SearchResultsDisplay = ({
  results = [],
  loading = false,
  pagination = { page: 1, limit: 20, total: 0 },
  onPageChange,
  showEmptyResults = true,
}) => {
  const translate = useLanguage();
  const navigate = useNavigate();

  // Show document details
  const handleViewDocument = (id) => {
    navigate(`/document/read/${id}`);
  };

  // Get appropriate file icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileImageOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileOutlined />;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '30px' }}>
        <Spin size="large" />
        <p>{translate('Searching documents...')}</p>
      </div>
    );
  }

  if (results.length === 0 && showEmptyResults) {
    return (
      <Empty
        description={translate('No documents found matching your search criteria')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <>
      <List
        itemLayout="vertical"
        dataSource={results}
        renderItem={(item) => {
          // Get file extension
          const fileType = item.fileType || (item.fileName ? item.fileName.split('.').pop() : '');

          // Determine if we have highlighted versions of text fields
          const titleText = item.titleHighlighted ? (
            <span dangerouslySetInnerHTML={{ __html: item.titleHighlighted }} />
          ) : (
            item.title
          );

          const descriptionText = item.descriptionHighlighted ? (
            <span dangerouslySetInnerHTML={{ __html: item.descriptionHighlighted }} />
          ) : (
            item.description
          );

          return (
            <Card
              style={{ marginBottom: 16 }}
              hoverable
              actions={[
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDocument(item._id)}
                >
                  {translate('View')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(fileType)}
                title={
                  <Space>
                    <Title level={4} style={{ margin: 0 }}>
                      {titleText}
                    </Title>
                    <Tag color="blue">{item.documentType}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">
                      {translate('Uploaded')}: {dayjs(item.created).format('YYYY-MM-DD')}
                      {item.fileName && (
                        <>
                          {' | '}
                          <Badge status="processing" text={item.fileName} />
                        </>
                      )}
                    </Text>

                    {descriptionText && (
                      <Paragraph ellipsis={{ rows: 2 }}>{descriptionText}</Paragraph>
                    )}

                    <Space style={{ marginTop: 8 }}>
                      {item.tags &&
                        Array.isArray(item.tags) &&
                        item.tags.map((tag) => (
                          <Tag key={tag} color="green">
                            {tag}
                          </Tag>
                        ))}
                    </Space>
                  </Space>
                }
              />
            </Card>
          );
        }}
      />

      {pagination && pagination.total > pagination.limit && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination
            current={pagination.page}
            pageSize={pagination.limit}
            total={pagination.total}
            onChange={(page) => onPageChange && onPageChange(page)}
            showSizeChanger={false}
            showTotal={(total) => `${translate('Total')} ${total} ${translate('items')}`}
          />
        </div>
      )}
    </>
  );
};

export default SearchResultsDisplay;
