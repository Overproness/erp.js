import { N8N_URL } from '@/config/serverApiConfig';
import { usePermissions } from '@/hooks/usePermissions';
import useLanguage from '@/locale/useLanguage';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import {
  BankOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ContainerOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  FileOutlined,
  FileSyncOutlined,
  FundOutlined,
  LinkOutlined,
  MessageOutlined,
  NodeIndexOutlined,
  ReconciliationOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

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
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/',
    },
    {
      key: 'crm',
      icon: <BankOutlined />,
      label: 'CRM (Customers & Sales)',
      path: '/client',
      permissions: ['customer:read'],
      children: [
        {
          key: 'customer',
          icon: <CustomerServiceOutlined />,
          label: 'Customers',
          path: '/client',
          permissions: ['customer:read'],
        },
        {
          key: 'quote',
          icon: <FileSyncOutlined />,
          label: 'Quotes',
          path: '/quote',
          permissions: ['quote:read'],
        },
        {
          key: 'invoice',
          icon: <ContainerOutlined />,
          label: 'Invoices',
          path: '/invoice',
          permissions: ['invoice:read'],
        },
        {
          key: 'payment',
          icon: <CreditCardOutlined />,
          label: 'Payments',
          path: '/payment',
          permissions: ['payment:read'],
        },
        {
          key: 'paymentMode',
          icon: <WalletOutlined />,
          label: 'Payment Methods',
          path: '/payment/mode',
          permissions: ['payment:read'],
        },
        {
          key: 'follow-ups',
          icon: <CalendarOutlined />,
          label: 'Follow-Up Management',
          path: '/ai-enhanced/follow-ups',
          permissions: ['ai:read'],
        },
      ],
    },
    {
      key: 'marketing',
      icon: <FundOutlined />,
      label: 'Marketing & Reputation',
      path: '/marketing',
      permissions: ['marketing:read'],
      children: [
        {
          key: 'marketing-campaigns',
          icon: <FundOutlined />,
          label: 'Campaigns',
          path: '/marketing',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-behavior',
          icon: <NodeIndexOutlined />,
          label: 'Behavior Triggers',
          path: '/marketing/behavior-triggers',
          permissions: ['marketing:read'],
        },
        {
          key: 'marketing-retargeting',
          icon: <ReconciliationOutlined />,
          label: 'Retargeting',
          path: '/marketing/audiences',
          permissions: ['marketing:read'],
        },
        {
          key: 'social-media',
          icon: <SendOutlined />,
          label: 'Social Media',
          path: '/social-media',
          permissions: ['social:read'],
        },
        {
          key: 'reputation',
          icon: <StarOutlined />,
          label: 'Reputation',
          path: '/reputation',
          permissions: ['reputation:read'],
        },
        {
          key: 'survey',
          icon: <CheckSquareOutlined />,
          label: 'Customer Surveys',
          path: '/survey',
          permissions: ['survey:read'],
        },
      ],
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'Chat',
      path: '/chat',
    },
    {
      key: 'ai-assistant',
      icon: <RobotOutlined />,
      label: 'AI Assistant',
      path: '/ai-assistant',
      permissions: ['ai:read'],
      children: [
        {
          key: 'ai-chat',
          icon: <MessageOutlined />,
          label: 'AI Chat',
          path: '/ai-assistant',
          permissions: ['ai:read'],
        },
        {
          key: 'ai-learning',
          icon: <BulbOutlined />,
          label: 'AI Learning',
          path: '/ai-enhanced/learning',
          permissions: ['ai:read'],
        },
      ],
    },
    {
      key: 'url',
      icon: <LinkOutlined />,
      label: 'URL',
      path: '/url',
      permissions: ['url:read'],
    },
    {
      key: 'document',
      icon: <FileOutlined />,
      label: 'Documents',
      path: '/document',
      permissions: ['document:read'],
    },
    {
      key: 'taxes',
      icon: <ShopOutlined />,
      label: 'Taxes',
      path: '/taxes',
      permissions: ['settings:read'],
    },
    {
      key: 'workflows-tasks',
      icon: <DeploymentUnitOutlined />,
      label: 'Workflow & Tasks',
      path: '/workflow',
      permissions: ['workflow:read'],
      children: [
        {
          key: 'workflow',
          icon: <ExperimentOutlined />,
          label: 'Workflows',
          path: '#',
          permissions: ['workflow:read'],
          isExternal: true,
        },
        {
          key: 'tasks',
          icon: <CheckSquareOutlined />,
          label: 'Tasks',
          path: '/tasks',
          permissions: ['task:read'],
        },
        {
          key: 'appointments',
          icon: <CalendarOutlined />,
          label: 'Appointments',
          path: '/appointments',
          permissions: ['workflow:read'],
        },
      ],
    },
    // {
    //   key: 'business-process-automation',
    //   icon: <ApartmentOutlined />,
    //   label: 'Business Process Automation',
    //   path: '/appointments',
    //   permissions: ['workflow:read'],
    //   children: [
    //     // {
    //     //   key: 'business-processes',
    //     //   icon: <ApartmentOutlined />,
    //     //   label: 'Business Processes',
    //     //   path: '/business-processes',
    //     //   permissions: ['workflow:read'],
    //     // },
    //     // {
    //     //   key: 'task-tracking',
    //     //   icon: <CheckSquareOutlined />,
    //     //   label: 'Task Tracking',
    //     //   path: '/task-tracking',
    //     //   permissions: ['task:read'],
    //     // },
    //   ],
    // },
    {
      key: 'team-settings',
      icon: <UsergroupAddOutlined />,
      label: 'Team & Settings',
      path: '/team',
      permissions: ['team:read'],
      children: [
        {
          key: 'team',
          icon: <TeamOutlined />,
          label: 'Team',
          path: '/team',
          permissions: ['team:read'],
        },
        {
          key: 'generalSettings',
          icon: <SettingOutlined />,
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
    if (item.path === '/' && currentPath === 'dashboard') return true;
    if (item.path && currentPath.startsWith(item.path.slice(1))) return true;
    if (item.children) {
      return item.children.some((child) => {
        if (currentPath === child.key) return true;
        if (child.path && currentPath.startsWith(child.path.slice(1))) return true;
        return false;
      });
    }
    return false;
  };

  // Handle main menu item click
  const handleItemClick = (item) => {
    if (item.children) {
      // Toggle submenu
      setActiveSubmenu(activeSubmenu === item.key ? null : item.key);
    } else {
      // Navigate directly
      navigate(item.path);
      setActiveSubmenu(null);
    }
  };

  // Handle submenu item click
  const handleSubmenuClick = (item) => {
    if (item.isExternal && item.key === 'workflow') {
      const companyId = currentAdmin?._id;
      if (companyId) {
        window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
      }
    } else {
      navigate(item.path);
    }
    setActiveSubmenu(null);
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
  }, [location]);

  return (
    <>
      {/* Main Icon Sidebar */}
      <aside
        className="icon-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 70,
          bottom: 0,
          width: '70px',
          background: '#ffffff',
          borderRight: '1px solid #e8e8e8',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)',
          zIndex: 1002,
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '16px',
          overflow: 'auto',
        }}
      >
        {filteredItems.map((item) => {
          const active = isActive(item);
          return (
            <Tooltip
              key={item.key}
              title={translate(item.label)}
              placement="right"
              mouseEnterDelay={0.3}
            >
              <div
                className={`icon-menu-item ${active ? 'active' : ''} ${
                  activeSubmenu === item.key ? 'submenu-open' : ''
                }`}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item.key)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: '100%',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  background: active ? '#eaf4ff' : 'transparent',
                  borderLeft: active ? '3px solid #1e3a8a' : '3px solid transparent',
                }}
              >
                <span
                  style={{
                    fontSize: '22px',
                    color: active || hoveredItem === item.key ? '#1e3a8a' : '#64748b',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </span>
              </div>
            </Tooltip>
          );
        })}
      </aside>

      {/* Submenu Panel */}
      {activeSubmenu && (
        <>
          {/* Backdrop to close submenu when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1001,
              background: 'transparent',
            }}
            onClick={() => setActiveSubmenu(null)}
          />

          {/* Submenu content */}
          <aside
            className="submenu-panel"
            style={{
              position: 'fixed',
              left: '70px',
              top: 70,
              bottom: 0,
              width: '240px',
              background: '#ffffff',
              borderRight: '1px solid #e8e8e8',
              boxShadow: '4px 0 12px rgba(0, 0, 0, 0.08)',
              zIndex: 1003,
              padding: '16px 12px',
              overflowY: 'auto',
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            {/* Submenu title */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#1e3a8a',
                marginBottom: '16px',
                paddingLeft: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {translate(filteredItems.find((i) => i.key === activeSubmenu)?.label || '')}
            </div>

            {/* Submenu items */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filteredItems
                .find((i) => i.key === activeSubmenu)
                ?.children?.map((child) => {
                  const childActive = currentPath === child.key;

                  if (child.isExternal && child.key === 'workflow') {
                    return (
                      <li key={child.key} style={{ marginBottom: '4px' }}>
                        <Button
                          type="primary"
                          icon={child.icon}
                          onClick={() => handleSubmenuClick(child)}
                          style={{
                            backgroundColor: '#7ED957',
                            borderColor: '#7ED957',
                            color: '#fff',
                            width: '100%',
                            height: '40px',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: '8px',
                          }}
                        >
                          {translate(child.label)}
                        </Button>
                      </li>
                    );
                  }

                  return (
                    <li key={child.key} style={{ marginBottom: '4px' }}>
                      <Link
                        to={child.path}
                        onClick={() => handleSubmenuClick(child)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: childActive ? '#1e3a8a' : '#1F2937',
                          background: childActive ? '#dbeafe' : 'transparent',
                          transition: 'all 0.2s ease',
                          fontWeight: childActive ? '600' : '500',
                          fontSize: '14px',
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.background = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <span
                          style={{
                            fontSize: '18px',
                            marginRight: '10px',
                            color: childActive ? '#1e3a8a' : '#64748b',
                          }}
                        >
                          {child.icon}
                        </span>
                        {translate(child.label)}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </aside>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .icon-menu-item:hover {
          background: #f3f4f6 !important;
        }

        .icon-menu-item.active:hover {
          background: #eaf4ff !important;
        }

        .icon-sidebar::-webkit-scrollbar {
          width: 4px;
        }

        .icon-sidebar::-webkit-scrollbar-track {
          background: #ffffff;
        }

        .icon-sidebar::-webkit-scrollbar-thumb {
          background: #dbeafe;
          border-radius: 2px;
        }

        .icon-sidebar::-webkit-scrollbar-thumb:hover {
          background: #bfdbfe;
        }

        .submenu-panel::-webkit-scrollbar {
          width: 6px;
        }

        .submenu-panel::-webkit-scrollbar-track {
          background: #ffffff;
        }

        .submenu-panel::-webkit-scrollbar-thumb {
          background: #dbeafe;
          border-radius: 3px;
        }

        .submenu-panel::-webkit-scrollbar-thumb:hover {
          background: #bfdbfe;
        }
      `}</style>
    </>
  );
}
