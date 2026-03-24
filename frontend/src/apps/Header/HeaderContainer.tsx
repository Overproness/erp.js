import { Avatar, Dropdown, Layout, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { LogoutOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons';

import NotificationBell from '@/components/NotificationBell/NotificationBell';
import { selectCurrentAdmin } from '@/redux/auth/selectors';

import { FILE_BASE_URL } from '@/config/serverApiConfig';

import useLanguage from '@/locale/useLanguage';

export default function HeaderContent() {
  const currentAdmin = useSelector(selectCurrentAdmin);
  const { Header } = Layout;
  const navigate = useNavigate();
  const translate = useLanguage();
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            background: '#eaf4ff',
            color: '#0058c3',
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
              color: '#191c1d',
              lineHeight: 1.2,
            }}
          >
            {currentAdmin?.name} {currentAdmin?.surname}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              color: '#71767f',
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
      icon: <UserOutlined style={{ color: '#0058c3' }} />,
      key: 'settingProfile',
      label: (
        <Link to={'/profile'} style={{ textDecoration: 'none' }}>
          <DropdownMenu text={translate('profile_settings')} />
        </Link>
      ),
    },
    {
      icon: <ToolOutlined style={{ color: '#0058c3' }} />,
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

  return (
    <Header
      className="header-no-shadow"
      style={{
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        boxShadow: 'none',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: searchFocused ? '#ffffff' : '#f3f4f5',
          borderRadius: '10px',
          padding: '0 14px',
          height: '40px',
          width: '340px',
          maxWidth: '40%',
          overflow: 'hidden',
          border: searchFocused ? '1.5px solid #0058c3' : '1.5px solid transparent',
          boxShadow: searchFocused
            ? 'inset 0 2px 4px rgba(0,0,0,0.06), 0 0 0 3px rgba(0,88,195,0.12)'
            : 'inset 0 2px 4px rgba(0,0,0,0.06)',
          transition: 'all 0.2s ease',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#71767f' }}>
          search
        </span>
        <input
          ref={searchInputRef}
          placeholder="Quick search transactions..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '13px',
            color: '#191c1d',
            width: '100%',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        />
        <kbd
          style={{
            fontSize: '10px',
            color: '#71767f',
            background: '#e1e3e4',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: '16px',
          }}
        >
          Ctrl K
        </kbd>
      </div>

      <Space size="middle" align="center">
        <NotificationBell />

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '10px',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Avatar
              className="last"
              src={currentAdmin?.photo ? FILE_BASE_URL + currentAdmin?.photo : undefined}
              style={{
                background: '#eaf4ff',
                color: '#0058c3',
                cursor: 'pointer',
                border: 'none',
                boxShadow: 'none',
                width: 36,
                height: 36,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              size={36}
            >
              {currentAdmin?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#191c1d' }}>
                {currentAdmin?.name}
              </span>
              <span style={{ fontSize: '11px', color: '#71767f' }}>
                {currentAdmin?.role || 'Admin'}
              </span>
            </div>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
}
