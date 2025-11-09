import { Avatar, Button, Dropdown, Layout, Space } from 'antd';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { BellOutlined, LogoutOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';
import { CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import { FILE_BASE_URL } from '@/config/serverApiConfig';
import logoIcon from '@/style/images/logo-icon.svg';

import useLanguage from '@/locale/useLanguage';

export default function HeaderContent() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const { Header } = Layout;
  const navigate = useNavigate();

  const translate = useLanguage();

  const ProfileDropdown = () => {
    const navigate = useNavigate();
    return (
      <div
        className="profileDropdown"
        onClick={() => navigate('/profile')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          cursor: 'pointer',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
        }}
      >
        <Avatar
          size={48}
          className="last"
          src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
          style={{
            background: '#eaf4ff', // light blue bg
            color: '#1e3a8a', // dark blue text
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {currentAdmin?.name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <div className="profileDropdownInfo" style={{ textAlign: 'left' }}>
          <p
            style={{
              margin: 0,
              fontWeight: '600',
              fontSize: '14px',
              color: '#2c2c2c',
              lineHeight: 1.2,
            }}
          >
            {currentAdmin?.name} {currentAdmin?.surname}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#6b7280',
              lineHeight: 1.2,
            }}
          >
            {currentAdmin?.email}
          </p>
        </div>
      </div>
    );
  };

  const DropdownMenu = ({ text }) => {
    return <span style={{ fontSize: '14px', fontWeight: '500' }}>{text}</span>;
  };

  const items = [
    {
      label: <ProfileDropdown className="headerDropDownMenu" />,
      key: 'ProfileDropdown',
    },
    {
      type: 'divider',
    },
    {
      icon: <UserOutlined style={{ color: '#1e3a8a' }} />,
      key: 'settingProfile',
      label: (
        <Link to={'/profile'} style={{ textDecoration: 'none' }}>
          <DropdownMenu text={translate('profile_settings')} />
        </Link>
      ),
    },
    {
      icon: <ToolOutlined style={{ color: '#1e3a8a' }} />,
      key: 'settingApp',
      label: (
        <Link to={'/settings'} style={{ textDecoration: 'none' }}>
          <DropdownMenu text={translate('app_settings')} />
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      icon: <LogoutOutlined style={{ color: '#ef4444' }} />,
      key: 'logout',
      label: (
        <Link to={'/logout'} style={{ textDecoration: 'none', color: '#ef4444' }}>
          <DropdownMenu text={translate('logout')} />
        </Link>
      ),
    },
  ];

  // Dummy notification data
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New invoice created', read: false },
    { id: 2, text: 'Payment received', read: false },
    { id: 3, text: 'Quote approved', read: true },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleClearAll = () => setNotifications([]);
  const handleMarkAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const NotificationDropdown = () => (
    <div
      className="font-roboto"
      style={{
        minWidth: 320,
        maxWidth: 340,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        padding: '12px 0 0 0',
        fontFamily: 'Roboto, Arial, sans-serif',
      }}
    >
      <div style={{ padding: '0 20px 8px 20px', fontWeight: 700, fontSize: 16, color: '#1e3a8a' }}>
        Notifications
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', padding: '0 8px' }}>
        {notifications.length === 0 ? (
          <div style={{ color: '#8c8c8c', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
            No notifications
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderBottom: '1px solid #f3f4f6',
                background: notif.read ? '#f6fff6' : '#eaf4ff',
                fontWeight: notif.read ? 400 : 600,
                color: notif.read ? '#6b7280' : '#1e3a8a',
                fontSize: 14,
              }}
            >
              <CheckCircleOutlined style={{ color: notif.read ? '#4d7f37ff' : '#2563eb' }} />
              <span>{notif.text}</span>
            </div>
          ))
        )}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f3f4f6',
        padding: '10px 18px',
        background: '#fafafa',
        borderRadius: '0 0 16px 16px',
        gap: 10,
      }}>
        <Button
          type="text"
          icon={<CheckCircleOutlined />}
          size="small"
          style={{ color: '#4d7f37ff', fontWeight: 600 }}
          onClick={handleMarkAllRead}
        >
          Mark all as read
        </Button>
        <Button
          type="text"
          icon={<DeleteOutlined />}
          size="small"
          style={{ color: '#ef4444', fontWeight: 600 }}
          onClick={handleClearAll}
        >
          Clear all
        </Button>
      </div>
    </div>
  );

  return (
    <Header
      className="header-no-shadow"
      style={{
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1002,
        boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
      }}
    >
      {/* Logo Section */}
      <div
        className="logo"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <img
          src={logoIcon}
          alt="Logo"
          style={{
            height: '32px',
            filter: 'none',
          }}
        />
        <span
          style={{
            marginLeft: '12px',
            color: '#1a1a1a',
            fontSize: '18px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          }}
        >
          Quickmation
        </span>
      </div>

      <Space size="large" align="center">
        <Dropdown
          open={notifOpen}
          onOpenChange={setNotifOpen}
          overlay={<NotificationDropdown />}
          trigger={['click']}
          placement="bottomRight"
          arrow
        >
          <Button
            type="text"
            icon={<BellOutlined />}
            size="large"
            style={{
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#eaf4ff',
              color: '#1e3a8a',
              border: 'none',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
          >
            {notifications.some((n) => !n.read) && (
              <span
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '2px solid #fff',
                  boxShadow: '0 0 2px #ccc',
                }}
              />
            )}
          </Button>
        </Dropdown>

        <Dropdown
          menu={{ items }}
          trigger={['click']}
          placement="bottomRight"
          styles={{
            overlay: {
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
            },
          }}
        >
          <Avatar
            className="last"
            src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
            style={{
              background: '#eaf4ff',
              color: '#1e3a8a',
              cursor: 'pointer',
              border: 'none',
              boxShadow: 'none',
              transition: 'all 0.3s ease',
              width: 44,
              height: 44,
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            size={44}
          >
            {currentAdmin?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
        </Dropdown>
      </Space>
    </Header>
  );
}
