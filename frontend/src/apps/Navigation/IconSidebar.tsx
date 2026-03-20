// @ts-nocheck
import { N8N_URL } from '@/config/serverApiConfig';
import { usePermissions } from '@/hooks/usePermissions';
import useLanguage from '@/locale/useLanguage';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function IconSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const translate = useLanguage();
  const currentAdmin = useSelector(selectCurrentAdmin);

  const {
    hasPermission,
    hasAnyPermission,
    isOwner,
    loading: permissionsLoading,
  } = usePermissions();

  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));
  const [expandedKey, setExpandedKey] = useState(null);

  // Permission checker
  const checkPermission = (requiredPermissions) => {
    if (isOwner) return true;
    if (!requiredPermissions) return true;
    if (Array.isArray(requiredPermissions)) {
      return hasAnyPermission(requiredPermissions);
    }
    return hasPermission(requiredPermissions);
  };

  // Filter menu items based on permissions
  const filterItemsByPermissions = (items) => {
    if (permissionsLoading) return [];

    return items.filter((item) => {
      if (!checkPermission(item.permissions)) {
        return false;
      }

      if (item.children) {
        item.children = item.children.filter((child) => checkPermission(child.permissions));
        return item.children.length > 0;
      }

      return true;
    });
  };

  // Define menu items
  const menuItems = [
    { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: '/' },
    {
      key: 'crm',
      icon: 'group',
      label: 'CRM',
      path: '/client',
      permissions: ['customer:read'],
      children: [
        {
          key: 'customer',
          icon: 'person',
          label: 'Customers',
          path: '/client',
          permissions: ['customer:read'],
        },
        {
          key: 'quote',
          icon: 'request_quote',
          label: 'Quotes',
          path: '/quote',
          permissions: ['quote:read'],
        },
        {
          key: 'invoice',
          icon: 'receipt_long',
          label: 'Invoices',
          path: '/invoice',
          permissions: ['invoice:read'],
        },
        {
          key: 'payment',
          icon: 'payments',
          label: 'Payments',
          path: '/payment',
          permissions: ['payment:read'],
        },
        {
          key: 'paymentMode',
          icon: 'credit_card',
          label: 'Payment Methods',
          path: '/payment/mode',
          permissions: ['payment:read'],
        },
        {
          key: 'follow-ups',
          icon: 'calendar_month',
          label: 'Follow-Ups',
          path: '/ai-enhanced/follow-ups',
          permissions: ['ai:read'],
        },
      ],
    },
    {
      key: 'marketing',
      icon: 'campaign',
      label: 'Marketing',
      path: '/marketing',
      permissions: ['marketing:read'],
      children: [
        {
          key: 'marketing-campaigns',
          icon: 'campaign',
          label: 'Campaigns',
          path: '/marketing',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-behavior',
          icon: 'psychology',
          label: 'Behavior Triggers',
          path: '/marketing/behavior-triggers',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-retargeting',
          icon: 'track_changes',
          label: 'Retargeting',
          path: '/marketing/audiences',
          permissions: ['marketing:read'],
        },
        {
          key: 'social-media',
          icon: 'share',
          label: 'Social Media',
          path: '/social-media',
          permissions: ['social:read'],
        },
        {
          key: 'reputation',
          icon: 'star',
          label: 'Reputation',
          path: '/reputation',
          permissions: ['reputation:read'],
        },
        {
          key: 'survey',
          icon: 'quiz',
          label: 'Surveys',
          path: '/survey',
          permissions: ['survey:read'],
        },
      ],
    },
    { key: 'chat', icon: 'chat', label: 'Chat', path: '/chat' },
    {
      key: 'ai-assistant',
      icon: 'smart_toy',
      label: 'AI Assistant',
      path: '/ai-assistant',
      permissions: ['ai:read'],
      children: [
        {
          key: 'ai-chat',
          icon: 'chat',
          label: 'AI Chat',
          path: '/ai-assistant',
          permissions: ['ai:read'],
        },
        {
          key: 'ai-learning',
          icon: 'lightbulb',
          label: 'AI Learning',
          path: '/ai-enhanced/learning',
          permissions: ['ai:read'],
        },
      ],
    },
    { key: 'url', icon: 'link', label: 'URLs', path: '/url', permissions: ['url:read'] },
    {
      key: 'document',
      icon: 'description',
      label: 'Documents',
      path: '/document',
      permissions: ['document:read'],
    },
    {
      key: 'taxes',
      icon: 'receipt',
      label: 'Taxes',
      path: '/taxes',
      permissions: ['settings:read'],
    },
    {
      key: 'workflows-tasks',
      icon: 'conversion_path',
      label: 'Workflows',
      path: '/workflow',
      permissions: ['workflow:read'],
      children: [
        {
          key: 'workflow',
          icon: 'bolt',
          label: 'N8N Workflows',
          path: '#',
          permissions: ['workflow:read'],
          isExternal: true,
        },
        {
          key: 'tasks',
          icon: 'task_alt',
          label: 'Tasks',
          path: '/tasks',
          permissions: ['task:read'],
        },
        {
          key: 'appointments',
          icon: 'calendar_month',
          label: 'Appointments',
          path: '/appointments',
          permissions: ['workflow:read'],
        },
      ],
    },
    {
      key: 'analytics',
      icon: 'analytics',
      label: 'Analytics',
      path: '/analytics',
      permissions: ['analytics:read'],
    },
    {
      key: 'team-settings',
      icon: 'settings',
      label: 'Settings',
      path: '/team',
      permissions: ['team:read'],
      children: [
        { key: 'team', icon: 'groups', label: 'Team', path: '/team', permissions: ['team:read'] },
        {
          key: 'generalSettings',
          icon: 'tune',
          label: 'Settings',
          path: '/settings',
          permissions: ['settings:read'],
        },
      ],
    },
  ];

  const filteredItems = filterItemsByPermissions(menuItems);

  // Check if current path matches item
  const isActive = (item) => {
    if (currentPath === item.key) return true;
    if (item.path === '/' && (currentPath === 'dashboard' || currentPath === '')) return true;
    if (item.path && item.path !== '/' && currentPath.startsWith(item.path.slice(1))) return true;
    if (item.children) {
      return item.children.some((child) => {
        if (currentPath === child.key) return true;
        if (child.path && child.path !== '#' && currentPath.startsWith(child.path.slice(1)))
          return true;
        return false;
      });
    }
    return false;
  };

  // Handle main menu item click
  const handleItemClick = (item) => {
    if (item.children) {
      setExpandedKey(expandedKey === item.key ? null : item.key);
    } else {
      navigate(item.path);
    }
  };

  // Handle submenu item click
  const handleChildClick = (child) => {
    if (child.isExternal && child.key === 'workflow') {
      const companyId = currentAdmin?._id;
      if (companyId) {
        window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
      }
    } else {
      navigate(child.path);
    }
  };

  // Update current path on location change
  useEffect(() => {
    if (location.pathname === '/') {
      setCurrentPath('dashboard');
    } else {
      const path = location.pathname.slice(1);
      if (path === 'client' || path.startsWith('client/')) {
        setCurrentPath('customer');
      } else if (path === 'payment/mode' || path.startsWith('payment/mode')) {
        setCurrentPath('paymentMode');
      } else if (path === 'settings' || path.startsWith('settings/')) {
        setCurrentPath('generalSettings');
      } else if (path === 'marketing/behavior-triggers') {
        setCurrentPath('marketing-behavior');
      } else if (path === 'marketing/audiences') {
        setCurrentPath('marketing-retargeting');
      } else if (path === 'marketing') {
        setCurrentPath('marketing-campaigns');
      } else {
        const basePath = path.split('/')[0];
        setCurrentPath(basePath);
      }
    }

    // Auto-expand parent of active child
    for (const item of filteredItems) {
      if (item.children && isActive(item)) {
        setExpandedKey(item.key);
        break;
      }
    }
  }, [location]);

  return (
    <aside
      className="erp-sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '220px',
        background: '#ffffff',
        borderRight: '1px solid rgba(0,0,0,0.06)',
        zIndex: 1002,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-5 py-5 cursor-pointer"
        onClick={() => navigate('/')}
      >
        <img src="/logo-bg-remove.png" alt="ERP.js" className="h-8 w-8 object-contain" />
        <div>
          <span className="text-lg font-bold tracking-tighter" style={{ color: '#191c1d' }}>
            ERP.js
          </span>
          <span
            className="block text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: '#71767f' }}
          >
            Enterprise Engine
          </span>
        </div>
      </div>

      {/* New Project Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => navigate('/client/create')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #0058c3, #0070f3)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            add
          </span>
          New Project
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {filteredItems.map((item) => {
          const active = isActive(item);
          const isExpanded = expandedKey === item.key;

          return (
            <div key={item.key} style={{ marginBottom: '2px' }}>
              <button
                onClick={() => handleItemClick(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer transition-all text-left"
                style={{
                  background: active ? 'linear-gradient(135deg, #0058c3, #0070f3)' : 'transparent',
                  color: active ? '#ffffff' : '#414754',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = '#f3f4f5';
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.background = active
                      ? 'linear-gradient(135deg, #0058c3, #0070f3)'
                      : 'transparent';
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '20px', color: active ? '#ffffff' : '#71767f' }}
                >
                  {item.icon}
                </span>
                <span
                  style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em', flex: 1 }}
                >
                  {translate(item.label)}
                </span>
                {item.children && (
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '16px',
                      color: active ? '#ffffff' : '#71767f',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    expand_more
                  </span>
                )}
              </button>

              {/* Children */}
              {item.children && isExpanded && (
                <div
                  style={{
                    marginLeft: '16px',
                    paddingLeft: '16px',
                    borderLeft: '1.5px solid #e1e3e4',
                    marginTop: '4px',
                    marginBottom: '4px',
                  }}
                >
                  {item.children.map((child) => {
                    const childActive = currentPath === child.key;
                    return (
                      <button
                        key={child.key}
                        onClick={() => handleChildClick(child)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-none cursor-pointer transition-all text-left"
                        style={{
                          background: childActive ? '#eaf4ff' : 'transparent',
                          color: childActive ? '#0058c3' : '#414754',
                          marginBottom: '2px',
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) e.currentTarget.style.background = '#f3f4f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = childActive
                            ? '#eaf4ff'
                            : 'transparent';
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: '18px', color: childActive ? '#0058c3' : '#71767f' }}
                        >
                          {child.icon}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>
                          {translate(child.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => navigate('/help')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-none cursor-pointer transition-all text-left"
          style={{ background: 'transparent', color: '#414754' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', color: '#71767f' }}
          >
            help
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Help</span>
        </button>
        <Link
          to="/logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline transition-all"
          style={{ color: '#414754' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px', color: '#71767f' }}
          >
            logout
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Logout</span>
        </Link>
      </div>

      <style>{`
        .erp-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .erp-sidebar::-webkit-scrollbar-track {
          background: transparent;
        }
        .erp-sidebar::-webkit-scrollbar-thumb {
          background: #e1e3e4;
          border-radius: 2px;
        }
      `}</style>
    </aside>
  );
}
