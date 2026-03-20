import useLanguage from '@/locale/useLanguage';
import { setCurrentAssistant } from '@/redux/ai/aiSlice';
import { deleteAssistant } from '@/redux/ai/aiThunks';
import {
  BarChartOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Input, List, Typography } from 'antd';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Search } = Input;

const ConversationHistory = ({ assistants, selectedAssistant, onSelectAssistant }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssistants = assistants.filter(
    (assistant) =>
      assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assistant.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAssistant = (assistant) => {
    onSelectAssistant(assistant);
    dispatch(setCurrentAssistant(assistant));
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: <RobotOutlined />,
      document: <FileTextOutlined />,
      workflow: <SettingOutlined />,
      analytics: <BarChartOutlined />,
      customer: <UserOutlined />,
      financial: <DollarOutlined />,
    };
    return icons[type] || <RobotOutlined />;
  };

  const getTypeColor = (type) => {
    const colors = {
      general: '#1890ff',
      document: '#52c41a',
      workflow: '#fa8c16',
      analytics: '#722ed1',
      customer: '#13c2c2',
      financial: '#faad14',
    };
    return colors[type] || '#1890ff';
  };

  const assistantMenuItems = (assistant) => [
    {
      key: 'edit',
      label: translate('Edit Assistant'),
      icon: <EditOutlined />,
      route: '/ai-assistant/update/' + assistant._id,
    },
    {
      key: 'delete',
      label: translate('Delete Assistant'),
      icon: <DeleteOutlined />,
      danger: true,
    },
  ];

  const handleDeleteAssistant = (assistant) => {
    dispatch(deleteAssistant(assistant._id));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}
      >
        <Title level={4} style={{ margin: 0, marginBottom: '16px', fontSize: '16px' }}>
          {translate('AI Assistants')}
        </Title>

        <Search
          placeholder={translate('Search assistants')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: '16px' }}
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          block
          onClick={() => navigate('/ai-assistant/create')}
          style={{ borderRadius: '6px' }}
        >
          {translate('New Assistant')}
        </Button>
      </div>

      {/* Assistants List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <List
          dataSource={filteredAssistants}
          renderItem={(assistant) => (
            <List.Item
              key={assistant._id}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                backgroundColor:
                  selectedAssistant?._id === assistant._id ? '#e6f7ff' : 'transparent',
                borderLeft:
                  selectedAssistant?._id === assistant._id
                    ? '4px solid #1890ff'
                    : '4px solid transparent',
                transition: 'all 0.2s ease',
                borderBottom: '1px solid #f5f5f5',
              }}
              onClick={() => handleSelectAssistant(assistant)}
              onMouseEnter={(e) => {
                if (selectedAssistant?._id !== assistant._id) {
                  e.currentTarget.style.backgroundColor = '#f9f9f9';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAssistant?._id !== assistant._id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={assistant.enabled} status={assistant.enabled ? 'success' : 'default'}>
                    <Avatar
                      size={36}
                      icon={getTypeIcon(assistant.type)}
                      style={{ backgroundColor: getTypeColor(assistant.type) }}
                    />
                  </Badge>
                }
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                      {assistant.name}
                    </Text>
                    <Dropdown
                      menu={{
                        items: assistantMenuItems(assistant),
                        onClick: ({ key }) => {
                          const item = assistantMenuItems(assistant).find((i) => i.key === key);
                          if (!item) return;

                          if (item.key === 'edit') {
                            navigate(item.route);
                          } else {
                            console.log('deleting');
                            handleDeleteAssistant(assistant);
                            navigate('/ai-assistant');
                          }
                        },
                      }}
                      trigger={['click']}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        size="small"
                        style={{ opacity: 0.6 }}
                      />
                    </Dropdown>
                  </div>
                }
                description={
                  <div style={{ marginTop: '4px' }}>
                    <Text
                      type="secondary"
                      style={{ fontSize: '12px', textTransform: 'capitalize' }}
                    >
                      {translate(assistant.type)}
                    </Text>
                    {assistant.description && (
                      <>
                        <br />
                        <Text
                          type="secondary"
                          style={{
                            fontSize: '11px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4',
                          }}
                        >
                          {assistant.description}
                        </Text>
                      </>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>

      {/* Recent Conversations Section - Removed as conversations will be shown in chat interface */}
    </div>
  );
};

export default ConversationHistory;
