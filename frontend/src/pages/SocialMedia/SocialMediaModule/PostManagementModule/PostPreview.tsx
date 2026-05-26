import React from 'react';
import { Card, Button, Space, Tag, Avatar, Divider, Typography } from '@/components/ui';
import {
  ArrowLeftOutlined,
  EditOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  UserOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// Register the relativeTime plugin
dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

const PostPreview = ({ post, onEdit, onBack }) => {
  const translate = useLanguage();

  if (!post) {
    return (
      <Card>
        <Text>{translate('No post selected')}</Text>
      </Card>
    );
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getPlatformColor = (platform) => {
    const colors = {
      facebook: '#1877f2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
    };
    return colors[platform] || '#1877f2';
  };

  const FacebookPreview = () => (
    <Card
      style={{
        maxWidth: '500px',
        margin: '16px 0',
        border: '1px solid #e4e6ea',
        borderRadius: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <Avatar icon={<UserOutlined />} style={{ marginRight: '8px' }} />
        <div>
          <Text strong>Your Company Page</Text>
          <div style={{ fontSize: '12px', color: '#65676b' }}>
            {post.scheduledAt ? dayjs(post.scheduledAt).fromNow() : 'Now'}
          </div>
        </div>
      </div>
      
      <Paragraph style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '1.33' }}>
        {post.content}
      </Paragraph>
      
      {post.media && post.media.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ 
            backgroundColor: '#f0f2f5', 
            padding: '20px', 
            textAlign: 'center',
            borderRadius: '8px'
          }}>
            [Media Preview]
          </div>
        </div>
      )}
      
      <Divider style={{ margin: '12px 0' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <Button type="text" icon={<HeartOutlined />} style={{ color: '#65676b' }}>
          Like
        </Button>
        <Button type="text" icon={<MessageOutlined />} style={{ color: '#65676b' }}>
          Comment
        </Button>
        <Button type="text" icon={<ShareAltOutlined />} style={{ color: '#65676b' }}>
          Share
        </Button>
      </div>
    </Card>
  );

  const InstagramPreview = () => (
    <Card
      style={{
        maxWidth: '400px',
        margin: '16px 0',
        border: '1px solid #dbdbdb',
        borderRadius: '3px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px', paddingBottom: '0' }}>
        <Avatar icon={<UserOutlined />} style={{ marginRight: '12px' }} />
        <Text strong>your_company</Text>
      </div>
      
      {post.media && post.media.length > 0 ? (
        <div style={{ 
          backgroundColor: '#fafafa', 
          aspectRatio: '1/1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0'
        }}>
          [Image/Video Preview]
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#fafafa', 
          aspectRatio: '1/1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0',
          color: '#8e8e8e'
        }}>
          [No Media]
        </div>
      )}
      
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Space>
            <HeartOutlined style={{ fontSize: '24px' }} />
            <MessageOutlined style={{ fontSize: '24px' }} />
            <ShareAltOutlined style={{ fontSize: '24px' }} />
          </Space>
        </div>
        
        <Text style={{ fontSize: '14px', lineHeight: '18px' }}>
          <Text strong>your_company</Text> {post.content}
        </Text>
        
        <div style={{ color: '#8e8e8e', fontSize: '10px', marginTop: '8px', paddingBottom: '16px' }}>
          {post.scheduledAt ? dayjs(post.scheduledAt).format('MMMM D, YYYY').toUpperCase() : 'NOW'}
        </div>
      </div>
    </Card>
  );

  const TwitterPreview = () => (
    <Card
      style={{
        maxWidth: '500px',
        margin: '16px 0',
        border: '1px solid #cfd9de',
        borderRadius: '16px',
      }}
    >
      <div style={{ display: 'flex', padding: '12px 16px' }}>
        <Avatar icon={<UserOutlined />} style={{ marginRight: '12px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
            <Text strong style={{ marginRight: '4px' }}>Your Company</Text>
            <Text style={{ color: '#536471' }}>@yourcompany</Text>
            <Text style={{ color: '#536471', margin: '0 4px' }}>·</Text>
            <Text style={{ color: '#536471' }}>
              {post.scheduledAt ? dayjs(post.scheduledAt).fromNow() : 'now'}
            </Text>
          </div>
          
          <Paragraph style={{ marginBottom: '12px', fontSize: '15px', lineHeight: '20px' }}>
            {post.content}
          </Paragraph>
          
          {post.media && post.media.length > 0 && (
            <div style={{ 
              backgroundColor: '#f7f9fa', 
              padding: '20px', 
              textAlign: 'center',
              borderRadius: '16px',
              marginBottom: '12px'
            }}>
              [Media Preview]
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '425px' }}>
            <Button type="text" icon={<MessageOutlined />} style={{ color: '#536471' }}>
              Reply
            </Button>
            <Button type="text" icon={<ShareAltOutlined />} style={{ color: '#536471' }}>
              Retweet
            </Button>
            <Button type="text" icon={<HeartOutlined />} style={{ color: '#536471' }}>
              Like
            </Button>
            <Button type="text" icon={<ShareAltOutlined />} style={{ color: '#536471' }}>
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: '16px' }}
        >
          {translate('Back')}
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>{translate('Post Preview')}</h3>
            <div style={{ marginTop: '8px' }}>
              <Space wrap>
                {post.platforms.map(platform => (
                  <Tag
                    key={platform}
                    color={getPlatformColor(platform)}
                    icon={getPlatformIcon(platform)}
                  >
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
          
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => onEdit(post)}
          >
            {translate('Edit Post')}
          </Button>
        </div>
      </div>

      {/* Platform Previews */}
      <div>
        {post.platforms.includes('facebook') && (
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FacebookOutlined style={{ color: '#1877f2' }} />
              Facebook Preview
            </h4>
            <FacebookPreview />
          </div>
        )}

        {post.platforms.includes('instagram') && (
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <InstagramOutlined style={{ color: '#E4405F' }} />
              Instagram Preview
            </h4>
            <InstagramPreview />
          </div>
        )}

        {post.platforms.includes('twitter') && (
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TwitterOutlined style={{ color: '#1DA1F2' }} />
              Twitter Preview
            </h4>
            <TwitterPreview />
          </div>
        )}
      </div>

      {/* Post Details */}
      <Card title={translate('Post Details')} style={{ marginTop: '24px' }}>
        <div>
          <Text strong>{translate('Status')}: </Text>
          <Tag color={post.status === 'published' ? 'green' : post.status === 'scheduled' ? 'blue' : 'default'}>
            {translate(post.status)}
          </Tag>
        </div>
        
        {post.scheduledAt && (
          <div style={{ marginTop: '8px' }}>
            <Text strong>{translate('Scheduled for')}: </Text>
            <Text>{dayjs(post.scheduledAt).format('MMMM D, YYYY [at] h:mm A')}</Text>
          </div>
        )}
        
        {post.created ? (
          <div style={{ marginTop: '8px' }}>
            <Text strong>{translate('Created')}: </Text>
            <Text>{dayjs(post.created).format('MMMM D, YYYY [at] h:mm A')}</Text>
          </div>
        ) : (
          <div style={{ marginTop: '8px' }}>
            <Text strong>{translate('Created')}: </Text>
            <Text>{translate('Not available')}</Text>
          </div>
        )}
        
        {post.campaign && (
          <div style={{ marginTop: '8px' }}>
            <Text strong>{translate('Campaign')}: </Text>
            <Text>{post.campaign.name}</Text>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PostPreview;
