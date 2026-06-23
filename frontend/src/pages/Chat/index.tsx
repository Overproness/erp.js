import { Avatar, Button, Input, message, Popover, Spin, Typography } from '@/components/ui';
import apolloClient from '@/graphql/client';
import { GET_ADMIN_LIST } from '@/graphql/operations/auth';
import { GET_CHAT_MESSAGES, GET_CHAT_ROOMS, SEND_CHAT_MESSAGE } from '@/graphql/operations/chat';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import {
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
  SmileOutlined,
  TeamOutlined,
  UserOutlined,
} from '@/components/icons';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const { TextArea } = Input;
const { Text, Title } = Typography;

const emojiCategories = {
  Smileys: [
    '😀',
    '😃',
    '😄',
    '😁',
    '😆',
    '😅',
    '🤣',
    '😂',
    '🙂',
    '😉',
    '😊',
    '😇',
    '🥰',
    '😍',
    '😘',
    '😋',
    '😛',
    '😜',
    '🤔',
    '😐',
    '😑',
    '😏',
    '😒',
    '😬',
    '🤥',
  ],
  Gestures: [
    '👍',
    '👎',
    '👌',
    '✌️',
    '🤞',
    '👈',
    '👉',
    '👆',
    '👇',
    '👏',
    '🙌',
    '🤝',
    '🙏',
    '✊',
    '👊',
    '👋',
    '✋',
  ],
  Hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💕', '💞', '💓', '💗', '💖', '💘'],
  Objects: ['🎉', '🎊', '🎈', '🎁', '🎂', '🏆', '🥇', '⭐', '🔥', '✨', '💡', '📌', '🔔', '📧'],
};

const EmojiPicker = ({ onEmojiSelect, visible, onVisibleChange }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(emojiCategories)[0]);

  const emojiContent = (
    <div style={{ width: '260px' }}>
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px',
          borderBottom: '1px solid #f0f0f0',
          overflowX: 'auto',
        }}
      >
        {Object.keys(emojiCategories).map((cat) => (
          <Button
            key={cat}
            size="small"
            type={activeCategory === cat ? 'primary' : 'text'}
            onClick={() => setActiveCategory(cat)}
            style={{ minWidth: 'auto', padding: '2px 8px', fontSize: '12px' }}
          >
            {cat}
          </Button>
        ))}
      </div>
      <div
        style={{
          padding: '8px',
          maxHeight: '180px',
          overflowY: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
        }}
      >
        {emojiCategories[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onVisibleChange(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '2px',
              borderRadius: '4px',
              lineHeight: 1,
            }}
          >
            {emoji}
          </button>
        ))}
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
      <Button type="text" icon={<SmileOutlined />} style={{ color: '#8c8c8c' }} />
    </Popover>
  );
};

