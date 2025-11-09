import { useState, useEffect, useRef } from 'react';
import { Input, Button, Avatar, Typography, Space, Spin, message, Popover, Row, Col } from 'antd';
import { SendOutlined, MessageOutlined, PlusOutlined, SmileOutlined, MoreOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '@/request';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';

const { TextArea } = Input;
const { Text, Title } = Typography;

// Emoji categories with popular emojis
const emojiCategories = {
  '😀 Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'],
  '👍 Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✊', '👊', '🤛', '🤜', '👋', '🤚', '🖐', '✋', '🖖', '👌'],
  '❤️ Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  '🎉 Objects': ['🎉', '🎊', '🎈', '🎁', '🎂', '🎄', '🎃', '🎆', '🎇', '✨', '🎀', '🎗', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅'],
  '😢 Emotions': ['😢', '😭', '😤', '😠', '😡', '🤬', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🙄', '😴', '😪', '🤤', '😵', '🤐', '🤢', '🤮', '🤧', '😷', '🤒', '🤕']
};

// Emoji Picker Component
const EmojiPicker = ({ onEmojiSelect, visible, onVisibleChange }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(emojiCategories)[0]);

  const emojiContent = (
    <div style={{ width: '260px', maxHeight: '260px' }}>
      {/* Category Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        padding: '8px', 
        borderBottom: '1px solid #f0f0f0',
        overflowX: 'auto'
      }}>
        {Object.keys(emojiCategories).map(category => (
          <Button
            key={category}
            size="small"
            type={activeCategory === category ? 'primary' : 'text'}
            onClick={() => setActiveCategory(category)}
            style={{
              minWidth: 'auto',
              padding: '4px 8px',
              fontSize: '12px',
              background: activeCategory === category ? '#667eea' : 'transparent'
            }}
          >
            {category.split(' ')[0]}
          </Button>
        ))}
      </div>
      
      {/* Emoji Grid */}
      <div style={{ 
        padding: '12px',
        maxHeight: '180px',
        overflowY: 'auto'
      }}>
        <Row gutter={[4, 4]}>
          {emojiCategories[activeCategory].map(emoji => (
            <Col key={emoji} span={4}>
              <Button
                type="text"
                style={{
                  width: '100%',
                  height: '32px',
                  fontSize: '18px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  onEmojiSelect(emoji);
                  onVisibleChange(false);
                }}
              >
                {emoji}
              </Button>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );

  return (
    <Popover
      content={emojiContent}
      trigger="click"
      open={visible}
      onOpenChange={onVisibleChange}
      placement="topLeft"
    >
      <Button
        type="text"
        icon={<SmileOutlined />}
        style={{
          color: '#94a3b8',
          fontSize: '18px',
          padding: '8px'
        }}
      />
    </Popover>
  );
};

export default function Chat() {
  const navigate = useNavigate();
  const { selectedUserId } = useParams();
  const currentUser = useSelector(selectCurrentAdmin);
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial data
  useEffect(() => {
    loadChatData();
  }, []);

  // Handle URL parameter for selected user
  useEffect(() => {
    if (selectedUserId && companyUsers.length > 0) {
      const user = companyUsers.find(u => u._id === selectedUserId);
      if (user) {
        selectUser(user);
      }
    }
  }, [selectedUserId, companyUsers]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      
      // Load conversations and company users in parallel
      const [conversationsRes, usersRes] = await Promise.all([
        request.get('/chat/list'),
        request.get('/chat/users')
      ]);

      if (conversationsRes.success) {
        setConversations(conversationsRes.result);
      }

      if (usersRes.success) {
        setCompanyUsers(usersRes.result);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
      message.error('Failed to load chat data');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user) => {
    if (!user || user._id === selectedUser?._id) return;
    
    setSelectedUser(user);
    setLoadingMessages(true);
    navigate(`/chat/${user._id}`);

    try {
      const response = await request.get(`/chat/history/${user._id}`);
      
      if (response.success) {
        setMessages(response.result);
        // Update conversation list to mark as read
        await loadChatData();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      message.error('Failed to load chat history');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedUser || sendingMessage) return;

    const tempMessage = {
      _id: Date.now(),
      message: messageText.trim(),
      sender: { _id: currentUser._id, name: currentUser.name },
      receiver: selectedUser,
      createdAt: new Date().toISOString(),
      isTemp: true
    };

    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    const currentMessage = messageText;
    setMessageText('');
    setSendingMessage(true);

    try {
      const response = await request.post('/chat/send', {
        receiverId: selectedUser._id,
        message: currentMessage
      });

      if (response.success) {
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(msg =>
            msg.isTemp && msg._id === tempMessage._id
              ? response.result
              : msg
          )
        );
        // Optionally update conversations list here if needed, but do NOT reload all chat data
        // Example: update last message for selected conversation
        setConversations(prev =>
          prev.map(conv =>
            conv.otherUserInfo?._id === selectedUser._id
              ? { ...conv, lastMessage: response.result }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      setMessageText(currentMessage);
    } finally {
      setSendingMessage(false);
      messageInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + emoji);
    messageInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text style={{ color: '#64748b' }}>Loading your conversations...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{
      height: '80vh',
      width: '70vw',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Fixed Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
        width: '100%',
        borderRadius: '16px 16px 0 0',
        margin: '0px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageOutlined style={{ fontSize: '20px' }} />
          </div>
          <div>
            <Title level={3} style={{ margin: 0, color: 'white', fontSize: '20px' }}>
              💬 Team Chat
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
              Connect and collaborate with your team members
            </Text>
          </div>
        </div>
      </div>

      {/* Main Chat Container */}
      <div style={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        background: 'white',
        borderRadius: '0 0 16px 16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '180px',
          background: 'white',
          borderRight: '1px solid #f1f5f9',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            flexShrink: 0
          }}>
            <div style={{ marginBottom: '12px' }}>
              <Title level={4} style={{ margin: 0, color: '#475569', fontSize: '15px' }}>
                💭 Conversations
              </Title>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              size="middle"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                height: '32px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
              }}
              onClick={() => setSelectedUser(null)}
            >
              ✨ New Chat
            </Button>
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0
          }}>
            {/* Recent Conversations */}
            {conversations.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#f8fafc'
                }}>
                  📝 Recent
                </div>
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      background: selectedUser?._id === conversation.otherUserInfo?._id
                        ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                        : 'white',
                      borderLeft: selectedUser?._id === conversation.otherUserInfo?._id
                        ? '3px solid #667eea'
                        : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUser?._id !== conversation.otherUserInfo?._id) {
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUser?._id !== conversation.otherUserInfo?._id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                    onClick={() => selectUser(conversation.otherUserInfo)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar
                        size={32}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white'
                        }}
                      >
                        {conversation.otherUserInfo?.name?.charAt(0)?.toUpperCase() || '👤'}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1a202c',
                          fontSize: '13px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.otherUserInfo?.name || 'Unknown User'}
                        </div>
                        <div style={{
                          color: '#64748b',
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.lastMessage.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members */}
            {companyUsers.length > 0 && (
              <div>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#f8fafc'
                }}>
                  👥 Team
                </div>
                {companyUsers.map((user) => (
                  <div
                    key={user._id}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f8fafc',
                      background: selectedUser?._id === user._id
                        ? 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'
                        : 'white',
                      borderLeft: selectedUser?._id === user._id
                        ? '3px solid #667eea'
                        : '3px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedUser?._id !== user._id) {
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedUser?._id !== user._id) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                    onClick={() => selectUser(user)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar
                        size={32}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white'
                        }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() || '👤'}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1a202c',
                          fontSize: '13px',
                          marginBottom: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.name}
                        </div>
                        <div style={{
                          color: '#64748b',
                          fontSize: '11px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.userType === 'companyOwner' ? '👑 Company Owner' : `👤 ${user.role}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {conversations.length === 0 && companyUsers.length === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                padding: '12px',
                color: '#64748b'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <Text style={{ textAlign: 'center', color: '#64748b' }}>
                  No team members found
                </Text>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{
          flex: 1,
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: 0,
          margin: 0,
          padding: 0
        }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{
                background: 'white',
                borderBottom: '1px solid #f1f5f9',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Avatar
                    size={36}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}
                  >
                    {selectedUser.name?.charAt(0)?.toUpperCase() || '👤'}
                  </Avatar>
                  <div>
                    <Title level={5} style={{ margin: 0, fontSize: '14px', color: '#1a202c' }}>
                      {selectedUser.name}
                    </Title>
                    <Text style={{ fontSize: '11px', color: '#64748b' }}>
                      {selectedUser.userType === 'companyOwner' ? '👑 Company Owner' : `👤 ${selectedUser.role}`}
                    </Text>
                  </div>
                </div>
                <Button type="text" icon={<MoreOutlined />} />
              </div>

              {/* Messages Container */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                {loadingMessages ? (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Space direction="vertical" align="center">
                      <Spin />
                      <Text style={{ color: '#64748b' }}>Loading messages...</Text>
                    </Space>
                  </div>
                ) : messages.length > 0 ? (
                  <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    {messages.map((msg, index) => {
                      const isCurrentUser = msg.sender?._id === currentUser._id;
                      const showTime = index === 0 ||
                        new Date(msg.createdAt).getTime() - new Date(messages[index-1]?.createdAt).getTime() > 300000;
                        
                      return (
                        <div key={msg._id}>
                          {showTime && (
                            <div style={{
                              textAlign: 'center',
                              fontSize: '10px',
                              color: '#94a3b8',
                              padding: '4px 0',
                              position: 'relative'
                            }}>
                              <span style={{
                                background: '#f8fafc',
                                padding: '2px 8px',
                                borderRadius: '12px'
                              }}>
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end',
                            gap: '6px'
                          }}>
                            {!isCurrentUser && (
                              <Avatar
                                size={24}
                                style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  fontSize: '12px',
                                  flexShrink: 0
                                }}
                              >
                                {msg.sender?.name?.charAt(0)?.toUpperCase() || '👤'}
                              </Avatar>
                            )}
                            <div style={{
                              maxWidth: '70%',
                              minWidth: '40px'
                            }}>
                              <div style={{
                                padding: '8px 12px',
                                borderRadius: isCurrentUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                background: isCurrentUser
                                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                  : 'white',
                                color: isCurrentUser ? 'white' : '#1a202c',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                position: 'relative',
                                opacity: msg.isTemp ? 0.7 : 1,
                                animation: msg.isTemp ? 'pulse 2s infinite' : 'none'
                              }}>
                                <div style={{
                                  wordBreak: 'break-word',
                                  lineHeight: '1.4',
                                  fontSize: '13px'
                                }}>
                                  {msg.message}
                                </div>
                                <div style={{
                                  fontSize: '9px',
                                  marginTop: '2px',
                                  opacity: 0.7,
                                  textAlign: 'right'
                                }}>
                                  {formatTime(msg.createdAt)}
                                  {msg.isTemp && ' • Sending...'}
                                </div>
                              </div>
                            </div>
                            {isCurrentUser && (
                              <Avatar
                                size={24}
                                style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  fontSize: '12px',
                                  flexShrink: 0
                                }}
                              >
                                {currentUser.name?.charAt(0)?.toUpperCase() || '👤'}
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '32px' }}>💬</div>
                    <div style={{ textAlign: 'center' }}>
                      <Title level={4} style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
                        No messages yet
                      </Title>
                      <Text style={{ color: '#94a3b8', fontSize: '12px' }}>
                        Start the conversation with {selectedUser.name}!
                      </Text>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input - Fixed at bottom */}
              <div style={{
                background: 'white',
                borderTop: '1px solid #f1f5f9',
                padding: '10px 16px',
                flexShrink: 0,
                boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '6px 8px',
                  border: '1px solid #e2e8f0',
                  minHeight: '38px'
                }}>
                  <EmojiPicker 
                    onEmojiSelect={handleEmojiSelect}
                    visible={emojiPickerVisible}
                    onVisibleChange={setEmojiPickerVisible}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextArea
                      ref={messageInputRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message... 😊"
                      autoSize={{ minRows: 1, maxRows: 3 }}
                      onKeyPress={handleKeyPress}
                      disabled={sendingMessage}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        resize: 'none',
                        fontSize: '13px',
                        boxShadow: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sendingMessage}
                    disabled={!messageText.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      height: '28px',
                      paddingLeft: '8px',
                      paddingRight: '8px',
                      boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>💬</div>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '16px' }}>
                  Select a team member to start chatting
                </Title>
                <Text style={{ color: '#94a3b8', fontSize: '13px' }}>
                  Choose someone from your team to begin a conversation
                </Text>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}