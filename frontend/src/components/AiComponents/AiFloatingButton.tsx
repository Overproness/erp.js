import useLanguage from '@/locale/useLanguage';
import AiChatModule from '@/pages/AiAssistant/AiAssistantModule/AiChatModule';
import { selectChatOpen } from '@/redux/ai/aiSelectors';
import { CloseOutlined, MessageOutlined, RobotOutlined } from '@ant-design/icons';
import { Badge, Button, Drawer, Tooltip } from '@/components/ui';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function AiFloatingButton({
  position = 'bottom-right',
  showBadge = false,
  badgeCount = 0,
}) {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const chatOpen = useSelector(selectChatOpen);

  const getPositionStyle = () => {
    const styles = {
      'bottom-right': { bottom: '24px', right: '24px' },
      'bottom-left': { bottom: '24px', left: '24px' },
      'top-right': { top: '80px', right: '24px' },
      'top-left': { top: '80px', left: '24px' },
    };
    return styles[position] || styles['bottom-right'];
  };

  const handleClick = () => {
    if (window.innerWidth < 768) {
      // Mobile: Use drawer
      setDrawerVisible(true);
    } else {
      // Desktop: Navigate to chat page
      navigate('/ai-assistant/chat');
    }
  };

  const button = (
    <Button
      type="primary"
      shape="circle"
      size="large"
      icon={drawerVisible ? <CloseOutlined /> : <MessageOutlined />}
      onClick={handleClick}
      style={{
        position: 'fixed',
        ...getPositionStyle(),
        width: '56px',
        height: '56px',
        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
      }}
    />
  );

  return (
    <>
      <Tooltip title={translate('AI Assistant')} placement="left">
        {showBadge ? (
          <Badge count={badgeCount} offset={[-8, 8]}>
            {button}
          </Badge>
        ) : (
          button
        )}
      </Tooltip>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RobotOutlined />
            {translate('AI Assistant')}
          </div>
        }
        placement="right"
        width="100%"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { padding: 0 } }}
      >
        <AiChatModule />
      </Drawer>
    </>
  );
}