export default function Chat() {
  const navigate = useNavigate();
  const { selectedUserId } = useParams();
  const currentUser = useSelector(selectCurrentAdmin);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadChatData();
  }, []);

  useEffect(() => {
    if (selectedUserId && companyUsers.length > 0) {
      const user = companyUsers.find((u) => u._id === selectedUserId);
      if (user) selectUser(user);
    }
  }, [selectedUserId, companyUsers]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      const conversationsRes = await apolloClient.query({ query: GET_CHAT_ROOMS });
      if (conversationsRes.data?.chatRoomList?.success) {
        setConversations(conversationsRes.data.chatRoomList.result);
      }
      try {
        const { data: usersData } = await apolloClient.query({
          query: GET_ADMIN_LIST,
          variables: { page: 1, limit: 1000 },
        });
        if (usersData.adminList?.success) setCompanyUsers(usersData.adminList.result);
      } catch {
        /* not critical */
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
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
      const { data } = await apolloClient.query({
        query: GET_CHAT_MESSAGES,
        variables: { roomId: user._id },
      });
      if (data.chatMessageList?.success) {
        setMessages(data.chatMessageList.result);
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
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMessage]);
    const currentMessage = messageText;
    setMessageText('');
    setSendingMessage(true);
    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_CHAT_MESSAGE,
        variables: { input: { roomId: selectedUser._id, content: currentMessage } },
      });
      if (data.chatMessageSend?.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.isTemp && msg._id === tempMessage._id ? data.chatMessageSend.result : msg
          )
        );
        setConversations((prev) =>
          prev.map((conv) =>
            conv.otherUserInfo?._id === selectedUser._id
              ? { ...conv, lastMessage: data.chatMessageSend.result }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
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
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText((prev) => prev + emoji);
    messageInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div
        style={{ height: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const PRIMARY = '#5b8def';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 128px)',
        minHeight: '500px',
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <MessageOutlined style={{ fontSize: '18px', color: PRIMARY }} />
        <div>
          <Title level={5} style={{ margin: 0, color: '#262626' }}>
            Team Chat
          </Title>
          <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Connect and collaborate with your team members
          </Text>
        </div>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: '240px',
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            background: '#fafafa',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              block
              size="middle"
              style={{ background: PRIMARY, border: 'none', borderRadius: '6px' }}
              onClick={() => setSelectedUser(null)}
            >
              New Chat
            </Button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {conversations.length > 0 && (
              <div>
                <div
                  style={{
                    padding: '6px 16px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Recent
                </div>
                {conversations.map((conv) => {
                  const isActive = selectedUser?._id === conv.otherUserInfo?._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => selectUser(conv.otherUserInfo)}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isActive ? '#e8f0fe' : 'transparent',
                        borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <Avatar
                        size={34}
                        style={{
                          background: PRIMARY,
                          fontSize: '13px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {conv.otherUserInfo?.name?.charAt(0)?.toUpperCase() ?? <UserOutlined />}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#262626',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.otherUserInfo?.name ?? 'Unknown'}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#8c8c8c',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {conv.lastMessage?.message ?? ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {companyUsers.length > 0 && (
              <div style={{ marginTop: conversations.length > 0 ? '8px' : 0 }}>
                <div
                  style={{
                    padding: '6px 16px 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <TeamOutlined style={{ fontSize: '10px' }} /> Team
                </div>
                {companyUsers.map((user) => {
                  const isActive = selectedUser?._id === user._id;
                  return (
                    <div
                      key={user._id}
                      onClick={() => selectUser(user)}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isActive ? '#e8f0fe' : 'transparent',
                        borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <Avatar
                        size={34}
                        style={{
                          background: '#73d13d',
                          fontSize: '13px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {user.name?.charAt(0)?.toUpperCase() ?? <UserOutlined />}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#262626',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {user.userType === 'companyOwner' ? 'Owner' : user.role ?? 'Member'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {conversations.length === 0 && companyUsers.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c' }}>
                <TeamOutlined style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
                <Text style={{ fontSize: '12px' }}>No team members found</Text>
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#f9fafb',
            minHeight: 0,
          }}
        >
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div
                style={{
                  background: '#fff',
                  borderBottom: '1px solid #f0f0f0',
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexShrink: 0,
                }}
              >
                <Avatar
                  size={36}
                  style={{ background: PRIMARY, fontSize: '15px', fontWeight: 600, flexShrink: 0 }}
                >
                  {selectedUser.name?.charAt(0)?.toUpperCase() ?? <UserOutlined />}
                </Avatar>
                <div>
                  <Title level={5} style={{ margin: 0, fontSize: '14px', color: '#262626' }}>
                    {selectedUser.name}
                  </Title>
                  <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {selectedUser.userType === 'companyOwner'
                      ? 'Owner'
                      : selectedUser.role ?? 'Member'}
                  </Text>
                </div>
              </div>

              {/* Messages */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: 0,
                }}
              >
                {loadingMessages ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Spin />
                  </div>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg, index) => {
                      const isMe = msg.sender?._id === currentUser._id;
                      const showTime =
                        index === 0 ||
                        new Date(msg.createdAt).getTime() -
                          new Date(messages[index - 1]?.createdAt).getTime() >
                          300000;
                      return (
                        <div key={msg._id}>
                          {showTime && (
                            <div
                              style={{
                                textAlign: 'center',
                                fontSize: '11px',
                                color: '#8c8c8c',
                                marginBottom: '8px',
                              }}
                            >
                              {formatTime(msg.createdAt)}
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              alignItems: 'flex-end',
                              gap: '8px',
                            }}
                          >
                            {!isMe && (
                              <Avatar
                                size={28}
                                style={{ background: '#73d13d', fontSize: '12px', flexShrink: 0 }}
                              >
                                {msg.sender?.name?.charAt(0)?.toUpperCase() ?? <UserOutlined />}
                              </Avatar>
                            )}
                            <div
                              style={{
                                maxWidth: '65%',
                                padding: '8px 12px',
                                borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                background: isMe ? PRIMARY : '#fff',
                                color: isMe ? '#fff' : '#262626',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                fontSize: '13px',
                                lineHeight: '1.5',
                                opacity: msg.isTemp ? 0.65 : 1,
                                wordBreak: 'break-word',
                              }}
                            >
                              {msg.message}
                              {msg.isTemp && (
                                <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '6px' }}>
                                  Sending…
                                </span>
                              )}
                            </div>
                            {isMe && (
                              <Avatar
                                size={28}
                                style={{ background: PRIMARY, fontSize: '12px', flexShrink: 0 }}
                              >
                                {currentUser.name?.charAt(0)?.toUpperCase() ?? <UserOutlined />}
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#8c8c8c',
                    }}
                  >
                    <MessageOutlined style={{ fontSize: '36px', color: '#d9d9d9' }} />
                    <Title level={5} style={{ margin: 0, color: '#595959' }}>
                      No messages yet
                    </Title>
                    <Text style={{ fontSize: '13px' }}>
                      Start the conversation with {selectedUser.name}
                    </Text>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div
                style={{
                  background: '#fff',
                  borderTop: '1px solid #f0f0f0',
                  padding: '12px 20px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    background: '#fff',
                    minHeight: '44px',
                  }}
                >
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    visible={emojiPickerVisible}
                    onVisibleChange={setEmojiPickerVisible}
                  />
                  <TextArea
                    ref={messageInputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                    style={{
                      flex: 1,
                      border: 'none',
                      boxShadow: 'none',
                      resize: 'none',
                      fontSize: '13px',
                      padding: '2px 0',
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sendingMessage}
                    disabled={!messageText.trim()}
                    style={{
                      background: PRIMARY,
                      border: 'none',
                      borderRadius: '6px',
                      flexShrink: 0,
                    }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                color: '#8c8c8c',
              }}
            >
              <MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} style={{ margin: 0, color: '#595959' }}>
                Select a team member to start chatting
              </Title>
              <Text style={{ fontSize: '13px' }}>
                Choose someone from your team to begin a conversation
              </Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
