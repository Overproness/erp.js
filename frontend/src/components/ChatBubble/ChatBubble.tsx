import {
  BulbOutlined,
  ClearOutlined,
  CloseOutlined,
  ExperimentOutlined,
  MessageOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useCopilot } from '../../context/useCopilot';
import './ChatBubble.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

/**
 * ChatBubble Component
 * Floating AI copilot chatbot that can be used on any page
 */
export default function ChatBubble({ module = 'general', context = {} }) {
  const {
    isOpen,
    messages,
    isLoading,
    isTyping,
    suggestions,
    sendMessage,
    setModuleContext,
    clearConversation,
    toggleCopilot,
    closeCopilot,
    handleSuggestionClick,
    selectedModel,
    setSelectedModel,
    availableModels,
    availableProviders,
  } = useCopilot();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const moduleSetRef = useRef({ module: '', entityId: '' });

  // AI Model options with icons and colors
  const getModelIcon = (provider) => {
    switch (provider) {
      case 'openai':
        return { icon: <ThunderboltOutlined />, color: '#10a37f' };
      case 'claude':
        return { icon: <ExperimentOutlined />, color: '#D97757' };
      case 'gemini':
        return { icon: <RobotOutlined />, color: '#4285f4' };
      default:
        return { icon: <RobotOutlined />, color: '#666' };
    }
  };

  // Build model options from available models
  const modelOptions = availableModels.map((model) => {
    const { icon, color } = getModelIcon(model.provider);
    return {
      label: model.label,
      value: model.value,
      icon,
      color,
      description: model.description,
    };
  });

  // Fallback to default models if none are loaded yet
  const defaultModelOptions = [
    { label: 'GPT-4o', value: 'gpt-4o', icon: <ThunderboltOutlined />, color: '#10a37f' },
    { label: 'GPT-4o-mini', value: 'gpt-4o-mini', icon: <ThunderboltOutlined />, color: '#10a37f' },
    {
      label: 'Claude 3.5 Sonnet',
      value: 'claude-3-5-sonnet-20241022',
      icon: <ExperimentOutlined />,
      color: '#D97757',
    },
    {
      label: 'Claude 3.5 Haiku',
      value: 'claude-3-5-haiku-20241022',
      icon: <ExperimentOutlined />,
      color: '#D97757',
    },
    { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro', icon: <RobotOutlined />, color: '#4285f4' },
    {
      label: 'Gemini 1.5 Flash',
      value: 'gemini-1.5-flash',
      icon: <RobotOutlined />,
      color: '#4285f4',
    },
  ];

  const displayModelOptions = modelOptions.length > 0 ? modelOptions : defaultModelOptions;

  // console.log('🔍 ChatBubble Debug:', {
  //   availableModels,
  //   modelOptions,
  //   displayModelOptions,
  //   availableProviders,
  // });

  const handleModelChange = (value) => {
    setSelectedModel(value);
    // Clear conversation when model changes
    clearConversation();
  };

  // Debug log to verify component renders
  useEffect(() => {
    // console.log('🤖 ChatBubble component mounted');
    // console.log('ChatBubble isOpen:', isOpen);
    return () => {
      // console.log('🤖 ChatBubble component unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('ChatBubble isOpen changed:', isOpen);
  }, [isOpen]);

  // Set module context when component mounts or module changes
  useEffect(() => {
    // Only set context if module or entityId actually changed
    const currentKey = `${module}-${context.entityId || ''}`;
    const prevKey = `${moduleSetRef.current.module}-${moduleSetRef.current.entityId || ''}`;

    if (currentKey !== prevKey) {
      setModuleContext(module, context);
      moduleSetRef.current = { module, entityId: context.entityId || '' };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, context.entityId, setModuleContext]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;

    return (
      <div
        key={msg.id}
        className={`chat-message ${isUser ? 'user-message' : 'ai-message'} ${
          isError ? 'error-message' : ''
        }`}
      >
        <div className="message-avatar">
          <Avatar
            size="small"
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: isUser ? '#60a5fa' : isError ? '#ff4d4f' : '#10b981',
            }}
          />
        </div>
        <div className="message-content">
          <Paragraph
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </Paragraph>
          {msg.usage && (
            <div className="message-meta">
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Tokens: {msg.usage.total_tokens} | Cost: ${msg.cost?.toFixed(4) || '0.0000'}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="suggestions-container">
        <Space size={[8, 8]} wrap>
          <BulbOutlined style={{ color: '#faad14' }} />
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <Tag
              key={index}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.title || suggestion.question}
            </Tag>
          ))}
        </Space>
      </div>
    );
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Tooltip title="AI Copilot" placement="left">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<MessageOutlined />}
            onClick={toggleCopilot}
            className="chat-bubble-button fixed bottom-4 right-4 w-14 h-14 z-50 cursor-pointer"
            style={{
              position: 'fixed',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.5)',
              zIndex: 9999,
              background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
              border: 'none',
              fontSize: '24px',
            }}
          />
        </Tooltip>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className="chat-bubble-window"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            height: '680px',
            maxHeight: '85vh',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid rgba(96, 165, 250, 0.2)',
          }}
          styles={{
            body: {
              padding: 0,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Header */}
          <div
            className="chat-header"
            style={{
              padding: '18px 20px',
              background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
              color: 'white',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <Space>
                <RobotOutlined style={{ fontSize: '22px' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '17px', lineHeight: '1.2' }}>
                    AI Copilot
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
                    {module === 'general'
                      ? 'General Assistant'
                      : `${module.charAt(0).toUpperCase() + module.slice(1)} Assistant`}
                  </div>
                </div>
              </Space>
              <Space>
                <Tooltip title="Clear conversation">
                  <Button
                    type="text"
                    size="middle"
                    icon={<ClearOutlined />}
                    onClick={clearConversation}
                    style={{ color: 'white' }}
                  />
                </Tooltip>
                <Tooltip title="Close">
                  <Button
                    type="text"
                    size="middle"
                    icon={<CloseOutlined />}
                    onClick={closeCopilot}
                    style={{ color: 'white' }}
                  />
                </Tooltip>
              </Space>
            </div>
            <Select
              value={selectedModel}
              onChange={handleModelChange}
              style={{ width: '100%' }}
              size="middle"
              disabled={availableProviders.length === 0}
              popupClassName="copilot-model-select-dropdown"
            >
              {displayModelOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  <Space>
                    <span style={{ color: opt.color }}>{opt.icon}</span>
                    {opt.label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Messages */}
          <div
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#f8f9fa',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#999',
                }}
              >
                <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>Hello! How can I help you today?</div>
                <Divider />
                {renderSuggestions()}
              </div>
            )}

            {messages.map(renderMessage)}

            {isTyping && (
              <div className="chat-message ai-message">
                <div className="message-avatar">
                  <Avatar
                    size="small"
                    icon={<RobotOutlined />}
                    style={{ backgroundColor: '#10b981' }}
                  />
                </div>
                <div className="message-content">
                  <Spin size="small" /> <Text type="secondary">Thinking...</Text>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length > 0 && suggestions.length > 0 && (
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#fafafa',
                borderTop: '1px solid #f0f0f0',
              }}
            >
              {renderSuggestions()}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: '16px 20px 20px',
              borderTop: '1px solid #e8e8e8',
              backgroundColor: 'white',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={isLoading}
                style={{
                  resize: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={isLoading}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  height: 'auto',
                  minHeight: '32px',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
            </Space.Compact>
          </div>
        </Card>
      )}
    </>
  );
}
