import React from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Divider,
  Space, 
  Alert,
  Table
} from '@/components/ui';
import {
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  MobileOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const CampaignReview = ({ formData, segments }) => {
  const translate = useLanguage();

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('MMM D, YYYY');
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    const icons = {
      email: <MailOutlined style={{ color: '#4f46e5' }} />,
      sms: <MobileOutlined style={{ color: '#10b981' }} />,
      push: <BellOutlined style={{ color: '#f59e0b' }} />,
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      twitter: <TwitterOutlined style={{ color: '#1da1f2' }} />,
      linkedin: <LinkedinOutlined style={{ color: '#0a66c2' }} />,
      instagram: <InstagramOutlined style={{ color: '#e4405f' }} />
    };
    
    return icons[channel] || <GlobalOutlined />;
  };

  // Calculate audience size
  const calculateAudienceSize = () => {
    if (formData?.audienceType === 'segment' && formData?.segmentIds?.length > 0) {
      return segments
        ?.filter(s => formData.segmentIds.includes(s.id))
        .reduce((sum, segment) => sum + (segment.count || 0), 0) || 0;
    }
    
    return formData?.customAudience?.estimatedSize || 0;
  };

  // Check if any warning conditions exist
  const hasWarnings = () => {
    const warnings = [];
    
    // Check if campaign is missing a subject line
    if (formData?.type === 'email' && !formData?.content?.email?.subject) {
      warnings.push(translate('Email is missing a subject line'));
    }
    
    // Check if campaign has no audience
    if ((!formData?.segmentIds || formData?.segmentIds.length === 0) && 
        formData?.audienceType === 'segment') {
      warnings.push(translate('No audience segments selected'));
    }
    
    // Return warnings array
    return warnings;
  };

  const warnings = hasWarnings();

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{translate('Review Campaign')}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {translate('Review your campaign settings before launching')}
      </Text>

      {warnings.length > 0 && (
        <Alert
          message={translate('Campaign Warnings')}
          description={
            <ul style={{ paddingLeft: '20px', marginBottom: 0 }}>
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card title={translate('Campaign Information')} size="small">
            <Descriptions column={1} size="small" layout="vertical" bordered>
              <Descriptions.Item label={translate('Campaign Name')}>
                <Text strong>{formData?.name || 'Untitled Campaign'}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Campaign Type')}>
                {formData?.type === 'email' && <Tag color="blue"><MailOutlined /> {translate('Email')}</Tag>}
                {formData?.type === 'sms' && <Tag color="green"><MobileOutlined /> {translate('SMS')}</Tag>}
                {formData?.type === 'push' && <Tag color="orange"><BellOutlined /> {translate('Push')}</Tag>}
                {formData?.type === 'multi' && <Tag color="purple"><GlobalOutlined /> {translate('Multi-channel')}</Tag>}
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Status')}>
                {formData?.status === 'draft' && <Tag>{translate('Draft')}</Tag>}
                {formData?.status === 'scheduled' && <Tag color="blue">{translate('Scheduled')}</Tag>}
                {formData?.status === 'active' && <Tag color="green">{translate('Active')}</Tag>}
              </Descriptions.Item>
              
              {formData?.description && (
                <Descriptions.Item label={translate('Description')}>
                  {formData.description}
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label={translate('Campaign Duration')}>
                {formData?.dateRange ? (
                  <div>
                    <CalendarOutlined /> {formatDate(formData.dateRange[0])} - {formatDate(formData.dateRange[1])}
                  </div>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </Descriptions.Item>
              
              {formData?.budget !== undefined && formData?.budget !== null && (
                <Descriptions.Item label={translate('Budget')}>
                  ${formData.budget}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
          
          <Card title={translate('Audience Information')} size="small" style={{ marginTop: '16px' }}>
            <Descriptions column={1} size="small" layout="vertical" bordered>
              <Descriptions.Item label={translate('Audience Type')}>
                {formData?.audienceType === 'segment' ? (
                  <Tag color="blue"><UserOutlined /> {translate('Segment Audience')}</Tag>
                ) : (
                  <Tag color="purple"><UserOutlined /> {translate('Custom Audience')}</Tag>
                )}
              </Descriptions.Item>
              
              {formData?.audienceType === 'segment' && (
                <Descriptions.Item label={translate('Selected Segments')}>
                  {formData?.segmentIds?.length > 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {segments
                        ?.filter(segment => formData.segmentIds.includes(segment.id))
                        .map(segment => (
                          <div key={segment.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text>{segment.name}</Text>
                            <Text type="secondary">{segment.count?.toLocaleString() || 0} {translate('contacts')}</Text>
                          </div>
                        ))
                      }
                    </Space>
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </Descriptions.Item>
              )}
              
              {formData?.audienceType === 'custom' && formData?.customAudience?.criteria?.length > 0 && (
                <Descriptions.Item label={translate('Audience Criteria')}>
                  <Space wrap>
                    {formData.customAudience.criteria.map(criteria => (
                      <Tag key={criteria}>{criteria}</Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
              
              <Descriptions.Item label={translate('Total Audience Size')}>
                <Text strong>{calculateAudienceSize().toLocaleString()}</Text> {translate('contacts')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title={translate('Delivery Information')} size="small">
            <Descriptions column={1} size="small" layout="vertical" bordered>
              <Descriptions.Item label={translate('Selected Channels')}>
                <Space wrap>
                  {formData?.channels?.map(channel => (
                    <Tag key={channel} icon={getChannelIcon(channel)}>
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              
              {formData?.channels?.map(channel => {
                const schedule = formData?.channelSettings?.[channel]?.schedule;
                return (
                  <Descriptions.Item 
                    key={channel} 
                    label={`${translate(channel.charAt(0).toUpperCase() + channel.slice(1))} ${translate('Schedule')}`}
                  >
                    {schedule === 'immediate' && <Text>{translate('Send immediately')}</Text>}
                    {schedule === 'scheduled' && (
                      <Text>{translate('Scheduled for')} {formData?.channelSettings?.[channel]?.scheduledTime}</Text>
                    )}
                    {schedule === 'optimal' && <Text>{translate('Send at optimal time')}</Text>}
                  </Descriptions.Item>
                );
              })}
              
              <Descriptions.Item label={translate('Time Zone Handling')}>
                {formData?.timeZoneSettings === 'recipient' ? (
                  <Text>{translate('Based on recipient time zone')}</Text>
                ) : (
                  <Text>{translate('Based on campaign time zone')}</Text>
                )}
              </Descriptions.Item>
              
              {formData?.abTesting && (
                <Descriptions.Item label={translate('A/B Testing')}>
                  <Tag color="green"><CheckCircleOutlined /> {translate('Enabled')}</Tag>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
          
          <Card title={translate('Content Summary')} size="small" style={{ marginTop: '16px' }}>
            {/* Email Content Summary */}
            {formData?.type === 'email' && (
              <Descriptions column={1} size="small" layout="vertical" bordered>
                <Descriptions.Item label={translate('Subject Line')}>
                  {formData?.content?.email?.subject || <Text type="secondary">—</Text>}
                </Descriptions.Item>
                
                <Descriptions.Item label={translate('Content Preview')}>
                  {formData?.contentMode === 'template' ? (
                    <Text>{translate('Using template')}</Text>
                  ) : (
                    <Text>{translate('Custom content')}</Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
            
            {/* SMS Content Summary */}
            {formData?.type === 'sms' && (
              <Descriptions column={1} size="small" layout="vertical" bordered>
                <Descriptions.Item label={translate('Message')}>
                  {formData?.content?.sms?.message || <Text type="secondary">—</Text>}
                </Descriptions.Item>
                
                <Descriptions.Item label={translate('Includes Opt-out')}>
                  {formData?.content?.sms?.includeUnsubscribeLink ? (
                    <CheckCircleOutlined style={{ color: '#10b981' }} />
                  ) : (
                    <InfoCircleOutlined style={{ color: '#f59e0b' }} />
                  )}
                </Descriptions.Item>
              </Descriptions>
            )}
            
            {/* Push Content Summary */}
            {formData?.type === 'push' && (
              <Descriptions column={1} size="small" layout="vertical" bordered>
                <Descriptions.Item label={translate('Title')}>
                  {formData?.content?.push?.title || <Text type="secondary">—</Text>}
                </Descriptions.Item>
                
                <Descriptions.Item label={translate('Message')}>
                  {formData?.content?.push?.body || <Text type="secondary">—</Text>}
                </Descriptions.Item>
                
                <Descriptions.Item label={translate('Action URL')}>
                  {formData?.content?.push?.actionUrl || <Text type="secondary">—</Text>}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Alert
          message={translate('Ready to Launch')}
          description={translate('Your campaign is now ready to be launched or saved as a draft.')}
          type="success"
          showIcon
        />
      </div>
    </Card>
  );
};

export default CampaignReview;
