import useLanguage from '@/locale/useLanguage';
import { RobotOutlined } from '@/components/icons';
import { Avatar, Space } from '@/components/ui';

const TypingIndicator = ({ assistant }) => {
  const translate = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '24px',
        gap: '12px',
      }}
    >
      <Avatar
        size={32}
        icon={<RobotOutlined />}
        style={{
          backgroundColor: '#1890ff',
          flexShrink: 0,
          marginTop: '4px',
        }}
      />
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '12px 16px',
          maxWidth: '200px',
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Space align="center">
          <span style={{ fontSize: '12px', color: '#666' }}>
            {assistant?.name || translate('AI Assistant')} {translate('is typing')}
          </span>
          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                animation: 'typing 1.4s infinite ease-in-out',
                animationDelay: '0s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                animation: 'typing 1.4s infinite ease-in-out',
                animationDelay: '0.2s',
              }}
            />
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                animation: 'typing 1.4s infinite ease-in-out',
                animationDelay: '0.4s',
              }}
            />
          </div>
        </Space>
      </div>

      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
