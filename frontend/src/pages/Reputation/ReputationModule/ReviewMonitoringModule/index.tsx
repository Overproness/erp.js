import React, { useState } from 'react';
import { Card, Table, Space, Divider, Badge, Button, Tag, Input, Select, Row, Col, Typography, Dropdown, Menu, Avatar, Rate, Modal, Form, Tabs, message } from 'antd';
import { 
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  MessageOutlined,
  UserOutlined,
  EllipsisOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  FormOutlined,
  CommentOutlined,
  SaveOutlined,
  SendOutlined,
  CloseOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Sample data for reviews with responses matching ReviewResponseModule
const sampleReviews = [
  {
    id: '1',
    customer: 'John Doe',
    rating: 5,
    date: '2023-04-15',
    content: 'Excellent service! The team was very professional and helpful. Would highly recommend.',
    platform: 'Google',
    responded: true,
    sentiment: 'positive',
    response: 'Thank you for your kind words! We\'re delighted that you enjoyed your experience with us. We strive to provide excellent service to all our customers. Looking forward to serving you again soon!'
  },
  {
    id: '2',
    customer: 'Jane Smith',
    rating: 2,
    date: '2023-04-10',
    content: 'Poor experience. Long wait times and staff was not attentive.',
    platform: 'Facebook',
    responded: false,
    sentiment: 'negative'
  },
  {
    id: '3',
    customer: 'Robert Johnson',
    rating: 4,
    date: '2023-04-05',
    content: 'Good overall, but could improve on communication.',
    platform: 'Google',
    responded: true,
    sentiment: 'neutral',
    response: 'Thank you for your feedback, Robert. We appreciate you taking the time to share your experience. We\'re constantly working to improve our communication and will take your suggestions into account. Please don\'t hesitate to reach out if you have any other feedback.'
  },
  {
    id: '4',
    customer: 'Emily Davis',
    rating: 1,
    date: '2023-04-02',
    content: 'Very disappointed with the service. Will not be returning.',
    platform: 'Google',
    responded: false,
    sentiment: 'negative'
  },
  {
    id: '5',
    customer: 'Michael Brown',
    rating: 5,
    date: '2023-03-28',
    content: 'Amazing experience! The staff went above and beyond.',
    platform: 'Facebook',
    responded: true,
    sentiment: 'positive',
    response: 'We\'re thrilled to hear about your amazing experience, Michael! Our team works hard to provide exceptional service, and we\'re glad it showed. Thank you for your kind words and support. We hope to see you again soon!'
  }
];

// Response templates for quick replies
const responseTemplates = [
  {
    id: '1',
    name: 'Positive Response Template',
    content: 'Thank you for your positive feedback! We are thrilled to hear you enjoyed your experience with us. We look forward to serving you again soon!',
    sentiment: 'positive'
  },
  {
    id: '2',
    name: 'Neutral Response Template',
    content: 'Thank you for your feedback. We appreciate your comments and will use them to improve our service. If you have any specific suggestions, please feel free to contact us directly.',
    sentiment: 'neutral'
  },
  {
    id: '3',
    name: 'Negative Response Template',
    content: 'We apologize for your disappointing experience. We would like to learn more about what happened and make things right. Please contact our customer service team at support@example.com so we can address your concerns personally.',
    sentiment: 'negative'
  }
];

const ReviewMonitoringModule = () => {
  const translate = useLanguage();
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [reviews, setReviews] = useState(sampleReviews);
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('descend');
  
  // State for modals
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editForm] = Form.useForm();
  
  // Row selection config
  const rowSelection = {
    selectedRowKeys,
    onChange: keys => setSelectedRowKeys(keys)
  };
  
  // Handle sort change
  const handleSortChange = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend');
    } else {
      setSortField(field);
      setSortOrder('ascend');
    }
  };
  
  // Handle reply button click
  const handleReply = (review) => {
    setSelectedReview(review);
    setResponseText('');
    setSelectedTemplate(null);
    setReplyModalVisible(true);
  };
  

  
  // Handle view button click
  const handleView = (review) => {
    setSelectedReview(review);
    setViewModalVisible(true);
  };
  
  // Handle template selection
  const handleTemplateChange = (templateId) => {
    const template = responseTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    if (template) {
      setResponseText(template.content);
    }
  };
  
  // Handle submit response
  const handleSubmitResponse = () => {
    if (!selectedReview || !responseText.trim()) return;
    
    // Update the review in the state
    const updatedReviews = reviews.map(review => 
      review.id === selectedReview.id 
        ? { ...review, responded: true, response: responseText } 
        : review
    );
    
    setReviews(updatedReviews);
    setReplyModalVisible(false);
    setResponseText('');
    setSelectedTemplate(null);
    
    // Show success message
    message.success('Response submitted successfully');
  };
  
  // Handle save edited review
  const handleSaveEdit = () => {
    editForm.validateFields().then(values => {
      const updatedReviews = reviews.map(review => 
        review.id === selectedReview.id 
          ? { ...review, ...values } 
          : review
      );
      
      setReviews(updatedReviews);
      setEditModalVisible(false);
      message.success('Review updated successfully');
    });
  };
  
  // Get badge color based on sentiment
  const getSentimentColor = (sentiment) => {
    const colorMap = {
      positive: 'success',
      neutral: 'warning',
      negative: 'error'
    };
    return colorMap[sentiment] || 'default';
  };
  
  // Column definitions
  const columns = [
    {
      title: translate('Customer'),
      dataIndex: 'customer',
      key: 'customer',
      render: (text) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: (
        <div style={{ cursor: 'pointer' }} onClick={() => handleSortChange('rating')}>
          {translate('Rating')} {sortField === 'rating' && (sortOrder === 'ascend' ? <SortAscendingOutlined /> : <SortDescendingOutlined />)}
        </div>
      ),
      dataIndex: 'rating',
      key: 'rating',
      sorter: true,
      sortOrder: sortField === 'rating' ? sortOrder : null,
      render: (rating) => <Rate disabled defaultValue={rating} />,
      width: 150
    },
    {
      title: (
        <div style={{ cursor: 'pointer' }} onClick={() => handleSortChange('date')}>
          {translate('Date')} {sortField === 'date' && (sortOrder === 'ascend' ? <SortAscendingOutlined /> : <SortDescendingOutlined />)}
        </div>
      ),
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      sortOrder: sortField === 'date' ? sortOrder : null,
      width: 120
    },
    {
      title: translate('Review'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div style={{ maxWidth: 400, whiteSpace: 'normal' }}>
          {text.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      ),
    },
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => {
        const colorMap = {
          'Google': 'blue',
          'Facebook': 'purple',
          'Yelp': 'red'
        };
        return <Tag color={colorMap[platform]}>{platform}</Tag>;
      },
      filters: [
        { text: 'Google', value: 'Google' },
        { text: 'Facebook', value: 'Facebook' },
        { text: 'Yelp', value: 'Yelp' },
      ],
      width: 120
    },
    {
      title: translate('Status'),
      dataIndex: 'responded',
      key: 'responded',
      render: (responded) => (
        responded ? 
          <Tag color="green">{translate('Responded')}</Tag> : 
          <Tag color="volcano">{translate('Pending')}</Tag>
      ),
      filters: [
        { text: translate('Responded'), value: true },
        { text: translate('Pending'), value: false },
      ],
      width: 120
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            type="text"
            onClick={() => handleView(record)}
            title={translate('View Details')}
          />
          <Button 
            icon={<CommentOutlined />} 
            type={record.responded ? 'text' : 'primary'}
            danger={!record.responded}
            onClick={() => handleReply(record)}
            title={record.responded ? translate('Edit Response') : translate('Reply')}
          />
        </Space>
      ),
      width: 120
    },
  ];
  
  return (
    <div className="review-monitoring-module">
      {/* Search and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder={translate('Search reviews')}
              enterButton
              onSearch={value => console.log(value)}
            />
          </Col>
          <Col xs={24} md={16}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Select
                placeholder={translate('Filter by rating')}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="5">5 {translate('Stars')}</Option>
                <Option value="4">4 {translate('Stars')}</Option>
                <Option value="3">3 {translate('Stars')}</Option>
                <Option value="2">2 {translate('Stars')}</Option>
                <Option value="1">1 {translate('Star')}</Option>
              </Select>
              
              <Select
                placeholder={translate('Filter by platform')}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="google">Google</Option>
                <Option value="facebook">Facebook</Option>
                <Option value="yelp">Yelp</Option>
              </Select>
              
              <Select
                placeholder={translate('Filter by sentiment')}
                style={{ width: 150 }}
                allowClear
              >
                <Option value="positive">{translate('Positive')}</Option>
                <Option value="neutral">{translate('Neutral')}</Option>
                <Option value="negative">{translate('Negative')}</Option>
              </Select>
              
              <Button icon={<FilterOutlined />}>{translate('More Filters')}</Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Reviews Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={reviews}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} ${translate('of')} ${total} ${translate('reviews')}`,
          }}
        />
        
        {/* Bulk Actions */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f5f5f5', 
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text>{selectedRowKeys.length} {translate('items selected')}</Text>
            <Space>
              <Button>{translate('Bulk Reply')}</Button>
              <Button>{translate('Mark as Responded')}</Button>
              <Button danger>{translate('Delete Selected')}</Button>
            </Space>
          </div>
        )}
      </Card>
      
      {/* Reply Modal */}
      <Modal
        title={
          <div>
            <div style={{ marginBottom: '8px' }}>
              {selectedReview?.responded 
                ? translate('Edit Response') 
                : translate('Reply to Review')}
            </div>
            {selectedReview && (
              <div style={{ 
                padding: '10px', 
                background: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text strong>{selectedReview.customer}</Text>
                  </Space>
                  <Space>
                    <Rate disabled defaultValue={selectedReview.rating} size="small" />
                    <Tag color={
                      selectedReview.platform === 'Google' ? 'blue' : 
                      selectedReview.platform === 'Facebook' ? 'purple' : 'red'
                    }>
                      {selectedReview.platform}
                    </Tag>
                  </Space>
                </div>
                <div>
                  <Text>{selectedReview.content}</Text>
                </div>
              </div>
            )}
          </div>
        }
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setReplyModalVisible(false)}>
            {translate('Cancel')}
          </Button>,
          <Button 
            key="save"
            icon={<SaveOutlined />}
          >
            {translate('Save as Draft')}
          </Button>,
          <Button 
            key="submit" 
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmitResponse}
            disabled={!responseText.trim()}
          >
            {translate('Send Response')}
          </Button>,
        ]}
      >
        {/* If review already has a response, show it and allow editing */}
        {selectedReview && selectedReview.responded && selectedReview.response && (
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ color: '#52c41a' }}>{translate('Current Response')}</Text>
            </div>
            <Paragraph>
              {selectedReview.response}
            </Paragraph>
          </div>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>{translate('Select Response Template')}</Text>
          <Select
            placeholder={translate('Select a template')}
            style={{ width: '100%', marginTop: '8px' }}
            onChange={handleTemplateChange}
            value={selectedTemplate?.id || undefined}
            allowClear
          >
            {responseTemplates.map(template => (
              <Option key={template.id} value={template.id}>
                <Space>
                  <Badge status={getSentimentColor(template.sentiment)} />
                  {template.name}
                </Space>
              </Option>
            ))}
          </Select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <Text strong>{translate('Your Response')}</Text>
          <TextArea
            rows={6}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={translate('Enter your response here...')}
            style={{ marginTop: '8px' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <Text type="secondary">{responseText.length} {translate('characters')}</Text>
          </div>
        </div>
      </Modal>
      
      {/* Edit Modal */}
      <Modal
        title={translate('Edit Review')}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            {translate('Cancel')}
          </Button>,
          <Button 
            key="save" 
            type="primary"
            onClick={handleSaveEdit}
          >
            {translate('Save Changes')}
          </Button>,
        ]}
      >
        <Form
          form={editForm}
          layout="vertical"
          initialValues={{
            rating: selectedReview?.rating || 0,
            content: selectedReview?.content || '',
            platform: selectedReview?.platform || 'Google',
            sentiment: selectedReview?.sentiment || 'neutral'
          }}
        >
          <Form.Item
            name="rating"
            label={translate('Rating')}
            rules={[{ required: true, message: translate('Please rate this review') }]}
          >
            <Rate />
          </Form.Item>
          
          <Form.Item
            name="platform"
            label={translate('Platform')}
            rules={[{ required: true, message: translate('Please select a platform') }]}
          >
            <Select>
              <Option value="Google">Google</Option>
              <Option value="Facebook">Facebook</Option>
              <Option value="Yelp">Yelp</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="sentiment"
            label={translate('Sentiment')}
            rules={[{ required: true, message: translate('Please select sentiment') }]}
          >
            <Select>
              <Option value="positive">
                <Badge status="success" text={translate('Positive')} />
              </Option>
              <Option value="neutral">
                <Badge status="warning" text={translate('Neutral')} />
              </Option>
              <Option value="negative">
                <Badge status="error" text={translate('Negative')} />
              </Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="content"
            label={translate('Review Content')}
            rules={[{ required: true, message: translate('Please enter review content') }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* View Modal */}
      <Modal
        title={translate('Review Details')}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            {translate('Close')}
          </Button>,
          <Button 
            key="reply" 
            type="primary"
            icon={<CommentOutlined />}
            onClick={() => {
              setViewModalVisible(false);
              handleReply(selectedReview);
            }}
          >
            {selectedReview?.responded ? translate('Edit Response') : translate('Reply')}
          </Button>,
        ]}
        width={700}
      >
        {selectedReview && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card variant="borderless" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Space direction="vertical" size="small">
                      <Space align="center">
                        <Avatar size="large" icon={<UserOutlined />} />
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>{selectedReview.customer}</Text>
                          <div>
                            <Text type="secondary">{selectedReview.date}</Text>
                          </div>
                        </div>
                      </Space>
                    </Space>
                    
                    <Space direction="vertical" align="end">
                      <Rate disabled value={selectedReview.rating} />
                      <Tag color={
                        selectedReview.platform === 'Google' ? 'blue' : 
                        selectedReview.platform === 'Facebook' ? 'purple' : 'red'
                      }>
                        {selectedReview.platform}
                      </Tag>
                    </Space>
                  </div>
                  
                  <Divider />
                  
                  <Paragraph style={{ fontSize: '16px' }}>
                    {selectedReview.content}
                  </Paragraph>
                  
                  <div style={{ marginTop: '16px' }}>
                    <Badge 
                      status={getSentimentColor(selectedReview.sentiment)} 
                      text={
                        <Text style={{ color: getSentimentColor(selectedReview.sentiment) === 'success' ? '#52c41a' : 
                                       getSentimentColor(selectedReview.sentiment) === 'warning' ? '#faad14' : 
                                       '#f5222d' }}>
                          {translate('Sentiment')}: {translate(selectedReview.sentiment)}
                        </Text>
                      } 
                    />
                  </div>
                </Card>
              </Col>
              
              {selectedReview.responded && (
                <Col span={24}>
                  <Card 
                    title={translate('Your Response')}
                    variant="borderless"
                    style={{ background: '#f6ffed', marginBottom: '16px' }}
                  >
                    <Paragraph>
                      {selectedReview.response || 'Thank you for your feedback!'}
                    </Paragraph>
                  </Card>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewMonitoringModule;