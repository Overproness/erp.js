import React, { useState } from 'react';
import { Card, Tabs, Empty, List, Avatar, Rate, Typography, Tag, Button, Input, Space, Divider, Row, Col, Select, Badge } from '@/components/ui';
import { 
  UserOutlined, 
  MessageOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  SendOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  FilterOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Updated pending reviews from ReviewMonitoringModule (reviews with responded: false)
const pendingReviews = [
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
    id: '4',
    customer: 'Emily Davis',
    rating: 1,
    date: '2023-04-02',
    content: 'Very disappointed with the service. Will not be returning.',
    platform: 'Google',
    responded: false,
    sentiment: 'negative'
  }
];

// Responded reviews from ReviewMonitoringModule (reviews with responded: true)
const respondedReviews = [
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

const ReviewResponseModule = () => {
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedReview, setSelectedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Handle template selection
  const handleTemplateChange = (templateId) => {
    const template = responseTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    if (template) {
      setResponseText(template.content);
    }
  };
  
  // Handle response submission
  const handleSubmitResponse = () => {
    console.log('Submitting response for review:', selectedReview?.id);
    console.log('Response text:', responseText);
    // This would be replaced with an actual API call
    
    // Reset state after submission
    setResponseText('');
    setSelectedTemplate(null);
    setSelectedReview(null);
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

  // Render review list item
  const renderReviewItem = (item) => (
    <List.Item
      key={item.id}
      onClick={() => setSelectedReview(item)}
      style={{ 
        cursor: 'pointer', 
        padding: '12px',
        backgroundColor: selectedReview?.id === item.id ? '#f0f5ff' : 'transparent',
        borderRadius: '4px',
        marginBottom: '8px'
      }}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} />}
        title={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong>{item.customer}</Text>
            <Tag color={item.platform === 'Google' ? 'blue' : item.platform === 'Facebook' ? 'purple' : 'red'}>
              {item.platform}
            </Tag>
          </Space>
        }
        description={
          <div>
            <Rate disabled defaultValue={item.rating} size="small" />
            <Text type="secondary" style={{ marginLeft: '8px' }}>{item.date}</Text>
            <Badge 
              status={getSentimentColor(item.sentiment)} 
              text={translate(item.sentiment)} 
              style={{ marginLeft: '8px' }}
            />
          </div>
        }
      />
      <div style={{ marginTop: '8px' }}>
        <Paragraph ellipsis={{ rows: 2 }}>
          {item.content}
        </Paragraph>
      </div>
      {item.response && (
        <div style={{ marginTop: '8px', borderTop: '1px dashed #d9d9d9', paddingTop: '8px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>{translate('Your Response')}:</Text>
          <Paragraph ellipsis={{ rows: 1 }} style={{ fontSize: '12px', color: '#8c8c8c' }}>
            {item.response}
          </Paragraph>
        </div>
      )}
    </List.Item>
  );

  return (
    <div className="review-response-module">
      <Row gutter={[16, 16]}>
        {/* Reviews List */}
        <Col xs={24} lg={12}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane 
                tab={
                  <span>
                    <ExclamationCircleOutlined />
                    {translate('Pending')} <Badge count={pendingReviews.length} style={{ backgroundColor: '#ff4d4f' }} />
                  </span>
                } 
                key="pending"
              >
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">{pendingReviews.length} {translate('pending reviews')}</Text>
                  <Space>
                    <Select placeholder={translate('Sort by')} style={{ width: 120 }}>
                      <Option value="date_newest">{translate('Newest First')}</Option>
                      <Option value="date_oldest">{translate('Oldest First')}</Option>
                      <Option value="rating_high">{translate('Highest Rating')}</Option>
                      <Option value="rating_low">{translate('Lowest Rating')}</Option>
                    </Select>
                    <Button icon={<FilterOutlined />}>{translate('Filter')}</Button>
                  </Space>
                </div>
                
                {pendingReviews.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={pendingReviews}
                    renderItem={renderReviewItem}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={translate('No pending reviews found')}
                  />
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <CheckCircleOutlined />
                    {translate('Responded')}
                  </span>
                } 
                key="responded"
              >
                {respondedReviews.length > 0 ? (
                  <>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                      <Text type="secondary">{respondedReviews.length} {translate('responded reviews')}</Text>
                      <Space>
                        <Select placeholder={translate('Sort by')} style={{ width: 120 }}>
                          <Option value="date_newest">{translate('Newest First')}</Option>
                          <Option value="date_oldest">{translate('Oldest First')}</Option>
                          <Option value="rating_high">{translate('Highest Rating')}</Option>
                          <Option value="rating_low">{translate('Lowest Rating')}</Option>
                        </Select>
                        <Button icon={<FilterOutlined />}>{translate('Filter')}</Button>
                      </Space>
                    </div>
                    <List
                      itemLayout="vertical"
                      dataSource={respondedReviews}
                      renderItem={renderReviewItem}
                    />
                  </>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={translate('No responded reviews found')}
                  />
                )}
              </TabPane>
              <TabPane 
                tab={
                  <span>
                    <ClockCircleOutlined />
                    {translate('Scheduled')}
                  </span>
                } 
                key="scheduled"
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={translate('Scheduled responses will be displayed here')}
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
        
        {/* Response Editor */}
        <Col xs={24} lg={12}>
          <Card>
            {selectedReview ? (
              <>
                <Title level={5}>{translate('Respond to Review')}</Title>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <Text strong>{selectedReview.customer}</Text>
                    </Space>
                    <Space>
                      <Rate disabled defaultValue={selectedReview.rating} />
                      <Tag color={selectedReview.platform === 'Google' ? 'blue' : selectedReview.platform === 'Facebook' ? 'purple' : 'red'}>
                        {selectedReview.platform}
                      </Tag>
                    </Space>
                  </div>
                  <Paragraph style={{ marginTop: '12px' }}>
                    {selectedReview.content}
                  </Paragraph>
                </div>
                
                {selectedReview.responded ? (
                  <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ color: '#52c41a' }}>{translate('Previously Responded')}</Text>
                    </div>
                    <Paragraph>{selectedReview.response}</Paragraph>
                  </div>
                ) : (
                  <>
                    <Divider />
                    
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong>{translate('Select Response Template')}</Text>
                      <Select
                        placeholder={translate('Select a template')}
                        style={{ width: '100%', marginTop: '8px' }}
                        onChange={handleTemplateChange}
                        value={selectedTemplate?.id || undefined}
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
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Space>
                        <Button icon={<SaveOutlined />}>{translate('Save as Draft')}</Button>
                        <Button>{translate('Schedule')}</Button>
                      </Space>
                      <Button 
                        type="primary" 
                        icon={<SendOutlined />}
                        onClick={handleSubmitResponse}
                        disabled={!responseText.trim()}
                      >
                        {translate('Send Response')}
                      </Button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 400
              }}>
                <MessageOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">{translate('Select a review to respond to')}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReviewResponseModule;