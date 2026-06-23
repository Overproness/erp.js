import useLanguage from '@/locale/useLanguage';
import {
  selectChatLoading,
  selectChatMessages,
  selectChatTyping,
  selectConversations,
  selectCurrentConversation,
} from '@/redux/ai/aiSelectors';
import { loadConversation, resetChat } from '@/redux/ai/aiSlice';
import { fetchConversation, fetchConversations, sendChatMessage } from '@/redux/ai/aiThunks';
import { useDate } from '@/settings';
import { DownOutlined, HistoryOutlined, PlusOutlined, RobotOutlined } from '@/components/icons';
import { Avatar, Button, Dropdown, Empty, Layout, Space, Typography } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApiKeyWarning from './ApiKeyWarning';
import InputArea from './InputArea';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import TypingIndicator from './TypingIndicator';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

const ChatInterface = ({ assistant }) => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const { formatDate } = useDate();
  const messages = useSelector(selectChatMessages);
  const isTyping = useSelector(selectChatTyping);
  const isLoading = useSelector(selectChatLoading);
  const conversations = useSelector(selectConversations) || [];
  const currentConversation = useSelector(selectCurrentConversation);
  const messagesEndRef = useRef(null);
  const [context, setContext] = useState({});
  const [hasApiKey, setHasApiKey] = useState(false);

  // Fetch conversations and load the most recent one when assistant changes
  useEffect(() => {
    if (assistant?._id) {
      dispatch(fetchConversations(assistant._id))
        .unwrap()
        .then((conversations) => {
          if (conversations && conversations.length > 0) {
            const mostRecentConversation = conversations[0];
            dispatch(
              fetchConversation({
                assistantId: assistant._id,
                conversationId: mostRecentConversation.id || mostRecentConversation._id,
              })
            )
              .unwrap()
              .then((conversationData) => {
                dispatch(loadConversation(conversationData));
              })
              .catch(() => {
                dispatch(resetChat());
              });
          } else {
            dispatch(resetChat());
          }
        })
        .catch(() => {
          dispatch(resetChat());
        });
    }
  }, [assistant, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageData) => {
    if (!assistant || (!messageData.text?.trim() && !messageData.files?.length)) return;

    // Check if user has configured their API key
    if (!hasApiKey) {
      console.warn('Cannot send message: API key not configured');
      return;
    }

    try {
      // Handle files if present
      let messageContent = messageData.text || '';

      if (messageData.files && messageData.files.length > 0) {
        const fileInfo = messageData.files.map((file) => `[File: ${file.name}]`).join(' ');
        messageContent = messageContent ? `${messageContent}\n\n${fileInfo}` : fileInfo;
      }

      await dispatch(
        sendChatMessage({
          assistantId: assistant._id,
          message: messageContent,
          context: {
            ...context,
            files: messageData.files || [],
          },
        })
      ).unwrap();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleApiKeyCheck = (hasKey) => {
    setHasApiKey(hasKey);
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage({ text: suggestion });
  };

  const handleNewConversation = () => {
    dispatch(resetChat());
  };

  const handleLoadConversation = async (conversation) => {
    try {
      if (assistant) {
        const conversationData = await dispatch(
          fetchConversation({
            assistantId: assistant._id,
            conversationId: conversation.id || conversation._id,
          })
        ).unwrap();

        dispatch(loadConversation(conversationData));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const getWelcomeMessage = () => {
    const typeMessages = {
      general: translate("Hello! I'm your general AI assistant. How can I help you today?"),
      document: translate("Hi! I'm here to help you with document analysis and management."),
      workflow: translate(
        'Hello! I specialize in workflow optimization. What processes would you like to improve?'
      ),
      analytics: translate('Hi! I can help you analyze your business data and provide insights.'),
      customer: translate("Hello! I'm your customer relationship specialist."),
      financial: translate("Hi! I'm here to help with financial analysis and advice."),
    };
    return typeMessages[assistant?.type] || typeMessages.general;
  };

  const getSuggestions = () => {
    const typeSuggestions = {
      general: [
        translate('What can you help me with?'),
        translate('Show me business insights'),
        translate('Analyze my data'),
      ],
      document: [
        translate('Analyze this document'),
        translate('Extract key information'),
        translate('Suggest document tags'),
      ],
      workflow: [
        translate('Optimize my workflow'),
        translate('Identify bottlenecks'),
        translate('Suggest automation'),
      ],
      analytics: [
        translate('Show business trends'),
        translate('Predict sales forecast'),
        translate('Analyze customer behavior'),
      ],
      customer: [
        translate('Customer segmentation'),
        translate('Retention strategies'),
        translate('Upselling opportunities'),
      ],
      financial: [
        translate('Cash flow analysis'),
        translate('Financial forecast'),
        translate('Cost optimization'),
      ],
    };
    return typeSuggestions[assistant?.type] || typeSuggestions.general;
  };

  if (!assistant) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#fafafa',
        }}
      >
        <Empty
          image={<RobotOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4} type="secondary">
                {translate('Select an AI assistant to start chatting')}
              </Title>
              <Text type="secondary">
                {translate('Choose an assistant from the sidebar to begin your conversation')}
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px',
          flexShrink: 0,
        }}
      >
        <Space align="center">
          <Avatar size={40} icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
              {assistant.name}
            </Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {currentConversation?.title
                ? `${currentConversation.title} • ${translate(assistant.type)}`
                : `${translate(assistant.type)} • ${assistant.model?.modelName || 'AI Model'}`}
            </Text>
          </div>
        </Space>

        {/* Conversation History Dropdown */}
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
            size="small"
          >
            {translate('New Chat')}
          </Button>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'current',
                  label: currentConversation
                    ? currentConversation.title || translate('Current Conversation')
                    : translate('New Conversation'),
                  disabled: true,
                  style: { fontWeight: 'bold', color: '#1890ff' },
                },
                { type: 'divider' },
                ...conversations.slice(0, 10).map((conv, index) => ({
                  key: conv.id || conv._id,
                  label: (
                    <div style={{ width: '250px' }}>
                      <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                        {conv.title || translate('Untitled Conversation')}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {formatDate(conv.created)} • {conv.messageCount || 0} messages
                      </div>
                    </div>
                  ),
                  onClick: () => handleLoadConversation(conv),
                })),
              ],
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button icon={<HistoryOutlined />} size="small">
              {translate('History')} <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      {/* API Key Warning */}
      <ApiKeyWarning onApiKeyCheck={handleApiKeyCheck} />

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#fafafa',
            padding: messages.length === 0 ? '0' : '0 24px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '40px 20px',
              }}
            >
              <Avatar
                size={80}
                icon={<RobotOutlined />}
                style={{
                  backgroundColor: '#1890ff',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                }}
              />
              <Title level={3} style={{ marginBottom: '8px', color: '#262626' }}>
                {assistant.name}
              </Title>
              <Text
                type="secondary"
                style={{
                  marginBottom: '32px',
                  fontSize: '16px',
                  maxWidth: '400px',
                  lineHeight: '1.5',
                }}
              >
                {getWelcomeMessage()}
              </Text>
              <SuggestionChips
                suggestions={getSuggestions()}
                onSuggestionClick={handleSuggestionClick}
              />
            </div>
          ) : (
            <div
              style={{
                paddingTop: '20px',
                paddingBottom: '20px',
              }}
            >
              {/* Conversation Header - shown when conversation is loaded */}
              {currentConversation && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '16px',
                    marginBottom: '16px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #f0f0f0',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {translate('Conversation')}:{' '}
                    {currentConversation.title || translate('Untitled')}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {translate('Started')} {formatDate(currentConversation.created)}
                  </Text>
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || `${message.timestamp}-${index}`}
                  message={message}
                  assistant={assistant}
                />
              ))}
              {isTyping && <TypingIndicator assistant={assistant} />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            backgroundColor: '#fff',
            borderTop: '1px solid #f0f0f0',
            padding: '16px 24px',
            flexShrink: 0,
            minHeight: '80px',
          }}
        >
          <InputArea
            onSendMessage={handleSendMessage}
            disabled={isLoading || !hasApiKey}
            placeholder={
              hasApiKey
                ? translate('Type your message...')
                : translate('Configure your OpenAI API key to start chatting...')
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
