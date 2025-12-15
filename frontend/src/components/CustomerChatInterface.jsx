import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CustomerServiceOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Input,
  List,
  message,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text } = Typography;

const CustomerChatInterface = ({ roomId, accessToken, userType = 'employee' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [otherParticipantOnline, setOtherParticipantOnline] = useState(false);
  const [otherParticipantTyping, setOtherParticipantTyping] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';

    // Connect to chat namespace
    const socket = io(`${backendUrl}/chat`, {
      auth: userType === 'employee' ? { token } : {},
      query: userType === 'customer' ? { accessToken } : {},
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('💬 Connected to chat server');
      setIsConnected(true);

      // Join the room
      socket.emit('chat:join', { roomId, accessToken });
    });

    socket.on('disconnect', () => {
      console.log('👋 Disconnected from chat server');
      setIsConnected(false);
    });

    // Chat events
    socket.on('chat:joined', (data) => {
      console.log('✅ Joined chat room:', data);
      setRoomInfo(data.room);
      setMessages(data.messages || []);
      setLoading(false);
    });

    socket.on('chat:newMessage', (data) => {
      setMessages((prev) => [...prev, data.message]);

      // Mark as read if we're viewing
      socket.emit('chat:markRead');
    });

    socket.on('chat:participantJoined', (data) => {
      setOtherParticipantOnline(true);
      message.info(`${data.name} joined the chat`);
    });

    socket.on('chat:participantLeft', () => {
      setOtherParticipantOnline(false);
    });

    socket.on('chat:participantTyping', (data) => {
      setOtherParticipantTyping(data.isTyping);
    });

    socket.on('chat:messagesRead', () => {
      // Update message read status
      setMessages((prev) => prev.map((msg) => ({ ...msg, read: true })));
    });

    socket.on('chat:closed', (data) => {
      message.warning(`Chat closed: ${data.reason || 'Chat ended'}`);
    });

    socket.on('chat:error', (data) => {
      message.error(data.message);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, accessToken, userType]);

  // Handle typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    // Emit typing indicator
    if (socketRef.current) {
      socketRef.current.emit('chat:typing', { isTyping: true });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('chat:typing', { isTyping: false });
      }, 2000);
    }
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;

    setSending(true);

    socketRef.current.emit('chat:sendMessage', {
      content: newMessage.trim(),
      type: 'text',
    });

    setNewMessage('');
    setSending(false);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current.emit('chat:typing', { isTyping: false });
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Connecting to chat...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <CustomerServiceOutlined />
            <span>{roomInfo?.title || 'Customer Chat'}</span>
          </Space>
          <Space>
            {isConnected ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Connected
              </Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>
                Disconnected
              </Tag>
            )}
            {otherParticipantOnline && <Badge status="success" text="Other party online" />}
          </Space>
        </Space>
      }
      style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f5f5f5',
        }}
      >
        {messages.length === 0 ? (
          <Empty
            description="No messages yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 100 }}
          >
            <Text type="secondary">Start the conversation!</Text>
          </Empty>
        ) : (
          <List
            dataSource={messages}
            renderItem={(msg) => {
              const isMine = msg.sender === userType;
              return (
                <div
                  key={msg._id || msg.timestamp}
                  style={{
                    display: 'flex',
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: isMine ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <Avatar
                      icon={
                        msg.sender === 'employee' ? <CustomerServiceOutlined /> : <UserOutlined />
                      }
                      style={{
                        backgroundColor: msg.sender === 'employee' ? '#1890ff' : '#52c41a',
                      }}
                    />
                    <div>
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          backgroundColor: isMine ? '#1890ff' : '#fff',
                          color: isMine ? '#fff' : '#000',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <Text style={{ color: isMine ? '#fff' : '#000' }}>{msg.content}</Text>
                      </div>
                      <div style={{ marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {dayjs(msg.timestamp).format('h:mm A')}
                        </Text>
                        {isMine && msg.read && (
                          <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                            • Read
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}

        {otherParticipantTyping && (
          <div style={{ padding: '0 16px', color: '#999', fontSize: 12, fontStyle: 'italic' }}>
            <Text type="secondary">typing...</Text>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={!isConnected}
            style={{ flex: 1 }}
          />
          <Tooltip title={!isConnected ? 'Not connected' : 'Send message'}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={sending}
              disabled={!isConnected || !newMessage.trim()}
            >
              Send
            </Button>
          </Tooltip>
        </Space.Compact>
      </div>
    </Card>
  );
};

export default CustomerChatInterface;
