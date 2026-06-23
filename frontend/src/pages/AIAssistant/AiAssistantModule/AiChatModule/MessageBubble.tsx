import React from 'react';
import { Avatar, Typography, Space, Tag, Button } from '@/components/ui';
import { UserOutlined, RobotOutlined, CopyOutlined } from '@/components/icons';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

const { Text, Paragraph } = Typography;

const MessageBubble = ({ message, assistant }) => {
  const { formatDate } = useDate();
  const translate = useLanguage();
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };

  const renderContent = () => {
    if (message.content.startsWith('{') && message.content.endsWith('}')) {
      try {
        const jsonContent = JSON.parse(message.content);
        return (
          <div>
            <Paragraph style={{ margin: 0, color: isUser ? '#fff' : '#000' }}>
              {jsonContent.summary || jsonContent.content}
            </Paragraph>
            {jsonContent.suggestions && (
              <div style={{ marginTop: '8px' }}>
                <Text strong style={{ color: isUser ? '#fff' : '#000' }}>
                  {translate('Suggestions')}:
                </Text>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {jsonContent.suggestions.map((suggestion, index) => (
                    <li key={index} style={{ color: isUser ? '#fff' : '#000' }}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      } catch {
        return (
          <Paragraph style={{ margin: 0, color: isUser ? '#fff' : '#000' }}>
            {message.content}
          </Paragraph>
        );
      }
    }
    return (
      <Paragraph style={{ margin: 0, color: isUser ? '#fff' : '#000' }}>
        {message.content}
      </Paragraph>
    );
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '24px',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      {!isUser && (
        <Avatar 
          size={32}
          icon={<RobotOutlined />} 
          style={{ 
            backgroundColor: '#1890ff',
            flexShrink: 0,
            marginTop: '4px'
          }}
        />
      )}
      
      <div style={{ 
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start'
      }}>
        <div
          style={{
            backgroundColor: isUser ? '#1890ff' : '#fff',
            color: isUser ? '#fff' : '#000',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: isUser ? 'none' : '1px solid #f0f0f0',
            position: 'relative',
            wordBreak: 'break-word'
          }}
        >
          {renderContent()}
          
          {!isUser && (
            <Button
              type="text"
              icon={<CopyOutlined />}
              size="small"
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                color: '#666',
                opacity: 0.7
              }}
            />
          )}
        </div>
        
        {message.metadata && (
          <div style={{ marginTop: '8px' }}>
            <Space size={4} wrap>
              {message.metadata.tokens && (
                <Tag size="small" color="blue" style={{ fontSize: '10px' }}>
                  {message.metadata.tokens} tokens
                </Tag>
              )}
              {message.metadata.cost && (
                <Tag size="small" color="green" style={{ fontSize: '10px' }}>
                  ${message.metadata.cost.toFixed(4)}
                </Tag>
              )}
            </Space>
          </div>
        )}
        
        <Text 
          type="secondary" 
          style={{ 
            fontSize: '11px',
            marginTop: '4px',
            color: '#999'
          }}
        >
          {formatDate(message.timestamp)}
        </Text>
      </div>
      
      {isUser && (
        <Avatar 
          size={32}
          icon={<UserOutlined />} 
          style={{ 
            backgroundColor: '#52c41a',
            flexShrink: 0,
            marginTop: '4px'
          }}
        />
      )}
    </div>
  );
};

export default MessageBubble;
