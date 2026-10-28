import React, { useState, useEffect } from 'react';
import { Card, Tabs, Empty, List, Avatar, Rate, Typography, Tag, Button, Input, Space, Divider, Row, Col, Select, Badge } from '@/components/ui';
import { 
  UserOutlined, 
  MessageOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  SendOutlined,
  SaveOutlined,
  ExclamationCircleOutlined,
  FilterOutlined,
  BulbOutlined,
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { request } = await import('@/request');
        const res = await request.get({ entity: 'marketing/reputation/reviews' });
        if (isMounted && res?.result && res.result.length > 0) {
          const mapped = res.result.map((r: any) => ({
            id: r._id || r.platformReviewId,
            customer: r.client?.name || 'Customer',
            rating: r.rating || 5,
            date: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : 'Recent',
            content: r.comment || '',
            platform: r.platform ? r.platform.charAt(0).toUpperCase() + r.platform.slice(1) : 'Google',
            responded: r.status === 'responded' || !!r.response?.text,
            sentiment: r.sentiment?.category || 'positive',
            response: r.response?.text || '',
          }));
          setReviews(mapped);
        }
      } catch (err) {
        console.warn('Failed to fetch reviews for response module:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingReviews = reviews.filter((r) => !r.responded);
  const respondedReviews = reviews.filter((r) => r.responded);

  // Handle AI Response Generation
  const handleAIGenerate = async () => {
    if (!selectedReview) return;
    setIsGeneratingAI(true);
    try {
      const { request } = await import('@/request');
      const res = await request.create({
        entity: `marketing/reputation/reviews/${selectedReview.id}/generate-ai-reply`,
        jsonData: {
          authorName: selectedReview.customer,
          rating: selectedReview.rating,
          comment: selectedReview.content,
        },
      });
      if (res?.result?.draft) {
        setResponseText(res.result.draft);
      }
    } catch (err: any) {
      console.warn('AI generation error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId) => {
    const template = responseTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template);
    if (template) {
      setResponseText(template.content);
    }
  };
  
  // Handle response submission
  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    try {
      const { request } = await import('@/request');
      await request.create({
        entity: `marketing/reputation/reviews/${selectedReview.id}/reply`,
        jsonData: {
          replyText: responseText,
          platform: selectedReview.platform?.toLowerCase() || 'google',
        },
      });

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, responded: true, response: responseText }
            : r
        )
      );
      setResponseText('');
      setSelectedTemplate(null);
      setSelectedReview(null);
    } catch (err: any) {
      console.error('Submit response error:', err);
    }
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
                    
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{translate('Select Response Template')}</Text>
                      <Button
                        type="dashed"
                        icon={<BulbOutlined />}
                        loading={isGeneratingAI}
                        onClick={handleAIGenerate}
                      >
                        {translate('AI Suggest Reply')}
                      </Button>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <Select
                        placeholder={translate('Select a template')}
                        style={{ width: '100%' }}
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